<script setup lang="ts">
import PaginationComponent from "@/base_components/utilities/PaginationComponent.vue";
import { ProjectsSortInterface } from "@/codeclarity_components/projects/project.repository";
import type { Dependency } from "@/codeclarity_components/results/graph.entity";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";
import { Icon } from "@iconify/vue";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/vue-table";
import { ref, onMounted, type Ref, watch, shallowRef, computed } from "vue";
import { columns } from "./table/columns";
import DataTable from "./table/DataTable.vue";

interface StatsData {
  number_of_dependencies?: number;
  number_of_outdated_dependencies?: number;
  number_of_direct_dependencies?: number;
  number_of_non_dev_dependencies?: number;
  number_of_deprecated_dependencies?: number;
}

export interface Props {
  projectID?: string;
  analysisID?: string;
  ecosystemFilter?: string | null;
  stats?: StatsData | null; // Stats from the parent component
}
const props = withDefaults(defineProps<Props>(), {
  projectID: "",
  analysisID: "",
  ecosystemFilter: null,
  stats: null,
});

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const sbomRepository: ResultsRepository = new ResultsRepository();

const data: Ref<Dependency[]> = shallowRef([]);
const selected_workspace = defineModel<string>("selected_workspace", {
  default: "",
});

const pageNumber = ref(0);
const pageLimitSelected = ref(15);
const nmbEntriesShowing = ref(0);
const matchingItemsCount = ref(0);
const nmbEntriesTotal = ref(0);
const totalPages = ref(0);
const render = ref(false);

const searchKey = ref("");

const sortKey: Ref<ProjectsSortInterface> = ref(ProjectsSortInterface.DIRECT);
const sortDirection: Ref<SortDirection> = ref(SortDirection.ASC);
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
// By default, all columns are visible except for the release column
const columnVisibility = ref<VisibilityState>({
  release: false,
});

// Computed statistics for dashboard
const outdatedCount = computed(() => {
  // Use stats from props if available, otherwise calculate from current page
  if (props.stats?.number_of_outdated_dependencies !== undefined) {
    return props.stats.number_of_outdated_dependencies;
  }
  return data.value.filter((dep) => dep.version !== dep.newest_release).length;
});

const directCount = computed(() => {
  // Use stats from props if available, otherwise calculate from current page
  if (props.stats?.number_of_direct_dependencies !== undefined) {
    return props.stats.number_of_direct_dependencies;
  }
  return data.value.filter((dep) => dep.is_direct_count > 0).length;
});

const prodCount = computed(() => {
  // Use stats from props if available, otherwise calculate from current page
  if (props.stats?.number_of_non_dev_dependencies !== undefined) {
    return props.stats.number_of_non_dev_dependencies;
  }
  return data.value.filter((dep) => dep.prod).length;
});

const deprecatedCount = computed(() => {
  // Use stats from props if available, otherwise calculate from current page
  if (props.stats?.number_of_deprecated_dependencies !== undefined) {
    return props.stats.number_of_deprecated_dependencies;
  }
  return data.value.filter((dep) => dep.deprecated).length;
});

async function init(): Promise<void> {
  if (!userStore.getDefaultOrg) {
    throw new Error("No default org selected");
  }
  if (!authStore.getToken) {
    throw new Error("No default org selected");
  }

  // Use props for project and analysis IDs, fallback to URL params if not provided
  let project_id = props.projectID;
  let analysis_id = props.analysisID;

  if (!project_id || !analysis_id) {
    const urlParams = new URLSearchParams(window.location.search);
    project_id = (project_id || urlParams.get("project_id")) ?? "";
    analysis_id = (analysis_id || urlParams.get("analysis_id")) ?? "";
  }

  if (!project_id || !analysis_id) {
    return;
  }

  try {
    const res = await sbomRepository.getSbom({
      orgId: userStore.getDefaultOrg.id,
      projectId: project_id,
      analysisId: analysis_id,
      workspace: selected_workspace.value,
      sort: {
        sortKey: sortKey.value,
        sortDirection: sortDirection.value,
      },
      pagination: {
        page: pageNumber.value,
        entries_per_page: pageLimitSelected.value,
      },
      bearerToken: authStore.getToken,
      active_filters: "",
      search_key: searchKey.value,
      ecosystem_filter: props.ecosystemFilter ?? undefined,
    });
    data.value = res.data;

    render.value = true;
    pageNumber.value = res.page;
    pageLimitSelected.value = res.entries_per_page;
    nmbEntriesShowing.value = res.entry_count;
    matchingItemsCount.value = res.matching_count;
    nmbEntriesTotal.value = res.total_entries;
    totalPages.value = res.total_pages;
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  void init();
});

watch([pageNumber, pageLimitSelected, sortDirection, sortKey], async () => {
  await init();
});

watch([searchKey], async () => {
  pageNumber.value = 0;
  await init();
});

