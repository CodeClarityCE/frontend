<script setup lang="ts">
import BoxLoader from '@/base_components/BoxLoader.vue';
import ProjectItem from './ProjectItem.vue';
import NoProjects from './NoProjects.vue';
import type { Project } from '@/codeclarity_components/projects/project.entity';
import { ref, watch, type Ref } from 'vue';
import {
    ProjectsSortInterface,
    ProjectRepository
} from '@/codeclarity_components/projects/project.repository';
import { useAuthStore } from '@/stores/auth';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import ProjectsListHeader from './ProjectsListHeader.vue';
import { useProjectsMainStore } from '@/stores/StateStore';
import { debounce } from '@/utils/searchUtils';
import { Icon } from '@iconify/vue';
import { APIErrors } from '@/utils/api/ApiErrors';
import router from '@/router';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import Pagination from '@/base_components/PaginationComponent.vue';
import Button from '@/shadcn/ui/button/Button.vue';

// Stores
const authStore = useAuthStore();
const viewState = useProjectsMainStore();

// Repositories
const projectsRepository: ProjectRepository = new ProjectRepository();

// State
const projects: Ref<Project[]> = ref([]);
const page: Ref<number> = ref(0);
const entriesPerPage: Ref<number> = ref(10);
const totalEntries: Ref<number> = ref(0);
const totalPages: Ref<number> = ref(0);
const searchKey: Ref<string> = ref('');
const loading: Ref<boolean> = ref(true);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const sortKey: Ref<ProjectsSortInterface> = ref(ProjectsSortInterface.NAME);
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);

async function fetchProjects(refresh: boolean = false) {
    if (!viewState.orgId) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    if (!refresh) loading.value = true;
    if (!refresh) viewState.setReposLoading(false);

    error.value = false;
    errorCode.value = undefined;

    try {
        const resp = await projectsRepository.getProjects({
            orgId: viewState.orgId,
            pagination: {
                page: page.value,
                entries_per_page: entriesPerPage.value
            },
            search: {
                searchKey: searchKey.value
            },
            sort: {
                sortKey: sortKey.value,
                sortDirection: sortDirection.value
            },
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        projects.value = resp.data;
        totalEntries.value = resp.total_entries;
        totalPages.value = resp.total_pages;
        viewState.setProjectsResponse(resp);
    } catch (_err) {
        viewState.setReposFetchError(true);
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
            viewState.setReposFetchErrorCode(_err.error_code);
        }
    } finally {
        if (!refresh) loading.value = false;
        if (!refresh) viewState.setReposLoading(false);
    }
}

watch(searchKey, async () => {
    debounce(async () => {
        page.value = 0;
        await fetchProjects(true);
    }, 250);
});

watch([page, entriesPerPage, sortKey, sortDirection], async () => {
    await fetchProjects(true);
});

fetchProjects();
</script>
<template>
    <template v-if="error">
        <div class="flex flex-row justify-center" style="margin-top: 5vh">
            <div class="flex flex-row gap-2 w-fit" style="font-size: 1.5em">
                <Icon
                    class="icon user-icon h-fit"
                    icon="solar:confounded-square-outline"
                    style="font-size: 2.5em"
                >
                </Icon>
                <div>
                    <div class="flex flex-col gap-5">
                        <div class="flex flex-col gap-1">
                            <div>We failed to retrieve your projects</div>
                            <div class="text-xs">
                                <div v-if="errorCode == APIErrors.NotAuthorized">
                                    You do not have permission to access this page.
                                </div>
                                <div v-else>An error occured while retrieving your projects.</div>
                            </div>
                        </div>
                        <div class="flex flex-row gap-1 items-center flex-wrap">
                            <Button
                                v-if="errorCode != APIErrors.NotAuthorized"
                                @click="fetchProjects(true)"
                            >
                                Try again
                            </Button>
                            <Button @click="router.back()"> Go back </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <template v-else>
        <ProjectsListHeader
            v-model:search-key="searchKey"
            v-model:page-limit-selected="entriesPerPage"
            v-model:sort-direction="sortDirection"
            v-model:sort-key="sortKey"
        />

        <div v-if="loading" class="flex flex-col gap-8">
            <BoxLoader
                v-for="index in 4"
                :key="index"
                :dimensions="{ width: '100%', height: '150px' }"
            />
        </div>

        <div v-else>
            <div v-if="projects.length == 0">
                <NoProjects />
            </div>

            <!-- <div v-else class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"> -->
            <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ProjectItem
                    v-for="project in projects"
                    :key="project.id"
                    :project="project"
                    @on-refresh="fetchProjects(true)"
                />
            </div>
        </div>

        <div class="flex flex-row justify-between">
            <div style="">Showing {{ projects.length }} out of {{ totalEntries }} entries</div>
            <Pagination
                v-model:page="page"
                v-model:nmb-entries-showing="entriesPerPage"
                v-model:nmb-entries-total="totalEntries"
                v-model:total-pages="totalPages"
            />
        </div>
    </template>
</template>
