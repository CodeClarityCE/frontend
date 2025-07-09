<script lang="ts" setup>
import { ref, type Ref, watch, computed } from 'vue';
import SearchBar from '@/base_components/filters/SearchBar.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import { Icon } from '@iconify/vue';

import LicenseComponent from './LicenseComponent.vue';
// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { License } from '@/codeclarity_components/results/licenses/License';
import PaginationComponent from '@/base_components/utilities/PaginationComponent.vue';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import UtilitiesSort from '@/base_components/utilities/UtilitiesSort.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import UtilitiesFilters, {
    createNewFilterState,
    FilterType,
    type FilterState
} from '@/base_components/filters/UtilitiesFilters.vue';
import ActiveFilterBar from '@/base_components/filters/ActiveFilterBar.vue';
import { ProjectsSortInterface } from '@/codeclarity_components/projects/project.repository';

export interface Props {
    analysisID?: string;
    projectID?: string;
}
const props = withDefaults(defineProps<Props>(), {
    analysisID: '',
    projectID: ''
});

const render = ref(false);
const sortDirection = ref(SortDirection.DESC);
const sortKey = ref(ProjectsSortInterface.LICENSE_TYPE);
const pageLimitSelected = ref(10);
const selectionPageLimit = [5, 10, 20, 30, 40, 50, 75, 100];
const nmbEntriesShowing = ref(pageLimitSelected.value);
const matchingItemsCount = ref(0);
const nmbEntriesTotal = ref(0);
const pageNumber = ref(0);
const totalPages = ref(10);
const filterApplied = ref(false);
const searchKey = ref('');
const placeholder = 'Search by licenses';
// const licenses_used = ref([]);
const licensesUsed: Ref<Array<License>> = ref([]);

const sortByOptions = [
    { key: 'type', label: 'Type' },
    { key: 'dep_count', label: 'Nmb. of deps' },
    { key: 'id', label: 'License Id' }
];

// Store setup
const resultsRepository: ResultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

watch([pageNumber, pageLimitSelected, sortKey, sortDirection, searchKey], () => {
    init();
});

// Filters
const filterState: Ref<FilterState> = ref(
    createNewFilterState({
        ImportState: {
            name: 'Language',
            type: FilterType.RADIO,
            data: {
                js: {
                    title: 'JavaScript',
                    value: true
                }
            }
        }
    })
);

async function init() {
    if (!userStore.getDefaultOrg) {
        throw new Error('No default org selected');
    }
    if (!authStore.getToken) {
        throw new Error('No default org selected');
    }
    if (props.projectID == '' || props.analysisID == '') {
        return;
    }
    try {
        const res = await resultsRepository.getLicenses({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: '.',
            bearerToken: authStore.getToken,
            pagination: {
                page: pageNumber.value,
                entries_per_page: pageLimitSelected.value
            },
            sort: {
                sortKey: sortKey.value,
                sortDirection: sortDirection.value
            },
            active_filters: '',
            search_key: searchKey.value
        });
        licensesUsed.value = res.data;
        pageNumber.value = res.page;
        pageLimitSelected.value = res.entries_per_page;
        nmbEntriesShowing.value = res.entry_count;
        matchingItemsCount.value = res.matching_count;
        nmbEntriesTotal.value = res.total_entries;
        totalPages.value = res.total_pages;
        render.value = true;
    } catch (error) {
        console.error('error', error);
    }
}

// Computed statistics for dashboard
const uniqueLicenseCount = computed(() => {
    return licensesUsed.value.length;
});

const totalDependencies = computed(() => {
    return licensesUsed.value.reduce(
        (total, license) => total + (license.deps_using_license?.length || 0),
        0
    );
});

const copyleftLicenseCount = computed(() => {
    const copyleftLicenses = ['GPL', 'LGPL', 'AGPL', 'MPL', 'EPL', 'CDDL', 'EUPL'];
    return licensesUsed.value.filter((license) =>
        copyleftLicenses.some(
            (copyleft) =>
                license.name?.toUpperCase().includes(copyleft) ||
                license.id?.toUpperCase().includes(copyleft)
        )
    ).length;
});

const permissiveLicenseCount = computed(() => {
    const permissiveLicenses = ['MIT', 'BSD', 'Apache', 'ISC', 'Zlib'];
    return licensesUsed.value.filter((license) =>
        permissiveLicenses.some(
            (permissive) =>
                license.name?.toUpperCase().includes(permissive) ||
                license.id?.toUpperCase().includes(permissive)
        )
    ).length;
});

init();
</script>

