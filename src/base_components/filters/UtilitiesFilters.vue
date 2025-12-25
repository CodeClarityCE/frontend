<script lang="ts" setup>
import { Button } from '@/shadcn/ui/button';
import { Checkbox } from '@/shadcn/ui/checkbox';
import { Label } from '@/shadcn/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shadcn/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/shadcn/ui/radio-group';
import { Separator } from '@/shadcn/ui/separator';
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

// Props
defineProps<{
    lockedCategories?: string[];
}>();

const filterState = defineModel<FilterState>('filter-state', { default: {} });

// State
const options_count = ref<Record<string, number>>({});

function optionClick(filter: FilterCategory, category_name: string, option_name: string): void {
    // Modify the filter state (view)
    if (filter?.type === FilterType.CHECKBOX) {
        if (filterState.value?.filterConfig?.[category_name]?.data?.[option_name]) {
            filterState.value.filterConfig[category_name].data[option_name].value =
                !filterState.value.filterConfig[category_name].data[option_name].value;
        }
    } else if (filter?.type === FilterType.RADIO) {
        // Set all other radio buttons in the same category to false
        if (filterState.value?.filterConfig?.[category_name]?.data) {
            Object.entries(filterState.value.filterConfig[category_name].data).forEach(([key]) => {
                if (filterState.value?.filterConfig?.[category_name]?.data?.[key]) {
                    if (key === option_name) {
                        filterState.value.filterConfig[category_name].data[key].value = true;
                    } else {
                        filterState.value.filterConfig[category_name].data[key].value = false;
                    }
                }
            });
        }
    }

    filterState.value.activeFilters = [];

    // Set the active filters state
    filterState.value.activeFilters = getActiveState(filterState.value.filterConfig);
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
    setFilterCount
});

function init(): void {
    filterState.value.activeFilters = getActiveState(filterState.value.filterConfig);
}

init();
</script>

<script lang="ts">
// Types
export enum FilterType {
    DIVIDER = 'divider',
    CHECKBOX = 'checkbox',
    RADIO = 'radio'
}

export interface ActiveFilter {
    label: string;
    category: string;
    type: FilterType;
    option: string;
}

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
        let options = '';
        this.activeFilters.forEach((filter, index) => {
            options += filter.option;
            if (index < this.activeFilters.length - 1) {
                options += ',';
            }
        });
        return options;
    }

    addFilterCategory(category: FilterCategory, integrationCategoryName?: string): ActiveFilter[] {
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

export type FilterConfig = Record<string, FilterCategory>;

export interface FilterCategory {
    iconScale?: string;
    icon?: string;
    name: string;
    type: FilterType;
    data: Record<string, FilterOption>;
}

export interface FilterOption {
    title: string;
    value: boolean;
}

export function createNewFilterState(filterConfig: FilterConfig): FilterState {
    return new FilterState(filterConfig);
}

function getActiveState(filterConfig: FilterConfig): ActiveFilter[] {
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
                    type: categoryObj.type
                });
            }
        }
    }
    return activeFilters;
}
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
                v-for="[category_name, filter] in Object.entries(filterState.filterConfig)"
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
                            v-if="lockedCategories && lockedCategories.includes(category_name)"
                            class="text-primary"
                        >
                            <Icon icon="material-symbols:lock" /> locked
                        </div>
                    </div>

                    <!-- CHECKBOX -->
                    <div v-if="filter.type === FilterType.CHECKBOX" class="flex flex-col gap-2">
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
                                v-for="[attribute_name, attribute] in Object.entries(filter.data)"
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
