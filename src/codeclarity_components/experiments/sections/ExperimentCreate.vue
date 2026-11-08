<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import {
  type Dataset,
  DatasetStatus,
} from "@/codeclarity_components/datasets/dataset.entity";
import { DatasetsRepository } from "@/codeclarity_components/datasets/datasets.repository";
import type { Analyzer } from "@/codeclarity_components/organizations/analyzers/Analyzer";
import { AnalyzerRepository } from "@/codeclarity_components/organizations/analyzers/AnalyzerRepository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

import {
  DEFAULT_GRID_COUNT,
  DEFAULT_GRID_INTERVAL,
  EXPERIMENT_REQUIRED_PLUGINS,
  GridInterval,
  GridIntervalLabels,
  MAX_ANALYSIS_BUDGET,
  MAX_GRID_COUNT,
} from "../experiment.entity";
import { ExperimentsRepository } from "../experiments.repository";

/** Bounds enforced by the API (CreateExperimentBody) */
const MAX_RETRIES = 10;
const MAX_NAME_LENGTH = 100;
/** Largest dataset page the API serves */
const DATASETS_PAGE_SIZE = 100;

const route = useRoute();
const userStore = useUserStore();
const auth = useAuthStore();
const experimentsRepository = new ExperimentsRepository();
const datasetsRepository = new DatasetsRepository();
const analyzerRepository = new AnalyzerRepository();

const name = ref("");
const datasetId = ref(
  typeof route.query.dataset === "string" ? route.query.dataset : "",
);
const analyzerId = ref("");
const retries = ref<number | string>(2);
const gridInterval = ref<GridInterval>(DEFAULT_GRID_INTERVAL);
const gridCount = ref<number | string>(DEFAULT_GRID_COUNT);
/** Empty for no budget */
const budget = ref<number | string>("");

const datasets = ref<Dataset[]>([]);
/** Fix probes per repository per grid interval, from the API; null if unknown */
const probesPerEntryInterval = ref<number | null>(null);
const analyzers = ref<Analyzer[]>([]);
const loading = ref(true);
const submitting = ref(false);
const submitted = ref(false);

interface FormErrors {
  name?: string;
  dataset?: string;
  analyzer?: string;
  retries?: string;
  gridCount?: string;
  budget?: string;
}

/** A whole number within [0, max], or null. */
function boundedInt(value: number | string, max: number): number | null {
  const n = Number(value);
  return value !== "" && Number.isInteger(n) && n >= 0 && n <= max ? n : null;
}

/** An analyzer is eligible when some stage runs each required plugin. */
function runsRequiredPlugins(analyzer: Analyzer): boolean {
  const plugins = new Set(analyzer.steps.flat().map((step) => step.name));
  return EXPERIMENT_REQUIRED_PLUGINS.every((plugin) => plugins.has(plugin));
}

const errors = computed(() => {
  const result: FormErrors = {};
  const trimmed = name.value.trim();
  if (trimmed.length === 0) result.name = "A name is required";
  else if (trimmed.length > MAX_NAME_LENGTH) {
    result.name = `At most ${MAX_NAME_LENGTH} characters`;
  }
  if (!datasets.value.some((dataset) => dataset.id === datasetId.value)) {
    result.dataset = "Pick a ready dataset";
  }
  if (!analyzers.value.some((analyzer) => analyzer.id === analyzerId.value)) {
    result.analyzer = "Pick an analyzer";
  }
  if (boundedInt(retries.value, MAX_RETRIES) === null) {
    result.retries = `A whole number between 0 and ${MAX_RETRIES}`;
  }
  if (boundedInt(gridCount.value, MAX_GRID_COUNT) === null) {
    result.gridCount = `A whole number between 0 and ${MAX_GRID_COUNT}`;
  }
  if (budget.value !== "" && budgetValue.value === null) {
    result.budget =
      "Leave empty for no budget, or a whole number of at least 1";
  }
  return result;
});

/** The budget as a number, null when empty or invalid. */
const budgetValue = computed<number | null>(() => {
  if (budget.value === "") return null;
  const n = boundedInt(budget.value, MAX_ANALYSIS_BUDGET);
  return n !== null && n >= 1 ? n : null;
});

interface Estimate {
  gridDates: number;
  /** One per entry per grid date, HEAD included */
  snapshots: number;
  /** A rough guess: probes depend on how often lockfiles change; null if unknown */
  probes: number | null;
  total: number;
}

const estimate = computed<Estimate | null>(() => {
  const dataset = datasets.value.find((d) => d.id === datasetId.value);
  const count = boundedInt(gridCount.value, MAX_GRID_COUNT);
  if (!dataset || count === null) return null;
  const snapshots = dataset.entry_count * (count + 1);
  const perInterval = probesPerEntryInterval.value;
  const probes =
    perInterval === null ? null : dataset.entry_count * count * perInterval;
  return {
    gridDates: count + 1,
    snapshots,
    probes,
    total: snapshots + (probes ?? 0),
  };
});

function probesText(probes: number | null): string {
  if (probes === null) return "fix probes not estimated";
  return probes > 0
    ? `about ${probes.toLocaleString()} fix probes`
    : "no fix probes";
}

