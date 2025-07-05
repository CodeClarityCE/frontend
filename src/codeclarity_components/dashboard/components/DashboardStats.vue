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
                    <Button class="bg-theme-primary hover:bg-theme-primary-dark text-white">
                        Link to Github or Gitlab
                    </Button>
                </RouterLink>
                <RouterLink
                    v-else-if="orgMetaData.projects.length == 0"
                    :to="{ name: 'projects', params: { page: 'add' } }"
                >
                    <Button class="bg-theme-primary hover:bg-theme-primary-dark text-white">
                        <Icon icon="ion:add-sharp" /> Add a project
                    </Button>
                </RouterLink>
            </template>
        </div>
    </div>
    <div v-else class="space-y-8 relative min-h-screen">
        <!-- Dashboard Header -->
        <div class="mb-10">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1
                        class="text-4xl font-bold tracking-tight bg-gradient-to-r from-black via-theme-gray to-theme-primary bg-clip-text text-transparent"
                    >
                        Security Dashboard
                    </h1>
                    <p class="text-slate-600 mt-2 text-lg">
                        Monitor your organization's security posture and vulnerabilities
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <div
                        class="flex items-center gap-2 text-sm text-slate-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm"
                    >
                        <Icon icon="solar:calendar-linear" class="h-4 w-4 text-theme-primary" />
                        <span>Last updated: {{ new Date().toLocaleDateString() }}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        class="hidden sm:flex items-center gap-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                    >
                        <Icon icon="solar:refresh-linear" class="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            <!-- Enhanced Quick Stats Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                                    Critical Issues
                                </p>
                                <p class="text-3xl font-bold text-black">14</p>
                                <div class="flex items-center gap-1 text-xs">
                                    <Icon icon="solar:arrow-up-linear" class="h-3 w-3 text-black" />
                                    <span class="text-black font-medium">+2 this week</span>
                                </div>
                            </div>
                            <div
                                class="p-3 bg-black/10 rounded-full group-hover:bg-black/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:danger-triangle-bold"
                                    class="h-8 w-8 text-black"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                    High Severity
                                </p>
                                <p class="text-3xl font-bold text-black">10</p>
                                <div class="flex items-center gap-1 text-xs">
                                    <Icon
                                        icon="solar:arrow-down-linear"
                                        class="h-3 w-3 text-theme-primary"
                                    />
                                    <span class="text-theme-primary font-medium">-3 this week</span>
                                </div>
                            </div>
                            <div
                                class="p-3 bg-theme-primary/10 rounded-full group-hover:bg-theme-primary/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:shield-warning-bold"
                                    class="h-8 w-8 text-theme-primary"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                    Projects Scanned
                                </p>
                                <p class="text-3xl font-bold text-black">24</p>
                                <div class="flex items-center gap-1 text-xs">
                                    <Icon
                                        icon="solar:check-circle-linear"
                                        class="h-3 w-3 text-theme-primary"
                                    />
                                    <span class="text-theme-primary font-medium">All systems</span>
                                </div>
                            </div>
                            <div
                                class="p-3 bg-black/10 rounded-full group-hover:bg-black/20 transition-colors duration-300"
                            >
                                <Icon icon="solar:folder-check-bold" class="h-8 w-8 text-black" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                    Security Score
                                </p>
                                <p class="text-3xl font-bold text-black">7.8</p>
                                <div class="flex items-center gap-1 text-xs">
                                    <Icon
                                        icon="solar:shield-check-linear"
                                        class="h-3 w-3 text-theme-primary"
                                    />
                                    <span class="text-theme-primary font-medium"
                                        >Good standing</span
                                    >
                                </div>
                            </div>
                            <div
                                class="p-3 bg-theme-primary/10 rounded-full group-hover:bg-theme-primary/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:shield-check-bold"
                                    class="h-8 w-8 text-theme-primary"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <!-- Enhanced Main Dashboard Grid -->
        <div class="grid gap-8 lg:grid-cols-12">
            <!-- Vulnerability Exposure Overview - Enhanced prominent card -->
            <Card
                class="lg:col-span-8 shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-l-theme-primary bg-white/70 backdrop-blur-sm hover:-translate-y-1 group"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
                <CardHeader class="pb-6 relative">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-theme-primary/10 rounded-lg group-hover:bg-theme-primary/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:chart-square-bold"
                                    class="h-6 w-6 text-theme-primary"
                                />
                            </div>
                            <div>
                                <CardTitle class="text-xl font-bold text-black"
                                    >Vulnerability Exposure Overview</CardTitle
                                >
                                <CardDescription class="text-slate-600 mt-1">
                                    Total severity of vulnerabilities across all your projects
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent class-name="relative">
                    <ExposureOverview :integration-ids="activeIntegrationIds"></ExposureOverview>
                </CardContent>
            </Card>

            <!-- Vulnerabilities Summary - Enhanced -->
            <Card
                class="lg:col-span-4 shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-l-black bg-white/70 backdrop-blur-sm hover:-translate-y-1 group"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-black/5 to-theme-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
                <CardHeader class="pb-6 relative">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-black/10 rounded-lg group-hover:bg-black/20 transition-colors duration-300"
                            >
                                <Icon icon="solar:bug-bold" class="h-6 w-6 text-black" />
                            </div>
                            <div>
                                <CardTitle class="text-lg font-bold text-black"
                                    >Vulnerabilities Summary</CardTitle
                                >
                                <CardDescription class="text-slate-600 mt-1">
                                    Current threats affecting your projects
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent class-name="relative">
                    <CurrentVulns :integration-ids="activeIntegrationIds"></CurrentVulns>
                </CardContent>
            </Card>

            <!-- License Distribution - Enhanced -->
            <Card
                class="lg:col-span-6 shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-l-theme-primary bg-white/70 backdrop-blur-sm hover:-translate-y-1 group"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-theme-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
                <CardHeader class="pb-6 relative">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-theme-primary/10 rounded-lg group-hover:bg-theme-primary/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:document-text-bold"
                                    class="h-6 w-6 text-theme-primary"
                                />
                            </div>
                            <div>
                                <CardTitle class="text-lg font-bold text-black"
                                    >Open Source Licenses</CardTitle
                                >
                                <CardDescription class="text-slate-600 mt-1">
                                    License compliance across your dependencies
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent class-name="relative">
                    <LicenseDist :integration-ids="activeIntegrationIds"></LicenseDist>
                </CardContent>
            </Card>

            <!-- Vulnerability Impact Analysis - Enhanced -->
            <Card
                class="lg:col-span-6 shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-l-black bg-white/70 backdrop-blur-sm hover:-translate-y-1 group"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-black/5 to-theme-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
                <CardHeader class="pb-6 relative">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-black/10 rounded-lg group-hover:bg-black/20 transition-colors duration-300"
                            >
                                <Icon icon="solar:target-bold" class="h-6 w-6 text-black" />
                            </div>
                            <div>
                                <CardTitle class="text-lg font-bold text-black"
                                    >Impact Analysis</CardTitle
                                >
                                <CardDescription class="text-slate-600 mt-1">
                                    Risk assessment and severity insights
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent class-name="relative">
                    <VulnerabilityImpact
                        :integration-ids="activeIntegrationIds"
                    ></VulnerabilityImpact>
                </CardContent>
            </Card>
        </div>

        <!-- Enhanced Action Items Section -->
        <div class="grid gap-8 lg:grid-cols-3 mt-12">
            <!-- Recent Activity - Enhanced -->
            <Card
                class="shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-l-black bg-white/70 backdrop-blur-sm hover:-translate-y-1 group"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
                <CardHeader class="pb-6 relative">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-black/10 rounded-lg group-hover:bg-black/20 transition-colors duration-300"
                            >
                                <Icon icon="solar:history-bold" class="h-5 w-5 text-black" />
                            </div>
                            <CardTitle class="text-lg font-bold text-black"
                                >Recent Activity</CardTitle
                            >
                        </div>
                    </div>
                </CardHeader>
                <CardContent class-name="relative">
                    <div class="space-y-4 max-h-80 overflow-y-auto activity-scroll">
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-slate-900 rounded-lg">
                                <Icon
                                    icon="solar:danger-triangle-bold"
                                    class="h-4 w-4 text-white"
                                />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">
                                    New critical vulnerability detected
                                </p>
                                <p class="text-xs text-slate-500 mt-1">
                                    CVE-2025-1234 in dependencies
                                </p>
                                <p class="text-xs text-slate-400 mt-2">2 hours ago</p>
                            </div>
                        </div>
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-emerald-500 rounded-lg">
                                <Icon icon="solar:check-circle-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">
                                    5 vulnerabilities resolved
                                </p>
                                <p class="text-xs text-slate-500 mt-1">
                                    Security patches applied successfully
                                </p>
                                <p class="text-xs text-slate-400 mt-2">1 day ago</p>
                            </div>
                        </div>
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-blue-500 rounded-lg">
                                <Icon icon="solar:add-circle-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">
                                    New project added
                                </p>
                                <p class="text-xs text-slate-500 mt-1">
                                    Frontend-v2 repository scanned
                                </p>
                                <p class="text-xs text-slate-400 mt-2">2 days ago</p>
                            </div>
                        </div>
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-amber-500 rounded-lg">
                                <Icon icon="solar:refresh-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">
                                    Security scan completed
                                </p>
                                <p class="text-xs text-slate-500 mt-1">
                                    Full system audit finished
                                </p>
                                <p class="text-xs text-slate-400 mt-2">3 days ago</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Recommended Actions - Enhanced -->
            <Card
                class="shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-l-theme-primary bg-white/70 backdrop-blur-sm hover:-translate-y-1 group"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
                <CardHeader class="pb-6 relative">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-theme-primary/10 rounded-lg group-hover:bg-theme-primary/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:lightbulb-bold"
                                    class="h-5 w-5 text-theme-primary"
                                />
                            </div>
                            <CardTitle class="text-lg font-bold text-black"
                                >Recommended Actions</CardTitle
                            >
                        </div>
                    </div>
                </CardHeader>
                <CardContent class-name="relative">
                    <div class="space-y-4 max-h-80 overflow-y-auto">
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-slate-900 rounded-lg">
                                <Icon
                                    icon="solar:danger-triangle-bold"
                                    class="h-4 w-4 text-white"
                                />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">
                                    Address Critical Issues
                                </p>
                                <p class="text-xs text-slate-500 mt-1">
                                    14 critical vulnerabilities need immediate attention
                                </p>
                            </div>
                        </div>
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-blue-500 rounded-lg">
                                <Icon icon="solar:refresh-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">
                                    Update Dependencies
                                </p>
                                <p class="text-xs text-slate-500 mt-1">
                                    8 packages have security updates available
                                </p>
                            </div>
                        </div>
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 hover:border-purple-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-purple-500 rounded-lg">
                                <Icon icon="solar:document-text-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">
                                    Review License Compliance
                                </p>
                                <p class="text-xs text-slate-500 mt-1">
                                    Check new license requirements
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Enhanced Quick Navigation -->
            <Card
                class="shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-l-theme-primary bg-white/70 backdrop-blur-sm hover:-translate-y-1 group"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
                <CardHeader class="pb-6 relative">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-theme-primary/10 rounded-lg group-hover:bg-theme-primary/20 transition-colors duration-300"
                            >
                                <Icon
                                    icon="solar:compass-bold"
                                    class="h-5 w-5 text-theme-primary"
                                />
                            </div>
                            <CardTitle class="text-lg font-bold text-black"
                                >Quick Navigation</CardTitle
                            >
                        </div>
                    </div>
                </CardHeader>
                <CardContent class-name="relative">
                    <div class="space-y-4 max-h-80 overflow-y-auto">
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-blue-500 rounded-lg">
                                <Icon icon="solar:folder-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">Projects</p>
                                <p class="text-xs text-slate-500 mt-1">Manage your repositories</p>
                            </div>
                        </div>
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 hover:border-purple-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-purple-500 rounded-lg">
                                <Icon icon="solar:settings-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">Settings</p>
                                <p class="text-xs text-slate-500 mt-1">
                                    Configure your preferences
                                </p>
                            </div>
                        </div>
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-emerald-500 rounded-lg">
                                <Icon icon="solar:chart-2-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">Reports</p>
                                <p class="text-xs text-slate-500 mt-1">View detailed analytics</p>
                            </div>
                        </div>
                        <div
                            class="flex items-start gap-4 p-4 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-all duration-200 cursor-pointer"
                        >
                            <div class="flex-shrink-0 p-2 bg-orange-500 rounded-lg">
                                <Icon icon="solar:shield-bold" class="h-4 w-4 text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-900">Security</p>
                                <p class="text-xs text-slate-500 mt-1">Security configurations</p>
                            </div>
                        </div>
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

