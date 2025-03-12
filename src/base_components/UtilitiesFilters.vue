<template>
    <div class="relative w-fit">
        <!--------------------------------------------------------------------------->
        <!--                             Filters box                               -->
        <!--------------------------------------------------------------------------->
        <div
            title="Open filters"
            class="bg-white flex flex-row items-center mt-0 border border-gray-200 rounded text-gray-600 w-fit h-10 whitespace-nowrap z-10 relative cursor-pointer"
            @click="showFilterModal = !showFilterModal"
        >
            <div class="px-4 text-base">Filters</div>
            <div>
                <Icon icon="ion:chevron-down-outline" />
            </div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                       Filters box active bubble                       -->
        <!--------------------------------------------------------------------------->
        <div
            v-if="isActive() == true"
            class="font-bold absolute -top-7 -left-1 bg-primary text-white rounded p-2 pt-1 scale-90 z-0"
        >
            Active
        </div>

        <!--------------------------------------------------------------------------->
        <!--                          Filter box content                           -->
        <!--------------------------------------------------------------------------->
        <div
            v-if="showFilterModal"
            class="absolute top-11 right-0 w-fit z-20 border border-gray-200 bg-white p-2 flex flex-col gap-4 rounded shadow-lg"
        >
            <div class="p-5 pb-0 flex flex-row gap-8 w-full">
                <!-- SHOW COLUMN FOR EACH OPTION -->
                <div
                    v-for="[category_name, filter] in Object.entries(filterState.filterConfig)"
                    :key="category_name"
                >
                    <!-- IF TYPE DIVIDER DIPLAY IT -->
                    <div
                        v-if="filter.type == FilterType.DIVIDER"
                        class="filter-divider border-l border-gray-600 h-full"
                    ></div>

                    <!-- ELSE IF TYPE CHECKBOX/RADIO -->
                    <div v-else class="flex flex-col gap-4 whitespace-nowrap w-full">
                        <div style="padding-bottom: 10px">
                            <div class="flex flex-row gap-2 items-center">
                                <Icon v-if="filter.icon" :icon="filter.icon" />
                                <div>{{ filter.name }}</div>
                                <!-- Stupid fix to keep header height the same -->
                                <Icon
                                    v-if="!filter.icon"
                                    icon="simple-icons:owasp"
                                    class="text-transparent"
                                />
                            </div>
                            <div
                                v-if="lockedCategories && lockedCategories.includes(category_name)"
                                class="text-primary"
                            >
                                <Icon icon="material-symbols:lock" /> locked
                            </div>
                        </div>

                        <!-- ADD A LINE FOR EACH ATTRIBUTE IN COLUMN -->
                        <div
                            :class="[
                                filter.type == FilterType.CHECKBOX
                                    ? 'checkbox-group flex row gap-2 items-center'
                                    : 'flex flex-col gap-2 text-sm whitespace-nowrap text-gray-600 min-w-36'
                            ]"
                        >
                            <div
                                v-for="[attribute_name, attribute] in Object.entries(filter.data)"
                                :key="attribute_name"
                                class="flex flex-row gap-2 items-center"
                                :class="[
                                    lockedCategories && lockedCategories.includes(category_name)
                                        ? 'cursor-not-allowed'
                                        : ''
                                ]"
                            >
                                <label
                                    class="flex flex-row items-center"
                                    :class="[
                                        filterState.filterConfig[category_name]['data'][
                                            attribute_name
                                        ]['value'] == true
                                            ? 'cursor-pointer text-primary'
                                            : ''
                                    ]"
                                >
                                    <input
                                        :type="filter.type"
                                        :value="
                                            filterState.filterConfig[category_name]['data'][
                                                attribute_name
                                            ]['value']
                                        "
                                        class="hidden"
                                        @click="optionClick(filter, category_name, attribute_name)"
                                    />
                                    <Icon :icon="apply_style(filter, attribute_name)" />
                                </label>
                                <div
                                    :class="[
                                        filterState.filterConfig[category_name]['data'][
                                            attribute_name
                                        ]['value'] == true
                                            ? 'cursor-pointer text-primary'
                                            : ''
                                    ]"
                                    class="flex flex-row gap-2 items-center w-full"
                                >
                                    {{ attribute.title }}
                                    <div
                                        v-if="options_count[attribute_name] != undefined"
                                        class="flex flex-row gap-2 px-3 py-1 border-r-8 w-fit text-gray-400 text-center text-sm bg-gray-200 items-center"
                                    >
                                        {{ options_count[attribute_name] }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CLOSE BUTTON -->
            <div title="Open settings" class="flex flex-row justify-end gap-2 p-2 -mt-5">
                <Button variant="outline" @click="showFilterModal = false">
                    Close
                </Button>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import Button from '@/shadcn/ui/button/Button.vue';

// Props
defineProps<{
    lockedCategories?: string[];
}>();

const filterState = defineModel<FilterState>('filterState', { default: {} });

// State
const options_count: any = ref({});
const showFilterModal = ref(false);

function apply_style(category: FilterCategory, option_name: string) {
    if (category.type == FilterType.RADIO)
        return category.data[option_name].value ? 'ion:radio-button-on' : 'ion:radio-button-off';
    return category.data[option_name].value
        ? 'material-symbols:check-box-rounded'
        : 'material-symbols:check-box-outline-blank';
}

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
    for (let category in filterState.value.filterConfig) {
        for (let option in filterState.value.filterConfig[category].data) {
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
    for (let category in filterConfig) {
        let categoryObj = filterConfig[category];
        for (let option in categoryObj.data) {
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
