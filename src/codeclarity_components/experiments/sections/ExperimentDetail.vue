<script setup lang="ts">
import {
  ArrowLeft,
  CircleAlert,
  Download,
  LoaderCircle,
  Lock,
} from "@lucide/vue";
import { computed, onMounted, onUnmounted, provide, ref, watch } from "vue";
import { useRoute } from "vue-router";

import DataTablePagination from "@/base_components/data-table/DataTablePagination.vue";
import {
  BrandEmphasis,
  FrozenBadge,
  PageHeading,
  StatusBadge,
} from "@/base_components/page";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Label } from "@/shadcn/ui/label";
import { Progress } from "@/shadcn/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Skeleton } from "@/shadcn/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { saveBlob } from "@/utils/download";
import { errorToast, successToast } from "@/utils/toasts";

import { OPEN_AS_FIGURE } from "../charts/open-as-figure";
import {
  type Experiment,
  EXPERIMENT_EXPORT_FILES,
  type ExperimentExportFile,
  type ExperimentResults as ExperimentResultsData,
  type ExperimentRun,
  ExperimentRunStatus,
  ExperimentRunStatusLabels,
  ExperimentRunStatusTones,
  ExperimentStatus,
  finishedRunCount,
  formatExperimentDate,
  isExperimentActive,
  type PublishedVersion,
} from "../experiment.entity";
import type {
  FigureCatalog,
  FigureDefinition,
} from "../experiment-figure.entity";
import { ExperimentsRepository } from "../experiments.repository";
import ExperimentStatusBadge from "../ExperimentStatusBadge.vue";
import { SELECTED_PUBLISHED_VERSION } from "../published-version";

import ExperimentFigures from "./ExperimentFigures.vue";
import ExperimentLoadProgress from "./ExperimentLoadProgress.vue";
import ExperimentResults from "./ExperimentResults.vue";

/** How often the experiment is reloaded while it may still change */
const POLL_INTERVAL_MS = 10_000;
const RUNS_PER_PAGE = 100;
/** Run states in the order the progress lists them */
const RUN_STATES = [
  ExperimentRunStatus.DONE,
  ExperimentRunStatus.FAILED,
  ExperimentRunStatus.SKIPPED,
  ExperimentRunStatus.PENDING,
] as const;
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
const runsTotal = ref(0);
const notFound = ref(false);
/** Which destructive action waits for a second click, if any */
const confirming = ref<"cancel" | "delete" | "publish" | null>(null);
const acting = ref(false);
const results = ref<ExperimentResultsData | null>(null);
/** The metric version of the results shown, null for unpublished results */
const resultsVersion = ref<number | null>(null);
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
const exporting = ref<ExperimentExportFile | "package" | null>(null);
let pollTimer: ReturnType<typeof setTimeout> | undefined;
const activeTab = ref("results");
const figureCatalog = ref<FigureCatalog | null>(null);
/** The definition a result block is opening in the composer */
const figureRequest = ref<FigureDefinition | null>(null);

provide(OPEN_AS_FIGURE, {
  catalog: figureCatalog,
  open(definition) {
    figureRequest.value = definition;
    activeTab.value = "figures";
  },
});

// Coming back to the tab must not reapply an old request
watch(activeTab, (tab) => {
  if (tab !== "figures") figureRequest.value = null;
});

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

