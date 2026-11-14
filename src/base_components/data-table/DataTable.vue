<script setup lang="ts" generic="TData">
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "@lucide/vue";
import {
  type ColumnDef,
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Header,
  type SortingState,
  useVueTable,
} from "@tanstack/vue-table";
import { computed, ref, watch } from "vue";

import { valueUpdater } from "@/shadcn/lib/utils";
import { Input } from "@/shadcn/ui/input";
import { Skeleton } from "@/shadcn/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

import DataTablePagination from "./DataTablePagination.vue";

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    // Names the table for screen readers, and the loading state.
    caption: string;
    loading?: boolean;
    // Shows a filter box over every text and number column.
    filterLabel?: string;
    emptyText?: string;
    pageSize?: number;
    initialSorting?: SortingState;
    rowKey?: (row: TData) => string;
    rowTestid?: string;
    // Server-side mode: the number of matching rows on the server. `data` is
    // then one page, and sorting, filtering and paging are left to the parent.
    total?: number;
  }>(),
  {
    loading: false,
    filterLabel: undefined,
    emptyText: "No results.",
    pageSize: 20,
    initialSorting: () => [],
    rowKey: undefined,
    rowTestid: undefined,
    total: undefined,
  },
);

const emit = defineEmits<{ "update:sorting": [sorting: SortingState] }>();

// Each `cell-<column id>` slot renders that column's cells.
const slots =
  defineSlots<
    Record<`cell-${string}`, (props: { row: TData; value: unknown }) => unknown>
  >();
const serverSide = computed(() => props.total !== undefined);
const sorting = ref<SortingState>(props.initialSorting);
// Bind these with v-model in server-side mode to load the matching page.
const globalFilter = defineModel<string>("filter", { default: "" });
const pageIndex = defineModel<number>("pageIndex", { default: 0 });
const pagination = computed(() => ({
  pageIndex: pageIndex.value,
  pageSize: props.pageSize,
}));

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getRowId: props.rowKey ? (row: TData) => props.rowKey!(row) : undefined,
  state: {
    get sorting() {
      return sorting.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
    get pagination() {
      return pagination.value;
    },
  },
  onSortingChange: (updater) => {
    valueUpdater(updater, sorting);
    emit("update:sorting", sorting.value);
    if (serverSide.value) pageIndex.value = 0;
  },
  onGlobalFilterChange: (updater) => valueUpdater(updater, globalFilter),
  onPaginationChange: (updater) => {
    const next =
      typeof updater === "function" ? updater(pagination.value) : updater;
    pageIndex.value = next.pageIndex;
  },
  get manualSorting() {
    return serverSide.value;
  },
  get manualFiltering() {
    return serverSide.value;
  },
  get manualPagination() {
    return serverSide.value;
  },
  get rowCount() {
    return props.total;
  },
  autoResetPageIndex: false,
  sortDescFirst: false,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});

// A new filter starts from the first page.
watch(globalFilter, () => {
  pageIndex.value = 0;
});

const filteredCount = computed(
  () => props.total ?? table.getFilteredRowModel().rows.length,
);

function ariaSort(
  header: Header<TData, unknown>,
): "ascending" | "descending" | undefined {
  const sorted = header.column.getIsSorted();
  if (sorted === "asc") return "ascending";
  if (sorted === "desc") return "descending";
  return undefined;
}

function headerLabel(header: Header<TData, unknown>): string {
  const label = header.column.columnDef.header;
  return typeof label === "string" ? label : header.column.id;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="filterLabel" class="relative max-w-sm">
      <Search
        aria-hidden="true"
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        v-model="globalFilter"
        type="search"
        :aria-label="filterLabel"
        :placeholder="filterLabel"
        class="pl-9"
        :disabled="loading"
      />
    </div>

    <div
      v-if="loading"
      role="status"
      :aria-label="`Loading ${caption}`"
      class="overflow-hidden rounded-card border bg-card shadow-card"
    >
      <div class="flex gap-6 border-b bg-muted px-4 py-3">
        <Skeleton
          v-for="column in columns.length"
          :key="column"
          class="h-4 flex-1"
        />
      </div>
      <div
        v-for="row in 5"
        :key="row"
        class="flex gap-6 border-b px-4 py-4 last:border-b-0"
      >
        <Skeleton
          v-for="column in columns.length"
          :key="column"
          class="h-4 flex-1"
        />
      </div>
    </div>

    <div v-else class="overflow-hidden rounded-card border bg-card shadow-card">
      <Table>
        <TableCaption class="sr-only">{{ caption }}</TableCaption>
        <TableHeader class="bg-muted">
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="hover:bg-transparent"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :aria-sort="ariaSort(header)"
              class="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              <button
                v-if="!header.isPlaceholder && header.column.getCanSort()"
                type="button"
                class="-mx-2 inline-flex items-center gap-1.5 rounded-control px-2 py-1 uppercase hover:text-foreground-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                @click="header.column.toggleSorting()"
              >
                {{ headerLabel(header) }}
                <ArrowUp
                  v-if="header.column.getIsSorted() === 'asc'"
                  aria-hidden="true"
                  class="size-3.5"
                />
                <ArrowDown
                  v-else-if="header.column.getIsSorted() === 'desc'"
                  aria-hidden="true"
                  class="size-3.5"
                />
                <ArrowUpDown v-else aria-hidden="true" class="size-3.5" />
              </button>
              <FlexRender
                v-else-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-testid="rowTestid"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-4 py-3"
              >
                <slot
                  v-if="slots[`cell-${cell.column.id}`]"
                  :name="`cell-${cell.column.id}`"
                  :row="row.original"
                  :value="cell.getValue()"
                />
                <FlexRender
                  v-else
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>
          <TableEmpty v-else :colspan="columns.length">
            {{ emptyText }}
          </TableEmpty>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination
      v-if="!loading && filteredCount > pagination.pageSize"
      :page-index="pagination.pageIndex"
      :page-size="pagination.pageSize"
      :total="filteredCount"
      @update:page-index="table.setPageIndex($event)"
    />
  </div>
</template>
