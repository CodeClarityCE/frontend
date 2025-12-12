<script lang="ts">
import SortableTable, {
    type TableHeader
} from '@/base_components/data-display/tables/SortableTable.vue';
import ActiveFilterBar from '@/base_components/filters/ActiveFilterBar.vue';
import SearchBar from '@/base_components/filters/SearchBar.vue';
import FilterBox, {
    createNewFilterState,
    FilterType,
    type FilterState,
    type ActiveFilter
} from '@/base_components/filters/UtilitiesFilters.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import Pagination from '@/base_components/utilities/PaginationComponent.vue';
import {
    GetRepositoriesSortInterface,
    type GetRepositoriesRequestOptions
} from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import type { Repository } from '@/codeclarity_components/projects/project.entity';
import router from '@/router';
import { Badge } from '@/shadcn/ui/badge';
import Button from '@/shadcn/ui/button/Button.vue';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import type { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import { formatDate } from '@/utils/dateUtils';
import { debounce } from '@/utils/searchUtils';
import { Icon } from '@iconify/vue';
import { ref, watch, type Ref } from 'vue';

// Types
export interface GetReposOptions extends GetRepositoriesRequestOptions {
    forceRefresh: boolean;
    activeFilters: string[];
}
</script>
<script lang="ts" setup>
// Props
const props = defineProps<{
    integration: string;
    getRepos: (options: GetRepositoriesRequestOptions) => Promise<PaginatedResponse<Repository>>;
}>();

// Emits
const emit = defineEmits<{
    (e: 'onForceRefresh'): void;
    (e: 'onSelectedReposChange', selected: Repository[]): void;
}>();

// Table headers + sort definition
const sortKey: Ref<string> = ref(GetRepositoriesSortInterface.CREATED);
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);
const selectAll: Ref<boolean> = ref(false);

const headers: TableHeader[] = [
    { label: '', key: null },
    { label: 'Repository', key: GetRepositoriesSortInterface.FULLY_QUALIFIED_NAME },
    { label: 'Import State', key: GetRepositoriesSortInterface.IMPORTED },
    { label: 'Description', key: GetRepositoriesSortInterface.DESCRIPTION },
    { label: 'Created Date', key: GetRepositoriesSortInterface.CREATED }
];

// Filters
const filterState: FilterState = createNewFilterState({
    ImportState: {
        name: 'Import State',
        type: FilterType.RADIO,
        data: {
            only_non_imported: {
                title: 'Only not already imported repos',
                value: true
            },
            imported_and_non_imported: {
                title: 'Both',
                value: false
            }
        }
    }
});

// Stores
const authStore = useAuthStore();
const userStore = useUserStore();

// State
const placeholder = 'Search repositories...';
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const repos: Ref<Repository[] | undefined> = ref();
const page = ref(0);
const entriesPerPage = ref(10);
const totalEntries = ref(0);
const totalPages = ref(0);
const searchKey = ref('');
const activeFilters: Ref<string[]> = ref(['only_non_imported']);
const selectedRepos: Ref<Repository[]> = ref([]);

// Watchers
watch([activeFilters, repos], () => {
    updateSelectAllState();
});

// Methods
async function updateSort(key: any) {
    if (key === undefined) return;
    if (key !== undefined)
        if (key === sortKey.value) {
            // If we select the same column then we reverse the direction
            sortDirection.value =
                sortDirection.value === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
        } else {
            // Default direction
            sortDirection.value = SortDirection.DESC;
        }
    sortKey.value = key;
    await fetchRepos(true);
}

watch([page, entriesPerPage], async () => {
    await fetchRepos(true);
});

/**
 * Fetch the repos of the integration
 * @param refresh Whether it is a refresh, if no shows the loading skeleton
 * @param forceRefresh Whether it is a force refresh, if yes refetches the repos from the vcs provider
 */
async function fetchRepos(refresh = false, forceRefresh = false) {
    if (!userStore.getDefaultOrg) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    error.value = false;
    errorCode.value = undefined;

    if (!refresh) loading.value = true;
    try {
        const resp = await props.getRepos({
            orgId: userStore.getDefaultOrg.id,
            integrationId: props.integration,
            forceRefresh: forceRefresh,
            activeFilters: activeFilters.value,
            pagination: {
                page: page.value,
                entries_per_page: entriesPerPage.value
            },
            search: {
                searchKey: searchKey.value
            },
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            sort: {
                sortKey: sortKey.value,
                sortDirection: sortDirection.value
            }
        });
        repos.value = resp.data;
        totalEntries.value = resp.total_entries;
        totalPages.value = resp.total_pages;
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        if (!refresh) loading.value = false;
    }
}

