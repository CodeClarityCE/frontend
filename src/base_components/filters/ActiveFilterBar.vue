<script lang="ts" setup>
import type { ActiveFilter, FilterState } from '@/base_components/filters/UtilitiesFilters.vue';
import { Icon } from '@iconify/vue';

const filterState = defineModel<FilterState>('filterState', { default: {} });

function removeFilter(filter: ActiveFilter) {
    if (filterState.value?.filterConfig?.[filter.category]?.data?.[filter.option]) {
        filterState.value.filterConfig[filter.category]!.data[filter.option]!.value = false;
    }
}
</script>
<template>
    <div class="flex flex-row gap-2 flex-wrap">
        <div v-for="filter in filterState.activeFilters" :key="filter.label">
            <div
                class="w-fit bg-gray-200 py-1 px-2 rounded flex flex-row gap-2 items-center font-normal text-grayTitle"
            >
                <div>{{ filter.label }}</div>
                <div
                    v-if="filter.type == 'checkbox'"
                    title="Remove filter"
                    style="cursor: pointer; color: #bfbfbf"
                    class="cursor-pointer text-gray-400"
                    @click="removeFilter(filter)"
                >
                    <Icon class="text-lg" icon="solar:close-circle-bold"></Icon>
                </div>
                <div v-if="filter.type == 'radio'" class="text-gray-400"></div>
            </div>
        </div>
    </div>
</template>
