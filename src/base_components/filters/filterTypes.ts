// Filter types and utilities

export enum FilterType {
  DIVIDER = "divider",
  CHECKBOX = "checkbox",
  RADIO = "radio",
}

export interface ActiveFilter {
  label: string;
  category: string;
  type: FilterType;
  option: string;
}

export interface FilterOption {
  title: string;
  value: boolean;
}

export interface FilterCategory {
  iconScale?: string;
  icon?: string;
  name: string;
  type: FilterType;
  data: Record<string, FilterOption>;
}

export type FilterConfig = Record<string, FilterCategory>;

export class FilterState {
  filterConfig: FilterConfig;
  activeFilters: ActiveFilter[];
  categoryCount: number;

  constructor(config: FilterConfig) {
    this.filterConfig = config;
    this.activeFilters = getActiveState(config);
    this.categoryCount = 0;
  }

  toString(): string {
    let options = "";
    this.activeFilters.forEach((filter, index) => {
      options += filter.option;
      if (index < this.activeFilters.length - 1) {
        options += ",";
      }
    });
    return options;
  }

  addFilterCategory(
    category: FilterCategory,
    integrationCategoryName?: string,
  ): ActiveFilter[] {
    if (!integrationCategoryName) {
      this.filterConfig[`category_${this.categoryCount}`] = category;
      this.categoryCount++;
    } else {
      this.filterConfig[integrationCategoryName] = category;
    }

    this.activeFilters.length = 0; // empty the array
    this.activeFilters.push(...getActiveState(this.filterConfig));

    return this.activeFilters;
  }
}

export function createNewFilterState(filterConfig: FilterConfig): FilterState {
  return new FilterState(filterConfig);
}

export function getActiveState(filterConfig: FilterConfig): ActiveFilter[] {
  const activeFilters: ActiveFilter[] = [];
  // Set the active filters state
  for (const category in filterConfig) {
    const categoryObj = filterConfig[category];
    if (!categoryObj) continue;
    for (const option in categoryObj.data) {
      const optionObj = categoryObj.data[option];
      if (optionObj?.value === true) {
        activeFilters.push({
          label: `${categoryObj.name}: ${optionObj.title}`,
          category: category,
          option: option,
          type: categoryObj.type,
        });
      }
    }
  }
  return activeFilters;
}