/** What the budget caps, given the estimate. */
const budgetNote = computed<string | null>(() => {
  const cap = budgetValue.value;
  if (cap === null) return null;
  const snapshots = estimate.value?.snapshots;
  if (snapshots !== undefined && cap <= snapshots) {
    return `The budget is at or below the ${snapshots.toLocaleString()} snapshots: every snapshot still runs and no fix probe will.`;
  }
  return `Fix probes stop once ${cap.toLocaleString()} analyses are submitted; snapshots always run.`;
});

const isValid = computed(() => Object.keys(errors.value).length === 0);

/** Shown only once the user tried to submit, so the form starts clean. */
function errorFor(field: keyof FormErrors): string | undefined {
  return submitted.value ? errors.value[field] : undefined;
}

/** Every page: a READY dataset (or the preselected one) may be past the first. */
async function loadDatasets(orgId: string, token: string): Promise<void> {
  try {
    const ready: Dataset[] = [];
    for (let page = 0, totalPages = 1; page < totalPages; page++) {
      const response = await datasetsRepository.getDatasets({
        orgId,
        pagination: { page, entries_per_page: DATASETS_PAGE_SIZE },
        bearerToken: token,
        handleBusinessErrors: true,
      });
      ready.push(
        ...response.data.filter(
          (dataset) => dataset.status === DatasetStatus.READY,
        ),
      );
      totalPages = response.total_pages;
    }
    datasets.value = ready;
  } catch {
    errorToast("Failed to load the datasets");
  }
}

async function loadAnalyzers(orgId: string, token: string): Promise<void> {
  try {
    const response = await analyzerRepository.getAnalyzers({
      orgId,
      page: 0,
      entries_per_page: 0,
      search_key: "",
      bearerToken: token,
      handleBusinessErrors: true,
    });
    analyzers.value = response.data.filter(runsRequiredPlugins);
    const [first] = analyzers.value;
    if (analyzers.value.length === 1 && first) analyzerId.value = first.id;
  } catch {
    errorToast("Failed to load the analyzers");
  }
}

/** Without it the estimate leaves fix probes out. */
async function loadEstimateBasis(orgId: string, token: string): Promise<void> {
  try {
    const response = await experimentsRepository.getEstimateBasis({
      orgId,
      bearerToken: token,
      handleBusinessErrors: true,
    });
    probesPerEntryInterval.value = response.data.probes_per_entry_interval;
  } catch {
    probesPerEntryInterval.value = null;
  }
}

async function load(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken) return;
  try {
    await Promise.all([
      loadDatasets(orgId, auth.getToken),
      loadAnalyzers(orgId, auth.getToken),
      loadEstimateBasis(orgId, auth.getToken),
    ]);
  } finally {
    loading.value = false;
  }
}

function createErrorMessage(err: unknown): string {
  if (!(err instanceof BusinessLogicError)) {
    return "Failed to create the experiment";
  }
  switch (err.error_code) {
    case APIErrors.AlreadyExists:
      return "An experiment with this name already exists";
    case APIErrors.DatasetNotReady:
      return "The dataset is not ready";
    case APIErrors.AnalyzerMissingRequiredPlugins:
      return "The analyzer must run js-sbom and vuln-finder";
    case APIErrors.NotAuthorized:
      return "Only organization admins can create experiments";
    default:
      return "Failed to create the experiment";
  }
}

