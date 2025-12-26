export interface PaginatedRequestOptions {
  activeFilters: string[];
  sortBy: string;
  sortDirection: SortDirection;
  searchKey: string;
  page: number;
  entriesPerPage: number;
}

export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}
