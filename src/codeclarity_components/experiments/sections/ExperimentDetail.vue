<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, onUnmounted, provide, ref } from "vue";
import { useRoute } from "vue-router";

import { PaginationComponent } from "@/base_components";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import { Progress } from "@/shadcn/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { saveBlob } from "@/utils/download";
import { errorToast, successToast } from "@/utils/toasts";

import {
  type Experiment,
  EXPERIMENT_EXPORT_FILES,
  type ExperimentExportFile,
  type ExperimentResults as ExperimentResultsData,
  type ExperimentRun,
  ExperimentRunStatusColors,
  ExperimentRunStatusLabels,
  ExperimentStatus,
  ExperimentStatusColors,
  ExperimentStatusLabels,
  finishedRunCount,
  formatExperimentDate,
  isExperimentActive,
  type PublishedVersion,
} from "../experiment.entity";
import { ExperimentsRepository } from "../experiments.repository";
import { SELECTED_PUBLISHED_VERSION } from "../published-version";

import ExperimentFigures from "./ExperimentFigures.vue";
import ExperimentResults from "./ExperimentResults.vue";

/** How often the experiment is reloaded while it may still change */
const POLL_INTERVAL_MS = 10_000;
const RUNS_PER_PAGE = 100;
/** Length of the abbreviated commit SHA shown in the coverage table */
const SHORT_SHA_LENGTH = 7;

const route = useRoute();
const userStore = useUserStore();
const auth = useAuthStore();
const experimentsRepository = new ExperimentsRepository();

const experiment = ref<Experiment | null>(null);
const runs = ref<ExperimentRun[]>([]);
const runsPage = ref(0);
const runsTotalPages = ref(0);
const notFound = ref(false);
/** Which destructive action waits for a second click, if any */
const confirming = ref<"cancel" | "delete" | "publish" | null>(null);
const acting = ref(false);
const results = ref<ExperimentResultsData | null>(null);
/** A failing results request is reported once, not on every poll */
const resultsErrorShown = ref(false);
/** Published results versions, newest first */
const publishedVersions = ref<PublishedVersion[]>([]);
/** The version a reader picked; null follows the newest */
const pickedMetricVersion = ref<number | null>(null);
const selectedVersion = computed<PublishedVersion | null>(
  () =>
    publishedVersions.value.find(
      (version) => version.metric_version === pickedMetricVersion.value,
    ) ??
    publishedVersions.value[0] ??
    null,
);
provide(SELECTED_PUBLISHED_VERSION, selectedVersion);
/** What a publish would store now; null until the API has answered */
const currentMetricVersion = ref<number | null>(null);
const exporting = ref<ExperimentExportFile | null>(null);
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const experimentId = computed(() =>
  typeof route.query.id === "string" ? route.query.id : "",
);

const isActive = computed(
  () => experiment.value !== null && isExperimentActive(experiment.value),
);

const isPublished = computed(() => publishedVersions.value.length > 0);

const canPublish = computed(
  () =>
    experiment.value?.status === ExperimentStatus.COMPLETED &&
    currentMetricVersion.value !== null &&
    !publishedVersions.value.some(
      (version) => version.metric_version === currentMetricVersion.value,
    ),
);

const finishedRuns = computed(() =>
  experiment.value ? finishedRunCount(experiment.value.run_counts) : 0,
);

const progressPercent = computed(() => {
  const total = experiment.value?.run_count ?? 0;
  return total === 0 ? 0 : Math.round((finishedRuns.value / total) * 100);
});

async function loadExperiment(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || !experimentId.value) return;

  try {
    const response = await experimentsRepository.getExperiment({
      orgId,
      experimentId: experimentId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    experiment.value = response.data;
    notFound.value = false;
  } catch (err) {
    if (
      err instanceof BusinessLogicError &&
      err.error_code === APIErrors.EntityNotFound
    ) {
      notFound.value = true;
      return;
    }
    errorToast("Failed to load the experiment");
  }

  await loadPublishedVersions();
  await Promise.all([loadRuns(), loadResults()]);

  if (isActive.value) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(() => void loadExperiment(), POLL_INTERVAL_MS);
  }
}

/** Only a COMPLETED experiment can have Published results. */
async function loadPublishedVersions(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || !experimentId.value) return;
  if (experiment.value?.status !== ExperimentStatus.COMPLETED) return;
  try {
    const request = {
      orgId,
      experimentId: experimentId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    };
    const [versions, current] = await Promise.all([
      experimentsRepository.getPublishedVersions(request),
      experimentsRepository.getCurrentMetricVersion(request),
    ]);
    publishedVersions.value = versions.data;
    currentMetricVersion.value = current.data.metric_version;
  } catch {
    errorToast("Failed to load the Published results versions");
  }
}

