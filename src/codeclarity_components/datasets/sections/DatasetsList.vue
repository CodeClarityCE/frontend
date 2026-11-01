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
  type Dataset,
  DatasetStatus,
  DatasetStatusColors,
  DatasetStatusLabels,
} from "../dataset.entity";
import { DatasetsRepository } from "../datasets.repository";

/** How often the list refreshes while a dataset is building */
const POLL_INTERVAL_MS = 5000;
const ENTRIES_PER_PAGE = 20;

const userStore = useUserStore();
const auth = useAuthStore();
const datasetsRepository = new DatasetsRepository();

const datasets = ref<Dataset[]>([]);
const isLoading = ref(false);
const hasError = ref(false);
const currentPage = ref(0);
const totalPages = ref(0);
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const anyBuilding = computed(() =>
  datasets.value.some((dataset) => dataset.status === DatasetStatus.BUILDING),
);

async function load(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken) return;

  isLoading.value = true;
  try {
    const response = await datasetsRepository.getDatasets({
      orgId,
      pagination: {
        page: currentPage.value,
        entries_per_page: ENTRIES_PER_PAGE,
      },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    datasets.value = response.data;
    totalPages.value = response.total_pages;
    hasError.value = false;
  } catch {
    hasError.value = true;
    errorToast("Failed to load the datasets");
  } finally {
    isLoading.value = false;
    schedulePoll();
  }
}

function schedulePoll(): void {
  clearTimeout(pollTimer);
  if (anyBuilding.value) {
    pollTimer = setTimeout(() => void load(), POLL_INTERVAL_MS);
  }
}

function goToPage(page: number): void {
  currentPage.value = page;
  void load();
}

function openDataset(id: string): void {
  void router.push({
    name: "datasets",
    params: { page: "detail" },
    query: { id },
  });
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

onMounted(() => void load());
onUnmounted(() => clearTimeout(pollTimer));

defineExpose({ load });
</script>

<template>
  <div class="space-y-8">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">
          Datasets
        </h1>
        <p class="text-gray-600 mt-2 text-lg">
          Reproducible cohorts of the most-starred GitHub projects
        </p>
      </div>
      <RouterLink :to="{ name: 'datasets', params: { page: 'add' } }">
        <Button class="flex items-center gap-2">
          <Icon icon="solar:add-circle-linear" class="h-4 w-4" />
          New dataset
        </Button>
      </RouterLink>
    </div>

    <div
      v-if="!isLoading && !hasError && datasets.length === 0"
      class="text-center py-20"
    >
      <div
        class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"
      >
        <Icon
          icon="solar:database-bold-duotone"
          class="h-12 w-12 text-gray-400"
        />
      </div>
      <h3 class="mt-6 text-lg font-semibold text-gray-900">No datasets yet</h3>
      <p class="mt-2 text-gray-600 max-w-md mx-auto">
        A dataset ranks GitHub repositories by stars and keeps the ones whose
        root commits a package.json and a lockfile.
      </p>
    </div>

    <div
      v-else-if="datasets.length > 0"
      class="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      <div
        class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider"
      >
        <div class="col-span-4">Name</div>
        <div class="col-span-2">Status</div>
        <div class="col-span-2">Repositories</div>
        <div class="col-span-2">Languages</div>
        <div class="col-span-2">Built</div>
      </div>
      <button
        v-for="dataset in datasets"
        :key="dataset.id"
        class="w-full text-left grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
        :data-testid="`dataset-row-${dataset.id}`"
        @click="openDataset(dataset.id)"
      >
        <div class="lg:col-span-4">
          <p class="font-medium text-gray-900">{{ dataset.name }}</p>
          <p v-if="dataset.created_by_name" class="text-sm text-gray-500">
            by {{ dataset.created_by_name }}
          </p>
        </div>
        <div class="lg:col-span-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
            :class="DatasetStatusColors[dataset.status]"
          >
            <Icon
              v-if="dataset.status === DatasetStatus.BUILDING"
              icon="solar:loading-linear"
              class="h-3 w-3 animate-spin"
            />
            {{ DatasetStatusLabels[dataset.status] }}
          </span>
        </div>
        <div class="lg:col-span-2 text-sm text-gray-700">
          <template v-if="dataset.status === DatasetStatus.READY">
            {{ dataset.entry_count }} / {{ dataset.params.limit }}
          </template>
          <template v-else>top {{ dataset.params.limit }}</template>
        </div>
        <div class="lg:col-span-2 text-sm text-gray-700">
          {{ dataset.params.languages.join(", ") }}
        </div>
        <div class="lg:col-span-2 text-sm text-gray-700">
          {{ formatDate(dataset.built_on) }}
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
