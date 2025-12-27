<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import {
  FilterType,
  type ActiveFilter,
  type FilterState,
} from "@/base_components/filters/filterTypes";

const filterState = defineModel<FilterState>("filterState", { required: true });

function removeFilter(filter: ActiveFilter): void {
  const state: FilterState | undefined = filterState.value;
  if (!state?.filterConfig) return;

  const config = state.filterConfig;
  const categoryKey = filter.category;
  const category = config[categoryKey];
  if (!category?.data) return;

  const data = category.data;
  const optionKey = filter.option;
  const option = data[optionKey];
  if (option && typeof option === "object" && "value" in option) {
    (option as { value: boolean }).value = false;
  }
}
</script>
<template>
  <div class="flex flex-row gap-2 flex-wrap">
    <div v-for="filter in filterState.activeFilters" :key="filter.label">
      <div
        class="w-fit bg-gray-200 py-1 px-2 rounded flex flex-row gap-2 items-center font-normal text-gray-700"
      >
        <div>{{ filter.label }}</div>
        <div
          v-if="filter.type === FilterType.CHECKBOX"
          title="Remove filter"
          style="cursor: pointer; color: #bfbfbf"
          class="cursor-pointer text-gray-400"
          @click="removeFilter(filter)"
        >
          <Icon class="text-lg" icon="solar:close-circle-bold"></Icon>
        </div>
        <div
          v-if="filter.type === FilterType.RADIO"
          class="text-gray-400"
        ></div>
      </div>
    </div>
  </div>
</template>
