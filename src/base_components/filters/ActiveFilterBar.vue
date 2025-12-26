<script lang="ts" setup>
import {
    FilterType,
    type ActiveFilter,
    type FilterState
} from '@/base_components/filters/UtilitiesFilters.vue';
import { Icon } from '@iconify/vue';

const filterState = defineModel<FilterState>('filterState', { required: true });

function removeFilter(filter: ActiveFilter): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const state = filterState.value;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!state?.filterConfig) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const category = state.filterConfig[filter.category as keyof typeof state.filterConfig];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!category?.data) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const option = category.data[filter.option as keyof typeof category.data];
    if (option) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        option.value = false;
    }
}
</script>
<template>
    <div class="flex flex-row gap-2 flex-wrap">
        <div v-for="filter in filterState.activeFilters" :key="filter.label">
            <div
                class="w-fit bg-gray-200 py-1 px-2 rounded flex flex-row gap-2 items-center font-normal text-gray-700"
            >
                <div>{{ filter.label }}</div>
                <div
                    v-if="filter.type === FilterType.CHECKBOX"
                    title="Remove filter"
                    style="cursor: pointer; color: #bfbfbf"
                    class="cursor-pointer text-gray-400"
                    @click="removeFilter(filter)"
                >
                    <Icon class="text-lg" icon="solar:close-circle-bold"></Icon>
                </div>
                <div v-if="filter.type === FilterType.RADIO" class="text-gray-400"></div>
            </div>
        </div>
    </div>
</template>
