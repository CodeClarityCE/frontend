<script setup lang="ts">
// Imports
import SearchBar from '@/common_components/SearchBar.vue';
import { SortDirection } from '@/repositories/types/PaginatedRequestOptions';
import { ProjectsSortInterface } from '@/repositories/ProjectRepository';
import UtilitiesSort from '@/common_components/UtilitiesSort.vue';
import { useProjectsMainStore } from '@/stores/StateStore';
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
        <SearchBar v-model:searchKey="searchKey" :placeholder="placeholder" />
    </div>

    <!-- Sort Bar -->
    <UtilitiesSort
        :selectionPageLimit="selectionPageLimit"
        :sortOptions="sort_options"
        :showing="projectsResponse?.entries_per_page || 0"
        :total="projectsResponse?.total_entries || 0"
        v-model:pageLimitSelected="pageLimitSelected"
        v-model:sortKey="sortKey"
        v-model:sortDirection="sortDirection"
    ></UtilitiesSort>
</template>