/* Enhanced dashboard animations and styling */
.grid {
    animation: fadeInUp 0.8s ease-out forwards;
    opacity: 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Staggered animation for cards with improved timing */
.grid > *:nth-child(1) {
    animation-delay: 0.1s;
}
.grid > *:nth-child(2) {
    animation-delay: 0.15s;
}
.grid > *:nth-child(3) {
    animation-delay: 0.2s;
}
.grid > *:nth-child(4) {
    animation-delay: 0.25s;
}
.grid > *:nth-child(5) {
    animation-delay: 0.3s;
}
.grid > *:nth-child(6) {
    animation-delay: 0.35s;
}

/* Enhanced card hover effects */
.hover\:-translate-y-1:hover {
    transform: translateY(-4px);
}

.group:hover .group-hover\:opacity-100 {
    opacity: 1;
}

/* Enhanced shadows */
.shadow-sm {
    box-shadow:
        0 1px 2px 0 rgba(0, 0, 0, 0.05),
        0 1px 3px 0 rgba(0, 0, 0, 0.08);
}

.hover\:shadow-xl:hover {
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04),
        0 0 0 1px rgba(255, 255, 255, 0.5);
}

/* Backdrop blur enhancement */
.backdrop-blur-sm {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.bg-white\/70 {
    background-color: rgba(255, 255, 255, 0.7);
}

/* Custom scrollbar styling */
.activity-scroll::-webkit-scrollbar {
    width: 6px;
}

.activity-scroll::-webkit-scrollbar-track {
    background: rgba(241, 245, 249, 0.5);
    border-radius: 8px;
}

.activity-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
    border-radius: 8px;
    transition: background 0.3s ease;
}

