<script setup lang="ts">
import { ref, onMounted, type Ref, watch } from 'vue';
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

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const sbomRepository: ResultsRepository = new ResultsRepository();

const data: Ref<Array<Dependency>> = ref([]);

const pageNumber = ref(0);
const pageLimitSelected = ref(15);
const nmbEntriesShowing = ref(0);
const matchingItemsCount = ref(0);
const nmbEntriesTotal = ref(0);
const totalPages = ref(0);
const render = ref(false);

const searchKey = ref('');

const sortKey: Ref<ProjectsSortInterface> = ref(ProjectsSortInterface.COMBINED_SEVERITY);
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);
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
            workspace: '.',
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
watch([pageNumber, pageLimitSelected, sortDirection, sortKey, searchKey], async () => {
    await init();
});

watch(sorting, () => {
    if (sorting.value.length > 0) {
        sortKey.value = sorting.value[0].id as ProjectsSortInterface;
        sortDirection.value = sorting.value[0].desc ? SortDirection.DESC : SortDirection.ASC;
    }
});
</script>

<template>
    <div class="container py-4 mx-auto">
        <!-- <div>
            Legend:
            <ul class="list list-inside">
                <li class="list-item text-primary">Dependency requested by you</li>
                <li class="list-item text-muted-foreground">
                    Dependency installed by one of your dependencies
                </li>
                <li class="list-item text-severityMedium">
                    Dependency requested by you and installed by one of your dependencies
                </li>
            </ul>
        </div> -->
        <DataTable
            :columns="columns"
            :data="data"
            v-model:pageLimitSelected="pageLimitSelected"
            v-model:searchKey="searchKey"
            v-model:sorting="sorting"
            v-model:columnFilters="columnFilters"
            v-model:columnVisibility="columnVisibility"
        />

        <div class="flex gap-2 items-center justify-center">
            <div class="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {{ pageNumber + 1 }} of
                {{ totalPages }}
            </div>
            <PaginationComponent
                v-model:page="pageNumber"
                v-model:nmbEntriesShowing="pageLimitSelected"
                v-model:nmbEntriesTotal="nmbEntriesTotal"
                v-model:totalPages="totalPages"
            />
        </div>
    </div>
</template>
