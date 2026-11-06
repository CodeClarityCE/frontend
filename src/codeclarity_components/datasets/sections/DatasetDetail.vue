<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";

import { PaginationComponent } from "@/base_components";
import {
  getImportErrorMessage,
  IMPORT_CONCURRENCY,
} from "@/codeclarity_components/projects/create/import/projectImport";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import { Progress } from "@/shadcn/ui/progress";
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
  DatasetStatusColors,
  DatasetStatusLabels,
} from "../dataset.entity";
import { DatasetsRepository } from "../datasets.repository";

/** How often the dataset is reloaded while it builds */
const POLL_INTERVAL_MS = 5000;
const ENTRIES_PER_PAGE = 100;
/** Page size used to fetch every entry before an import */
const IMPORT_FETCH_PAGE_SIZE = 500;

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
const entriesPage = ref(0);
const entriesTotalPages = ref(0);
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
    const response = await datasetsRepository.getDatasetEntries({
      orgId,
      datasetId: datasetId.value,
      pagination: {
        page: entriesPage.value,
        entries_per_page: ENTRIES_PER_PAGE,
      },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    entries.value = response.data;
    entriesTotalPages.value = response.total_pages;
  } catch {
    errorToast("Failed to load the dataset repositories");
  }
}

function goToEntriesPage(page: number): void {
  entriesPage.value = page;
  void loadEntries();
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
      pagination: { page, entries_per_page: IMPORT_FETCH_PAGE_SIZE },
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

onMounted(() => void loadDataset());
onUnmounted(() => clearTimeout(pollTimer));
</script>

<template>
  <div class="space-y-8">
    <RouterLink
      :to="{ name: 'datasets' }"
      class="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
    >
      <Icon icon="solar:arrow-left-linear" class="h-4 w-4" />
      Datasets
    </RouterLink>

    <div v-if="notFound" class="text-center py-20">
      <h3 class="text-lg font-semibold text-gray-900">Dataset not found</h3>
    </div>

    <template v-else-if="dataset">
      <div
        class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900">
              {{ dataset.name }}
            </h1>
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
              :class="DatasetStatusColors[dataset.status]"
              data-testid="dataset-status"
            >
              <Icon
                v-if="dataset.status === DatasetStatus.BUILDING"
                icon="solar:loading-linear"
                class="h-3 w-3 animate-spin"
              />
              {{ DatasetStatusLabels[dataset.status] }}
            </span>
          </div>
          <p class="text-gray-600 mt-2">
            Top {{ dataset.params.limit }}
            {{ dataset.params.languages.join(" / ") }} repositories with more
            than {{ dataset.params.min_stars }} stars,
            {{ dataset.params.pages }} search page(s) per language. Created
            {{ formatDate(dataset.created_on) }}
            <template v-if="dataset.created_by_name">
              by {{ dataset.created_by_name }}</template
            >.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="canRunExperiment"
            :disabled="importing"
            data-testid="dataset-run-experiment"
            @click="runExperiment"
          >
            <Icon icon="solar:test-tube-linear" class="h-4 w-4 mr-2" />
            Run experiment
          </Button>
          <Button
            v-if="canImport"
            :disabled="importing"
            data-testid="dataset-import"
            @click="importAsProjects"
          >
            <Icon icon="solar:import-linear" class="h-4 w-4 mr-2" />
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
        </div>
      </div>

      <div
        v-if="dataset.status === DatasetStatus.BUILDING"
        class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900"
      >
        Searching GitHub and checking each candidate's root files. This takes a
        few minutes, and pauses by itself if the GitHub rate limit is reached.
      </div>

      <div
        v-if="dataset.status === DatasetStatus.FAILED"
        class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900"
        data-testid="dataset-error"
      >
        The build failed: {{ dataset.error ?? "unknown error" }}
      </div>

      <div
        v-if="importing || importProgress.total > 0"
        class="bg-white rounded-xl border border-gray-200 p-4 space-y-2"
      >
        <div class="flex justify-between text-sm text-gray-700">
          <span>{{
            importing ? "Importing projects" : "Import finished"
          }}</span>
          <span>{{ importProgress.done }} / {{ importProgress.total }}</span>
        </div>
        <Progress :model-value="importProgressPercent" />
        <ul
          v-if="importFailures.length > 0"
          class="text-sm text-red-700 space-y-1 pt-2"
          data-testid="dataset-import-failures"
        >
          <li v-for="failure in importFailures" :key="failure.entry.id">
            #{{ failure.entry.rank + 1 }} {{ failure.entry.full_name }}:
            {{ failure.reason }}
          </li>
        </ul>
      </div>

      <div
        v-if="dataset.stats"
        class="grid grid-cols-2 sm:grid-cols-4 gap-4"
        data-testid="dataset-stats"
      >
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500">Selected</p>
          <p class="text-xl font-semibold">
            {{ dataset.stats.selected }} / {{ dataset.params.limit }}
          </p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500">Candidates</p>
          <p class="text-xl font-semibold">{{ dataset.stats.candidates }}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500">Probed</p>
          <p class="text-xl font-semibold">{{ dataset.stats.probed }}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500">Built</p>
          <p class="text-base font-semibold">
            {{ formatDate(dataset.built_on) }}
          </p>
        </div>
        <div
          v-if="rejections.length > 0"
          class="col-span-2 sm:col-span-4 bg-white rounded-lg border border-gray-200 p-4"
        >
          <p class="text-sm text-gray-500 mb-2">Left out while probing</p>
          <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
            <span v-for="rejection in rejections" :key="rejection.key">
              {{ rejection.label }}: <strong>{{ rejection.count }}</strong>
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="entries.length > 0"
        class="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <div
          class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          <div class="col-span-1">Rank</div>
          <div class="col-span-4">Repository</div>
          <div class="col-span-2">Stars</div>
          <div class="col-span-2">Branch</div>
          <div class="col-span-3">Lockfiles</div>
        </div>
        <div
          v-for="entry in entries"
          :key="entry.id"
          class="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-3 border-b border-gray-100 last:border-b-0 text-sm"
          data-testid="dataset-entry"
        >
          <div class="lg:col-span-1 text-gray-500">#{{ entry.rank + 1 }}</div>
          <div class="lg:col-span-4">
            <a
              :href="entry.git_url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-gray-900 hover:underline"
            >
              {{ entry.full_name }}
            </a>
            <span v-if="entry.language" class="text-gray-500">
              · {{ entry.language }}</span
            >
          </div>
          <div class="lg:col-span-2 text-gray-700">
            {{ entry.stars.toLocaleString("en-US") }}
          </div>
          <div class="lg:col-span-2 text-gray-700">
            {{ entry.default_branch }}
          </div>
          <div class="lg:col-span-3 text-gray-700">
            {{ entry.lockfiles.join(", ") }}
          </div>
        </div>
      </div>

      <PaginationComponent
        v-if="entriesTotalPages > 1"
        :current-page="entriesPage"
        :total-pages="entriesTotalPages"
        @page-change="goToEntriesPage"
      />
    </template>
  </div>
</template>
