<script setup lang="ts">
import { ArrowLeft, FlaskConical, FolderInput, Info } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import { BrandEmphasis, PageHeading, StatTile } from "@/base_components/page";
import {
  getImportErrorMessage,
  IMPORT_CONCURRENCY,
} from "@/codeclarity_components/projects/create/import/projectImport";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Progress } from "@/shadcn/ui/progress";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { runWithConcurrency } from "@/utils/concurrency";
import { errorToast, successToast } from "@/utils/toasts";

import {
  type Dataset,
  type DatasetEntry,
  DatasetRejectionLabels,
  type DatasetStats,
  DatasetStatus,
} from "../dataset.entity";
import { DatasetsRepository } from "../datasets.repository";
import DatasetStatusBadge from "../DatasetStatusBadge.vue";

/** How often the dataset is reloaded while it builds */
const POLL_INTERVAL_MS = 5000;
/** The API's largest page; every entry is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 500;

interface FailedEntryImport {
  entry: DatasetEntry;
  reason: string;
}

const route = useRoute();
const userStore = useUserStore();
const auth = useAuthStore();
const datasetsRepository = new DatasetsRepository();
const projectRepository = new ProjectRepository();

const dataset = ref<Dataset | null>(null);
const entries = ref<DatasetEntry[]>([]);
const notFound = ref(false);
const importing = ref(false);
const importProgress = ref({ done: 0, total: 0 });
const importFailures = ref<FailedEntryImport[]>([]);
const confirmingDelete = ref(false);
const deleting = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const datasetId = computed(() =>
  typeof route.query.id === "string" ? route.query.id : "",
);

const importProgressPercent = computed(() =>
  importProgress.value.total === 0
    ? 0
    : Math.round(
        (importProgress.value.done / importProgress.value.total) * 100,
      ),
);

const rejections = computed(() => {
  const stats = dataset.value?.stats;
  if (!stats) return [];
  return (
    Object.keys(DatasetRejectionLabels) as (keyof DatasetStats["rejected"])[]
  )
    .map((key) => ({
      key,
      label: DatasetRejectionLabels[key],
      count: stats.rejected[key],
    }))
    .filter((rejection) => rejection.count > 0);
});

const canImport = computed(
  () =>
    dataset.value?.status === DatasetStatus.READY &&
    dataset.value.entry_count > 0 &&
    dataset.value.integration_id !== null,
);

/** Only a READY dataset can be the cohort of an experiment */
const canRunExperiment = computed(
  () =>
    dataset.value?.status === DatasetStatus.READY &&
    dataset.value.entry_count > 0,
);

function runExperiment(): void {
  void router.push({
    name: "experiments",
    params: { page: "add" },
    query: { dataset: datasetId.value },
  });
}

async function loadDataset(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || !datasetId.value) return;

  const wasBuilding = dataset.value?.status === DatasetStatus.BUILDING;
  try {
    const response = await datasetsRepository.getDataset({
      orgId,
      datasetId: datasetId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    dataset.value = response.data;
    notFound.value = false;
  } catch (err) {
    if (
      err instanceof BusinessLogicError &&
      err.error_code === APIErrors.EntityNotFound
    ) {
      notFound.value = true;
      return;
    }
    errorToast("Failed to load the dataset");
  }

  const status = dataset.value?.status;
  if (status === DatasetStatus.BUILDING) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(() => void loadDataset(), POLL_INTERVAL_MS);
  } else if (
    status === DatasetStatus.READY &&
    (wasBuilding || !entries.value.length)
  ) {
    await loadEntries();
  }
}

async function loadEntries(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || !datasetId.value) return;
  try {
    entries.value = await fetchAllEntries(orgId, auth.getToken);
  } catch {
    errorToast("Failed to load the dataset repositories");
  }
}

async function fetchAllEntries(
  orgId: string,
  token: string,
): Promise<DatasetEntry[]> {
  const all: DatasetEntry[] = [];
  for (let page = 0; ; page++) {
    const response = await datasetsRepository.getDatasetEntries({
      orgId,
      datasetId: datasetId.value,
      pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
      bearerToken: token,
      handleBusinessErrors: true,
    });
    all.push(...response.data);
    if (page + 1 >= response.total_pages) return all;
  }
}

/**
 * Import every repository of the dataset as a project, a few at a time.
 * Repositories imported before (AlreadyExists) count as imported.
 */
