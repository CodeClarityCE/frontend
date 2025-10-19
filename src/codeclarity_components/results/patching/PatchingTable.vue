<script lang="ts" setup>
import SearchBar from '@/base_components/filters/SearchBar.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import { ref, type Ref, watch } from 'vue';
import Patch from './patch/PatchComponent.vue';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import PaginationComponent from '@/base_components/utilities/PaginationComponent.vue';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { PatchedManifestData } from '@/codeclarity_components/results/patching/Patching';
import type { Workspace } from '@/codeclarity_components/results/patching/Patching';
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

const patches: Ref<Workspace> = ref({} as Workspace);
const error: Ref<boolean> = ref(false);
const render: Ref<boolean> = ref(false);
const sortOptionSelected: Ref<string> = ref('patch_type');
const pageLimitSelected: Ref<number> = ref(5);
const selectionPageLimit = [3, 5, 7, 10, 12, 15];
const nmbEntriesShowing = ref(pageLimitSelected.value);
const nmbEntriesTotal: Ref<number> = ref(0);
const pageNumber: Ref<number> = ref(0);
const totalPages: Ref<number> = ref(0);
const searchKey: Ref<string> = ref('');
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);
const sortKey = ref(ProjectsSortInterface.PATCH_TYPE);
const placeholder = 'Search by direct vulnerability or affected dependency name';

const patchedManifestData: Ref<PatchedManifestData> = ref(new PatchedManifestData());

const sortOptions = [{ key: 'patch_type', label: 'Type' }];

watch([pageNumber, pageLimitSelected, sortOptionSelected, sortDirection, pageNumber], () => {
    init();
});

const resultsRepository: ResultsRepository = new ResultsRepository();

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

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();
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
        const res = await resultsRepository.getPatches({
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
                sortKey: sortOptionSelected.value,
                sortDirection: sortDirection.value
            },
            active_filters: '',
            search_key: searchKey.value
        });
        patches.value = res.data;

        render.value = true;
    } catch (_err) {
        console.error('error', _err);
        render.value = false;
        error.value = true;
    }

    try {
        const res = await resultsRepository.getPatchesManifest({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: '.',
            bearerToken: authStore.getToken
        });
        patchedManifestData.value = res.data;
        render.value = true;
    } catch (_err) {
        console.error('error', _err);
        render.value = false;
        error.value = true;
    }
}

init();
</script>

<template>
    <div class="flex flex-col gap-7">
        <!--------------------------------------------------------------------------->
        <!--                            Search and Filters                         -->
        <!--------------------------------------------------------------------------->

        <div style="display: flex; column-gap: 1em">
            <SearchBar v-model:search-key="searchKey" :placeholder="placeholder" />
            <UtilitiesFilters v-model:filter-state="filterState"></UtilitiesFilters>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                           Active Filters list                         -->
        <!--------------------------------------------------------------------------->

        <ActiveFilterBar v-model:filter-state="filterState"></ActiveFilterBar>

        <!--------------------------------------------------------------------------->
        <!--                        Pagination info and controls                   -->
        <!--------------------------------------------------------------------------->
        <UtilitiesSort
            v-model:page-limit-selected="pageLimitSelected"
            v-model:sort-key="sortKey"
            v-model:sort-direction="sortDirection"
            :selection-page-limit="selectionPageLimit"
            :sort-options="sortOptions"
            :showing="nmbEntriesShowing"
            :total="nmbEntriesTotal"
        >
        </UtilitiesSort>

        <!--------------------------------------------------------------------------->
        <!--                                Patch List                             -->
        <!--------------------------------------------------------------------------->

        <div v-if="render" style="margin-bottom: 5rem">
            <div style="display: flex; flex-direction: column; row-gap: 2em">
                <div v-for="(patch, index) in patches.patches" :key="index">
                    <Patch :patch="patch" :name="index" :type="'prod'" />
                </div>
                <div v-for="(patch, index) in patches.dev_patches" :key="index">
                    <Patch :patch="patch" :name="index" :type="'dev'" />
                </div>
            </div>

            <!--------------------------------------------------------------------------->
            <!--                          Pagination buttons                           -->
            <!--------------------------------------------------------------------------->

            <div
                style="
                    color: #484848;
                    font-weight: 400;
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                "
            >
                <div style="">
                    Showing {{ nmbEntriesShowing }} out of {{ nmbEntriesTotal }} entries
                </div>
                <PaginationComponent
                    v-model:page="pageNumber"
                    v-model:nmb-entries-showing="pageLimitSelected"
                    v-model:nmb-entries-total="nmbEntriesTotal"
                    v-model:total-pages="totalPages"
                />
            </div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                            Loading skeleton                           -->
        <!--------------------------------------------------------------------------->

        <div v-if="!render">
            <div style="display: flex; flex-direction: column; row-gap: 10px">
                <BoxLoader
                    v-for="index in 3"
                    :key="index"
                    :dimensions="{ width: '100%', height: '150px' }"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.patched-manifest {
    counter-reset: linecount;
}

.patched-manifest .line {
    position: relative;
    display: flex;
}

.patched-manifest .line::before {
    display: inline-block;
    counter-increment: linecount;
    content: counter(linecount) '.';
    width: 50px;
}
</style>