<template>
    <div class="container py-6 mx-auto space-y-6">
        <!-- Header Section -->
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-theme-black">Licenses</h2>
                    <p class="text-sm text-theme-gray mt-1">
                        License compliance and usage analysis for your project dependencies
                    </p>
                </div>
                <div class="flex items-center gap-2 text-sm text-theme-gray">
                    <Icon icon="tabler:license" class="w-4 h-4 text-theme-primary" />
                    <span>{{ nmbEntriesTotal }} total licenses</span>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-white border rounded-lg p-3 shadow-sm">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:file-certificate" class="w-4 h-4 text-theme-primary" />
                        <span class="text-xs text-theme-gray uppercase tracking-wide">Unique</span>
                    </div>
                    <div class="text-lg font-semibold text-theme-black">
                        {{ uniqueLicenseCount }}
                    </div>
                </div>

                <div class="bg-white border rounded-lg p-3 shadow-sm">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:package" class="w-4 h-4 text-theme-primary" />
                        <span class="text-xs text-theme-gray uppercase tracking-wide"
                            >Dependencies</span
                        >
                    </div>
                    <div class="text-lg font-semibold text-theme-black">
                        {{ totalDependencies }}
                    </div>
                </div>

                <div class="bg-white border rounded-lg p-3 shadow-sm">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:shield-check" class="w-4 h-4 text-theme-primary" />
                        <span class="text-xs text-theme-gray uppercase tracking-wide"
                            >Permissive</span
                        >
                    </div>
                    <div class="text-lg font-semibold text-theme-black">
                        {{ permissiveLicenseCount }}
                    </div>
                </div>

                <div class="bg-white border rounded-lg p-3 shadow-sm">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:shield-exclamation" class="w-4 h-4 text-theme-primary" />
                        <span class="text-xs text-theme-gray uppercase tracking-wide"
                            >Copyleft</span
                        >
                    </div>
                    <div class="text-lg font-semibold text-theme-black">
                        {{ copyleftLicenseCount }}
                    </div>
                </div>
            </div>

            <!-- License Information Legend -->
            <div
                class="bg-gradient-to-r from-gray-50 to-green-50 rounded-lg p-4 border border-theme-primary/20"
            >
                <h3 class="text-sm font-medium text-theme-black mb-3 flex items-center gap-2">
                    <Icon icon="tabler:info-circle" class="w-4 h-4 text-theme-primary" />
                    License Types & Compliance Information
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div class="space-y-2">
                        <div class="font-medium text-theme-black">License Categories</div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-theme-primary rounded"></div>
                                <span class="text-theme-gray">Permissive (MIT, BSD, Apache)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-yellow-500 rounded"></div>
                                <span class="text-theme-gray">Copyleft (GPL, LGPL, MPL)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-theme-black rounded"></div>
                                <span class="text-theme-gray">Proprietary & Other</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="font-medium text-theme-black">Compliance Status</div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <Icon
                                    icon="tabler:check-circle"
                                    class="w-3 h-3 text-theme-primary"
                                />
                                <span class="text-theme-gray">Compliant</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon
                                    icon="tabler:alert-triangle"
                                    class="w-3 h-3 text-yellow-600"
                                />
                                <span class="text-theme-gray">Review Required</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="font-medium text-theme-black">Usage Rights</div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:building" class="w-3 h-3 text-theme-primary" />
                                <span class="text-theme-gray">Commercial Use</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:git-fork" class="w-3 h-3 text-theme-primary" />
                                <span class="text-theme-gray">Distribution Rights</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col gap-4">
            <div class="flex gap-4">
                <SearchBar v-model:search-key="searchKey" :placeholder="placeholder" />
                <UtilitiesFilters v-model:filter-state="filterState"></UtilitiesFilters>
            </div>

            <!--------------------------------------------------------------------------->
            <!--                           Active Filters list                         -->
            <!--------------------------------------------------------------------------->

            <ActiveFilterBar v-model:filter-state="filterState"></ActiveFilterBar>

            <UtilitiesSort
                v-model:page-limit-selected="pageLimitSelected"
                v-model:sort-key="sortKey"
                v-model:sort-direction="sortDirection"
                :selection-page-limit="selectionPageLimit"
                :sort-options="sortByOptions"
                :showing="nmbEntriesShowing"
                :total="nmbEntriesTotal"
            >
            </UtilitiesSort>
        </div>

        <!-- Licenses List -->
        <div v-if="render" class="flex flex-col gap-y-8">
            <div v-for="(license, index) in licensesUsed" :key="index">
                <LicenseComponent
                    :key="license.id"
                    :license="license"
                    :last="false"
                    :analysis-i-d="analysisID"
                    :project-i-d="projectID"
                />
            </div>

            <!-- No Results Messages -->
            <div v-if="matchingItemsCount == 0 && filterApplied && render" class="mt-5">
                <div style="text-align: center">No licenses match the filter</div>
            </div>
            <div v-if="matchingItemsCount == 0 && !filterApplied && render" class="mt-5">
                <div style="text-align: center">No licenses</div>
            </div>

            <!-- Pagination -->
            <div class="flex items-center justify-between border-t border-gray-200 py-4">
                <div class="flex items-center gap-4 text-sm text-theme-gray">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:file-text" class="w-4 h-4 text-theme-primary" />
                        <span>Page {{ pageNumber + 1 }} of {{ totalPages }}</span>
                    </div>
                    <div class="text-xs">
                        Showing
                        {{ Math.min(pageNumber * pageLimitSelected + 1, nmbEntriesTotal) }}-{{
                            Math.min((pageNumber + 1) * pageLimitSelected, nmbEntriesTotal)
                        }}
                        of {{ nmbEntriesTotal }}
                    </div>
                </div>

                <PaginationComponent
                    v-model:page="pageNumber"
                    v-model:nmb-entries-showing="pageLimitSelected"
                    v-model:nmb-entries-total="nmbEntriesTotal"
                    v-model:total-pages="totalPages"
                />
            </div>
        </div>

        <!-- Loading skeleton -->
        <div v-else>
            <div class="flex flex-col gap-2">
                <BoxLoader
                    v-for="index in 4"
                    :key="index"
                    :dimensions="{ width: '100%', height: '100px' }"
                />
            </div>
        </div>
    </div>
</template>
