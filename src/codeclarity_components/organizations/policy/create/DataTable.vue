<script setup lang="ts" generic="TData, TValue">
import type { License } from "@/codeclarity_components/results/licenses/License";
import { valueUpdater } from "@/shadcn/lib/utils";
import Button from "@/shadcn/ui/button/Button.vue";
import Input from "@/shadcn/ui/input/Input.vue";
import Table from "@/shadcn/ui/table/Table.vue";
import TableBody from "@/shadcn/ui/table/TableBody.vue";
import TableCell from "@/shadcn/ui/table/TableCell.vue";
import TableHead from "@/shadcn/ui/table/TableHead.vue";
import TableHeader from "@/shadcn/ui/table/TableHeader.vue";
import TableRow from "@/shadcn/ui/table/TableRow.vue";
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useVueTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/vue-table";
import { ref } from "vue";

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}>();

interface CheckboxRootEmits {
  /** Event handler called when the checked state of the checkbox changes. */
  "update:rowSelection": [value: string[]];
}
const emit = defineEmits<CheckboxRootEmits>();

const rowSelection = ref({});
const columnFilters = ref<ColumnFiltersState>([]);

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  getFilteredRowModel: getFilteredRowModel(),
  onRowSelectionChange: (updaterOrValue) => {
    void valueUpdater(updaterOrValue, rowSelection);

    const selectedRows: string[] = [];
    table.getFilteredSelectedRowModel().rows.forEach((row) => {
      selectedRows.push((row.original as License).licenseId);
    });

    void emit("update:rowSelection", selectedRows);
  },
  state: {
    get columnFilters() {
      return columnFilters.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
  },
});
</script>

<template>
  <div class="flex items-center py-4">
    <Input
      class="max-w-sm"
      placeholder="Filter licenses..."
      :model-value="table.getColumn('licenseName')?.getFilterValue() as string"
      @update:model-value="
        table.getColumn('licenseName')?.setFilterValue($event)
      "
    />
  </div>
  <div class="border rounded-md">
    <Table>
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
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
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
  <div class="flex items-center justify-end py-4 space-x-2">
    <div class="flex-1 text-sm text-muted-foreground">
      {{ table.getFilteredSelectedRowModel().rows.length }} of
      {{ table.getFilteredRowModel().rows.length }} row(s) selected.
    </div>
    <Button
      variant="outline"
      size="sm"
      :disabled="!table.getCanPreviousPage()"
      @click="table.previousPage()"
    >
      Previous
    </Button>
    <Button
      variant="outline"
      size="sm"
      :disabled="!table.getCanNextPage()"
      @click="table.nextPage()"
    >
      Next
    </Button>
  </div>
</template>
