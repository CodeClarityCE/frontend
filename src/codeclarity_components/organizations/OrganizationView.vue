<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

// Each section renders its own page heading.
const OrgsList = defineAsyncComponent(
  (() =>
    import("@/codeclarity_components/organizations/list/OrganizationsList.vue")) as AsyncComponentLoader,
) as Component;
const CreateOrg = defineAsyncComponent(
  (() =>
    import("@/codeclarity_components/organizations/create/OrganizationCreate.vue")) as AsyncComponentLoader,
) as Component;
const OrgManageAuditLogs = defineAsyncComponent(
  (() => import("./audit_logs/ManageAuditLogs.vue")) as AsyncComponentLoader,
) as Component;
const OrgPolicies = defineAsyncComponent(
  (() => import("./policy/PoliciesView.vue")) as AsyncComponentLoader,
) as Component;
const OrgManageOverview = defineAsyncComponent(
  (() => import("./manage/OrganizationManage.vue")) as AsyncComponentLoader,
) as Component;
const OrgManageMembers = defineAsyncComponent(
  (() => import("./members/ManageMembers.vue")) as AsyncComponentLoader,
) as Component;
const OrgManageInvites = defineAsyncComponent(
  (() => import("./invites/ManageInvites.vue")) as AsyncComponentLoader,
) as Component;
const OrgManageIntegrations = defineAsyncComponent(
  (() => import("./integrations/IntegrationsView.vue")) as AsyncComponentLoader,
) as Component;
const OrgAnalyzers = defineAsyncComponent(
  (() => import("./analyzers/AnalyzersView.vue")) as AsyncComponentLoader,
) as Component;

const state = useStateStore();
state.$reset();

state.page = "orgs";

const props = defineProps<{
  action?: string;
  page?: string;
  orgId?: string;
}>();
</script>
<template>
  <div class="flex flex-col gap-8 p-8">
    <CreateOrg v-if="props.action === 'add' && !props.orgId" />
    <OrgsList v-else-if="props.action === 'list' && !props.orgId" />
    <OrgPolicies
      v-else-if="
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
</template>
