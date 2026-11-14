<script lang="ts" setup>
import { Plus, Trash2 } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import {
  BrandEmphasis,
  OwlEmptyState,
  PageHeading,
  StatTile,
  StatusBadge,
} from "@/base_components/page";
import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import AnalysisFailureReason from "@/codeclarity_components/analyses/AnalysisFailureReason.vue";
import ProjectLanguageDetection from "@/codeclarity_components/projects/components/ProjectLanguageDetection.vue";
import ProjectSource from "@/codeclarity_components/projects/components/ProjectSource.vue";
import type { Project } from "@/codeclarity_components/projects/project.entity";
import {
  ProjectRepository,
  ProjectsSortInterface,
} from "@/codeclarity_components/projects/project.repository";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";
import { errorToast, successToast } from "@/utils/toasts";

import {
  analysisStatus,
  byNewest,
  formatDateTime,
  formatDay,
  isActive,
  isFinished,
  isRunning,
  isScheduled,
} from "./analysis-status";
import ProjectAnalysesDialog from "./components/ProjectAnalysesDialog.vue";

/** How often the list refreshes while an analysis is still running */
const POLL_INTERVAL_MS = 5000;
/** The API's largest page; every project is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 100;

const userStore = useUserStore();
const authStore = useAuthStore();
const projectRepository = new ProjectRepository();

const projects = ref<Project[]>([]);
const loaded = ref(false);
const hasError = ref(false);
const analysesOf = ref<Project | null>(null);
const toDelete = ref<Project | null>(null);
const deleting = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const orgId = computed(() => userStore.getDefaultOrg?.id);
const allAnalyses = computed(() =>
  projects.value.flatMap((project) => project.analyses ?? []),
);
const anyActive = computed(() => allAnalyses.value.some(isActive));
const lastAnalysis = computed(() => byNewest(allAnalyses.value)[0]);

function latest(project: Project): Analysis | undefined {
  return byNewest(project.analyses)[0];
}

const columns: ColumnDef<Project, unknown>[] = [
  { id: "name", accessorKey: "name", header: "Project" },
  { id: "source", accessorKey: "type", header: "Source" },
  {
    id: "languages",
    header: "Languages",
    enableSorting: false,
    enableGlobalFilter: false,
  },
  {
    id: "latest",
    accessorFn: (project) => {
      const analysis = latest(project);
      return analysis ? new Date(analysis.created_on).getTime() : 0;
    },
    header: "Latest analysis",
    enableGlobalFilter: false,
  },
  {
    id: "analyses",
    accessorFn: (project) => project.analyses?.length ?? 0,
    header: "Analyses",
    enableGlobalFilter: false,
  },
  {
    id: "added",
    accessorFn: (project) => new Date(project.added_on).getTime(),
    header: "Added",
    enableGlobalFilter: false,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
  },
];

function analysesCount(project: Project): string {
  const count = project.analyses?.length ?? 0;
  return `${count} ${count === 1 ? "analysis" : "analyses"}`;
}

async function fetchAll(org: string, token: string): Promise<Project[]> {
  const all: Project[] = [];
  for (let page = 0; ; page++) {
    const response = await projectRepository.getProjects({
      orgId: org,
      pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
      search: { searchKey: "" },
      sort: {
        sortKey: ProjectsSortInterface.NAME,
        sortDirection: SortDirection.ASC,
      },
      bearerToken: token,
      handleBusinessErrors: true,
    });
    all.push(...response.data);
    if (page + 1 >= response.total_pages) return all;
  }
}

async function load(): Promise<void> {
  if (!orgId.value || !authStore.getToken) return;

  try {
    projects.value = await fetchAll(orgId.value, authStore.getToken);
    hasError.value = false;
    // Keep the open dialog in step with the reloaded project.
    if (analysesOf.value) {
      const id = analysesOf.value.id;
      analysesOf.value = projects.value.find((p) => p.id === id) ?? null;
    }
  } catch {
    hasError.value = true;
  } finally {
    loaded.value = true;
    schedulePoll();
  }
}

function schedulePoll(): void {
  clearTimeout(pollTimer);
  if (anyActive.value) {
    pollTimer = setTimeout(() => void load(), POLL_INTERVAL_MS);
  }
}

function resultsLink(project: Project): Record<string, unknown> | undefined {
  const analysis = latest(project);
  if (!analysis || !isFinished(analysis)) return undefined;
  const query: Record<string, string | number> = {
    analysis_id: analysis.id,
    project_id: project.id,
  };
  if (isScheduled(analysis)) query.run_index = 0;
  return { name: "results", query };
}

async function deleteProject(): Promise<void> {
  const project = toDelete.value;
  if (!project || !orgId.value || !authStore.getToken) return;

  deleting.value = true;
  try {
    await projectRepository.deleteProject({
      orgId: orgId.value,
      projectId: project.id,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast(`Deleted ${project.name}`);
  } catch (err) {
    if (
      err instanceof BusinessLogicError &&
      err.error_code === APIErrors.EntityNotFound
    ) {
      successToast(`Deleted ${project.name}`);
    } else {
      errorToast(`Failed to delete ${project.name}`);
    }
  } finally {
    deleting.value = false;
    toDelete.value = null;
    void load();
  }
}

onMounted(() => void load());
onUnmounted(() => clearTimeout(pollTimer));
</script>

<template>
  <PageHeading
    description="Repositories and uploads you analyse for vulnerabilities, licences and outdated dependencies."
  >
    <BrandEmphasis>Projects</BrandEmphasis>
    <template #actions>
      <Button
        :as="RouterLink"
        :to="{ name: 'projects', params: { page: 'add' } }"
      >
        <Plus aria-hidden="true" />
        Add Project
      </Button>
    </template>
  </PageHeading>

  <Alert v-if="hasError" variant="destructive">
    <AlertDescription class="flex items-center justify-between gap-4">
      The projects could not be loaded.
      <Button variant="outline" size="sm" @click="load">Try again</Button>
    </AlertDescription>
  </Alert>

  <OwlEmptyState
    v-else-if="loaded && projects.length === 0"
    title="No Projects yet"
    description="Import a repository through a GitHub or GitLab integration, or upload an archive, then run an analysis on it."
  >
    <div class="flex flex-wrap justify-center gap-3">
      <Button
        :as="RouterLink"
        :to="{ name: 'projects', params: { page: 'add' } }"
        arrow
      >
        Add a Project
      </Button>
      <Button
        v-if="orgId"
        :as="RouterLink"
        :to="{
          name: 'orgs',
          params: { orgId, page: 'integrations', action: 'manage' },
        }"
        variant="outline"
      >
        Connect an integration
      </Button>
    </div>
  </OwlEmptyState>

  <template v-else>
    <ul
      v-if="loaded"
      aria-label="Project overview"
      class="grid grid-cols-4 gap-4"
    >
      <StatTile label="Projects" :value="projects.length" />
      <StatTile
        label="Completed analyses"
        :value="allAnalyses.filter(isFinished).length"
      />
      <StatTile
        label="Running analyses"
        :value="allAnalyses.filter(isRunning).length"
      />
      <StatTile
        label="Last analysis"
        :value="lastAnalysis ? formatDay(lastAnalysis.created_on) : 'None yet'"
      />
    </ul>

    <DataTable
      :columns="columns"
      :data="projects"
      :loading="!loaded"
      :row-key="(project: Project) => project.id"
      caption="Projects"
      filter-label="Filter projects"
      empty-text="No projects match."
      row-testid="project-row"
    >
      <template #cell-name="{ row }">
        <span class="font-semibold text-foreground-strong">{{ row.name }}</span>
      </template>
      <template #cell-source="{ row }">
        <ProjectSource :type="row.type" />
      </template>
      <template #cell-languages="{ row }">
        <ProjectLanguageDetection :project="row" />
      </template>
      <template #cell-latest="{ row }">
        <div v-if="latest(row)" class="flex max-w-64 flex-col gap-1">
          <StatusBadge
            :tone="analysisStatus(latest(row)!).tone"
            :label="analysisStatus(latest(row)!).label"
            :busy="analysisStatus(latest(row)!).busy"
            class="w-fit"
          />
          <span class="whitespace-nowrap text-xs text-muted-foreground">
            {{ formatDateTime(latest(row)!.created_on) }}
          </span>
          <AnalysisFailureReason :analysis="latest(row)!" />
        </div>
        <span v-else class="text-muted-foreground">Not analysed</span>
      </template>
      <template #cell-analyses="{ row }">
        <Button
          v-if="row.analyses?.length"
          variant="link"
          size="sm"
          class="-ml-3 tabular-nums"
          :aria-label="`${analysesCount(row)} of ${row.name}`"
          @click="analysesOf = row"
        >
          {{ analysesCount(row) }}
        </Button>
        <span v-else class="text-muted-foreground">None</span>
      </template>
      <template #cell-added="{ row }">
        <span class="whitespace-nowrap">{{ formatDay(row.added_on) }}</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <Button
            :as="RouterLink"
            :to="{
              name: 'analyses',
              params: { page: 'add' },
              query: { id: row.id },
            }"
            variant="outline"
            size="sm"
            :aria-label="`New analysis of ${row.name}`"
          >
            New analysis
          </Button>
          <Button
            v-if="resultsLink(row)"
            :as="RouterLink"
            :to="resultsLink(row)"
            variant="ghost"
            size="sm"
            :aria-label="`Results of ${row.name}`"
          >
            Results
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-label="`Delete ${row.name}`"
            @click="toDelete = row"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </template>
    </DataTable>
  </template>

  <ProjectAnalysesDialog
    v-if="analysesOf"
    :project="analysesOf"
    :open="analysesOf !== null"
    @update:open="(value: boolean) => !value && (analysesOf = null)"
    @changed="load"
  />

  <Dialog
    :open="toDelete !== null"
    @update:open="(value: boolean) => !value && (toDelete = null)"
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete {{ toDelete?.name }}?</DialogTitle>
        <DialogDescription>
          The project, its
          {{ toDelete?.analyses?.length ?? 0 }}
          {{ toDelete?.analyses?.length === 1 ? "analysis" : "analyses" }} and
          every result, SBOM and report are deleted. This cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" :disabled="deleting" @click="toDelete = null">
          Cancel
        </Button>
        <Button
          variant="destructive"
          :disabled="deleting"
          @click="deleteProject"
        >
          {{ deleting ? "Deleting" : "Delete project" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
