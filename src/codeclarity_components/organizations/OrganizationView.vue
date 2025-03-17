<script lang="ts" setup>
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const OrgsList = defineAsyncComponent({
    loader: () => import('@/codeclarity_components/organizations/list/OrganizationsList.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const CreateOrg = defineAsyncComponent({
    loader: () => import('@/codeclarity_components/organizations/create/OrganizationCreate.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgManageAuditLogs = defineAsyncComponent({
    loader: () => import('./audit_logs/ManageAuditLogs.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgPolicies = defineAsyncComponent({
    loader: () => import('./policy/PoliciesView.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgManageOverview = defineAsyncComponent({
    loader: () => import('./manage/OrganizationManage.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgManageMembers = defineAsyncComponent({
    loader: () => import('./members/ManageMembers.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgManageInvites = defineAsyncComponent({
    loader: () => import('./invites/ManageInvites.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgManageIntegrations = defineAsyncComponent({
    loader: () => import('./integrations/IntegrationsView.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgAnalyzers = defineAsyncComponent({
    loader: () => import('./analyzers/AnalyzersView.vue'),
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

state.page = 'orgs';

const props = defineProps<{
    action?: string;
    page?: string;
    orgId?: string;
}>();
</script>
<template>
    <main class="p-12">
        <CreateOrg v-if="props.action == 'add' && !props.orgId" />
        <OrgsList v-else-if="props.action == 'list' && !props.orgId" />
        <OrgPolicies
            v-if="(props.page == 'policies' || props.page == 'policy') && props.orgId"
            :page="props.page"
            :org-id="props.orgId"
            :action="props.action"
        />
        <OrgManageAuditLogs
            v-else-if="props.page == 'logs' && props.orgId"
            :page="props.page"
            :org-id="props.orgId"
        />
        <OrgManageMembers
            v-else-if="props.page == 'members' && props.orgId"
            :page="props.page"
            :org-id="props.orgId"
        />
        <OrgManageInvites
            v-else-if="props.page == 'invites' && props.orgId"
            :page="props.page"
            :org-id="props.orgId"
        />
        <OrgManageIntegrations
            v-else-if="props.page == 'integrations' && props.orgId"
            :page="props.page"
            :org-id="props.orgId"
            :action="props.action"
        />
        <OrgAnalyzers
            v-else-if="props.page == 'analyzers' && props.orgId"
            :page="props.page"
            :org-id="props.orgId"
            :action="props.action"
        />
        <OrgManageOverview
            v-else-if="props.page && props.orgId"
            :page="props.page"
            :org-id="props.orgId"
        />
    </main>
</template>