/** Results are aggregated from done runs: there is nothing before the first. */
async function loadResults(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || !experimentId.value) return;
  if ((experiment.value?.run_counts.done ?? 0) === 0) return;
  const requested = selectedVersion.value;
  try {
    const request = {
      orgId,
      experimentId: experimentId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    };
    const response = requested
      ? await experimentsRepository.getPublishedResults({
          ...request,
          metricVersion: requested.metric_version,
        })
      : await experimentsRepository.getExperimentResults(request);
    // A newer pick is already on its way; this answer is out of date
    if (requested?.metric_version !== selectedVersion.value?.metric_version) {
      return;
    }
    results.value = response.data;
    resultsErrorShown.value = false;
  } catch {
    if (!resultsErrorShown.value) {
      errorToast("Failed to load the experiment results");
      resultsErrorShown.value = true;
    }
  }
}

function pickVersion(event: Event): void {
  pickedMetricVersion.value = Number((event.target as HTMLSelectElement).value);
  void loadResults();
}

function exportFilename(file: ExperimentExportFile): string {
  const name = (experiment.value?.name ?? "experiment")
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-");
  return `${name}-${file}`;
}

async function downloadExport(file: ExperimentExportFile): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || exporting.value) return;
  exporting.value = file;
  try {
    const blob = await experimentsRepository.downloadExperimentExport({
      orgId,
      experimentId: experimentId.value,
      file,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    saveBlob(blob, exportFilename(file));
  } catch {
    errorToast(`Failed to export ${file}`);
  } finally {
    exporting.value = null;
  }
}

async function loadRuns(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || !experimentId.value) return;
  try {
    const response = await experimentsRepository.getExperimentRuns({
      orgId,
      experimentId: experimentId.value,
      pagination: { page: runsPage.value, entries_per_page: RUNS_PER_PAGE },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    runs.value = response.data;
    runsTotalPages.value = response.total_pages;
  } catch {
    errorToast("Failed to load the experiment runs");
  }
}

function isNotAuthorized(err: unknown): boolean {
  return (
    err instanceof BusinessLogicError &&
    err.error_code === APIErrors.NotAuthorized
  );
}

async function cancelExperiment(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || acting.value) return;
  acting.value = true;
  try {
    await experimentsRepository.cancelExperiment({
      orgId,
      experimentId: experimentId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    successToast("Experiment cancelled");
  } catch (err) {
    errorToast(
      isNotAuthorized(err)
        ? "Only organization admins can cancel experiments"
        : "Failed to cancel the experiment",
    );
  } finally {
    acting.value = false;
    confirming.value = null;
  }
  await loadExperiment();
}

async function publishExperiment(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || acting.value) return;
  acting.value = true;
  try {
    await experimentsRepository.publishExperiment({
      orgId,
      experimentId: experimentId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    pickedMetricVersion.value = null;
    successToast("Experiment published");
  } catch (err) {
    errorToast(
      isNotAuthorized(err)
        ? "Only organization admins can publish experiments"
        : "Failed to publish the experiment",
    );
  } finally {
    acting.value = false;
    confirming.value = null;
  }
  await loadExperiment();
}

async function deleteExperiment(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || acting.value) return;
  acting.value = true;
  try {
    await experimentsRepository.deleteExperiment({
      orgId,
      experimentId: experimentId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    successToast("Experiment deleted");
    void router.push({ name: "experiments" });
  } catch (err) {
    errorToast(
      isNotAuthorized(err)
        ? "Only organization admins can delete experiments"
        : "Failed to delete the experiment",
    );
  } finally {
    acting.value = false;
    confirming.value = null;
  }
}

// A run's snapshot: its grid day, or HEAD
function snapshotLabel(gridDate: Date | string | null): string {
  return gridDate ? new Date(gridDate).toISOString().slice(0, 10) : "HEAD";
}

function shortSha(sha: string | null): string {
  return sha ? sha.slice(0, SHORT_SHA_LENGTH) : "-";
}

function goToRunsPage(page: number): void {
  runsPage.value = page;
  void loadRuns();
}

onMounted(() => void loadExperiment());
onUnmounted(() => clearTimeout(pollTimer));
</script>

<template>
  <div class="space-y-8">
    <RouterLink
      :to="{ name: 'experiments' }"
      class="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
    >
      <Icon icon="solar:arrow-left-linear" class="h-4 w-4" />
      Experiments
    </RouterLink>

    <div v-if="notFound" class="text-center py-20">
      <h3 class="text-lg font-semibold text-gray-900">Experiment not found</h3>
    </div>

    <template v-else-if="experiment">
      <div
        class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900">
              {{ experiment.name }}
            </h1>
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
              :class="ExperimentStatusColors[experiment.status]"
              data-testid="experiment-status"
            >
              <Icon
                v-if="isActive"
                icon="solar:loading-linear"
                class="h-3 w-3 animate-spin"
              />
              {{ ExperimentStatusLabels[experiment.status] }}
            </span>
          </div>
          <p class="text-gray-600 mt-2">
            Analyzer
            <strong>{{ experiment.analyzer_name ?? "(deleted)" }}</strong>
            over dataset
            <RouterLink
              :to="{
                name: 'datasets',
                params: { page: 'detail' },
                query: { id: experiment.dataset_id },
              }"
              class="font-medium underline"
              >{{ experiment.dataset_name }}</RouterLink
            >, {{ experiment.retries }} retries per failed run. Created
            {{ formatExperimentDate(experiment.created_on) }}
            <template v-if="experiment.created_by_name">
              by {{ experiment.created_by_name }}</template
            >.
          </p>
          <p class="text-sm text-gray-500 mt-1">
            Started {{ formatExperimentDate(experiment.started_on) }}, ended
            {{ formatExperimentDate(experiment.ended_on) }}
          </p>
          <p
            v-if="experiment.analysis_budget != null"
            class="text-sm text-gray-500"
            data-testid="experiment-budget"
          >
            Analysis budget:
            {{ experiment.analysis_budget.toLocaleString() }} analyses.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <template v-if="confirming === null">
            <Button
              v-if="isActive"
              variant="outline"
              data-testid="experiment-cancel"
              @click="confirming = 'cancel'"
            >
              Cancel experiment
            </Button>
            <Button
              v-if="canPublish"
              data-testid="experiment-publish"
              @click="confirming = 'publish'"
            >
              Publish
            </Button>
            <Button
              v-if="!isPublished"
              variant="outline"
              data-testid="experiment-delete"
              @click="confirming = 'delete'"
            >
              Delete
            </Button>
          </template>
          <template v-else>
            <Button
              v-if="confirming === 'cancel'"
              variant="destructive"
              :disabled="acting"
              data-testid="experiment-cancel-confirm"
              @click="cancelExperiment"
            >
              Confirm cancel
            </Button>
            <Button
              v-else-if="confirming === 'publish'"
              :disabled="acting"
              data-testid="experiment-publish-confirm"
              @click="publishExperiment"
            >
              Confirm publish
            </Button>
            <Button
              v-else
              variant="destructive"
              :disabled="acting"
              data-testid="experiment-delete-confirm"
              @click="deleteExperiment"
            >
              Confirm delete
            </Button>
            <Button variant="outline" @click="confirming = null"> Keep </Button>
          </template>
        </div>
      </div>

      <p
        v-if="confirming === 'cancel'"
        class="text-sm text-gray-600"
        data-testid="experiment-cancel-hint"
      >
        Analyses already submitted finish and are still counted; runs not
        submitted yet are skipped.
      </p>
      <p
        v-if="confirming === 'publish'"
        class="text-sm text-gray-600"
        data-testid="experiment-publish-hint"
      >
        Publishing is one-way: these results are frozen under the current metric
        version so they can be cited. It cannot be undone, and a published
        experiment cannot be deleted.
      </p>
      <p
        v-if="confirming === 'delete'"
        class="text-sm text-gray-600"
        data-testid="experiment-delete-hint"
      >
        Deletes the experiment and its results. Projects and analyses are kept.
      </p>

      <div
        v-if="experiment.status === ExperimentStatus.FAILED"
        class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900"
        data-testid="experiment-error"
      >
        The experiment failed: {{ experiment.error ?? "unknown error" }}
      </div>

      <div
        class="bg-white rounded-xl border border-gray-200 p-4 space-y-2"
        data-testid="experiment-progress"
      >
        <div class="flex justify-between text-sm text-gray-700">
          <span>Finished runs</span>
          <span>{{ finishedRuns }} / {{ experiment.run_count }}</span>
        </div>
        <Progress :model-value="progressPercent" />
        <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
          <span
            >Done: <strong>{{ experiment.run_counts.done }}</strong></span
          >
          <span
            >Failed: <strong>{{ experiment.run_counts.failed }}</strong></span
          >
          <span
            >Skipped: <strong>{{ experiment.run_counts.skipped }}</strong></span
          >
          <span
            >Pending: <strong>{{ experiment.run_counts.pending }}</strong></span
          >
        </div>
      </div>

      <Tabs default-value="results" class="space-y-6">
        <TabsList>
          <TabsTrigger value="results" data-testid="experiment-tab-results">
            Results
          </TabsTrigger>
          <TabsTrigger value="figures" data-testid="experiment-tab-figures">
            Figures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" class="space-y-8">
          <section class="space-y-4" data-testid="experiment-results">
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <h2 class="text-2xl font-semibold text-gray-900">Results</h2>
                <p
                  v-if="selectedVersion"
                  class="text-sm text-gray-600"
                  data-testid="experiment-published-version"
                >
                  Published results, metric version
                  {{ selectedVersion.metric_version }}, published
                  {{ formatExperimentDate(selectedVersion.published_on) }}
                  <template v-if="selectedVersion.published_by_name">
                    by {{ selectedVersion.published_by_name }}</template
                  >.
                </p>
                <label
                  v-if="selectedVersion"
                  class="mt-2 flex items-center gap-2 text-sm text-gray-600"
                >
                  Version
                  <select
                    class="border border-gray-300 rounded-md bg-white px-2 py-1 text-sm text-gray-900"
                    data-testid="experiment-version-select"
                    :value="selectedVersion.metric_version"
                    @change="pickVersion"
                  >
                    <option
                      v-for="version in publishedVersions"
                      :key="version.metric_version"
                      :value="version.metric_version"
                    >
                      Metric version {{ version.metric_version }}
                    </option>
                  </select>
                </label>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button
                  v-for="file in EXPERIMENT_EXPORT_FILES"
                  :key="file"
                  variant="outline"
                  size="sm"
                  :disabled="exporting !== null"
                  :data-testid="`export-${file}`"
                  @click="downloadExport(file)"
                >
                  <Icon
                    :icon="
                      exporting === file
                        ? 'solar:loading-linear'
                        : 'solar:download-linear'
                    "
                    class="h-4 w-4 mr-1"
                    :class="{ 'animate-spin': exporting === file }"
                  />
                  {{ file }}
                </Button>
              </div>
            </div>
            <ExperimentResults v-if="results" :results="results" />
            <p
              v-else-if="experiment.run_counts.done === 0"
              class="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-sm text-gray-600"
              data-testid="experiment-results-empty"
            >
              Results appear once the first run is done.
            </p>
          </section>

          <div
            v-if="runs.length > 0"
            class="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div
              class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div class="col-span-1">Rank</div>
              <div class="col-span-3">Repository</div>
              <div class="col-span-1">Snapshot</div>
              <div class="col-span-2">State</div>
              <div class="col-span-2">Error</div>
              <div class="col-span-2">Commit</div>
              <div class="col-span-1">Analysis</div>
            </div>
            <div
              v-for="run in runs"
              :key="run.id"
              class="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-3 border-b border-gray-100 last:border-b-0 text-sm"
              data-testid="experiment-run"
            >
              <div class="lg:col-span-1 text-gray-500">
                #{{ run.entry.rank + 1 }}
              </div>
              <div class="lg:col-span-3">
                <a
                  :href="run.entry.git_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-gray-900 hover:underline"
                >
                  {{ run.entry.full_name }}
                </a>
              </div>
              <div
                class="lg:col-span-1 text-gray-700 whitespace-nowrap"
                data-testid="experiment-run-snapshot"
              >
                {{ snapshotLabel(run.grid_date) }}
              </div>
              <div class="lg:col-span-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
                  :class="ExperimentRunStatusColors[run.status]"
                >
                  {{ ExperimentRunStatusLabels[run.status] }}
                </span>
                <span
                  v-if="run.attempts > 1"
                  class="text-xs text-gray-500 ml-1"
                >
                  {{ run.attempts }} attempts
                </span>
              </div>
              <div class="lg:col-span-2 text-gray-700 break-words">
                {{ run.error ?? "" }}
              </div>
              <div
                class="lg:col-span-2 font-mono text-gray-700"
                :title="run.commit_hash ?? undefined"
              >
                {{ shortSha(run.commit_hash) }}
                <span v-if="run.branch" class="font-sans text-gray-500">
                  ({{ run.branch }})</span
                >
              </div>
              <div class="lg:col-span-1">
                <RouterLink
                  v-if="run.analysis_id && run.project_id"
                  :to="{
                    name: 'results',
                    query: {
                      analysis_id: run.analysis_id,
                      project_id: run.project_id,
                    },
                  }"
                  class="text-gray-900 underline"
                  data-testid="run-analysis"
                >
                  Open
                </RouterLink>
              </div>
            </div>
          </div>

          <PaginationComponent
            v-if="runsTotalPages > 1"
            :current-page="runsPage"
            :total-pages="runsTotalPages"
            @page-change="goToRunsPage"
          />
        </TabsContent>

        <TabsContent value="figures">
          <ExperimentFigures
            :experiment-id="experimentId"
            :grid-coverage="results?.grid_coverage ?? []"
          />
        </TabsContent>
      </Tabs>
    </template>
  </div>
</template>