/**
 * Adds a repo selected by the user to the tally of selected repos and emits the new list
 * @param repo The selected repo
 */
function selectRepo(repo: Repository) {
    const selectedReposIds = selectedRepos.value.map((x) => x.id);

    if (!selectedReposIds.includes(repo.id)) selectedRepos.value.push(repo);
    else selectedRepos.value = selectedRepos.value.filter((x) => x.id !== repo.id);

    // Update select all checkbox state
    updateSelectAllState();
    emit('onSelectedReposChange', selectedRepos.value);
}

function toggleSelectAll() {
    if (selectAll.value) {
        // Deselect all
        selectedRepos.value = [];
        selectAll.value = false;
    } else {
        // Select all non-imported repos (or all if showing both)
        const availableRepos =
            repos.value?.filter((repo) =>
                activeFilters.value.includes('only_non_imported') ? !repo.imported_already : true
            ) || [];
        selectedRepos.value = [...availableRepos];
        selectAll.value = true;
    }
    emit('onSelectedReposChange', selectedRepos.value);
}

function updateSelectAllState() {
    const availableRepos =
        repos.value?.filter((repo) =>
            activeFilters.value.includes('only_non_imported') ? !repo.imported_already : true
        ) || [];

    if (availableRepos.length === 0) {
        selectAll.value = false;
        return;
    }

    const selectedIds = selectedRepos.value.map((repo) => repo.id);
    const allSelected = availableRepos.every((repo) => selectedIds.includes(repo.id));
    selectAll.value = allSelected;
}

/**
 * When a change to the filters is made, update the state of active filters
 * and fetch the repos matching this filter
 * @param newActiveFilters List of active filters
 */
async function setActiveFilters(newActiveFilters: ActiveFilter[]) {
    activeFilters.value = newActiveFilters.map((activeFilter: ActiveFilter) => activeFilter.option);
    await fetchRepos(true);
}

watch([searchKey], async () => {
    debounce(async () => {
        await fetchRepos(true);
    }, 250);
});

/**
 * Clears the selected repos
 */
async function clearSelection() {
    selectedRepos.value = [];
}

async function init() {
    await fetchRepos(false, false);
}

init();

defineExpose({
    fetchRepos,
    clearSelection
});
</script>

