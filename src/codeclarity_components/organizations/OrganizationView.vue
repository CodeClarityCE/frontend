<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  computed,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

import { orgView } from "./org-route";
import OrgNotFound from "./subcomponents/OrgNotFound.vue";

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

const view = computed(() => orgView(props));
</script>
<template>
  <div class="flex flex-col gap-8 p-8">
    <CreateOrg v-if="view === 'create'" />
    <OrgsList v-else-if="view === 'list'" />
    <OrgPolicies
      v-else-if="view === 'policies'"
      :page="props.page!"
      :org-id="props.orgId!"
      :action="props.action"
    />
    <OrgManageAuditLogs
      v-else-if="view === 'logs'"
      :page="props.page!"
      :org-id="props.orgId!"
    />
    <OrgManageMembers
      v-else-if="view === 'members'"
      :page="props.page!"
      :org-id="props.orgId!"
    />
    <OrgManageInvites
      v-else-if="view === 'invites'"
      :page="props.page!"
      :org-id="props.orgId!"
    />
    <OrgManageIntegrations
      v-else-if="view === 'integrations'"
      :page="props.page!"
      :org-id="props.orgId!"
      :action="props.action"
    />
    <OrgAnalyzers
      v-else-if="view === 'analyzers'"
      :page="props.page!"
      :org-id="props.orgId!"
      :action="props.action"
    />
    <OrgManageOverview
      v-else-if="view === 'overview'"
      :page="props.page!"
      :org-id="props.orgId!"
    />
    <OrgNotFound v-else :org-id="props.orgId" />
  </div>
</template>
