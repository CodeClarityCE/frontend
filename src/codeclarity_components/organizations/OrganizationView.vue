<script lang="ts" setup>
import PageHeader from '@/base_components/layout/PageHeader.vue';
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import { useStateStore } from '@/stores/state';
import { defineAsyncComponent, type AsyncComponentLoader, type Component } from 'vue';

const OrgsList = defineAsyncComponent({
    loader: (() =>
        import(
            '@/codeclarity_components/organizations/list/OrganizationsList.vue'
        )) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const CreateOrg = defineAsyncComponent({
    loader: (() =>
        import(
            '@/codeclarity_components/organizations/create/OrganizationCreate.vue'
        )) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgManageAuditLogs = defineAsyncComponent({
    loader: (() => import('./audit_logs/ManageAuditLogs.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgPolicies = defineAsyncComponent({
    loader: (() => import('./policy/PoliciesView.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgManageOverview = defineAsyncComponent({
    loader: (() => import('./manage/OrganizationManage.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgManageMembers = defineAsyncComponent({
    loader: (() => import('./members/ManageMembers.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgManageInvites = defineAsyncComponent({
    loader: (() => import('./invites/ManageInvites.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgManageIntegrations = defineAsyncComponent({
    loader: (() => import('./integrations/IntegrationsView.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const OrgAnalyzers = defineAsyncComponent({
    loader: (() => import('./analyzers/AnalyzersView.vue')) as AsyncComponentLoader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

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
            case 'vulnerability-policy':
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
            case 'vulnerability-policy':
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
                <CreateOrg v-if="props.action === 'add' && !props.orgId" />
                <OrgsList v-else-if="props.action === 'list' && !props.orgId" />
                <OrgPolicies
                    v-if="
                        (props.page === 'policies' ||
                            props.page === 'policy' ||
                            props.page === 'vulnerability-policy') &&
                        props.orgId
                    "
                    :page="props.page"
                    :org-id="props.orgId"
                    :action="props.action"
                />
                <OrgManageAuditLogs
                    v-else-if="props.page === 'logs' && props.orgId"
                    :page="props.page"
                    :org-id="props.orgId"
                />
                <OrgManageMembers
                    v-else-if="props.page === 'members' && props.orgId"
                    :page="props.page"
                    :org-id="props.orgId"
                />
                <OrgManageInvites
                    v-else-if="props.page === 'invites' && props.orgId"
                    :page="props.page"
                    :org-id="props.orgId"
                />
                <OrgManageIntegrations
                    v-else-if="props.page === 'integrations' && props.orgId"
                    :page="props.page"
                    :org-id="props.orgId"
                    :action="props.action"
                />
                <OrgAnalyzers
                    v-else-if="props.page === 'analyzers' && props.orgId"
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
