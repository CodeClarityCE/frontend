<script setup lang="ts">
import { ListFilter, X } from "@lucide/vue";
import { computed } from "vue";

import {
  type ActiveFilter,
  type FilterState,
  FilterType,
  getActiveState,
} from "@/base_components/filters/filterTypes";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";

// The filter menu and the chips of active filters, over a FilterState.
const filterState = defineModel<FilterState>("filterState", {
  required: true,
});

const categories = computed(() =>
  Object.entries(filterState.value.filterConfig).filter(
    ([, category]) => category.type === FilterType.CHECKBOX,
  ),
);

function setOption(category: string, option: string, value: boolean): void {
  const entry = filterState.value.filterConfig[category]?.data[option];
  if (!entry) return;
  entry.value = value;
  filterState.value.activeFilters = getActiveState(
    filterState.value.filterConfig,
  );
}

function remove(filter: ActiveFilter): void {
  setOption(filter.category, filter.option, false);
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline">
          <ListFilter aria-hidden="true" class="size-4" />
          Filters
          <span
            v-if="filterState.activeFilters.length > 0"
            class="tabular-nums text-muted-foreground"
            >({{ filterState.activeFilters.length }})</span
          >
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-64">
        <template v-for="([name, category], index) in categories" :key="name">
          <DropdownMenuSeparator v-if="index > 0" />
          <DropdownMenuLabel>{{ category.name }}</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            v-for="[option, entry] in Object.entries(category.data)"
            :key="option"
            :model-value="entry.value"
            @select.prevent
            @update:model-value="setOption(name, option, $event === true)"
          >
            {{ entry.title }}
          </DropdownMenuCheckboxItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>

    <ul
      v-if="filterState.activeFilters.length > 0"
      aria-label="Active filters"
      class="flex flex-wrap gap-2"
    >
      <li v-for="filter in filterState.activeFilters" :key="filter.label">
        <Button
          variant="secondary"
          size="sm"
          :aria-label="`Remove filter ${filter.label}`"
          @click="remove(filter)"
        >
          {{ filter.label }}
          <X aria-hidden="true" class="size-3.5" />
        </Button>
      </li>
    </ul>
  </div>
</template>
