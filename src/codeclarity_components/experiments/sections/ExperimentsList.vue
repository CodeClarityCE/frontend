<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, onUnmounted, ref } from "vue";

import { PaginationComponent } from "@/base_components";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast } from "@/utils/toasts";

import {
  type Experiment,
  ExperimentStatusColors,
  ExperimentStatusLabels,
  finishedRunCount,
  formatExperimentDate,
  isExperimentActive,
} from "../experiment.entity";
import { ExperimentsRepository } from "../experiments.repository";

/** How often the list refreshes while an experiment may still change */
const POLL_INTERVAL_MS = 10_000;
const ENTRIES_PER_PAGE = 20;

const userStore = useUserStore();
const auth = useAuthStore();
const experimentsRepository = new ExperimentsRepository();

const experiments = ref<Experiment[]>([]);
const isLoading = ref(false);
const hasError = ref(false);
const currentPage = ref(0);
const totalPages = ref(0);
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const anyActive = computed(() =>
  experiments.value.some((experiment) => isExperimentActive(experiment)),
);

async function load(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken) return;

  isLoading.value = true;
  try {
    const response = await experimentsRepository.getExperiments({
      orgId,
      pagination: {
        page: currentPage.value,
        entries_per_page: ENTRIES_PER_PAGE,
      },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    experiments.value = response.data;
    totalPages.value = response.total_pages;
    hasError.value = false;
  } catch {
    hasError.value = true;
    errorToast("Failed to load the experiments");
  } finally {
    isLoading.value = false;
    schedulePoll();
  }
}

function schedulePoll(): void {
  clearTimeout(pollTimer);
  if (anyActive.value) {
    pollTimer = setTimeout(() => void load(), POLL_INTERVAL_MS);
  }
}

function goToPage(page: number): void {
  currentPage.value = page;
  void load();
}

function openExperiment(id: string): void {
  void router.push({
    name: "experiments",
    params: { page: "detail" },
    query: { id },
  });
}

onMounted(() => void load());
onUnmounted(() => clearTimeout(pollTimer));
</script>

<template>
  <div class="space-y-8">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">
          Experiments
        </h1>
        <p class="text-gray-600 mt-2 text-lg">
          One analyzer run over every repository of a dataset
        </p>
      </div>
      <RouterLink :to="{ name: 'experiments', params: { page: 'add' } }">
        <Button class="flex items-center gap-2">
          <Icon icon="solar:add-circle-linear" class="h-4 w-4" />
          New experiment
        </Button>
      </RouterLink>
    </div>

    <div
      v-if="!isLoading && !hasError && experiments.length === 0"
      class="text-center py-20"
    >
      <div
        class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"
      >
        <Icon
          icon="solar:test-tube-bold-duotone"
          class="h-12 w-12 text-gray-400"
        />
      </div>
      <h3 class="mt-6 text-lg font-semibold text-gray-900">
        No experiments yet
      </h3>
      <p class="mt-2 text-gray-600 max-w-md mx-auto">
        An experiment runs one analyzer over every repository of a ready dataset
        and gathers the results across the whole cohort.
      </p>
    </div>

    <div
      v-else-if="experiments.length > 0"
      class="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      <div
        class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider"
      >
        <div class="col-span-4">Name</div>
        <div class="col-span-2">Status</div>
        <div class="col-span-2">Dataset</div>
        <div class="col-span-2">Finished runs</div>
        <div class="col-span-2">Created</div>
      </div>
      <button
        v-for="experiment in experiments"
        :key="experiment.id"
        class="w-full text-left grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
        :data-testid="`experiment-row-${experiment.id}`"
        @click="openExperiment(experiment.id)"
      >
        <div class="lg:col-span-4">
          <p class="font-medium text-gray-900">{{ experiment.name }}</p>
          <p v-if="experiment.analyzer_name" class="text-sm text-gray-500">
            {{ experiment.analyzer_name }}
          </p>
        </div>
        <div class="lg:col-span-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
            :class="ExperimentStatusColors[experiment.status]"
          >
            <Icon
              v-if="isExperimentActive(experiment)"
              icon="solar:loading-linear"
              class="h-3 w-3 animate-spin"
            />
            {{ ExperimentStatusLabels[experiment.status] }}
          </span>
        </div>
        <div class="lg:col-span-2 text-sm text-gray-700">
          {{ experiment.dataset_name }}
        </div>
        <div class="lg:col-span-2 text-sm text-gray-700">
          {{ finishedRunCount(experiment.run_counts) }} / {{ experiment.run_count }}
        </div>
        <div class="lg:col-span-2 text-sm text-gray-700">
          {{ formatExperimentDate(experiment.created_on, false) }}
        </div>
      </button>
    </div>

    <PaginationComponent
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="goToPage"
    />
  </div>
</template>
