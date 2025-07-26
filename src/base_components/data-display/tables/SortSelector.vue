<script lang="ts">
export interface SortOption {
    label: string;
    key: string;
}
</script>
<script setup lang="ts">
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { Icon } from '@iconify/vue';
import type { TableHeader } from '@/base_components/data-display/tables/SortableTable.vue';

// Props
const props = defineProps<{
    sortOptions: SortOption[] | TableHeader[];
    sortKey?: string;
    sortDirection: SortDirection;
    sortByLabel?: string;
}>();

// Emits
const emit = defineEmits<{
    (e: 'onSortChange', sortKey: string, sortDirection: SortDirection): void;
}>();

async function updateSort(key: string | null, sortDirection?: SortDirection) {
    if (!key) return;

    if (!sortDirection) {
        // Emit the change
        emit('onSortChange', key, props.sortDirection);
    } else {
        // Emit the change
        emit('onSortChange', key, sortDirection);
    }
}
</script>
<template>
    <div class="flex flex-row gap-2 items-center w-fit whitespace-nowrap">
        {{ sortByLabel || 'Sort by' }}
        <select
            class="drop-down-box no-shadow"
            style="padding: 5px; height: fit-content; margin: 0px"
        >
            <option
                v-for="(sort_option, index) in sortOptions.filter(
                    (option: SortOption | TableHeader) => option.key != null
                )"
                :key="index"
                :value="sort_option.key"
                :selected="sortKey == sort_option.key"
                @click="updateSort(sort_option.key!, props.sortDirection)"
            >
                {{ sort_option.label }}
            </option>
        </select>
        <div style="cursor: pointer">
            <Icon
                v-if="sortDirection == SortDirection.DESC"
                icon="iconoir:sort-down"
                style="font-size: 2em"
                @click="updateSort(sortKey || null, SortDirection.ASC)"
            />
            <Icon
                v-else
                icon="iconoir:sort-up"
                style="font-size: 2em"
                @click="updateSort(sortKey || null, SortDirection.DESC)"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
.drop-down-box {
    background-color: #fff;
    display: flex;
    flex-direction: row;
    align-items: center;
    // box-shadow: 0 0.1rem 0.3rem 0.05rem rgba(58, 59, 69, 0.15) !important;
    margin-top: 0px;
    border: 1px solid #ccc;
    color: #44423b;
    border-radius: 7px;
    height: 50px;
    width: fit-content;
    height: 40px;
    white-space: nowrap;
    z-index: 1;
    position: relative;
}

.drop-down-box div:nth-child(1) {
    padding-left: 15px;
    padding-right: 15px;
    font-size: 1em;
}

.drop-down-box div:nth-child(2) {
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: 5px;
    padding-right: 15px;
    cursor: pointer;
    font-size: 0.9em;
}
</style>