/** Result blocks and the composer offer only what the catalog allows. */
async function loadFigureCatalog(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || !experimentId.value) return;
  try {
    const response = await experimentsRepository.getFigureCatalog({
      orgId,
      experimentId: experimentId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    figureCatalog.value = response.data;
  } catch {
    errorToast("Failed to load the Figure catalog");
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
    resultsVersion.value = requested?.metric_version ?? null;
    resultsErrorShown.value = false;
  } catch {
    if (!resultsErrorShown.value) {
      errorToast("Failed to load the experiment results");
      resultsErrorShown.value = true;
    }
  }
}

function pickVersion(value: unknown): void {
  pickedMetricVersion.value = Number(value);
  void loadResults();
}

function exportFilename(file: string): string {
  const name = (experiment.value?.name ?? "experiment")
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-");
  return `${name}-${file}`;
}

async function downloadExport(file: ExperimentExportFile): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || exporting.value) return;
  exporting.value = file;
  const metricVersion = resultsVersion.value;
  try {
    const blob = await experimentsRepository.downloadExperimentExport({
      orgId,
      experimentId: experimentId.value,
      file,
      ...(metricVersion === null ? {} : { metricVersion }),
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    saveBlob(
      blob,
      exportFilename(
        metricVersion === null ? file : `v${metricVersion}-${file}`,
      ),
    );
  } catch {
    errorToast(`Failed to export ${file}`);
  } finally {
    exporting.value = null;
  }
}

async function downloadPackage(metricVersion: number): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken || exporting.value) return;
  exporting.value = "package";
  try {
    const blob = await experimentsRepository.downloadPublishedPackage({
      orgId,
      experimentId: experimentId.value,
      metricVersion,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    saveBlob(blob, exportFilename(`v${metricVersion}-package.zip`));
  } catch {
    errorToast("Failed to download the replication package");
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
    runsTotal.value = response.total_entries;
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

onMounted(async () => {
  await loadExperiment();
  if (!notFound.value) await loadFigureCatalog();
});
onUnmounted(() => clearTimeout(pollTimer));
</script>

<template>
  <div class="flex flex-col gap-8">
    <RouterLink
      :to="{ name: 'experiments' }"
      class="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ArrowLeft aria-hidden="true" class="size-4" />
      Experiments
    </RouterLink>

    <PageHeading v-if="notFound">Experiment not found</PageHeading>

    <template v-else-if="experiment">
      <PageHeading>
        <BrandEmphasis>{{ experiment.name }}</BrandEmphasis>
        <template #badge>
          <ExperimentStatusBadge
            :status="experiment.status"
            data-testid="experiment-status"
          />
        </template>
        <template #description>
          Analyzer
          <strong class="font-semibold text-foreground">{{
            experiment.analyzer_name ?? "(deleted)"
          }}</strong>
          over Dataset
          <RouterLink
            :to="{
              name: 'datasets',
              params: { page: 'detail' },
              query: { id: experiment.dataset_id },
            }"
            class="rounded-sm font-semibold text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >{{ experiment.dataset_name }}</RouterLink
          >, {{ experiment.retries }} retries per failed run. Created
          {{ formatExperimentDate(experiment.created_on) }}
          <template v-if="experiment.created_by_name">
            by {{ experiment.created_by_name }}</template
          >.
          <span class="mt-1 block text-sm">
            Started {{ formatExperimentDate(experiment.started_on) }}, ended
            {{ formatExperimentDate(experiment.ended_on) }}
          </span>
          <span
            v-if="experiment.analysis_budget != null"
            class="block text-sm"
            data-testid="experiment-budget"
            >Analysis budget:
            {{ experiment.analysis_budget.toLocaleString() }} analyses.</span
          >
        </template>
        <template #actions>
          <template v-if="confirming === null">
            <Button
              v-if="isActive"
              variant="outline"
              data-testid="experiment-cancel"
              @click="confirming = 'cancel'"
            >
              Cancel Experiment
            </Button>
            <Button
              v-if="canPublish"
              data-testid="experiment-publish"
              @click="confirming = 'publish'"
            >
              <Lock aria-hidden="true" />
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
        </template>
      </PageHeading>

      <p
        v-if="confirming === 'cancel'"
        class="text-sm text-foreground"
        data-testid="experiment-cancel-hint"
      >
        Analyses already submitted finish and are still counted; runs not
        submitted yet are skipped.
      </p>
      <p
        v-if="confirming === 'publish'"
        class="text-sm text-foreground"
        data-testid="experiment-publish-hint"
      >
        Publishing is one-way: these results are frozen under the current metric
        version so they can be cited. It cannot be undone, and a published
        Experiment cannot be deleted.
      </p>
      <p
        v-if="confirming === 'delete'"
        class="text-sm text-foreground"
        data-testid="experiment-delete-hint"
      >
        Deletes the Experiment and its results. Projects and analyses are kept.
      </p>

      <Alert
        v-if="experiment.status === ExperimentStatus.FAILED"
        variant="destructive"
        data-testid="experiment-error"
      >
        <CircleAlert aria-hidden="true" class="size-4" />
        <AlertDescription>
          The Experiment failed: {{ experiment.error ?? "unknown error" }}
        </AlertDescription>
      </Alert>

      <Card class="rounded-card shadow-card">
        <CardContent class="pt-6">
          <section
            class="flex flex-col gap-3"
            aria-labelledby="experiment-progress-heading"
            data-testid="experiment-progress"
          >
            <div class="flex items-baseline justify-between text-sm">
              <h2
                id="experiment-progress-heading"
                class="font-semibold text-foreground-strong"
              >
                Progress
              </h2>
              <span class="tabular-nums text-foreground"
                ><span id="experiment-progress-label">Finished runs</span>
                {{ finishedRuns }} / {{ experiment.run_count }}</span
              >
            </div>
            <Progress
              :model-value="progressPercent"
              aria-labelledby="experiment-progress-label"
            />
            <ul
              aria-label="Runs by state"
              class="flex flex-wrap gap-x-6 gap-y-2"
            >
              <li
                v-for="state in RUN_STATES"
                :key="state"
                class="flex items-center gap-2 text-sm"
              >
                <StatusBadge
                  :tone="ExperimentRunStatusTones[state]"
                  :label="ExperimentRunStatusLabels[state]"
                />
                <span class="font-semibold tabular-nums text-foreground-strong">
                  {{ experiment.run_counts[state] }}
                </span>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>

      <Tabs v-model="activeTab" class="flex flex-col gap-6">
        <TabsList class="w-fit">
          <TabsTrigger value="results" data-testid="experiment-tab-results">
            Results
          </TabsTrigger>
          <TabsTrigger value="figures" data-testid="experiment-tab-figures">
            Figures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" class="flex flex-col gap-8">
          <section
            class="flex flex-col gap-4"
            aria-labelledby="experiment-results-heading"
            data-testid="experiment-results"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3">
                  <h2
                    id="experiment-results-heading"
                    class="text-xl font-bold tracking-tight text-foreground-strong"
                  >
                    Results
                  </h2>
                  <FrozenBadge v-if="selectedVersion" />
                </div>
                <p
                  v-if="selectedVersion"
                  class="max-w-3xl text-sm text-foreground"
                  data-testid="experiment-published-version"
                >
                  Published results, metric version
                  {{ selectedVersion.metric_version }}, published
                  {{ formatExperimentDate(selectedVersion.published_on) }}
                  <template v-if="selectedVersion.published_by_name">
                    by {{ selectedVersion.published_by_name }}</template
                  >. These numbers are frozen under metric version
                  {{ selectedVersion.metric_version }} and will not change.
                </p>
                <div v-if="selectedVersion" class="flex items-center gap-2">
                  <Label for="experiment-version" class="text-sm">
                    Version
                  </Label>
                  <Select
                    :model-value="String(selectedVersion.metric_version)"
                    data-testid="experiment-version-select"
                    @update:model-value="pickVersion"
                  >
                    <SelectTrigger id="experiment-version" class="h-8 w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="version in publishedVersions"
                        :key="version.metric_version"
                        :value="String(version.metric_version)"
                      >
                        Metric version {{ version.metric_version }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p
                  v-if="selectedVersion?.package_checksum"
                  class="break-all text-xs text-muted-foreground"
                  data-testid="experiment-package-checksum"
                >
                  Package SHA-256: {{ selectedVersion.package_checksum }}
                </p>
              </div>
              <div
                class="flex max-w-xl flex-wrap justify-end gap-2"
                role="group"
                aria-label="Downloads"
              >
                <Button
                  v-for="file in EXPERIMENT_EXPORT_FILES"
                  :key="file"
                  variant="outline"
                  size="sm"
                  :disabled="exporting !== null"
                  :data-testid="`export-${file}`"
                  @click="downloadExport(file)"
                >
                  <LoaderCircle
                    v-if="exporting === file"
                    aria-hidden="true"
                    class="animate-spin motion-reduce:animate-none"
                  />
                  <Download v-else aria-hidden="true" />
                  {{ file }}
                </Button>
                <Button
                  v-if="selectedVersion?.package_checksum"
                  variant="outline"
                  size="sm"
                  :disabled="exporting !== null"
                  data-testid="export-package"
                  @click="downloadPackage(selectedVersion.metric_version)"
                >
                  <LoaderCircle
                    v-if="exporting === 'package'"
                    aria-hidden="true"
                    class="animate-spin motion-reduce:animate-none"
                  />
                  <Download v-else aria-hidden="true" />
                  Replication package
                </Button>
              </div>
            </div>
            <ExperimentResults
              v-if="results"
              :results="results"
              :metric-version="resultsVersion"
            />
            <p
              v-else-if="experiment.run_counts.done === 0"
              class="rounded-card border border-dashed bg-muted p-6 text-sm text-muted-foreground"
              data-testid="experiment-results-empty"
            >
              Results appear once the first run is done.
            </p>
            <ExperimentLoadProgress
              v-else-if="!resultsErrorShown"
              :experiment-id="experimentId"
              data-testid="experiment-results-loading"
            />
          </section>

          <section
            v-if="runs.length > 0"
            class="flex flex-col gap-4"
            aria-labelledby="experiment-runs-heading"
          >
            <h2
              id="experiment-runs-heading"
              class="text-xl font-bold tracking-tight text-foreground-strong"
            >
              Runs
            </h2>
            <div class="rounded-card border bg-card shadow-card">
              <Table>
                <TableCaption class="sr-only">Experiment runs</TableCaption>
                <TableHeader>
                  <TableRow class="hover:bg-transparent">
                    <TableHead class="w-16 pl-4">Rank</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Snapshot</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Commit</TableHead>
                    <TableHead class="pr-4">Analysis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="run in runs"
                    :key="run.id"
                    data-testid="experiment-run"
                  >
                    <TableCell class="pl-4 tabular-nums text-muted-foreground">
                      #{{ run.entry.rank + 1 }}
                    </TableCell>
                    <TableCell>
                      <a
                        :href="run.entry.git_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-sm font-semibold text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {{ run.entry.full_name }}
                      </a>
                    </TableCell>
                    <TableCell
                      class="whitespace-nowrap font-mono text-foreground"
                      data-testid="experiment-run-snapshot"
                    >
                      {{ snapshotLabel(run.grid_date) }}
                    </TableCell>
                    <TableCell class="whitespace-nowrap">
                      <StatusBadge
                        :tone="ExperimentRunStatusTones[run.status]"
                        :label="ExperimentRunStatusLabels[run.status]"
                      />
                      <span
                        v-if="run.attempts > 1"
                        class="ml-2 text-xs text-muted-foreground"
                      >
                        {{ run.attempts }} attempts
                      </span>
                    </TableCell>
                    <TableCell class="break-words text-foreground">
                      {{ run.error ?? "" }}
                    </TableCell>
                    <TableCell
                      class="whitespace-nowrap font-mono text-foreground"
                      :title="run.commit_hash ?? undefined"
                    >
                      {{ shortSha(run.commit_hash) }}
                      <span
                        v-if="run.branch"
                        class="font-sans text-muted-foreground"
                      >
                        ({{ run.branch }})</span
                      >
                    </TableCell>
                    <TableCell class="pr-4">
                      <RouterLink
                        v-if="run.analysis_id && run.project_id"
                        :to="{
                          name: 'results',
                          query: {
                            analysis_id: run.analysis_id,
                            project_id: run.project_id,
                          },
                        }"
                        class="rounded-sm font-semibold text-foreground-strong underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        data-testid="run-analysis"
                      >
                        Open
                      </RouterLink>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <DataTablePagination
              v-if="runsTotalPages > 1"
              :page-index="runsPage"
              :page-size="RUNS_PER_PAGE"
              :total="runsTotal"
              @update:page-index="goToRunsPage"
            />
          </section>
        </TabsContent>

        <TabsContent value="figures">
          <ExperimentFigures
            :experiment-id="experimentId"
            :grid-coverage="results?.grid_coverage ?? []"
            :catalog="figureCatalog"
            :published-versions="publishedVersions"
            :open-request="figureRequest"
          />
        </TabsContent>
      </Tabs>
    </template>

    <div
      v-else
      role="status"
      aria-label="Loading the Experiment"
      class="flex flex-col gap-8"
    >
      <div class="flex flex-col gap-3">
        <Skeleton class="h-9 w-72" />
        <Skeleton class="h-5 w-[32rem]" />
      </div>
      <Skeleton class="h-28 rounded-card" />
      <Skeleton class="h-80 rounded-card" />
    </div>
  </div>
</template>