async function submit(): Promise<void> {
  submitted.value = true;
  const orgId = userStore.getDefaultOrg?.id;
  if (!isValid.value || !orgId || !auth.getToken || submitting.value) return;

  submitting.value = true;
  try {
    const created = await experimentsRepository.createExperiment({
      orgId,
      data: {
        name: name.value.trim(),
        dataset_id: datasetId.value,
        analyzer_id: analyzerId.value,
        retries: Number(retries.value),
        grid_interval: gridInterval.value,
        grid_count: Number(gridCount.value),
        ...(budgetValue.value === null
          ? {}
          : { analysis_budget: budgetValue.value }),
      },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    successToast("Experiment created");
    void router.push({
      name: "experiments",
      params: { page: "detail" },
      query: { id: created.id },
    });
  } catch (err) {
    errorToast(createErrorMessage(err));
  } finally {
    submitting.value = false;
  }
}

onMounted(() => void load());
</script>

<template>
  <div class="space-y-8 max-w-3xl">
    <div>
      <RouterLink
        :to="{ name: 'experiments' }"
        class="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
      >
        <Icon icon="solar:arrow-left-linear" class="h-4 w-4" />
        Experiments
      </RouterLink>
      <h1 class="text-4xl font-bold tracking-tight text-gray-900 mt-2">
        New experiment
      </h1>
      <p class="text-gray-600 mt-2 text-lg">
        Run one analyzer over every repository of a dataset at each date of a
        snapshot grid and at HEAD, each pinned to a default branch commit.
      </p>
    </div>

    <form
      class="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
      novalidate
      @submit.prevent="submit"
    >
      <div class="space-y-2">
        <Label for="experiment-name">Name</Label>
        <Input
          id="experiment-name"
          v-model="name"
          placeholder="top100-head-2026-11"
          data-testid="experiment-name"
        />
        <p v-if="errorFor('name')" class="text-sm text-red-600">
          {{ errorFor("name") }}
        </p>
      </div>

      <div class="space-y-2">
        <Label>Dataset</Label>
        <p
          v-if="!loading && datasets.length === 0"
          class="text-sm text-gray-600"
        >
          No ready dataset.
          <RouterLink
            :to="{ name: 'datasets', params: { page: 'add' } }"
            class="underline"
          >
            Build one
          </RouterLink>
          first.
        </p>
        <Select v-else v-model="datasetId" data-testid="experiment-dataset">
          <SelectTrigger>
            <SelectValue placeholder="Select a dataset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="dataset in datasets"
              :key="dataset.id"
              :value="dataset.id"
            >
              {{ dataset.name }} ({{ dataset.entry_count }} repositories)
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="errorFor('dataset')" class="text-sm text-red-600">
          {{ errorFor("dataset") }}
        </p>
      </div>

      <div class="space-y-2">
        <Label>Analyzer</Label>
        <p
          v-if="!loading && analyzers.length === 0"
          class="text-sm text-gray-600"
        >
          No analyzer runs both js-sbom and vuln-finder.
        </p>
        <Select v-else v-model="analyzerId" data-testid="experiment-analyzer">
          <SelectTrigger>
            <SelectValue placeholder="Select an analyzer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="analyzer in analyzers"
              :key="analyzer.id"
              :value="analyzer.id"
            >
              {{ analyzer.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="text-sm text-gray-500">
          Only analyzers that run js-sbom and vuln-finder are listed.
        </p>
        <p v-if="errorFor('analyzer')" class="text-sm text-red-600">
          {{ errorFor("analyzer") }}
        </p>
      </div>

      <div class="space-y-2 max-w-xs">
        <Label for="experiment-retries">Retries per failed run</Label>
        <Input
          id="experiment-retries"
          v-model="retries"
          type="number"
          min="0"
          :max="MAX_RETRIES"
          data-testid="experiment-retries"
        />
        <p class="text-xs text-gray-500">
          A failed analysis is retried on the same commit.
        </p>
        <p v-if="errorFor('retries')" class="text-sm text-red-600">
          {{ errorFor("retries") }}
        </p>
      </div>

      <div class="space-y-2">
        <Label>Snapshot grid</Label>
        <div class="flex flex-wrap gap-4">
          <div class="space-y-1 w-40">
            <Select
              v-model="gridInterval"
              data-testid="experiment-grid-interval"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="interval in Object.values(GridInterval)"
                  :key="interval"
                  :value="interval"
                >
                  {{ GridIntervalLabels[interval] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1 w-40">
            <Input
              id="experiment-grid-count"
              v-model="gridCount"
              type="number"
              min="0"
              :max="MAX_GRID_COUNT"
              aria-label="Grid dates before HEAD"
              data-testid="experiment-grid-count"
            />
          </div>
        </div>
        <p class="text-xs text-gray-500">
          Grid dates before HEAD, stepped back from today. 0 analyses HEAD only.
          The grid is frozen once the experiment is created.
        </p>
        <p v-if="errorFor('gridCount')" class="text-sm text-red-600">
          {{ errorFor("gridCount") }}
        </p>
      </div>

      <div class="space-y-2 max-w-xs">
        <Label for="experiment-budget">Analysis budget (optional)</Label>
        <Input
          id="experiment-budget"
          v-model="budget"
          type="number"
          min="1"
          :max="MAX_ANALYSIS_BUDGET"
          placeholder="No budget"
          data-testid="experiment-budget"
        />
        <p class="text-xs text-gray-500">
          Caps the analyses the experiment submits, snapshots and fix probes
          alike. Once spent, no further fix probe runs; snapshots are never cut.
          Fixes are probed before introductions. Frozen at creation.
        </p>
        <p
          v-if="budgetNote"
          class="text-xs text-gray-700"
          data-testid="experiment-budget-note"
        >
          {{ budgetNote }}
        </p>
        <p v-if="errorFor('budget')" class="text-sm text-red-600">
          {{ errorFor("budget") }}
        </p>
      </div>

      <p
        v-if="estimate !== null"
        class="text-sm text-gray-700"
        data-testid="experiment-estimate"
      >
        Estimated {{ estimate.probes === null ? "at least " : ""
        }}{{ estimate.total.toLocaleString() }} analyses:
        {{ estimate.snapshots.toLocaleString() }} snapshots ({{
          estimate.gridDates
        }}
        grid {{ estimate.gridDates === 1 ? "date" : "dates" }} including HEAD)
        and {{ probesText(estimate.probes) }}.
      </p>

      <div class="flex justify-end">
        <Button
          type="submit"
          :disabled="submitting"
          data-testid="experiment-submit"
        >
          <Icon
            v-if="submitting"
            icon="solar:loading-linear"
            class="h-4 w-4 mr-2 animate-spin"
          />
          Start experiment
        </Button>
      </div>
    </form>
  </div>
</template>
