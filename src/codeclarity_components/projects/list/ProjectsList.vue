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
import { AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';
import StatCard from '@/base_components/ui/cards/StatCard.vue';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';

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
        <!-- Page Header -->
        <div class="mb-10">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 class="text-4xl font-bold tracking-tight text-gray-900">Projects</h1>
                    <p class="text-gray-600 mt-2 text-lg">
                        Manage and monitor your project security analyses
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <div
                        class="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm"
                    >
                        <Icon icon="solar:calendar-linear" class="h-4 w-4 text-theme-primary" />
                        <span>Last updated: {{ new Date().toLocaleDateString() }}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        class="hidden sm:flex items-center gap-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                        :disabled="orgMetaDataLoading"
                        @click="fetchOrgMetaData"
                    >
                        <Icon
                            :icon="
                                orgMetaDataLoading ? 'solar:loading-linear' : 'solar:refresh-linear'
                            "
                            class="h-4 w-4"
                            :class="{ 'animate-spin': orgMetaDataLoading }"
                        />
                        {{ orgMetaDataLoading ? 'Refreshing...' : 'Refresh' }}
                    </Button>
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
                        <Button disabled class="bg-gray-300 text-gray-500 flex items-center gap-2">
                            <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
                            Add Project
                        </Button>
                    </div>
                    <div v-else>
                        <Skeleton class="h-10 w-32" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Stats Row -->
        <div
            v-if="orgMetaData && orgMetaData.projects.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
            <!-- Total Projects -->
            <StatCard
                label="Total Projects"
                :value="orgMetaData.projects.length"
                icon="solar:folder-bold"
                variant="default"
                subtitle="Active repositories"
                subtitle-icon="solar:folder-linear"
            />

            <!-- Completed Analyses -->
            <StatCard
                label="Completed"
                :value="getCompletedAnalysesCount()"
                icon="solar:check-circle-bold"
                variant="success"
                subtitle="Finished analyses"
                subtitle-icon="solar:check-circle-linear"
            />

            <!-- Running Analyses -->
            <StatCard
                label="Running"
                :value="getRunningAnalysesCount()"
                icon="solar:refresh-bold"
                variant="primary"
                subtitle="In progress"
                subtitle-icon="solar:refresh-linear"
            />

            <!-- Last Activity -->
            <StatCard
                label="Last Activity"
                :value="getLastActivityTime()"
                icon="solar:clock-circle-bold"
                variant="primary"
                subtitle="Recent analysis"
                subtitle-icon="solar:clock-circle-linear"
            />
        </div>

        <!-- Loading State for Statistics -->
        <div
            v-else-if="orgMetaDataLoading"
            class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
            <Skeleton v-for="i in 4" :key="i" class="h-24 w-full" />
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
                <InfoCard
                    v-if="orgMetaDataError"
                    title="Unable to Load Organization Data"
                    description="There was an error fetching your organization's state. Please try refreshing the page."
                    icon="solar:confounded-square-linear"
                    variant="danger"
                />
                <InfoCard
                    v-else-if="orgMetaData && orgMetaData.integrations.length == 0"
                    title="No VCS Integration Yet"
                    description="You have no integration with a VCS system yet"
                    icon="solar:sleeping-square-linear"
                    variant="default"
                >
                    <template #actions>
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: {
                                    orgId: orgMetaData.id,
                                    page: 'integrations',
                                    action: 'manage'
                                }
                            }"
                        >
                            <Button class="bg-theme-primary hover:bg-theme-primary-dark text-white">
                                Link to Github or Gitlab
                            </Button>
                        </RouterLink>
                    </template>
                </InfoCard>
                <InfoCard
                    v-else-if="orgMetaData && orgMetaData.projects.length == 0"
                    title="No Projects Yet"
                    description="Get started by adding your first project to begin security analysis."
                    icon="solar:sleeping-square-linear"
                    variant="default"
                >
                    <template #actions>
                        <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
                            <Button
                                class="bg-theme-primary hover:bg-theme-primary-dark text-white flex items-center gap-2"
                            >
                                <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
                                Add Project
                            </Button>
                        </RouterLink>
                    </template>
                </InfoCard>
            </div>
        </div>

        <!-- Projects List -->
        <div v-else class="space-y-6">
            <ProjectsList />

            <!-- Floating Add Button for mobile -->
            <RouterLink
                :to="{ name: 'projects', params: { page: 'add' } }"
                class="fixed bottom-6 right-6 z-50 md:hidden"
            >
                <Button
                    size="lg"
                    class="h-14 w-14 rounded-full bg-theme-primary hover:bg-theme-primary-dark text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <Icon icon="solar:add-circle-bold" class="h-6 w-6" />
                </Button>
            </RouterLink>
        </div>
    </div>
</template>
