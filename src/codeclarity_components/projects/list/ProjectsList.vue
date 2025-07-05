<script lang="ts" setup>
import { onBeforeUnmount, ref, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import ProjectsList from './components/ProjectsList.vue';
import { useProjectsMainStore } from '@/stores/StateStore';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { useAuthStore } from '@/stores/auth';
import type { OrganizationMetaData } from '@/codeclarity_components/organizations/organization.entity';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { Button } from '@/shadcn/ui/button';
import Skeleton from '@/shadcn/ui/skeleton/Skeleton.vue';
import { Card, CardContent } from '@/shadcn/ui/card';
import { AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';

// Repositories
const orgRepo: OrgRepository = new OrgRepository();

// Stores
const viewState = useProjectsMainStore();
const userStore = useUserStore();
const authStore = useAuthStore();

// globalState.$reset();
// globalState.page = 'projects';

viewState.setOrgId(userStore.getUser!.default_org.id);

// State
const orgMetaDataLoading: Ref<boolean> = ref(false);
const orgMetaDataError: Ref<boolean> = ref(false);
const orgMetaDataErrorCode: Ref<string | undefined> = ref();
const orgMetaData: Ref<OrganizationMetaData | undefined> = ref();
const { defaultOrg } = storeToRefs(userStore);

onBeforeUnmount(() => {
    viewState.$reset();
});

/**
 * Fetches meta data about an org
 * including amongst other things: whether an integration was added, a projects was addded, and anlyses have been started
 */
async function fetchOrgMetaData() {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    orgMetaDataError.value = false;
    orgMetaDataErrorCode.value = undefined;
    orgMetaDataLoading.value = true;

    try {
        const resp = await orgRepo.getOrgMetaData({
            orgId: defaultOrg.value.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        orgMetaData.value = resp;
    } catch (err) {
        orgMetaDataError.value = true;
        if (err instanceof BusinessLogicError) {
            orgMetaDataErrorCode.value = err.error_code;
        }
    } finally {
        orgMetaDataLoading.value = false;
    }
}

fetchOrgMetaData();

// Helper functions for statistics
function getCompletedAnalysesCount(): number {
    if (!orgMetaData.value?.projects) return 0;
    return orgMetaData.value.projects.reduce((count, project) => {
        if (!project.analyses) return count;
        return (
            count +
            project.analyses.filter(
                (analysis) =>
                    analysis.status === AnalysisStatus.COMPLETED ||
                    analysis.status === AnalysisStatus.FINISHED
            ).length
        );
    }, 0);
}

function getRunningAnalysesCount(): number {
    if (!orgMetaData.value?.projects) return 0;
    return orgMetaData.value.projects.reduce((count, project) => {
        if (!project.analyses) return count;
        return (
            count +
            project.analyses.filter(
                (analysis) =>
                    analysis.status === AnalysisStatus.STARTED ||
                    analysis.status === AnalysisStatus.REQUESTED ||
                    analysis.status === AnalysisStatus.ONGOING ||
                    analysis.status === AnalysisStatus.UPDATING_DB
            ).length
        );
    }, 0);
}

function getLastActivityTime(): string {
    if (!orgMetaData.value?.projects) return 'N/A';

    let latestDate: Date | null = null;

    orgMetaData.value.projects.forEach((project) => {
        if (!project.analyses) return;
        project.analyses.forEach((analysis) => {
            const createdDate = new Date(analysis.created_on);
            if (!latestDate || createdDate > latestDate) {
                latestDate = createdDate;
            }
        });
    });

    if (!latestDate) return 'N/A';

    const now = new Date();
    const diffInHours = Math.floor(
        (now.getTime() - (latestDate as Date).getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;
    return '30d+';
}
</script>
<template>
    <div class="space-y-8 relative min-h-screen">
        <!-- Dashboard Header -->
        <div class="mb-10">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1
                        class="text-4xl font-bold tracking-tight bg-gradient-to-r from-black via-theme-gray to-theme-primary bg-clip-text text-transparent"
                    >
                        Projects
                    </h1>
                    <p class="text-slate-600 mt-2 text-lg">
                        Manage and monitor your project security analyses
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <div
                        class="flex items-center gap-2 text-sm text-slate-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm"
                    >
                        <Icon icon="solar:calendar-linear" class="h-4 w-4 text-theme-primary" />
                        <span>Last updated: {{ new Date().toLocaleDateString() }}</span>
                    </div>
                    <div v-if="orgMetaData && orgMetaData.projects.length > 0">
                        <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
                            <Button
                                class="bg-theme-primary hover:bg-theme-primary-dark text-white shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                            >
                                <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
                                Add Project
                            </Button>
                        </RouterLink>
                    </div>
                    <div v-else-if="!orgMetaDataLoading">
                        <Button
                            disabled
                            class="bg-slate-300 text-slate-500 flex items-center gap-2"
                        >
                            <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
                            Add Project
                        </Button>
                    </div>
                    <div v-else>
                        <Skeleton class="h-10 w-32" />
                    </div>
                </div>
            </div>

            <!-- Enhanced Quick Stats Row -->
            <div
                v-if="orgMetaData && orgMetaData.projects.length > 0"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
                <!-- Total Projects -->
                <Card
                    class="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:border-theme-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-black/5 to-theme-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    ></div>
                    <CardContent class="p-6 relative">
                        <div class="flex items-center justify-between">
                            <div class="space-y-2">
                                <p
                                    class="text-sm font-semibold text-slate-600 uppercase tracking-wide"
                                >
                                    Total Projects
                                </p>
                                <p class="text-3xl font-bold text-black">
                                    {{ orgMetaData.projects.length }}
                                </p>
                                <div class="flex items-center gap-1 text-xs">
                                    <Icon
                                        icon="solar:folder-linear"
                                        class="h-3 w-3 text-theme-primary"
                                    />
                                    <span class="text-theme-primary font-medium"
                                        >Active repositories</span
                                    >
                                </div>
                            </div>
                            <div
                                class="p-3 bg-black/10 rounded-full group-hover:bg-black/20 transition-colors duration-300"
                            >
                                <Icon icon="solar:folder-bold" class="h-8 w-8 text-black" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Completed Analyses -->
                <Card
                    class="group relative overflow-hidden bg-gradient-to-br from-theme-primary/10 to-theme-primary/20 border-theme-primary/30 hover:border-theme-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-theme-primary/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    ></div>
                    <CardContent class="p-6 relative">
                        <div class="flex items-center justify-between">
                            <div class="space-y-2">
                                <p class="text-sm font-semibold text-black uppercase tracking-wide">
                                    Completed
                                </p>
                                <p class="text-3xl font-bold text-black">
                                    {{ getCompletedAnalysesCount() }}
                                </p>
                                <div class="flex items-center gap-1 text-xs">
                                    <Icon
                                        icon="solar:check-circle-linear"
                                        class="h-3 w-3 text-theme-primary"
                                    />
                                    <span class="text-theme-primary font-medium"
                                        >Finished analyses</span
                                    >
                                </div>
                            </div>
                            <div
                                class="p-3 bg-theme-primary/10 rounded-full group-hover:bg-theme-primary/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:check-circle-bold"
                                    class="h-8 w-8 text-theme-primary"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Running Analyses -->
                <Card
                    class="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:border-theme-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    ></div>
                    <CardContent class="p-6 relative">
                        <div class="flex items-center justify-between">
                            <div class="space-y-2">
                                <p
                                    class="text-sm font-semibold text-slate-600 uppercase tracking-wide"
                                >
                                    Running
                                </p>
                                <p class="text-3xl font-bold text-black">
                                    {{ getRunningAnalysesCount() }}
                                </p>
                                <div class="flex items-center gap-1 text-xs">
                                    <Icon
                                        icon="solar:refresh-linear"
                                        class="h-3 w-3 text-theme-primary"
                                    />
                                    <span class="text-theme-primary font-medium">In progress</span>
                                </div>
                            </div>
                            <div
                                class="p-3 bg-black/10 rounded-full group-hover:bg-black/20 transition-colors duration-300"
                            >
                                <Icon icon="solar:refresh-bold" class="h-8 w-8 text-black" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Last Activity -->
                <Card
                    class="group relative overflow-hidden bg-gradient-to-br from-theme-primary/10 to-theme-primary/20 border-theme-primary/30 hover:border-theme-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-theme-primary/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    ></div>
                    <CardContent class="p-6 relative">
                        <div class="flex items-center justify-between">
                            <div class="space-y-2">
                                <p class="text-sm font-semibold text-black uppercase tracking-wide">
                                    Last Activity
                                </p>
                                <p class="text-3xl font-bold text-black">
                                    {{ getLastActivityTime() }}
                                </p>
                                <div class="flex items-center gap-1 text-xs">
                                    <Icon
                                        icon="solar:clock-circle-linear"
                                        class="h-3 w-3 text-theme-primary"
                                    />
                                    <span class="text-theme-primary font-medium"
                                        >Recent analysis</span
                                    >
                                </div>
                            </div>
                            <div
                                class="p-3 bg-theme-primary/10 rounded-full group-hover:bg-theme-primary/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:clock-circle-bold"
                                    class="h-8 w-8 text-theme-primary"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Loading State for Statistics -->
            <div
                v-else-if="orgMetaDataLoading"
                class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
            >
                <Skeleton v-for="i in 4" :key="i" class="h-24 w-full" />
            </div>
        </div>

        <!-- Empty state or error state -->
        <div
            v-if="
                orgMetaDataLoading ||
                orgMetaDataError ||
                (orgMetaData && orgMetaData.projects.length == 0)
            "
            class="h-full relative"
        >
            <div class="flex flex-col gap-4 h-full">
                <div class="flex flex-row gap-5">
                    <Skeleton class="h-14 w-10/12" />
                    <Skeleton class="h-14 w-2/12" />
                </div>
                <Skeleton v-for="i in 6" :key="i" class="h-[16.6%] w-full min-h-32" />
            </div>
            <div
                class="flex flex-col gap-4 items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg"
            >
                <template v-if="orgMetaDataError">
                    <Icon
                        class="icon"
                        icon="solar:confounded-square-linear"
                        style="font-size: 5rem"
                    ></Icon>
                    <div style="font-size: 1.25rem">
                        Unable to fetch the state of your organizaiton
                    </div>
                </template>
                <template v-else-if="orgMetaData">
                    <Icon
                        class="icon"
                        icon="solar:sleeping-square-linear"
                        style="font-size: 5rem"
                    ></Icon>
                    <div style="font-size: 1.25rem">
                        <div v-if="orgMetaData.projects.length == 0">You have no projects yet</div>
                    </div>

                    <RouterLink
                        v-if="orgMetaData.projects.length == 0"
                        :to="{ name: 'projects', params: { page: 'add' } }"
                    >
                        <Button
                            class="bg-theme-primary hover:bg-theme-primary-dark text-white shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                        >
                            <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
                            Add your first project
                        </Button>
                    </RouterLink>
                </template>
            </div>
        </div>

        <!-- Projects List -->
        <div v-else class="space-y-6">
            <ProjectsList />
        </div>
    </div>
</template>
