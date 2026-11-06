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

import { EXPERIMENT_REQUIRED_PLUGINS } from "../experiment.entity";
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

const datasets = ref<Dataset[]>([]);
const analyzers = ref<Analyzer[]>([]);
const loading = ref(true);
const submitting = ref(false);
const submitted = ref(false);

interface FormErrors {
  name?: string;
  dataset?: string;
  analyzer?: string;
  retries?: string;
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
  const retriesNumber = Number(retries.value);
  if (
    retries.value === "" ||
    !Number.isInteger(retriesNumber) ||
    retriesNumber < 0 ||
    retriesNumber > MAX_RETRIES
  ) {
    result.retries = `A whole number between 0 and ${MAX_RETRIES}`;
  }
  return result;
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

async function load(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken) return;
  try {
    await Promise.all([
      loadDatasets(orgId, auth.getToken),
      loadAnalyzers(orgId, auth.getToken),
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
        Run one analyzer over every repository of a dataset, each at its current
        default branch HEAD, pinned to a commit when submitted.
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
