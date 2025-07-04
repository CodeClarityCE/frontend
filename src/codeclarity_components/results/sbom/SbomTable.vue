<script setup lang="ts">
import { ref, onMounted, type Ref, watch, shallowRef } from 'vue';
import { columns } from './table/columns';
import DataTable from './table/DataTable.vue';
import type { Dependency } from '@/codeclarity_components/results/graph.entity';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ProjectsSortInterface } from '@/codeclarity_components/projects/project.repository';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import PaginationComponent from '@/base_components/PaginationComponent.vue';
import type { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/vue-table';
import { Icon } from '@iconify/vue';

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const sbomRepository: ResultsRepository = new ResultsRepository();

const data: Ref<Array<Dependency>> = shallowRef([]);
const selected_workspace = defineModel<string>('selected_workspace', { default: {} });

const pageNumber = ref(0);
const pageLimitSelected = ref(15);
const nmbEntriesShowing = ref(0);
const matchingItemsCount = ref(0);
const nmbEntriesTotal = ref(0);
const totalPages = ref(0);
const render = ref(false);

const searchKey = ref('');

const sortKey: Ref<ProjectsSortInterface> = ref(ProjectsSortInterface.DIRECT);
const sortDirection: Ref<SortDirection> = ref(SortDirection.ASC);
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
// By default, all columns are visible except for the release column
const columnVisibility = ref<VisibilityState>({
    release: false
});

async function init() {
    if (!userStore.getDefaultOrg) {
        throw new Error('No default org selected');
    }
    if (!authStore.getToken) {
        throw new Error('No default org selected');
    }
    const urlParams = new URLSearchParams(window.location.search);
    const analysis_id = urlParams.get('analysis_id');
    const project_id = urlParams.get('project_id');

    if (project_id == null || analysis_id == null) {
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
                sortDirection: sortDirection.value
            },
            pagination: {
                page: pageNumber.value,
                entries_per_page: pageLimitSelected.value
            },
            bearerToken: authStore.getToken,
            active_filters: '',
            search_key: searchKey.value
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
    init();
});

watch([pageNumber, pageLimitSelected, sortDirection, sortKey], async () => {
    await init();
});

watch([searchKey], async () => {
    pageNumber.value = 0;
    await init();
});

watch(sorting, () => {
    if (sorting.value.length > 0) {
        sortKey.value = sorting.value[0].id as ProjectsSortInterface;
        sortDirection.value = sorting.value[0].desc ? SortDirection.DESC : SortDirection.ASC;
    }
});
watch([selected_workspace], () => init());
</script>

<template>
    <div class="container py-6 mx-auto space-y-6">
        <!-- Header Section -->
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Dependencies</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Software Bill of Materials (SBOM) for your project
                    </p>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Icon icon="tabler:package" class="w-4 h-4" />
                    <span>{{ nmbEntriesTotal }} total dependencies</span>
                </div>
            </div>
            
            <!-- Status Legend -->
            <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Dependency Types</h3>
                <div class="flex flex-wrap gap-4 text-xs">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded"></div>
                        <span class="text-gray-600 dark:text-gray-400">Direct dependencies (requested by you)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded"></div>
                        <span class="text-gray-600 dark:text-gray-400">Transitive dependencies (sub-dependencies)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded"></div>
                        <span class="text-gray-600 dark:text-gray-400">Development dependencies</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"></div>
                        <span class="text-gray-600 dark:text-gray-400">Production dependencies</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Data Table -->
        <DataTable
            v-model:page-limit-selected="pageLimitSelected"
            v-model:search-key="searchKey"
            v-model:sorting="sorting"
            v-model:column-filters="columnFilters"
            v-model:column-visibility="columnVisibility"
            v-model:data="data"
            :columns="columns"
        />

        <!-- Enhanced Pagination -->
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div class="flex items-center gap-2">
                    <Icon icon="tabler:file-text" class="w-4 h-4" />
                    <span>Page {{ pageNumber + 1 }} of {{ totalPages }}</span>
                </div>
                <div class="text-xs">
                    Showing {{ Math.min((pageNumber * pageLimitSelected) + 1, nmbEntriesTotal) }}-{{ Math.min((pageNumber + 1) * pageLimitSelected, nmbEntriesTotal) }} of {{ nmbEntriesTotal }}
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