.activity-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #94a3b8, #64748b);
}

/* Enhanced button animations */
.transition-all {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Gradient text improvements */
.bg-clip-text {
    -webkit-background-clip: text;
    background-clip: text;
}

.text-transparent {
    -webkit-text-fill-color: transparent;
}

/* Icon consistency and animations */
.h-4.w-4,
.h-5.w-5,
.h-6.w-6,
.h-8.w-8 {
    flex-shrink: 0;
    transition:
        transform 0.2s ease,
        color 0.2s ease;
}

/* Group hover effects for nested elements */
.group\/button:hover .group-hover\/button\:bg-slate-800 {
    background-color: rgb(30 41 59);
}

.group\/button:hover .group-hover\/button\:bg-blue-600 {
    background-color: rgb(37 99 235);
}

.group\/button:hover .group-hover\/button\:bg-purple-600 {
    background-color: rgb(147 51 234);
}

.group\/nav:hover .group-hover\/nav\:bg-blue-200 {
    background-color: rgb(191 219 254);
}

.group\/nav:hover .group-hover\/nav\:bg-purple-200 {
    background-color: rgb(233 213 255);
}

.group\/nav:hover .group-hover\/nav\:bg-emerald-200 {
    background-color: rgb(167 243 208);
}

.group\/nav:hover .group-hover\/nav\:bg-orange-200 {
    background-color: rgb(254 215 170);
}

/* Enhanced responsive design */
@media (max-width: 768px) {
    .grid {
        gap: 1rem;
    }

    .space-y-8 > * + * {
        margin-top: 1.5rem;
    }
}

/* Performance optimizations */
.group {
    will-change: transform;
}

.transition-all,
.transition-colors,
.transition-opacity,
.transition-shadow {
    will-change: auto;
}

/* Focus states for accessibility */
.focus\:ring-2:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* Loading state animations */
@keyframes shimmer {
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: calc(200px + 100%) 0;
    }
}

.animate-shimmer {
    animation: shimmer 2s infinite linear;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    background-size: 200px 100%;
}

/* Improved color transitions */
.text-slate-400,
.text-slate-500,
.text-slate-600,
.text-slate-700,
.text-slate-900 {
    transition: color 0.2s ease;
}
</style>
