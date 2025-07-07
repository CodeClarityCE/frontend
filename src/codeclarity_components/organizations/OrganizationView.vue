<script lang="ts" setup>
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import PageHeader from '@/base_components/layout/PageHeader.vue';
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

// Helper functions for dynamic page titles and descriptions
function getPageTitle(): string {
    if (props.action === 'add' && !props.orgId) {
        return 'Create Organization';
    }
    if (props.action === 'list' && !props.orgId) {
        return 'Organizations';
    }
    if (props.orgId) {
        switch (props.page) {
            case 'policies':
            case 'policy':
                return 'Organization Policies';
            case 'logs':
                return 'Audit Logs';
            case 'members':
                return 'Members';
            case 'invites':
                return 'Invitations';
            case 'integrations':
                return 'Integrations';
            case 'analyzers':
                return 'Analyzers';
            default:
                return 'Organization Overview';
        }
    }
    return 'Organizations';
}

function getPageDescription(): string {
    if (props.action === 'add' && !props.orgId) {
        return 'Create a new organization to manage your team and projects';
    }
    if (props.action === 'list' && !props.orgId) {
        return "Monitor your organization's security posture and vulnerabilities";
    }
    if (props.orgId) {
        switch (props.page) {
            case 'policies':
            case 'policy':
                return 'Configure security policies and compliance settings';
            case 'logs':
                return 'Review organization activity and audit trails';
            case 'members':
                return 'Manage organization members and their permissions';
            case 'invites':
                return 'Send and manage organization invitations';
            case 'integrations':
                return 'Connect external tools and services';
            case 'analyzers':
                return 'Configure security analyzers and scanning tools';
            default:
                return 'Organization management and overview';
        }
    }
    return 'Manage your organizations and security settings';
}
</script>
<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto p-6">
            <!-- Page Header with Dashboard Theme -->
            <PageHeader
                :title="getPageTitle()"
                :description="getPageDescription()"
                :show-last-updated="false"
                :show-refresh="false"
            />

            <!-- Main Content Area -->
            <div class="space-y-6">
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
            </div>
        </div>
    </div>
</template>
