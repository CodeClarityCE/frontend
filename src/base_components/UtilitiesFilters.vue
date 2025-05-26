<script lang="ts" setup>
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Popover, PopoverContent, PopoverTrigger } from '@/shadcn/ui/popover';
import { Button } from '@/shadcn/ui/button';
import { Separator } from '@/shadcn/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/shadcn/ui/radio-group';
import { Label } from '@/shadcn/ui/label';
import { Checkbox } from '@/shadcn/ui/checkbox';

// Props
defineProps<{
    lockedCategories?: string[];
}>();

const filterState = defineModel<FilterState>('filterState', { default: {} });

// State
const options_count: any = ref({});

function optionClick(filter: FilterCategory, category_name: string, option_name: string) {
    // Modify the filter state (view)
    if (filter.type == FilterType.CHECKBOX) {
        filterState.value.filterConfig[category_name].data[option_name].value =
            !filterState.value.filterConfig[category_name].data[option_name].value;
    } else if (filter.type == FilterType.RADIO) {
        // Set all other radio buttons in the same category to false
        Object.entries(filterState.value.filterConfig[category_name].data).forEach(([key]) => {
            if (key == option_name) {
                filterState.value.filterConfig[category_name].data[key].value = true;
            } else {
                filterState.value.filterConfig[category_name].data[key].value = false;
            }
        });
    }

    filterState.value.activeFilters = [];

    // Set the active filters state
    filterState.value.activeFilters = getActiveState(filterState.value.filterConfig);
}

function isActive() {
    for (const category in filterState.value.filterConfig) {
        for (const option in filterState.value.filterConfig[category].data) {
            if (filterState.value.filterConfig[category].data[option].value == true) {
                return true;
            }
        }
    }
    return false;
}

function setFilterCount(new_filter_count: { [key: string]: number }) {
    options_count.value = new_filter_count;
}

defineExpose({
    setFilterCount
});

function init() {
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

export interface FilterConfig {
    [key: string]: FilterCategory;
}

export interface FilterCategory {
    iconScale?: string;
    icon?: string;
    name: string;
    type: FilterType;
    data: { [key: string]: FilterOption };
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
        for (const option in categoryObj.data) {
            if (categoryObj.data[option].value == true) {
                activeFilters.push({
                    label: `${categoryObj.name}: ${categoryObj.data[option].title}`,
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
                <Icon v-if="isActive() == true" class="text-primary" icon="pajamas:status-active" />
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
                    v-if="filter.type == FilterType.DIVIDER"
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
                    <div v-if="filter.type == FilterType.CHECKBOX" class="flex flex-col gap-2">
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
                    <div v-else-if="filter.type == FilterType.RADIO">
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
