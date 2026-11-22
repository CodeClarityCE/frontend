import {
  type ColumnDef,
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  type Header,
  type RowData,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from "@tanstack/vue-table";

// The table features every DataTable uses: sorting, the global filter and paging.
// The built-in sort functions back each column's automatic sort.
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns,
});

type DataTableFeatures = typeof dataTableFeatures;

// A column of a DataTable showing rows of type TData.
export type DataTableColumn<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  unknown
>;

export type DataTableHeader<TData extends RowData> = Header<
  DataTableFeatures,
  TData,
  unknown
>;
