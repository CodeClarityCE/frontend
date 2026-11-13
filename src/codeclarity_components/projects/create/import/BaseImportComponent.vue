<script lang="ts">
import { type GetRepositoriesRequestOptions } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import { type Repository } from "@/codeclarity_components/projects/project.entity";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Progress } from "@/shadcn/ui/progress";
import { runWithConcurrency } from "@/utils/concurrency";

import RepoTable, { type RepoTableConfig } from "./components/RepoTable.vue";
import {
  type FailedProjectImport,
  getImportErrorMessage,
  IMPORT_CONCURRENCY,
} from "./projectImport";

export { getImportErrorMessage, IMPORT_CONCURRENCY } from "./projectImport";

/**
 * Drop a trailing ".git" from a repository url. Only the suffix: a name such
 * as "octo.github.io" keeps its ".git".
 */
export function stripGitSuffix(url: string): string {
  return url.replace(/\.git$/, "");
}

export interface GetReposOptions extends GetRepositoriesRequestOptions {
  forceRefresh: boolean;
  activeFilters: string[];
}

export type { FailedProjectImport } from "./projectImport";
</script>
<script lang="ts" setup>
import { Plus, RefreshCw } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, type Ref, ref } from "vue";
import * as z from "zod";

import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import type { PaginatedResponse } from "@/utils/api/responses/PaginatedResponse";
import { errorToast, successToast } from "@/utils/toasts";

import Faq from "./components/FaqComponent.vue";
import ImportErrorTable from "./components/ImportErrorTable.vue";

// Repositories
const projectsRepo: ProjectRepository = new ProjectRepository();

const authStore = useAuthStore();
const userStore = useUserStore();

// Props
const props = defineProps<{
  integration: string;
  getRepos: (
    options: GetRepositoriesRequestOptions,
  ) => Promise<PaginatedResponse<Repository>>;
  /** Presentation tweaks forwarded to the repository table. */
  tableConfig?: RepoTableConfig;
}>();

// State
const repoTableRef: Ref<{
  clearSelection: () => void;
  fetchRepos: (refresh: boolean, forceRefresh?: boolean) => Promise<void>;
} | null> = ref(null);
const reposFailedToImportPage: Ref<number> = ref(0);
const reposFailedToImport: Ref<Record<string, FailedProjectImport>> = ref({});
const selectedRepos: Ref<Repository[]> = ref([]);
const importing: Ref<boolean> = ref(false);
const importProgress: Ref<{ done: number; total: number }> = ref({
  done: 0,
  total: 0,
});
// Stays visible for the whole run so the progress bar cannot disappear
// mid-import, even if the selection changes meanwhile.
const showImportCard = computed(
  () =>
    (importing.value || selectedRepos.value.length > 0) &&
    Object.keys(reposFailedToImport.value).length === 0,
);
const importProgressPercent = computed(() =>
  importProgress.value.total === 0
    ? 0
    : Math.round(
        (importProgress.value.done / importProgress.value.total) * 100,
      ),
);

const formSchema = z.object({
  repository: z
    .string({ required_error: "A repository URL is required" })
    .min(2, "A repository URL is required")
    .max(150, "At most 150 characters"),
});
type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
});
const [repository] = form.defineField("repository");
const repositoryError = computed(() => form.errors.value.repository);

const onSubmit = form.handleSubmit(async (values) => {
  if (!userStore.getDefaultOrg) return;
  if (!authStore.getAuthenticated || !authStore.getToken) return;
  try {
    await importProject(
      userStore.getDefaultOrg.id,
      authStore.getToken,
      stripGitSuffix(values.repository),
    );
  } catch (err) {
    errorToast(getImportErrorMessage(err));
    return;
  }
  void router.push({ name: "projects" });
});

// Methods
/**
 * Import a repo and create a project
 * @param orgId the org to which to import the repo
 * @param token the user's authentication token
 * @param repo the repo to import
 */
async function importProject(
  orgId: string,
  token: string,
  repo: string,
): Promise<void> {
  await projectsRepo.createProject({
    orgId: orgId,
    data: {
      integration_id: props.integration,
      url: repo,
    },
    bearerToken: token,
    handleBusinessErrors: true,
  });
}

/**
 * Import the selected repos in bulk, a few at a time, reporting progress.
 * Navigates to the project list once when everything succeeded; otherwise
 * stays on the page so the per-repository failures can be reviewed.
 */
