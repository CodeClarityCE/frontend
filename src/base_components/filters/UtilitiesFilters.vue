<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ref } from "vue";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Label } from "@/shadcn/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/shadcn/ui/radio-group";
import { Separator } from "@/shadcn/ui/separator";
import {
  FilterType,
  getActiveState,
  type FilterCategory,
  type FilterState,
} from "./filterTypes";

// Props
defineProps<{
  lockedCategories?: string[];
}>();

const filterState = defineModel<FilterState>("filter-state", { default: {} });

// State
const options_count = ref<Record<string, number>>({});

function optionClick(
  filter: FilterCategory,
  category_name: string,
  option_name: string,
): void {
  // Modify the filter state (view)
  if (filter?.type === FilterType.CHECKBOX) {
    if (filterState.value?.filterConfig?.[category_name]?.data?.[option_name]) {
      filterState.value.filterConfig[category_name].data[option_name].value =
        !filterState.value.filterConfig[category_name].data[option_name].value;
    }
  } else if (filter?.type === FilterType.RADIO) {
    // Set all other radio buttons in the same category to false
    if (filterState.value?.filterConfig?.[category_name]?.data) {
      Object.entries(
        filterState.value.filterConfig[category_name].data,
      ).forEach(([key]) => {
        if (filterState.value?.filterConfig?.[category_name]?.data?.[key]) {
          if (key === option_name) {
            filterState.value.filterConfig[category_name].data[key].value =
              true;
          } else {
            filterState.value.filterConfig[category_name].data[key].value =
              false;
          }
        }
      });
    }
  }

  filterState.value.activeFilters = [];

  // Set the active filters state
  filterState.value.activeFilters = getActiveState(
    filterState.value.filterConfig,
  );
}

function isActive(): boolean {
  for (const category in filterState.value.filterConfig) {
    const categoryObj = filterState.value.filterConfig[category];
    if (!categoryObj) continue;
    for (const option in categoryObj.data) {
      const optionObj = categoryObj.data[option];
      if (optionObj?.value === true) {
        return true;
      }
    }
  }
  return false;
}

function setFilterCount(new_filter_count: Record<string, number>): void {
  options_count.value = new_filter_count;
}

defineExpose({
  setFilterCount,
});

function init(): void {
  filterState.value.activeFilters = getActiveState(
    filterState.value.filterConfig,
  );
}

init();
</script>

<script lang="ts">
// Re-export types from the filter types module for backwards compatibility
export {
  FilterType,
  FilterState,
  createNewFilterState,
  getActiveState,
  type ActiveFilter,
  type FilterConfig,
  type FilterCategory,
  type FilterOption,
} from "./filterTypes";
</script>
<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline">
        <Icon
          v-if="isActive() === true"
          class="text-primary"
          icon="pajamas:status-active"
        />
        Filters
        <Icon icon="ion:chevron-down-outline" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="flex w-full">
      <!-- SHOW COLUMN FOR EACH OPTION -->
      <div
        v-for="[category_name, filter] in Object.entries(
          filterState.filterConfig,
        )"
        :key="category_name"
      >
        <!-- IF TYPE DIVIDER DIPLAY IT -->
        <Separator
          v-if="filter.type === FilterType.DIVIDER"
          orientation="vertical"
          class="mx-4"
        ></Separator>

        <!-- ELSE IF TYPE CHECKBOX/RADIO -->
        <div v-else class="flex flex-col gap-4 whitespace-nowrap w-full">
          <div class="pb-2">
            <div class="flex gap-2 items-center">
              <Icon v-if="filter.icon" :icon="filter.icon" />
              <div>{{ filter.name }}</div>
            </div>
            <div
              v-if="
                lockedCategories && lockedCategories.includes(category_name)
              "
              class="text-primary"
            >
              <Icon icon="material-symbols:lock" /> locked
            </div>
          </div>

          <!-- CHECKBOX -->
          <div
            v-if="filter.type === FilterType.CHECKBOX"
            class="flex flex-col gap-2"
          >
            <div
              v-for="[attribute_name, attribute] in Object.entries(filter.data)"
              :key="attribute_name"
              class="flex items-center gap-2"
            >
              <Checkbox
                :id="attribute_name"
                :value="attribute"
                :default-value="attribute.value"
                @click="optionClick(filter, category_name, attribute_name)"
              />
              <Label :for="attribute_name">{{ attribute.title }}</Label>
            </div>
          </div>
          <!-- RADIO -->
          <div v-else-if="filter.type === FilterType.RADIO">
            <RadioGroup>
              <div
                v-for="[attribute_name, attribute] in Object.entries(
                  filter.data,
                )"
                :key="attribute_name"
                class="flex items-center space-x-2"
              >
                <RadioGroupItem
                  :id="attribute_name"
                  :value="attribute"
                  :default-value="attribute.value"
                  @click="optionClick(filter, category_name, attribute_name)"
                />
                <Label :for="attribute_name">{{ attribute.title }}</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