watch(sorting, () => {
  const firstSort = sorting.value[0];
  if (sorting.value.length > 0 && firstSort) {
    sortKey.value = firstSort.id as ProjectsSortInterface;
    sortDirection.value = firstSort.desc
      ? SortDirection.DESC
      : SortDirection.ASC;
  }
});
watch([selected_workspace], () => init());
watch(
  () => props.ecosystemFilter,
  () => {
    pageNumber.value = 0; // Reset to first page when filter changes
    void init();
  },
);
</script>

<template>
  <div class="container py-6 mx-auto space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Dependencies</h2>
          <p class="text-sm text-gray-600 mt-1">
            Software Bill of Materials (SBOM) for your project
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <Icon icon="tabler:package" class="w-4 h-4" />
          <span
            >{{ props.stats?.number_of_dependencies || nmbEntriesTotal }} total
            dependencies</span
          >
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="bg-white border rounded-lg p-3">
          <div class="flex items-center gap-2">
            <Icon icon="tabler:package" class="w-4 h-4 text-blue-500" />
            <span class="text-xs text-gray-600 uppercase tracking-wide"
              >Total</span
            >
          </div>
          <div class="text-lg font-semibold text-gray-900">
            {{ props.stats?.number_of_dependencies || nmbEntriesTotal }}
          </div>
        </div>

        <div class="bg-white border rounded-lg p-3">
          <div class="flex items-center gap-2">
            <Icon icon="tabler:alert-triangle" class="w-4 h-4 text-amber-500" />
            <span class="text-xs text-gray-600 uppercase tracking-wide"
              >Outdated</span
            >
          </div>
          <div class="text-lg font-semibold text-gray-900">
            {{ outdatedCount }}
          </div>
        </div>

        <div class="bg-white border rounded-lg p-3">
          <div class="flex items-center gap-2">
            <Icon icon="tabler:alert-circle" class="w-4 h-4 text-red-500" />
            <span class="text-xs text-gray-600 uppercase tracking-wide"
              >Deprecated</span
            >
          </div>
          <div class="text-lg font-semibold text-gray-900">
            {{ deprecatedCount }}
          </div>
        </div>

        <div class="bg-white border rounded-lg p-3">
          <div class="flex items-center gap-2">
            <Icon icon="tabler:target" class="w-4 h-4 text-purple-500" />
            <span class="text-xs text-gray-600 uppercase tracking-wide"
              >Direct</span
            >
          </div>
          <div class="text-lg font-semibold text-gray-900">
            {{ directCount }}
          </div>
        </div>

        <div class="bg-white border rounded-lg p-3">
          <div class="flex items-center gap-2">
            <Icon icon="tabler:code" class="w-4 h-4 text-green-500" />
            <span class="text-xs text-gray-600 uppercase tracking-wide"
              >Prod</span
            >
          </div>
          <div class="text-lg font-semibold text-gray-900">
            {{ prodCount }}
          </div>
        </div>
      </div>

      <!-- Status Legend -->
      <div
        class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border"
      >
        <h3
          class="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2"
        >
          <Icon icon="tabler:info-circle" class="w-4 h-4" />
          Dependency Types & Status Indicators
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 bg-purple-100 border border-purple-200 rounded"
            ></div>
            <span class="text-gray-600"
              >Direct dependencies (requested by you)</span
            >
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 bg-orange-100 border border-orange-200 rounded"
            ></div>
            <span class="text-gray-600"
              >Transitive dependencies (sub-dependencies)</span
            >
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 bg-blue-100 border border-blue-200 rounded"
            ></div>
            <span class="text-gray-600">Development dependencies</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 bg-green-100 border border-green-200 rounded"
            ></div>
            <span class="text-gray-600">Production dependencies</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div v-if="render">
      <DataTable
        v-model:page-limit-selected="pageLimitSelected"
        v-model:search-key="searchKey"
        v-model:sorting="sorting"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:data="data"
        :columns="columns"
      />
    </div>

    <!-- Loading State -->
    <div v-else class="border rounded-lg overflow-hidden bg-white">
      <div class="p-4 bg-gray-50 border-b">
        <div class="flex items-center justify-between">
          <div class="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div class="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
      <div class="p-6">
        <div class="space-y-3">
          <div v-for="i in 8" :key="i" class="flex items-center gap-4">
            <div class="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
            <div class="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div class="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div class="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div class="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Pagination -->
    <div
      class="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg border"
    >
      <div class="flex items-center gap-4 text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <Icon icon="tabler:file-text" class="w-4 h-4" />
          <span>Page {{ pageNumber + 1 }} of {{ totalPages }}</span>
        </div>
        <div class="text-xs">
          Showing
          {{ Math.min(pageNumber * pageLimitSelected + 1, nmbEntriesTotal) }}-{{
            Math.min((pageNumber + 1) * pageLimitSelected, nmbEntriesTotal)
          }}
          of {{ nmbEntriesTotal }}
        </div>
      </div>

      <PaginationComponent
        v-model:page="pageNumber"
        v-model:nmb-entries-showing="pageLimitSelected"
        v-model:nmb-entries-total="nmbEntriesTotal"
        v-model:total-pages="totalPages"
      />
    </div>
  </div>
</template>
