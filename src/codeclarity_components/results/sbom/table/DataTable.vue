<script setup lang="ts" generic="TData, TValue">
import type {
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    VisibilityState
} from '@tanstack/vue-table';

import { valueUpdater } from '@/shadcn/lib/utils';

import {
    FlexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useVueTable
} from '@tanstack/vue-table';

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from '@/shadcn/ui/dropdown-menu';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shadcn/ui/table';
import { Button } from '@/shadcn/ui/button';
import { Input } from '@/shadcn/ui/input';
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/ui/select';

const props = defineProps<{
    columns: ColumnDef<TData, TValue>[];
}>();

const pageLimitSelected = defineModel<number>('pageLimitSelected', { default: 15 });
const searchKey = defineModel<string>('searchKey', { default: '' });
const sorting = defineModel<SortingState>('sorting', { default: [] });
const columnFilters = defineModel<ColumnFiltersState>('columnFilters', { default: [] });
const columnVisibility = defineModel<VisibilityState>('columnVisibility', { default: {} });
const data = defineModel<TData[]>('data', { default: [] });

const rowSelection = ref({});
const rowDensity = ref('normal');

const table = useVueTable({
    data,
    get columns() {
        return props.columns;
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
    onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
    onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
    state: {
        get sorting() {
            return sorting.value;
        },
        get columnFilters() {
            return columnFilters.value;
        },
        get columnVisibility() {
            return columnVisibility.value;
        },
        get rowSelection() {
            return rowSelection.value;
        }
    },
    getPaginationRowModel: getPaginationRowModel()
});
table.setPageSize(pageLimitSelected.value);

function setPageSize(pageSize: any) {
    const size = typeof pageSize === 'string' ? parseInt(pageSize) : (pageSize ?? 15);
    table.setPageSize(size);
    pageLimitSelected.value = size;
}

function search(_searchKey: any) {
    searchKey.value = String(_searchKey || '');
}

function toggleFilter(filterType: string) {
    // This would integrate with your actual filtering logic
    console.log('Toggle filter:', filterType);
}
</script>

<template>
    <div class="space-y-4">
        <!-- Header Section with Search and Filters -->
        <div
            class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border"
        >
            <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
                <div class="relative flex-1 max-w-sm">
                    <Icon
                        icon="tabler:search"
                        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                    />
                    <Input
                        class="pl-10 bg-white dark:bg-gray-800"
                        placeholder="Search by name, version, or status..."
                        :model-value="table.getColumn('name')?.getFilterValue() as string"
                        @update:model-value="search"
                    />
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div class="flex items-center gap-1">
                        <Icon icon="tabler:filter" class="w-3 h-3" />
                        {{ table.getFilteredRowModel().rows.length }} dependencies
                    </div>

                    <!-- Row Density Toggle -->
                    <div class="flex items-center gap-1">
                        <span class="text-xs">Density:</span>
                        <Select
                            :model-value="rowDensity"
                            @update:model-value="(value: any) => (rowDensity = value)"
                        >
                            <SelectTrigger class="h-7 w-20 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="compact">Compact</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="comfortable">Roomy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- Quick Filters -->
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="outline" size="sm" class="gap-2">
                            <Icon icon="tabler:filter-star" class="w-4 h-4" />
                            Quick Filters
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-52">
                        <DropdownMenuCheckboxItem @click="toggleFilter('outdated')">
                            <Icon
                                icon="tabler:alert-triangle"
                                class="w-4 h-4 mr-2 text-amber-500"
                            />
                            Show only outdated
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem @click="toggleFilter('direct')">
                            <Icon icon="tabler:target" class="w-4 h-4 mr-2 text-purple-500" />
                            Show only direct
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem @click="toggleFilter('dev')">
                            <Icon icon="tabler:code" class="w-4 h-4 mr-2 text-blue-500" />
                            Show only dev deps
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="outline" class="gap-2">
                            <Icon icon="tabler:columns" class="w-4 h-4" />
                            Columns
                            <Icon icon="tabler:chevron-down" class="w-4 h-4"></Icon>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-48">
                        <DropdownMenuCheckboxItem
                            v-for="column in table
                                .getAllColumns()
                                .filter((column: any) => column.getCanHide())"
                            :key="column.id"
                            class="capitalize"
                            :checked="column.getIsVisible()"
                            @update:checked="
                                (value: any) => {
                                    column.toggleVisibility(!!value);
                                }
                            "
                        >
                            {{ column.id.replace('_', ' ') }}
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <!-- Table Section -->
        <div class="border rounded-lg overflow-hidden bg-white dark:bg-gray-950">
            <Table>
                <TableHeader class="bg-gray-50 dark:bg-gray-900/50">
                    <TableRow
                        v-for="headerGroup in table.getHeaderGroups()"
                        :key="headerGroup.id"
                        class="border-b border-gray-200 dark:border-gray-800"
                    >
                        <TableHead
                            v-for="header in headerGroup.headers"
                            :key="header.id"
                            class="font-semibold text-gray-900 dark:text-gray-100 py-3"
                        >
                            <FlexRender
                                v-if="!header.isPlaceholder"
                                :render="header.column.columnDef.header"
                                :props="header.getContext()"
                            />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <template v-if="table.getRowModel().rows?.length">
                        <TableRow
                            v-for="(row, index) in table.getRowModel().rows"
                            :key="row.id"
                            :data-state="row.getIsSelected() ? 'selected' : undefined"
                            :class="[
                                'transition-colors duration-150 border-b border-gray-100 dark:border-gray-800',
                                'hover:bg-blue-50 dark:hover:bg-blue-950/30',
                                {
                                    'h-12': rowDensity === 'compact',
                                    'h-16': rowDensity === 'normal',
                                    'h-20': rowDensity === 'comfortable',
                                    'bg-gray-50/50 dark:bg-gray-900/20': index % 2 === 1
                                }
                            ]"
                        >
                            <TableCell
                                v-for="cell in row.getVisibleCells()"
                                :key="cell.id"
                                :class="[
                                    'align-middle',
                                    {
                                        'py-2': rowDensity === 'compact',
                                        'py-3': rowDensity === 'normal',
                                        'py-4': rowDensity === 'comfortable'
                                    }
                                ]"
                            >
                                <FlexRender
                                    :render="cell.column.columnDef.cell"
                                    :props="cell.getContext()"
                                />
                            </TableCell>
                        </TableRow>
                    </template>
                    <template v-else>
                        <TableRow>
                            <TableCell :col-span="columns.length" class="h-32 text-center">
                                <div
                                    class="flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400"
                                >
                                    <Icon icon="tabler:package-off" class="w-8 h-8" />
                                    <p class="text-sm font-medium">No dependencies found</p>
                                    <p class="text-xs">Try adjusting your search or filters</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    </template>
                </TableBody>
            </Table>
        </div>

        <!-- Pagination Section -->
        <div class="flex items-center justify-between py-4 px-2">
            <div class="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div class="flex items-center gap-2">
                    <span>Show</span>
                    <Select
                        :model-value="`${table.getState().pagination.pageSize}`"
                        @update:model-value="setPageSize"
                    >
                        <SelectTrigger class="h-8 w-[70px]">
                            <SelectValue :placeholder="`${pageLimitSelected}`" />
                        </SelectTrigger>
                        <SelectContent side="top">
                            <SelectItem
                                v-for="pageSize in [10, 15, 20, 30, 40, 50]"
                                :key="pageSize"
                                :value="`${pageSize}`"
                            >
                                {{ pageSize }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <span>entries</span>
                </div>
            </div>
        </div>
    </div>
</template>
