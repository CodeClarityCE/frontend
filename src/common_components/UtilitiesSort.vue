<template>
    <div class="flex flex-row gap-1 justify-between items-center">
        <div class="flex flex-row gap-8 w-fit">
            <div class="flex flex-row gap-2 items-center whitespace-nowrap">
                Showing
                <Select
                    @update:modelValue="
                        (e) => {
                            pageLimitSelected = parseInt(e);
                        }
                    "
                    v-bind="pageLimitSelected.toString"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select entries" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Entries per page</SelectLabel>
                            <SelectItem
                                v-for="(page_limit_option, index) in selectionPageLimit"
                                :key="index"
                                :value="page_limit_option.toString()"
                            >
                                {{ page_limit_option.toString() }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                entries per page
            </div>
            <div class="flex flex-row gap-2 items-center whitespace-nowrap">
                Sort by
                <Select v-bind="sortKey.toString">
                    <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Sort by</SelectLabel>
                            <SelectItem
                                v-for="(sort_option, index) in sortOptions"
                                :key="index"
                                :value="sort_option['key']"
                                @click="changeSort(sort_option['key'], sortDirection)"
                            >
                                {{ sort_option['label'] }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div class="cursor-pointer flex gap-1 items-center">
                    <Icon
                        icon="oi:sort-descending"
                        class="h-5 w-5"
                        v-if="sortDirection == SortDirection.DESC"
                        @click="changeSort(sortKey, SortDirection.ASC)"
                    />
                    <Icon
                        icon="oi:sort-ascending"
                        class="h-5 w-5"
                        v-else
                        @click="changeSort(sortKey, SortDirection.DESC)"
                    />
                    {{ sortDirection }}
                </div>
            </div>
        </div>
        <div style="">Showing {{ showing }} out of {{ total }} entries</div>
    </div>
</template>
<script setup lang="ts">
// Imports
import { Icon } from '@iconify/vue';
import { SortDirection } from '@/repositories/types/PaginatedRequestOptions';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/shadcn/ui/select';

// Props
defineProps<{
    selectionPageLimit: Array<Number>;
    sortOptions: Array<any>;
    showing: Number;
    total: Number;
}>();

// Models
const pageLimitSelected = defineModel<number>('pageLimitSelected', { default: 10 });
const sortKey = defineModel<string>('sortKey', {
    default: ''
});
const sortDirection = defineModel<SortDirection>('sortDirection', { default: SortDirection.DESC });

// Methods
function changeSort(_sortKey: string, _sortDirection: SortDirection) {
    sortKey.value = _sortKey;
    sortDirection.value = _sortDirection;
}
</script>