async function importAsProjects(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  const token = auth.getToken;
  const integrationId = dataset.value?.integration_id;
  if (!orgId || !token || !integrationId || importing.value) return;

  importing.value = true;
  importFailures.value = [];
  const failures: FailedEntryImport[] = [];
  let alreadyImported = 0;
  try {
    const all = await fetchAllEntries(orgId, token);
    importProgress.value = { done: 0, total: all.length };
    await runWithConcurrency(all, IMPORT_CONCURRENCY, async (entry) => {
      try {
        await projectRepository.createProject({
          orgId,
          data: { integration_id: integrationId, url: entry.git_url },
          bearerToken: token,
          handleBusinessErrors: true,
        });
      } catch (err) {
        if (
          err instanceof BusinessLogicError &&
          err.error_code === APIErrors.AlreadyExists
        ) {
          alreadyImported++;
        } else {
          failures.push({ entry, reason: getImportErrorMessage(err) });
        }
      } finally {
        importProgress.value = {
          ...importProgress.value,
          done: importProgress.value.done + 1,
        };
      }
    });
  } catch {
    errorToast("Failed to load the dataset repositories");
    return;
  } finally {
    importing.value = false;
  }

  importFailures.value = failures.sort((a, b) => a.entry.rank - b.entry.rank);
  const imported =
    importProgress.value.total - failures.length - alreadyImported;
  if (imported > 0 || alreadyImported > 0) {
    const already =
      alreadyImported > 0 ? `, ${alreadyImported} already imported` : "";
    successToast(`Imported ${imported} projects${already}`);
  }
  if (failures.length > 0) {
    errorToast(`Failed to import ${failures.length} repositories`);
  }
}

