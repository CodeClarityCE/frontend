<script setup lang="ts">
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import Pagination from '@/base_components/utilities/PaginationComponent.vue';
import type { Project } from '@/codeclarity_components/projects/project.entity';
import {
    ProjectsSortInterface,
    ProjectRepository
} from '@/codeclarity_components/projects/project.repository';
import router from '@/router';
import Button from '@/shadcn/ui/button/Button.vue';
import { useAuthStore } from '@/stores/auth';
import { useProjectsMainStore } from '@/stores/StateStore';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { debounce } from '@/utils/searchUtils';
import { Icon } from '@iconify/vue';
import { ref, watch, type Ref } from 'vue';
import NoProjects from './NoProjects.vue';
import ProjectItem from './ProjectItemImproved.vue';
import ProjectsListHeader from './ProjectsListHeader.vue';

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

async function fetchProjects(refresh = false) {
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
            <div
                class="flex flex-row gap-4 w-fit max-w-lg bg-white border border-red-200 rounded-xl p-6 shadow-sm"
            >
                <div class="flex-shrink-0">
                    <div class="p-3 bg-red-100 rounded-xl">
                        <Icon class="h-8 w-8 text-red-600" icon="solar:confounded-square-outline" />
                    </div>
                </div>
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <div class="text-lg font-semibold text-theme-black">
                            We failed to retrieve your projects
                        </div>
                        <div class="text-sm text-theme-gray/60">
                            <div v-if="errorCode === APIErrors.NotAuthorized">
                                You do not have permission to access this page.
                            </div>
                            <div v-else>An error occurred while retrieving your projects.</div>
                        </div>
                    </div>
                    <div class="flex flex-row gap-2 items-center flex-wrap">
                        <Button
                            v-if="errorCode !== APIErrors.NotAuthorized"
                            class="bg-theme-primary hover:bg-theme-primary-dark text-white"
                            @click="fetchProjects(true)"
                        >
                            Try again
                        </Button>
                        <Button variant="outline" @click="router.back()"> Go back </Button>
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
            <div v-if="projects.length === 0">
                <NoProjects />
            </div>

            <!-- Projects grid with improved spacing -->
            <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <!-- Add Project CTA Card -->
                <RouterLink :to="{ name: 'projects', params: { page: 'add' } }" class="block">
                    <div
                        class="h-full bg-gradient-to-br from-theme-primary/10 to-theme-primary/5 border-2 border-dashed border-theme-primary/30 rounded-xl p-6 hover:border-theme-primary/50 hover:bg-theme-primary/15 transition-all duration-300 cursor-pointer group min-h-[280px]"
                    >
                        <div class="flex flex-col items-center text-center h-full justify-center">
                            <div
                                class="p-4 bg-theme-primary/20 rounded-full mb-4 group-hover:bg-theme-primary/30 transition-colors"
                            >
                                <Icon
                                    icon="solar:add-circle-bold"
                                    class="h-8 w-8 text-theme-primary"
                                />
                            </div>
                            <div class="text-lg font-semibold text-theme-primary mb-2">
                                Add Project
                            </div>
                            <div class="text-sm text-theme-gray/60">
                                Import a new repository to start security analysis
                            </div>
                        </div>
                    </div>
                </RouterLink>

                <!-- Existing Projects -->
                <ProjectItem
                    v-for="project in projects"
                    :key="project.id"
                    :project="project"
                    @on-refresh="fetchProjects(true)"
                />
            </div>
        </div>

        <div
            class="flex flex-row justify-between items-center mt-8 pt-4 border-t border-theme-primary/10"
        >
            <div class="text-sm text-theme-gray/60">
                Showing {{ projects.length }} out of {{ totalEntries }} entries
            </div>
            <Pagination
                v-model:page="page"
                v-model:nmb-entries-showing="entriesPerPage"
                v-model:nmb-entries-total="totalEntries"
                v-model:total-pages="totalPages"
            />
        </div>
    </template>
</template>
