<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { useStateStore } from '@/stores/state';
import type { ActiveFilter, FilterCategory } from '@/base_components/UtilitiesFilters.vue';
import {
    createNewFilterState,
    FilterType,
    type FilterState
} from '@/base_components/UtilitiesFilters.vue';
import { ref, type Ref } from 'vue';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import type { OrganizationMetaData } from '@/codeclarity_components/organizations/organization.entity';
import Skeleton from '@/shadcn/ui/skeleton/Skeleton.vue';
import { Icon } from '@iconify/vue';
import Button from '@/shadcn/ui/button/Button.vue';

import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const LicenseDist = defineAsyncComponent({
    loader: () => import('./LicenseDist.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

// const ProjectProblemsHeatmap = defineAsyncComponent({
//     loader: () => import('./ProjectProblemsHeatmap.vue'),
//     loadingComponent: LoadingComponent,
//     // Delay before showing the loading component. Default: 200ms.
//     delay: 200,
//     errorComponent: ErrorComponent,
//     // The error component will be displayed if a timeout is
//     // provided and exceeded. Default: Infinity.
//     timeout: 3000
// });

const ExposureOverview = defineAsyncComponent({
    loader: () => import('./ExposureOverview.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const VulnerabilityImpact = defineAsyncComponent({
    loader: () => import('./VulnerabilityImpact.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const CurrentVulns = defineAsyncComponent({
    loader: () => import('./CurrentVulns.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

// const QuickStats = defineAsyncComponent({
//     loader: () => import('./QuickStats.vue'),
//     loadingComponent: LoadingComponent,
//     // Delay before showing the loading component. Default: 200ms.
//     delay: 200,
//     errorComponent: ErrorComponent,
//     // The error component will be displayed if a timeout is
//     // provided and exceeded. Default: Infinity.
//     timeout: 3000
// });

// const ProjectProblems = defineAsyncComponent({
//     loader: () => import('./ProjectProblems.vue'),
//     loadingComponent: LoadingComponent,
//     // Delay before showing the loading component. Default: 200ms.
//     delay: 200,
//     errorComponent: ErrorComponent,
//     // The error component will be displayed if a timeout is
//     // provided and exceeded. Default: Infinity.
//     timeout: 3000
// });

// const AttackVectorDist = defineAsyncComponent({
//     loader: () => import('./AttackVectorsDist.vue'),
//     loadingComponent: LoadingComponent,
//     // Delay before showing the loading component. Default: 200ms.
//     delay: 200,
//     errorComponent: ErrorComponent,
//     // The error component will be displayed if a timeout is
//     // provided and exceeded. Default: Infinity.
//     timeout: 3000
// });

const state = useStateStore();
state.$reset();

state.page = 'home';

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();
const orgRepo: OrgRepository = new OrgRepository();

// Stores
const userStore = useUserStore();
const authStore = useAuthStore();

// State
const activeFilters: Ref<string[]> = ref(['js']);
const { defaultOrg } = storeToRefs(userStore);

const integrationsFilterLoading: Ref<boolean> = ref(false);
const integrationsFilterError: Ref<boolean> = ref(false);
const integrationsFilterErrorCode: Ref<string | undefined> = ref();
const activeIntegrationIds: Ref<string[]> = ref([]);
const orgMetaDataLoading: Ref<boolean> = ref(false);
const orgMetaDataError: Ref<boolean> = ref(false);
const orgMetaDataErrorCode: Ref<string | undefined> = ref();
const orgMetaData: Ref<OrganizationMetaData | undefined> = ref();

const integrationsCategory: FilterCategory = {
    name: 'Integration',
    type: FilterType.CHECKBOX,
    data: {}
};

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

/**
 * When a change to the filters is made, update the state of active filters
 * and fetch the repos matching this filter
 * @param newActiveFilters List of active filters
 */
async function setActiveFilters(newActiveFilters: ActiveFilter[]) {
    activeFilters.value = newActiveFilters.map((activeFilter: ActiveFilter) => activeFilter.option);
    activeIntegrationIds.value.length = 0;
    for (const activeFilter of newActiveFilters) {
        if (activeFilter.category == 'Integration') {
            activeIntegrationIds.value.push(activeFilter.option);
        }
    }
}

/**
 * Fetches the VCS integrations to add them as filter options
 */
async function fetchVcsIntegrations() {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    integrationsFilterError.value = false;
    integrationsFilterErrorCode.value = undefined;
    integrationsFilterLoading.value = true;
    integrationsCategory.data = {};

    try {
        const resp = await integrationRepo.getVCS({
            orgId: defaultOrg.value.id,
            bearerToken: authStore.getToken,
            pagination: {
                page: 0,
                entries_per_page: 100
            },
            handleBusinessErrors: true
        });
        for (const integration of resp.data) {
            let title = '';
            if (integration.integration_provider == IntegrationProvider.GITHUB) {
                title = `Github (${integration.service_domain})`;
            } else if (integration.integration_provider == IntegrationProvider.GITLAB) {
                title = `Gitlab (${integration.service_domain})`;
            } else {
                title = `${integration.integration_provider} (${integration.service_domain})`;
            }
            integrationsCategory.data[integration.id] = {
                title: title,
                value: true
            };
        }
        if (resp.data.length > 0) {
            setActiveFilters(
                filterState.value.addFilterCategory(integrationsCategory, 'Integration')
            );
        }
    } catch (err) {
        integrationsFilterError.value = true;
        if (err instanceof BusinessLogicError) {
            integrationsFilterErrorCode.value = err.error_code;
        }
    } finally {
        integrationsFilterLoading.value = false;
    }
}

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
fetchVcsIntegrations();
</script>
<template>
    <div
        v-if="
            orgMetaDataLoading ||
            orgMetaDataError ||
            (orgMetaData &&
                (orgMetaData.integrations.length == 0 || orgMetaData.projects.length == 0))
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
                <div style="font-size: 1.25rem">Unable to fetch the state of your organizaiton</div>
            </template>
            <template v-else-if="orgMetaData">
                <Icon
                    class="icon"
                    icon="solar:sleeping-square-linear"
                    style="font-size: 5rem"
                ></Icon>
                <div style="font-size: 1.25rem">
                    <div v-if="orgMetaData.integrations.length == 0">
                        You have no integration with a VCS system yet
                    </div>
                    <div v-else-if="orgMetaData.projects.length == 0">
                        You have imported no projects yet
                    </div>
                </div>

                <RouterLink
                    v-if="orgMetaData.integrations.length == 0"
                    :to="{
                        name: 'orgs',
                        params: { orgId: defaultOrg!.id, page: 'integrations', action: 'manage' }
                    }"
                >
                    <Button> Link to Github or Gitlab </Button>
                </RouterLink>
                <RouterLink
                    v-else-if="orgMetaData.projects.length == 0"
                    :to="{ name: 'projects', params: { page: 'add' } }"
                >
                    <Button> <Icon icon="ion:add-sharp" /> Add a project </Button>
                </RouterLink>
            </template>
        </div>
    </div>
    <div v-else class="space-y-6">
        <!-- Dashboard Header -->
        <div class="mb-8">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">Security Dashboard</h1>
                    <p class="text-muted-foreground mt-1">
                        Monitor your organization's security posture and vulnerabilities
                    </p>
                </div>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon icon="solar:calendar-linear" class="h-4 w-4" />
                    <span>Last updated: {{ new Date().toLocaleDateString() }}</span>
                </div>
            </div>

            <!-- Quick Stats Row -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card
                    class="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 hover:shadow-md transition-all duration-300"
                >
                    <CardContent class="p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-700">Critical Issues</p>
                                <p class="text-2xl font-bold text-black">14</p>
                                <p class="text-xs text-gray-600 mt-1">+2 this week</p>
                            </div>
                            <Icon icon="solar:danger-triangle-bold" class="h-8 w-8 text-black" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    class="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-all duration-300"
                >
                    <CardContent class="p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-red-700">High Severity</p>
                                <p class="text-2xl font-bold text-red-900">10</p>
                                <p class="text-xs text-red-600 mt-1">-3 this week</p>
                            </div>
                            <Icon icon="solar:shield-warning-bold" class="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    class="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-all duration-300"
                >
                    <CardContent class="p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-blue-700">Projects Scanned</p>
                                <p class="text-2xl font-bold text-blue-900">24</p>
                                <p class="text-xs text-blue-600 mt-1">All systems</p>
                            </div>
                            <Icon icon="solar:folder-check-bold" class="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    class="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-all duration-300"
                >
                    <CardContent class="p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-green-700">Security Score</p>
                                <p class="text-2xl font-bold text-green-900">7.8</p>
                                <p class="text-xs text-green-600 mt-1">Good standing</p>
                            </div>
                            <Icon icon="solar:shield-check-bold" class="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-9">
            <!-- Vulnerability Exposure Overview - Larger prominent card -->
            <Card
                class="xl:col-span-5 xl:col-start-3 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
                <CardHeader class="pb-4">
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:chart-square-bold" class="h-5 w-5 text-blue-600" />
                        <CardTitle class="text-lg">Vulnerability Exposure Overview</CardTitle>
                    </div>
                    <CardDescription>
                        This chart displays the total severity of vulnerabilities across all your
                        projects.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExposureOverview :integration-ids="activeIntegrationIds"></ExposureOverview>
                </CardContent>
            </Card>

            <!-- Vulnerabilities Summary -->
            <Card
                class="xl:col-start-1 xl:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300 border-l-4 border-l-black"
            >
                <CardHeader class="pb-4">
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:bug-bold" class="h-5 w-5 text-black" />
                        <CardTitle class="text-lg">Vulnerabilities Summary</CardTitle>
                    </div>
                    <CardDescription>
                        Current vulnerabilities affecting your projects.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CurrentVulns :integration-ids="activeIntegrationIds"></CurrentVulns>
                </CardContent>
            </Card>

            <!-- License Distribution -->
            <Card
                class="xl:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300 border-l-4 border-l-purple-500"
            >
                <CardHeader class="pb-4">
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:document-text-bold" class="h-5 w-5 text-purple-600" />
                        <CardTitle class="text-lg">Open Source Licenses</CardTitle>
                    </div>
                    <CardDescription>
                        Comprehensive overview of open source licenses used by your project's
                        dependencies.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LicenseDist :integration-ids="activeIntegrationIds"></LicenseDist>
                </CardContent>
            </Card>

            <!-- Vulnerability Impact Analysis -->
            <Card
                class="xl:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300 border-l-4 border-l-yellow-500"
            >
                <CardHeader class="pb-4">
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:target-bold" class="h-5 w-5 text-yellow-600" />
                        <CardTitle class="text-lg">Impact Analysis</CardTitle>
                    </div>
                    <CardDescription>
                        Average severity of vulnerabilities affecting your projects, providing
                        insight into potential risks.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VulnerabilityImpact
                        :integration-ids="activeIntegrationIds"
                    ></VulnerabilityImpact>
                </CardContent>
            </Card>
        </div>

        <!-- Action Items Section -->
        <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 mt-8">
            <!-- Recent Activity -->
            <Card class="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader class="pb-4">
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:history-bold" class="h-5 w-5 text-gray-600" />
                        <CardTitle class="text-lg">Recent Activity</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="space-y-3">
                        <div
                            class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200"
                        >
                            <Icon icon="solar:danger-triangle-bold" class="h-4 w-4 text-black" />
                            <div class="flex-1">
                                <p class="text-sm font-medium">
                                    New critical vulnerability detected
                                </p>
                                <p class="text-xs text-gray-500">2 hours ago</p>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-100"
                        >
                            <Icon icon="solar:check-circle-bold" class="h-4 w-4 text-green-500" />
                            <div class="flex-1">
                                <p class="text-sm font-medium">5 vulnerabilities resolved</p>
                                <p class="text-xs text-gray-500">1 day ago</p>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border border-blue-100"
                        >
                            <Icon icon="solar:add-circle-bold" class="h-4 w-4 text-blue-500" />
                            <div class="flex-1">
                                <p class="text-sm font-medium">New project added</p>
                                <p class="text-xs text-gray-500">2 days ago</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Recommended Actions -->
            <Card class="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader class="pb-4">
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:lightbulb-bold" class="h-5 w-5 text-yellow-600" />
                        <CardTitle class="text-lg">Recommended Actions</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="space-y-3">
                        <Button
                            variant="outline"
                            class="w-full justify-start h-auto p-3 border-gray-300 hover:bg-gray-50"
                        >
                            <div class="text-left">
                                <p class="font-medium text-black">Address Critical Issues</p>
                                <p class="text-xs text-gray-600">
                                    14 critical vulnerabilities need attention
                                </p>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            class="w-full justify-start h-auto p-3 border-blue-200 hover:bg-blue-50"
                        >
                            <div class="text-left">
                                <p class="font-medium text-blue-700">Update Dependencies</p>
                                <p class="text-xs text-blue-600">
                                    8 packages have security updates available
                                </p>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            class="w-full justify-start h-auto p-3 border-gray-200 hover:bg-gray-50"
                        >
                            <div class="text-left">
                                <p class="font-medium text-gray-700">Review License Compliance</p>
                                <p class="text-xs text-gray-600">Check new license requirements</p>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <!-- Quick Navigation -->
            <Card class="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader class="pb-4">
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:compass-bold" class="h-5 w-5 text-indigo-600" />
                        <CardTitle class="text-lg">Quick Navigation</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-2 gap-2">
                        <Button
                            variant="ghost"
                            class="h-auto p-3 flex flex-col items-center gap-1 hover:bg-blue-50"
                        >
                            <Icon icon="solar:folder-bold" class="h-5 w-5 text-blue-600" />
                            <span class="text-xs">Projects</span>
                        </Button>
                        <Button
                            variant="ghost"
                            class="h-auto p-3 flex flex-col items-center gap-1 hover:bg-purple-50"
                        >
                            <Icon icon="solar:settings-bold" class="h-5 w-5 text-purple-600" />
                            <span class="text-xs">Settings</span>
                        </Button>
                        <Button
                            variant="ghost"
                            class="h-auto p-3 flex flex-col items-center gap-1 hover:bg-green-50"
                        >
                            <Icon icon="solar:chart-2-bold" class="h-5 w-5 text-green-600" />
                            <span class="text-xs">Reports</span>
                        </Button>
                        <Button
                            variant="ghost"
                            class="h-auto p-3 flex flex-col items-center gap-1 hover:bg-orange-50"
                        >
                            <Icon icon="solar:shield-bold" class="h-5 w-5 text-orange-600" />
                            <span class="text-xs">Security</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>

<style scoped>
/* Dashboard animations and enhancements */
.grid {
    animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Staggered animation for cards */
.grid > *:nth-child(1) {
    animation-delay: 0.1s;
}
.grid > *:nth-child(2) {
    animation-delay: 0.2s;
}
.grid > *:nth-child(3) {
    animation-delay: 0.3s;
}
.grid > *:nth-child(4) {
    animation-delay: 0.4s;
}

/* Hover effects for better interactivity */
.hover\:shadow-md:hover {
    transform: translateY(-2px);
    transition: all 0.3s ease;
}

/* Pulse animation for critical alerts */
@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.8;
    }
}

.animate-pulse-subtle {
    animation: pulse 3s infinite;
}

/* Gradient text effect for important metrics */
.gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Custom scrollbar for activity feed */
.activity-scroll::-webkit-scrollbar {
    width: 4px;
}

.activity-scroll::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
}

.activity-scroll::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
}

.activity-scroll::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
