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

function setPageSize(pageSize: string) {
    table.setPageSize(parseInt(pageSize));
    pageLimitSelected.value = parseInt(pageSize);
}

function search(_searchKey: string) {
    searchKey.value = _searchKey;
}
</script>

<template>
    <div>
        <div class="flex items-center py-4">
            <Input
                class="max-w-sm"
                placeholder="Filter dependencies..."
                :model-value="table.getColumn('name')?.getFilterValue() as string"
                @update:model-value="search"
            />
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button variant="outline" class="ml-auto">
                        Columns
                        <Icon icon="tabler:chevron-down" class="w-4 h-4 ml-2"></Icon>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                        v-for="column in table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())"
                        :key="column.id"
                        class="capitalize"
                        :checked="column.getIsVisible()"
                        @update:checked="
                            (value) => {
                                column.toggleVisibility(!!value);
                            }
                        "
                    >
                        {{ column.id }}
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div class="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                        <TableHead v-for="header in headerGroup.headers" :key="header.id">
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
                            v-for="row in table.getRowModel().rows"
                            :key="row.id"
                            :data-state="row.getIsSelected() ? 'selected' : undefined"
                        >
                            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                <FlexRender
                                    :render="cell.column.columnDef.cell"
                                    :props="cell.getContext()"
                                />
                            </TableCell>
                        </TableRow>
                    </template>
                    <template v-else>
                        <TableRow>
                            <TableCell :col-span="columns.length" class="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    </template>
                </TableBody>
            </Table>
        </div>
        <div class="flex items-center justify-evenly py-4 space-x-2">
            <div class="flex items-center space-x-6 lg:space-x-8">
                <div class="flex items-center space-x-2">
                    <p class="text-sm font-medium">Rows per page</p>
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
                </div>
            </div>
        </div>
    </div>
</template>
