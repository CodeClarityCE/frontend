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
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
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
    <div class="flex flex-col gap-6 h-full">
        <!-- Enhanced Header with Statistics -->
        <div class="space-y-6">
            <!-- Main Header -->
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="space-y-1">
                    <h1 class="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
                    <p class="text-slate-600">Manage and monitor your project security analyses</p>
                </div>
                <div v-if="orgMetaData && orgMetaData.projects.length > 0">
                    <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
                        <Button
                            class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
                            Add Project
                        </Button>
                    </RouterLink>
                </div>
                <div v-else-if="!orgMetaDataLoading">
                    <Button disabled class="inline-flex items-center gap-2">
                        <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
                        Add Project
                    </Button>
                </div>
                <div v-else>
                    <Skeleton class="h-10 w-32" />
                </div>
            </div>

            <!-- Statistics Cards -->
            <div
                v-if="orgMetaData && orgMetaData.projects.length > 0"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                <!-- Total Projects -->
                <Card class="border-slate-200 hover:border-slate-300 transition-colors">
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium text-slate-600"
                            >Total Projects</CardTitle
                        >
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <Icon icon="solar:folder-bold" class="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-slate-900">
                            {{ orgMetaData.projects.length }}
                        </div>
                        <p class="text-xs text-slate-500 mt-1">Active repositories</p>
                    </CardContent>
                </Card>

                <!-- Completed Analyses -->
                <Card class="border-slate-200 hover:border-slate-300 transition-colors">
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium text-slate-600">Completed</CardTitle>
                        <div class="p-2 bg-emerald-100 rounded-lg">
                            <Icon icon="solar:check-circle-bold" class="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-slate-900">
                            {{ getCompletedAnalysesCount() }}
                        </div>
                        <p class="text-xs text-slate-500 mt-1">Finished analyses</p>
                    </CardContent>
                </Card>

                <!-- Running Analyses -->
                <Card class="border-slate-200 hover:border-slate-300 transition-colors">
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium text-slate-600">Running</CardTitle>
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <Icon icon="solar:refresh-bold" class="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-slate-900">
                            {{ getRunningAnalysesCount() }}
                        </div>
                        <p class="text-xs text-slate-500 mt-1">In progress</p>
                    </CardContent>
                </Card>

                <!-- Last Activity -->
                <Card class="border-slate-200 hover:border-slate-300 transition-colors">
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium text-slate-600"
                            >Last Activity</CardTitle
                        >
                        <div class="p-2 bg-purple-100 rounded-lg">
                            <Icon icon="solar:clock-circle-bold" class="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-slate-900">
                            {{ getLastActivityTime() }}
                        </div>
                        <p class="text-xs text-slate-500 mt-1">Recent analysis</p>
                    </CardContent>
                </Card>
            </div>

            <!-- Loading State for Statistics -->
            <div
                v-else-if="orgMetaDataLoading"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                <Skeleton v-for="i in 4" :key="i" class="h-24 w-full" />
            </div>
        </div>

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
                            class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
                            Add your first project
                        </Button>
                    </RouterLink>
                </template>
            </div>
        </div>
        <ProjectsList v-else />
    </div>
</template>