<template>
    <!--------------------------------------------------------------------------->
    <!--                            Loading skeleton                           -->
    <!--------------------------------------------------------------------------->
    <div v-if="loading">
        <div class="flex flex-col gap-4">
            <BoxLoader v-for="i in 4" :key="i" :dimensions="{ width: '100%', height: '50px' }" />
        </div>
    </div>

    <!--------------------------------------------------------------------------->
    <!--                             Fetch repos error                         -->
    <!--------------------------------------------------------------------------->
    <template v-else-if="error">
        <div class="flex flex-row gap-2">
            <Icon class="text-5xl text-black" icon="solar:confounded-square-outline"></Icon>
            <div>
                <div class="flex flex-col gap-5">
                    <div class="flex flex-col gap-2">
                        <div>Failed to fetch repositories from the integration</div>
                        <div v-if="errorCode" class="text-sm">
                            <div
                                v-if="
                                    errorCode === APIErrors.IntegrationInvalidToken ||
                                    errorCode === APIErrors.FailedToRetrieveReposFromProvider ||
                                    errorCode ==
                                        APIErrors.IntegrationIntegrationTokenMissingPermissions ||
                                    errorCode === APIErrors.IntegrationTokenExpired ||
                                    errorCode === APIErrors.IntegrationTokenRetrievalFailed
                                "
                            >
                                The integration is not valid. Please update the integration in the
                                organization page.
                            </div>
                            <div v-else>We encountered an error while processing the request.</div>
                        </div>
                        <div v-else class="text-sm">
                            <div>We encountered an error while processing the request.</div>
                        </div>
                    </div>
                    <div class="flex flex-row gap-2 flex-wrap items-center">
                        <Button @click="fetchRepos(false, true)"> Try again </Button>
                        <Button @click="router.back()"> Go back </Button>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <template v-else-if="!error">
        <!--------------------------------------------------------------------------->
        <!--                             Search and Filter                         -->
        <!--------------------------------------------------------------------------->

        <div class="flex flex-col gap-4 w-full">
            <div class="flex flex-row gap-2 items-center w-full">
                <SearchBar
                    v-model:search-key="searchKey"
                    :placeholder="placeholder"
                    class="flex-1"
                />

                <FilterBox
                    :filter-state="filterState"
                    @on-filter-state-change="setActiveFilters($event)"
                />
            </div>

            <ActiveFilterBar :filter-state="filterState"> </ActiveFilterBar>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                              Paginated Repos                          -->
        <!--------------------------------------------------------------------------->
        <Pagination
            v-model:page="page"
            v-model:nmb-entries-showing="entriesPerPage"
            v-model:nmb-entries-total="totalEntries"
            v-model:total-pages="totalPages"
        >
            <template #content>
                <div
                    v-if="totalEntries === 0 && searchKey !== ''"
                    class="flex flex-col items-center gap-4 py-16"
                >
                    <Icon icon="lucide:search-x" class="text-6xl text-gray-300" />
                    <div class="text-lg text-gray-500">No repositories match your search</div>
                    <div class="text-sm text-gray-400">
                        Try adjusting your search terms or filters
                    </div>
                </div>
                <div
                    v-else-if="totalEntries === 0 && searchKey === ''"
                    class="flex flex-col items-center gap-4 py-16"
                >
                    <Icon icon="octicon:repo-24" class="text-6xl text-gray-300" />
                    <div class="text-lg text-gray-500">No repositories found</div>
                    <div class="text-sm text-gray-400">
                        Try adjusting your filters or check your integration settings
                    </div>
                </div>
                <template v-else-if="totalEntries > 0">
                    <!-- No selectable repositories message -->
                    <div
                        v-if="
                            repos &&
                            repos.filter((repo: any) =>
                                activeFilters.includes('only_non_imported')
                                    ? !repo.imported_already
                                    : true
                            ).length === 0
                        "
                        class="bg-green-50 border border-green-200 rounded-lg p-6 mb-4 text-center"
                    >
                        <Icon
                            icon="lucide:check-circle"
                            class="w-12 h-12 text-green-600 mx-auto mb-3"
                        />
                        <h3 class="font-semibold text-green-900 mb-2">
                            All repositories are already imported!
                        </h3>
                        <p class="text-green-700 text-sm">
                            All available repositories from this integration have been successfully
                            imported.
                        </p>
                    </div>

                    <!-- Select All Section - Only show if there are selectable repos -->
                    <div
                        v-else-if="
                            repos &&
                            repos.filter((repo: any) =>
                                activeFilters.includes('only_non_imported')
                                    ? !repo.imported_already
                                    : true
                            ).length > 0
                        "
                        class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4"
                    >
                        <div class="flex items-center gap-3">
                            <input
                                v-model="selectAll"
                                type="checkbox"
                                class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                @click="toggleSelectAll()"
                            />
                            <div class="flex-1">
                                <div class="font-medium text-gray-700 text-sm">
                                    Select All Repositories
                                </div>
                                <div class="text-gray-600 text-xs mt-1">
                                    {{
                                        repos?.filter((repo: any) =>
                                            activeFilters.includes('only_non_imported')
                                                ? !repo.imported_already
                                                : true
                                        ).length || 0
                                    }}
                                    repositories available for selection
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Selection Summary Bar -->
                    <div
                        v-if="selectedRepos.length > 0"
                        class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <Icon icon="lucide:check-circle-2" class="text-blue-600" />
                                <div>
                                    <div class="font-medium text-blue-900 text-sm">
                                        {{ selectedRepos.length }}
                                        {{
                                            selectedRepos.length === 1
                                                ? 'repository'
                                                : 'repositories'
                                        }}
                                        selected
                                    </div>
                                    <div class="text-blue-700 text-xs mt-1">Ready for import</div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                class="text-blue-700 border-blue-300 hover:bg-blue-100"
                                @click="
                                    selectedRepos = [];
                                    updateSelectAllState();
                                "
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </div>

                    <!-- Table Section -->
                    <div
                        class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                    >
                        <SortableTable
                            :headers="headers"
                            :sort-key="sortKey"
                            :sort-direction="sortDirection"
                            class="w-full modern-table"
                            @on-sort-change="updateSort"
                        >
                            <template #data>
                                <!-- Repository Rows -->
                                <tr
                                    v-for="repo in repos"
                                    :key="repo.id"
                                    class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150"
                                    :class="{
                                        'bg-blue-50/30 border-blue-200': selectedRepos
                                            .map((x: any) => x.id)
                                            .includes(repo.id)
                                    }"
                                >
                                    <td class="p-4">
                                        <input
                                            type="checkbox"
                                            :checked="
                                                selectedRepos
                                                    .map((x: any) => x.id)
                                                    .includes(repo.id)
                                            "
                                            class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                            @click="selectRepo(repo)"
                                        />
                                    </td>
                                    <td class="p-4">
                                        <div class="flex items-center gap-3">
                                            <Icon
                                                icon="octicon:repo-16"
                                                class="text-gray-600 text-lg flex-shrink-0"
                                            />
                                            <div class="flex flex-col min-w-0">
                                                <div class="font-medium text-gray-900 truncate">
                                                    {{ repo.fully_qualified_name }}
                                                </div>
                                                <div class="text-sm text-gray-500 mt-1">
                                                    {{ repo.visibility }}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="p-4">
                                        <Badge
                                            v-if="repo.imported_already"
                                            variant="default"
                                            class="bg-green-100 text-green-800 hover:bg-green-100"
                                        >
                                            <Icon icon="lucide:check-circle" class="w-3 h-3 mr-1" />
                                            Imported
                                        </Badge>
                                        <Badge
                                            v-else
                                            variant="secondary"
                                            class="bg-gray-100 text-gray-600 hover:bg-gray-100"
                                        >
                                            <Icon icon="lucide:clock" class="w-3 h-3 mr-1" />
                                            Not imported
                                        </Badge>
                                    </td>
                                    <td class="p-4">
                                        <div class="text-gray-700 text-sm line-clamp-2 max-w-md">
                                            {{ repo.description || 'No description available' }}
                                        </div>
                                    </td>
                                    <td class="p-4">
                                        <div class="text-gray-600 text-sm">
                                            {{ formatDate(repo.created_at, 'MMM DD, YYYY') }}
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </SortableTable>
                    </div>
                </template>
            </template>
        </Pagination>
    </template>
