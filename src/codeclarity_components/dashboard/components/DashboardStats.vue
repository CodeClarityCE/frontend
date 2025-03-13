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
import { Icon } from '@iconify/vue/dist/iconify.js';
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
    <div v-if="
        orgMetaDataLoading ||
        orgMetaDataError ||
        (orgMetaData &&
            (orgMetaData.integrations.length == 0 || orgMetaData.projects.length == 0))
    " class="h-full relative">
        <div class="flex flex-col gap-4 h-full">
            <div class="flex flex-row gap-5">
                <Skeleton class="h-14 w-10/12" />
                <Skeleton class="h-14 w-2/12" />
            </div>
            <Skeleton class="h-[16.6%] w-full min-h-32" v-for="i in 6" :key="i" />
        </div>
        <div
            class="flex flex-col gap-4 items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg">
            <template v-if="orgMetaDataError">
                <Icon class="icon" icon="solar:confounded-square-linear" style="font-size: 5rem"></Icon>
                <div style="font-size: 1.25rem">Unable to fetch the state of your organizaiton</div>
            </template>
            <template v-else-if="orgMetaData">
                <Icon class="icon" icon="solar:sleeping-square-linear" style="font-size: 5rem"></Icon>
                <div style="font-size: 1.25rem">
                    <div v-if="orgMetaData.integrations.length == 0">
                        You have no integration with a VCS system yet
                    </div>
                    <div v-else-if="orgMetaData.projects.length == 0">
                        You have imported no projects yet
                    </div>
                </div>

                <RouterLink v-if="orgMetaData.integrations.length == 0" :to="{
                    name: 'orgs',
                    params: { orgId: defaultOrg!.id, page: 'integrations', action: 'add' }
                }">
                    <Button> Link to Github or Gitlab </Button>
                </RouterLink>
                <RouterLink v-else-if="orgMetaData.projects.length == 0"
                    :to="{ name: 'projects', params: { page: 'add' } }">
                    <Button>
                        <Icon icon="ion:add-sharp" /> Add a project
                    </Button>
                </RouterLink>
            </template>
        </div>
    </div>
    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-9" v-else>
        <Card class="xl:col-span-5 xl:col-start-3">
            <CardHeader>
                <CardTitle>Overall Exposure</CardTitle>
                <CardDescription> Overall exposure of your projects. </CardDescription>
            </CardHeader>
            <CardContent>
                <ExposureOverview :integration-ids="activeIntegrationIds"></ExposureOverview>
            </CardContent>
        </Card>
        <Card class="xl:col-start-1 xl:col-span-3">
            <CardHeader>
                <CardTitle>Current vulnerabilities</CardTitle>
                <CardDescription>
                    Current vulnerabilities affecting your projects.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <CurrentVulns :integration-ids="activeIntegrationIds"></CurrentVulns>
            </CardContent>
        </Card>
        <Card class="xl:col-span-3">
            <CardHeader>
                <CardTitle>Open source license distribution</CardTitle>
                <CardDescription>
                    Overview of the open source licenses within your dependencies.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LicenseDist :integration-ids="activeIntegrationIds"></LicenseDist>
            </CardContent>
        </Card>
        <Card class="xl:col-span-3">
            <CardHeader>
                <CardTitle>Vulnerability Impact Analysis</CardTitle>
                <CardDescription> Average severity of vulnerabilities affecting your projects, providing insight into potential risks. </CardDescription>
            </CardHeader>
            <CardContent>
                <VulnerabilityImpact :integration-ids="activeIntegrationIds"></VulnerabilityImpact>
            </CardContent>
        </Card>
    </div>
</template>