async function importProjectsBulk(): Promise<void> {
  if (!userStore.getDefaultOrg) return;
  if (!authStore.getAuthenticated || !authStore.getToken) return;
  if (importing.value) return;

  const orgId = userStore.getDefaultOrg.id;
  const token = authStore.getToken;
  const repos = [...selectedRepos.value];
  const _reposFailedToImport: Record<string, FailedProjectImport> = {};
  reposFailedToImport.value = {};

  importing.value = true;
  importProgress.value = { done: 0, total: repos.length };
  try {
    await runWithConcurrency(repos, IMPORT_CONCURRENCY, async (repo) => {
      try {
        await importProject(orgId, token, repo.url);
      } catch (err) {
        _reposFailedToImport[repo.id] = {
          repo: repo,
          reason: getImportErrorMessage(err),
        };
      } finally {
        importProgress.value = {
          ...importProgress.value,
          done: importProgress.value.done + 1,
        };
      }
    });
  } finally {
    importing.value = false;
  }

  reposFailedToImport.value = { ..._reposFailedToImport };

  const nmbFailedImports = Object.keys(_reposFailedToImport).length;
  const nmbImported = repos.length - nmbFailedImports;
  if (nmbImported > 0) {
    successToast(`Succesfully imported ${nmbImported} repositories`);
  }
  if (nmbFailedImports > 0) {
    void errorToast(`Failed to import ${nmbFailedImports} repositories`);
  }

  if (repoTableRef.value) {
    repoTableRef.value.clearSelection();
  }
  selectedRepos.value = [];

  if (nmbFailedImports === 0 && nmbImported > 0) {
    void router.push({ name: "projects" });
    return;
  }

  void refreshRepos();
}

async function clearImportErrors(): Promise<void> {
  reposFailedToImportPage.value = 0;
  reposFailedToImport.value = {};
  await forceRefreshRepos();
}

async function forceRefreshRepos(): Promise<void> {
  if (repoTableRef.value) {
    await repoTableRef.value.fetchRepos(false, true);
  }
}

async function refreshRepos(): Promise<void> {
  if (repoTableRef.value) {
    await repoTableRef.value.fetchRepos(true);
  }
}

// Emit Listeners
function onSelectedReposChange(repos: Repository[]): void {
  selectedRepos.value = repos;
}
</script>
<template>
  <div class="flex flex-col gap-8">
    <Card v-if="Object.keys(reposFailedToImport).length === 0">
      <CardHeader class="flex-row items-start justify-between gap-4">
        <div class="flex flex-col gap-1.5">
          <CardTitle>Repositories</CardTitle>
          <CardDescription>
            Select the repositories to import, then import them together.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="importing"
          @click="forceRefreshRepos()"
        >
          <RefreshCw aria-hidden="true" />
          Refresh from provider
        </Button>
      </CardHeader>
      <CardContent class="flex flex-col gap-6">
        <RepoTable
          ref="repoTableRef"
          :integration="integration"
          :get-repos="getRepos"
          :config="tableConfig"
          :disabled="importing"
          @on-selected-repos-change="onSelectedReposChange($event)"
        />

        <div
          v-if="showImportCard"
          class="flex flex-col gap-3 rounded-card border bg-muted p-4"
        >
          <div
            v-if="importing"
            class="flex flex-col gap-2"
            data-testid="import-progress"
          >
            <div class="flex justify-between text-sm">
              <span class="font-medium text-foreground-strong">
                Importing {{ importProgress.done }} /
                {{ importProgress.total }}
              </span>
              <span class="text-muted-foreground">
                {{ importProgressPercent }}%
              </span>
            </div>
            <Progress
              :model-value="importProgressPercent"
              aria-label="Import progress"
            />
          </div>
          <Button
            class="w-fit"
            :disabled="importing"
            data-testid="bulk-import-button"
            arrow
            @click="importProjectsBulk()"
          >
            <template v-if="importing">Importing</template>
            <template v-else>
              Import {{ selectedRepos.length }}
              {{ selectedRepos.length === 1 ? "Project" : "Projects" }}
            </template>
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle>Some imports failed</CardTitle>
        <CardDescription>
          The other selected repositories were imported.
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <ImportErrorTable :repos-failed-to-import="reposFailedToImport" />
        <Button class="w-fit" variant="outline" @click="clearImportErrors()">
          <RefreshCw aria-hidden="true" />
          Back to the repositories
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Import by URL</CardTitle>
        <CardDescription>
          Cannot find a repository? Import it with its URL.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" novalidate @submit="onSubmit">
          <div class="flex max-w-xl flex-col gap-2">
            <Label for="manual-repository">Repository URL</Label>
            <Input
              id="manual-repository"
              v-model="repository"
              type="url"
              placeholder="https://github.com/owner/repository"
              :aria-invalid="repositoryError ? true : undefined"
              :aria-describedby="
                repositoryError
                  ? 'manual-repository-error'
                  : 'manual-repository-hint'
              "
            />
            <p
              v-if="repositoryError"
              id="manual-repository-error"
              class="text-sm text-destructive"
            >
              {{ repositoryError }}
            </p>
            <p
              v-else
              id="manual-repository-hint"
              class="text-sm text-muted-foreground"
            >
              The full URL of the repository.
            </p>
          </div>
          <Button type="submit" variant="outline" class="w-fit">
            <Plus aria-hidden="true" />
            Import repository
          </Button>
        </form>
      </CardContent>
    </Card>

    <Faq />
  </div>
</template>
