<script lang="ts">
import {
    GetRepositoriesSortInterface,
    type GetRepositoriesRequestOptions
} from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import type { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { APIErrors } from '@/utils/api/ApiErrors';
import { debounce } from '@/utils/searchUtils';
import router from '@/router';
import BoxLoader from '@/base_components/BoxLoader.vue';
import SearchBar from '@/base_components/SearchBar.vue';
import ActiveFilterBar from '@/base_components/ActiveFilterBar.vue';
import FilterBox from '@/base_components/UtilitiesFilters.vue';
import { Icon } from '@iconify/vue/dist/iconify.js';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import Pagination from '@/base_components/PaginationComponent.vue';
import type { Repository } from '@/codeclarity_components/projects/project.entity';
import {
    createNewFilterState,
    FilterType,
    type FilterState,
    type ActiveFilter
} from '@/base_components/UtilitiesFilters.vue';
import { ref, watch, type Ref } from 'vue';
import moment from 'moment';
import BlueButton from '@/base_components/buttons/BlueButton.vue';
import SortableTable, { type TableHeader } from '@/base_components/tables/SortableTable.vue';

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

const headers: TableHeader[] = [
    { label: '', key: null },
    { label: 'Repo', key: GetRepositoriesSortInterface.FULLY_QUALIFIED_NAME },
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

// Methods
async function updateSort(key: any) {
    if (key == undefined) return;
    if (key != undefined)
        if (key == sortKey.value) {
            // If we select the same column then we reverse the direction
            sortDirection.value =
                sortDirection.value == SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
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
async function fetchRepos(refresh: boolean = false, forceRefresh: boolean = false) {
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
            bearerToken: authStore.getToken!,
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
    else selectedRepos.value = selectedRepos.value.filter((x) => x.id != repo.id);

    emit('onSelectedReposChange', selectedRepos.value);
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
            <BoxLoader :dimensions="{ width: '100%', height: '50px' }" v-for="i in 4" :key="i" />
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
                        <div class="text-sm" v-if="errorCode">
                            <div
                                v-if="
                                    errorCode == APIErrors.IntegrationInvalidToken ||
                                    errorCode == APIErrors.FailedToRetrieveReposFromProvider ||
                                    errorCode ==
                                        APIErrors.IntegrationIntegrationTokenMissingPermissions ||
                                    errorCode == APIErrors.IntegrationTokenExpired ||
                                    errorCode == APIErrors.IntegrationTokenRetrievalFailed
                                "
                            >
                                The integration is not valid. Please update the integration in the
                                organization page.
                            </div>
                            <div v-else>We encountered an error while processing the request.</div>
                        </div>
                        <div class="text-sm" v-else>
                            <div>We encountered an error while processing the request.</div>
                        </div>
                    </div>
                    <div class="flex flex-row gap-2 flex-wrap items-center">
                        <BlueButton @click="fetchRepos(false, true)">
                            <template #text>Try again</template>
                        </BlueButton>
                        <BlueButton @click="router.back()">
                            <template #text>Go back</template>
                        </BlueButton>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <template v-else-if="!error">
        <!--------------------------------------------------------------------------->
        <!--                             Search and Filter                         -->
        <!--------------------------------------------------------------------------->

        <div class="flex flex-col gap-2 w-full">
            <div class="flex flex-row gap-2 items-center w-full">
                <SearchBar v-model:searchKey="searchKey" :placeholder="placeholder" />

                <FilterBox
                    :filterState="filterState"
                    @onFilterStateChange="setActiveFilters($event)"
                />
            </div>

            <ActiveFilterBar :filterState="filterState"> </ActiveFilterBar>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                              Paginated Repos                          -->
        <!--------------------------------------------------------------------------->
        <Pagination
            v-model:page="page"
            v-model:nmbEntriesShowing="entriesPerPage"
            v-model:nmbEntriesTotal="totalEntries"
            v-model:totalPages="totalPages"
        >
            <template #content>
                <div
                    v-if="totalEntries == 0 && searchKey != ''"
                    class="flex flex-row gap-4 justify-center"
                    style="margin-top: 10px"
                >
                    No repositories logs match your search
                </div>
                <div
                    v-else-if="totalEntries == 0 && searchKey == ''"
                    class="flex flex-row gap-4 justify-center"
                    style="margin-top: 10px"
                >
                    No repositories
                </div>
                <SortableTable
                    v-else-if="totalEntries > 0"
                    :headers="headers"
                    :sort-key="sortKey"
                    :sort-direction="sortDirection"
                    @on-sort-change="updateSort"
                    class="w-full"
                >
                    <template #data>
                        <tr v-for="repo in repos" :key="repo.id">
                            <td>
                                <input
                                    type="checkbox"
                                    :checked="selectedRepos.map((x) => x.id).includes(repo.id)"
                                    @click="selectRepo(repo)"
                                />
                            </td>
                            <td>
                                <div>
                                    {{ repo.fully_qualified_name }}
                                </div>
                            </td>
                            <!-- <td
                                    v-if="
                                        filterState.filterConfig['ImportState'].data[
                                            'only_non_imported'
                                        ].value == false
                                    "
                                > -->
                            <td>
                                <div>
                                    <div
                                        class="general-bubble general-bubble-slim general-bubble-teal"
                                        v-if="repo.imported_already"
                                    >
                                        Imported
                                    </div>
                                    <div
                                        class="general-bubble general-bubble-slim general-bubble-darker"
                                        v-if="!repo.imported_already"
                                    >
                                        Not imported
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    {{ repo.description }}
                                </div>
                            </td>
                            <td>
                                <div>
                                    {{ moment(repo.created_at).format('LL') }}
                                </div>
                            </td>
                        </tr>
                    </template>
                </SortableTable>
            </template>
        </Pagination>
    </template>
</template>

<style scope lang="scss">
@use '@/assets/colors.scss';

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