</template>

<style scope lang="scss">
.line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
}

/* Modern table styling overrides */
.modern-table {
    border-radius: 0 !important;

    /* Override header styling */
    :deep(th) {
        background-color: #f8fafc !important;
        border-bottom: 2px solid #e2e8f0 !important;
        padding: 12px 16px !important;
        font-weight: 600 !important;
        color: #374151 !important;
        font-size: 13px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
    }

    /* Override header content styling */
    :deep(.header-sortable) {
        height: auto !important;
        padding: 0 !important;
        background: none !important;
        border: none !important;
        font-weight: 600 !important;
    }

    /* Override active header styling */
    :deep(.header-sortable-active) {
        background-color: #e2e8f0 !important;
    }

    /* Override sort arrow colors */
    :deep(.header-sortable > div:nth-child(2)) {
        color: #6b7280 !important;
    }

    /* Override table body styling */
    :deep(tbody tr) {
        border-bottom: 1px solid #f1f5f9 !important;
    }

    :deep(tbody tr:hover) {
        background-color: #f9fafb !important;
    }

    /* Remove default table borders */
    :deep(.stylized_table_with_dividers th > div) {
        border-bottom: none !important;
    }

    /* Override table cell padding */
    :deep(tbody td) {
        padding: 0 !important;
    }
}

.general-bubble {
    display: flex;
    flex-direction: row;
    column-gap: 5px;
    padding: 7px;
    padding-left: 12px;
    padding-right: 12px;
    border-radius: 15px;
    width: fit-content;
    font-weight: 400;
    color: rgb(80, 80, 80);
    text-align: center;
    font-size: 0.9em;
    background-color: #f4f8ff;
    align-items: center;
}

.general-bubble-darker {
    background-color: #ececec;
}

.general-bubble-slim {
    padding-left: 9px;
    padding-right: 9px;
}

.general-bubble-green {
    background-color: #dbf5d2;
    color: #69b751;
}

.general-bubble-blue {
    background-color: #cfd3f7;
    color: #292f75;
}

.general-bubble-yellow {
    background-color: #eae793;
    color: #87830b;
}

.general-bubble-orange {
    background-color: #ecdea9;
    color: #87740b;
}

.general-bubble-red {
    background-color: #ffdcdc;
    color: rgb(170, 109, 109);
}

.general-bubble-teal {
    background-color: #9dccd0;
    color: #015b63;
}
</style>
