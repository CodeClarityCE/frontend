<script setup lang="ts">
// Imports
import SearchBar from '@/base_components/filters/SearchBar.vue';
import UtilitiesSort from '@/base_components/utilities/UtilitiesSort.vue';
import { ProjectsSortInterface } from '@/codeclarity_components/projects/project.repository';
import { useProjectsMainStore } from '@/stores/StateStore';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { storeToRefs } from 'pinia';

// State
const viewState = useProjectsMainStore();
const { projectsResponse } = storeToRefs(viewState);

// Models
const pageLimitSelected = defineModel<number>('pageLimitSelected', { default: 10 });
const sortKey = defineModel<ProjectsSortInterface>('sortKey', {
    default: ProjectsSortInterface.IMPORTED_ON
});
const sortDirection = defineModel<SortDirection>('sortDirection', { default: SortDirection.DESC });
const searchKey = defineModel<string>('searchKey', { default: '' });

// Variables
const placeholder = 'Search by project name';
const selectionPageLimit = [3, 8, 10, 15];
const sort_options = [
    { label: 'Name', key: ProjectsSortInterface.NAME },
    { label: 'Imported on', key: ProjectsSortInterface.IMPORTED_ON }
];
</script>
<template>
    <!-- Search Bar -->
    <div class="flex gap-4 mt-4">
        <SearchBar v-model:search-key="searchKey" :placeholder="placeholder" />
    </div>

    <!-- Sort Bar -->
    <UtilitiesSort
        v-model:page-limit-selected="pageLimitSelected"
        v-model:sort-key="sortKey"
        v-model:sort-direction="sortDirection"
        :selection-page-limit="selectionPageLimit"
        :sort-options="sort_options"
        :showing="projectsResponse?.entries_per_page || 0"
        :total="projectsResponse?.total_entries || 0"
    >
    </UtilitiesSort>
</template>
