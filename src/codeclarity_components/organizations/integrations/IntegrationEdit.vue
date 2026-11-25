<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import { leaveUnlessOrgAdmin } from "@/codeclarity_components/organizations/admin-only";
import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { type Organization } from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import OrgNotFound from "@/codeclarity_components/organizations/subcomponents/OrgNotFound.vue";

import OrgIntegrationManageClickUp from "./clickup/ManageClickUp.vue";
import OrgIntegrationManageGithub from "./github/ManageGithub.vue";
import OrgIntegrationManageGitlab from "./gitlab/ManageGitlab.vue";

defineProps<{
  orgId: string;
  page: string;
}>();

const route = useRoute();
const provider = computed(() => route.query.provider);
// GitHub and GitLab integrations are opened by id; ClickUp has one per organisation.
const hasId = computed(
  () =>
    typeof route.query.integrationId === "string" &&
    route.query.integrationId !== "",
);

// Only admins manage integrations; others go to the organisation overview.
function setOrgInfo(orgInfo: Organization): void {
  leaveUnlessOrgAdmin(orgInfo);
}
</script>
<template>
  <div class="flex flex-col gap-8 org-manage-integration-create">
    <HeaderItem
      v-if="orgId"
      :org-id="orgId"
      @on-org-info="setOrgInfo($event)"
    ></HeaderItem>
    <div class="org-integrations-create-wrapper">
      <OrgIntegrationManageGithub
        v-if="provider === IntegrationProvider.GITHUB && hasId"
        :org-id="orgId"
      />
      <OrgIntegrationManageGitlab
        v-else-if="provider === IntegrationProvider.GITLAB && hasId"
        :org-id="orgId"
      />
      <OrgIntegrationManageClickUp
        v-else-if="provider === IntegrationProvider.CLICKUP"
        :org-id="orgId"
      />
      <OrgNotFound
        v-else
        :org-id="orgId"
        subject="Integration"
        description="This integration does not exist or the link is incomplete."
      />
    </div>
  </div>
</template>
