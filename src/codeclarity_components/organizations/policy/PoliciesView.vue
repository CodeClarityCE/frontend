<script lang="ts" setup>
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import type { Organization } from '@/codeclarity_components/organizations/organization.entity';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/ui/tabs';
import {
    defineAsyncComponent,
    ref,
    computed,
    type AsyncComponentLoader,
    type Component
} from 'vue';

const OrgPoliciesList = defineAsyncComponent({
    loader: (() => import('./list/PoliciesList.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgPoliciesCreate = defineAsyncComponent({
    loader: (() => import('./create/PolicyCreate.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgPoliciesEdit = defineAsyncComponent({
    loader: (() => import('./edit/PolicyEdit.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const VulnerabilityPoliciesView = defineAsyncComponent({
    loader: (() => import('./VulnerabilityPoliciesView.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    delay: 200,
    errorComponent: ErrorComponent as Component,
    timeout: 3000
}) as Component;

const props = defineProps<{
    page: string;
    orgId: string;
    action?: string;
}>();

const activeTab = ref('license');
const orgInfo = ref<Organization>();

// Determine if we should show the tab interface (for manage/list view) or a specific policy type view
const showTabs = computed(() => props.action === 'manage' || !props.action);
const policyType = computed(() => {
    // If specific policy page is requested, extract from page parameter
    if (
        props.page &&
        (props.page.includes('vulnerability') ?? props.page === 'vulnerability-policy')
    )
        return 'vulnerability';
    return 'license';
});

function setOrgInfo(_orgInfo: Organization): void {
    orgInfo.value = _orgInfo;
}
</script>
<template>
    <div v-if="showTabs" class="min-h-screen bg-gray-50">
        <!-- Page Header -->
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)" />

        <div class="max-w-7xl mx-auto px-8 py-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Policy Management</h1>
                <p class="text-gray-600">
                    Configure license and vulnerability policies for your organization
                </p>
            </div>

            <Tabs v-model="activeTab" class="w-full">
                <TabsList class="grid w-full grid-cols-2 lg:w-[400px] mb-8">
                    <TabsTrigger value="license"> License Policies </TabsTrigger>
                    <TabsTrigger value="vulnerability"> Vulnerability Policies </TabsTrigger>
                </TabsList>

                <TabsContent value="license" class="mt-0">
                    <OrgPoliciesList :page="page" :org-id="orgId" />
                </TabsContent>

                <TabsContent value="vulnerability" class="mt-0">
                    <VulnerabilityPoliciesView :page="page" :org-id="orgId" action="manage" />
                </TabsContent>
            </Tabs>
        </div>
    </div>

    <!-- Direct policy type views for add/edit actions -->
    <OrgPoliciesCreate
        v-else-if="action === 'add' && policyType === 'license'"
        :page="page"
        :org-id="orgId"
    />
    <OrgPoliciesEdit
        v-else-if="action === 'edit' && policyType === 'license'"
        :page="page"
        :org-id="orgId"
    />

    <VulnerabilityPoliciesView
        v-else-if="(action === 'add' || action === 'edit') && policyType === 'vulnerability'"
        :page="page"
        :org-id="orgId"
        :action="action"
    />
</template>
