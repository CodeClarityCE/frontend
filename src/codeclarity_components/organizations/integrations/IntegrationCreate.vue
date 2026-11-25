<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import { leaveUnlessOrgAdmin } from "@/codeclarity_components/organizations/admin-only";
import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { type Organization } from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import OrgNotFound from "@/codeclarity_components/organizations/subcomponents/OrgNotFound.vue";

import OrgIntegrationAddClickUp from "./clickup/AddClickUp.vue";
import OrgIntegrationAddGithub from "./github/AddGithub.vue";
import OrgIntegrationAddGitlab from "./gitlab/AddGitlab.vue";

defineProps<{
  orgId: string;
  page: string;
}>();

const route = useRoute();
// Without a provider the GitHub form opens.
const provider = computed(() =>
  typeof route.query.provider === "string"
    ? route.query.provider
    : IntegrationProvider.GITHUB,
);

// Only admins add integrations; others go to the organisation overview.
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
      <OrgIntegrationAddGithub
        v-if="provider === IntegrationProvider.GITHUB"
      ></OrgIntegrationAddGithub>
      <OrgIntegrationAddGitlab
        v-else-if="provider === IntegrationProvider.GITLAB"
      ></OrgIntegrationAddGitlab>
      <OrgIntegrationAddClickUp
        v-else-if="provider === IntegrationProvider.CLICKUP"
      ></OrgIntegrationAddClickUp>
      <OrgNotFound
        v-else
        :org-id="orgId"
        subject="Integration"
        description="CodeClarity has no integration of this kind."
      />
    </div>
  </div>
</template>
