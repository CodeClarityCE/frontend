<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { useStateStore } from '@/stores/state';
import type { ActiveFilter, FilterCategory } from '@/common_components/UtilitiesFilters.vue';
import {
    createNewFilterState,
    FilterType,
    type FilterState
} from '@/common_components/UtilitiesFilters.vue';
import { ref, type Ref } from 'vue';
import { IntegrationProvider } from '@/repositories/types/entities/Integrations';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { IntegrationsRepository } from '@/repositories/IntegrationsRepository';
import { BusinessLogicError } from '@/repositories/BaseRepository';
import { OrgRepository } from '@/repositories/OrganizationRepository';
import type { OrganizationMetaData } from '@/repositories/types/entities/Organization';
import Skeleton from '@/shadcn/ui/skeleton/Skeleton.vue';
import { Icon } from '@iconify/vue/dist/iconify.js';
import Button from '@/shadcn/ui/button/Button.vue';

import ErrorComponent from '@/common_components/ErrorComponent.vue';
import LoadingComponent from '@/common_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const LicenseDist = defineAsyncComponent({
    loader: () => import('@/views/dashboard/LicenseDist.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const ProjectProblemsHeatmap = defineAsyncComponent({
    loader: () => import('@/views/dashboard/ProjectProblemsHeatmap.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const ExposureOverview = defineAsyncComponent({
    loader: () => import('@/views/dashboard/ExposureOverview.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const CIAImpact = defineAsyncComponent({
    loader: () => import('@/views/dashboard/CIAImpact.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const CurrentVulns = defineAsyncComponent({
    loader: () => import('@/views/dashboard/CurrentVulns.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const QuickStats = defineAsyncComponent({
    loader: () => import('@/views/dashboard/QuickStats.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const ProjectProblems = defineAsyncComponent({
    loader: () => import('@/views/dashboard/ProjectProblems.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const AttackVectorDist = defineAsyncComponent({
    loader: () => import('@/views/dashboard/AttackVectorsDist.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            <Skeleton class="h-[16.6%] w-full min-h-32" v-for="i in 6" :key="i" />
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
                        params: { orgId: defaultOrg!.id, page: 'integrations', action: 'add' }
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
    <div class="space-y-4" v-else>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <QuickStats class="col-span-2" :integration-ids="activeIntegrationIds" />
            <Card class="col-span-2 flex flex-col">
                <CardHeader>
                    <CardTitle>Current vulnerabilities</CardTitle>
                    <CardDescription>
                        Current vulnerabilities affecting your projects.
                    </CardDescription>
                </CardHeader>
                <CardContent class="flex items-center justify-center flex-grow">
                    <CurrentVulns :integration-ids="activeIntegrationIds"></CurrentVulns>
                </CardContent>
            </Card>
            <Card class="col-span-2 flex flex-col">
                <CardHeader>
                    <CardTitle>Open source license distribution</CardTitle>
                    <CardDescription>
                        Overview of the open source licenses within your dependencies.
                    </CardDescription>
                </CardHeader>
                <CardContent class="flex items-center justify-center flex-grow">
                    <LicenseDist :integration-ids="activeIntegrationIds"></LicenseDist>
                </CardContent>
            </Card>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
            <Card class="col-span-4 flex flex-col">
                <CardHeader>
                    <CardTitle>Overall Exposure</CardTitle>
                    <CardDescription> Overall exposure of your projects. </CardDescription>
                </CardHeader>
                <CardContent class="flex items-center justify-center flex-grow">
                    <ExposureOverview :integration-ids="activeIntegrationIds"></ExposureOverview>
                </CardContent>
            </Card>
            <Card class="col-span-2 flex flex-col">
                <CardHeader>
                    <CardTitle>Potential CIA Impact</CardTitle>
                    <CardDescription> Potential CIA Impact on your projects. </CardDescription>
                </CardHeader>
                <CardContent class="flex items-center justify-center flex-grow">
                    <CIAImpact :integration-ids="activeIntegrationIds"></CIAImpact>
                </CardContent>
            </Card>
            <Card class="col-span-2 flex flex-col">
                <CardHeader>
                    <CardTitle>Attack Vectors</CardTitle>
                    <CardDescription>
                        Indicates the channels through which vulnerabilities in your projects can be
                        exploited.
                    </CardDescription>
                </CardHeader>
                <CardContent class="flex items-center justify-center flex-grow">
                    <AttackVectorDist :integration-ids="activeIntegrationIds"></AttackVectorDist>
                </CardContent>
            </Card>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card class="col-span-3 flex flex-col">
                <CardHeader>
                    <CardTitle> Project Problems </CardTitle>
                    <CardDescription> Quickly identify problematic projects. </CardDescription>
                </CardHeader>
                <CardContent class="flex items-center justify-center flex-grow">
                    <ProjectProblems :integration-ids="activeIntegrationIds"></ProjectProblems>
                </CardContent>
            </Card>
            <Card class="col-span-2 flex flex-col">
                <CardHeader>
                    <CardTitle> Project Problems </CardTitle>
                    <CardDescription> Quickly identify problematic projects. </CardDescription>
                </CardHeader>
                <CardContent class="flex items-center justify-center flex-grow">
                    <ProjectProblemsHeatmap
                        :integration-ids="activeIntegrationIds"
                    ></ProjectProblemsHeatmap>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