async function deleteDataset(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || deleting.value) return;
  deleting.value = true;
  try {
    await datasetsRepository.deleteDataset({
      orgId,
      datasetId: datasetId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    successToast("Dataset deleted");
    void router.push({ name: "datasets" });
  } catch (err) {
    errorToast(
      err instanceof BusinessLogicError &&
        err.error_code === APIErrors.NotAuthorized
        ? "Only organization admins can delete datasets"
        : "Failed to delete the dataset",
    );
  } finally {
    deleting.value = false;
    confirmingDelete.value = false;
  }
}

function formatDay(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date | null): string | undefined {
  if (!date) return undefined;
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const entryColumns: ColumnDef<DatasetEntry, unknown>[] = [
  {
    id: "rank",
    accessorKey: "rank",
    header: "Rank",
    enableGlobalFilter: false,
  },
  { id: "repository", accessorKey: "full_name", header: "Repository" },
  {
    id: "stars",
    accessorKey: "stars",
    header: "Stars",
    enableGlobalFilter: false,
  },
  { id: "branch", accessorKey: "default_branch", header: "Branch" },
  {
    id: "lockfiles",
    accessorFn: (entry) => entry.lockfiles.join(", "),
    header: "Lockfiles",
    enableSorting: false,
  },
];

onMounted(() => void loadDataset());
onUnmounted(() => clearTimeout(pollTimer));
</script>

<template>
  <div class="flex flex-col gap-8">
    <RouterLink
      :to="{ name: 'datasets' }"
      class="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ArrowLeft aria-hidden="true" class="size-4" />
      Datasets
    </RouterLink>

    <PageHeading v-if="notFound">Dataset not found</PageHeading>

    <template v-else-if="dataset">
      <PageHeading>
        <BrandEmphasis>{{ dataset.name }}</BrandEmphasis>
        <template #badge>
          <DatasetStatusBadge
            :status="dataset.status"
            data-testid="dataset-status"
          />
        </template>
        <template #description>
          Top {{ dataset.params.limit }}
          {{ dataset.params.languages.join(" / ") }} repositories with more than
          {{ dataset.params.min_stars }} stars,
          {{ dataset.params.pages }} search page(s) per language. Created
          {{ formatDate(dataset.created_on) }}
          <template v-if="dataset.created_by_name">
            by {{ dataset.created_by_name }}</template
          >.
        </template>
        <template #actions>
          <Button
            v-if="canRunExperiment"
            :disabled="importing"
            data-testid="dataset-run-experiment"
            arrow
            @click="runExperiment"
          >
            <FlaskConical aria-hidden="true" />
            Run Experiment
          </Button>
          <Button
            v-if="canImport"
            variant="outline"
            :disabled="importing"
            data-testid="dataset-import"
            @click="importAsProjects"
          >
            <FolderInput aria-hidden="true" />
            Import as projects
          </Button>
          <Button
            v-if="!confirmingDelete"
            variant="outline"
            :disabled="importing"
            data-testid="dataset-delete"
            @click="confirmingDelete = true"
          >
            {{
              dataset.status === DatasetStatus.BUILDING
                ? "Cancel build"
                : "Delete"
            }}
          </Button>
          <template v-else>
            <Button
              variant="destructive"
              :disabled="deleting"
              data-testid="dataset-delete-confirm"
              @click="deleteDataset"
            >
              Confirm delete
            </Button>
            <Button variant="outline" @click="confirmingDelete = false">
              Keep
            </Button>
          </template>
        </template>
      </PageHeading>

      <Alert v-if="dataset.status === DatasetStatus.BUILDING" role="status">
        <Info aria-hidden="true" class="size-4" />
        <AlertDescription>
          Searching GitHub and checking each candidate's root files. This takes
          a few minutes, and pauses by itself if the GitHub rate limit is
          reached.
        </AlertDescription>
      </Alert>

      <Alert
        v-if="dataset.status === DatasetStatus.FAILED"
        variant="destructive"
        data-testid="dataset-error"
      >
        <AlertDescription>
          The build failed: {{ dataset.error ?? "unknown error" }}
        </AlertDescription>
      </Alert>

      <Card
        v-if="importing || importProgress.total > 0"
        class="rounded-card shadow-card"
      >
        <CardContent class="flex flex-col gap-2 pt-6">
          <div class="flex justify-between text-sm text-foreground">
            <span id="dataset-import-label">{{
              importing ? "Importing projects" : "Import finished"
            }}</span>
            <span class="tabular-nums"
              >{{ importProgress.done }} / {{ importProgress.total }}</span
            >
          </div>
          <Progress
            :model-value="importProgressPercent"
            aria-labelledby="dataset-import-label"
          />
          <ul
            v-if="importFailures.length > 0"
            class="flex flex-col gap-1 pt-2 text-sm text-destructive"
            data-testid="dataset-import-failures"
          >
            <li v-for="failure in importFailures" :key="failure.entry.id">
              #{{ failure.entry.rank + 1 }} {{ failure.entry.full_name }}:
              {{ failure.reason }}
            </li>
          </ul>
        </CardContent>
      </Card>

      <div
        v-if="dataset.stats"
        class="flex flex-col gap-4"
        data-testid="dataset-stats"
      >
        <ul aria-label="Build numbers" class="grid grid-cols-4 gap-4">
          <StatTile
            label="Selected"
            :value="`${dataset.stats.selected} / ${dataset.params.limit}`"
          />
          <StatTile label="Candidates" :value="dataset.stats.candidates" />
          <StatTile label="Probed" :value="dataset.stats.probed" />
          <StatTile
            label="Built"
            :value="formatDay(dataset.built_on)"
            :hint="formatTime(dataset.built_on)"
          />
        </ul>
        <div
          v-if="rejections.length > 0"
          class="rounded-card border bg-card p-4 shadow-card"
        >
          <h2 class="mb-2 text-sm text-muted-foreground">
            Left out while probing
          </h2>
          <p class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-foreground">
            <span v-for="rejection in rejections" :key="rejection.key">
              {{ rejection.label }}: <strong>{{ rejection.count }}</strong>
            </span>
          </p>
        </div>
      </div>

      <section
        v-if="dataset.status === DatasetStatus.READY"
        class="flex flex-col gap-4"
        aria-labelledby="dataset-entries-heading"
      >
        <h2
          id="dataset-entries-heading"
          class="text-xl font-bold tracking-tight text-foreground-strong"
        >
          Repositories
        </h2>
        <DataTable
          :columns="entryColumns"
          :data="entries"
          :row-key="(entry: DatasetEntry) => entry.id"
          caption="Dataset entries"
          filter-label="Filter repositories"
          empty-text="No repositories match."
          row-testid="dataset-entry"
        >
          <template #cell-rank="{ row }">
            <span class="tabular-nums text-muted-foreground"
              >#{{ row.rank + 1 }}</span
            >
          </template>
          <template #cell-repository="{ row }">
            <a
              :href="row.git_url"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-sm font-semibold text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {{ row.full_name }}
            </a>
            <span v-if="row.language" class="text-muted-foreground">
              · {{ row.language }}</span
            >
          </template>
          <template #cell-stars="{ row }">
            <span class="tabular-nums">{{
              row.stars.toLocaleString("en-US")
            }}</span>
          </template>
        </DataTable>
      </section>
    </template>

    <div
      v-else
      role="status"
      aria-label="Loading the Dataset"
      class="flex flex-col gap-8"
    >
      <div class="flex flex-col gap-3">
        <Skeleton class="h-9 w-72" />
        <Skeleton class="h-5 w-[32rem]" />
      </div>
      <div class="grid grid-cols-4 gap-4">
        <Skeleton v-for="tile in 4" :key="tile" class="h-24 rounded-card" />
      </div>
      <Skeleton class="h-80 rounded-card" />
    </div>
  </div>
</template>
