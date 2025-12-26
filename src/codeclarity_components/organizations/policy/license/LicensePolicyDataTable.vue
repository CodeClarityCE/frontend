<script setup lang="ts" generic="TData, TValue">
import { valueUpdater } from "@/shadcn/lib/utils";
import Button from "@/shadcn/ui/button/Button.vue";
import Input from "@/shadcn/ui/input/Input.vue";
import Table from "@/shadcn/ui/table/Table.vue";
import TableBody from "@/shadcn/ui/table/TableBody.vue";
import TableCell from "@/shadcn/ui/table/TableCell.vue";
import TableHead from "@/shadcn/ui/table/TableHead.vue";
import TableHeader from "@/shadcn/ui/table/TableHeader.vue";
import TableRow from "@/shadcn/ui/table/TableRow.vue";
import { Icon } from "@iconify/vue";
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useVueTable,
  type ColumnFiltersState,
} from "@tanstack/vue-table";
import { ref, computed } from "vue";
import type { LicensePolicy } from "../license_policy.entity";
import { columns } from "./columns";

const props = defineProps<{
  data: LicensePolicy[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  edit: [policy: LicensePolicy];
  delete: [policy: LicensePolicy];
}>();

const rowSelection = ref<Record<string, boolean>>({});
const columnFilters = ref<ColumnFiltersState>([]);

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  getFilteredRowModel: getFilteredRowModel(),
  onRowSelectionChange: (updaterOrValue) => {
    void valueUpdater(updaterOrValue, rowSelection);
  },
  state: {
    get columnFilters() {
      return columnFilters.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
  },
  meta: {
    onEdit: (policy: LicensePolicy) => emit("edit", policy),
    onDelete: (policy: LicensePolicy) => emit("delete", policy),
  },
});

const selectedRowCount = computed(() => {
  return Object.keys(rowSelection.value).filter(
    (key) => rowSelection.value[key],
  ).length;
});
</script>

<template>
  <div class="w-full">
    <div class="flex items-center py-4">
      <Input
        placeholder="Filter policies..."
        :model-value="
          (table.getColumn('name')?.getFilterValue() as string) ?? ''
        "
        class="max-w-sm"
        @update:model-value="table.getColumn('name')?.setFilterValue($event)"
      />
    </div>
    <div class="rounded-md border">
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
              <TableCell :col-span="columns.length" class="h-24 text-center">
                <div
                  class="flex flex-col items-center justify-center text-gray-500"
                >
                  <Icon
                    icon="solar:shield-check-bold"
                    class="h-12 w-12 mb-4 text-gray-300"
                  />
                  <p class="text-lg font-medium">No license policies found</p>
                  <p class="text-sm text-gray-400 mt-1">
                    Create your first license policy to get started
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ selectedRowCount }} of
        {{ table.getFilteredRowModel().rows.length }} row(s) selected.
      </div>
      <div class="space-x-2">
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
    </div>
  </div>
</template>
