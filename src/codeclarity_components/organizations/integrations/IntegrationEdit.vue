<script lang="ts" setup>
import { type Ref, ref } from "vue";
import { useRoute } from "vue-router";

import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import router from "@/router";

import OrgIntegrationManageClickUp from "./clickup/ManageClickUp.vue";
import OrgIntegrationManageGithub from "./github/ManageGithub.vue";
import OrgIntegrationManageGitlab from "./gitlab/ManageGitlab.vue";

const provider: Ref<IntegrationProvider> = ref(IntegrationProvider.GITHUB);

// Props
defineProps<{
  orgId: string;
  page: string;
}>();

const orgInfo: Ref<Organization | undefined> = ref();

function setOrgInfo(_orgInfo: Organization): void {
  orgInfo.value = _orgInfo;
  if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
    void router.push({
      name: "orgs",
      params: { action: "manage", page: "integrations", orgId: _orgInfo.id },
    });
  }
}

const route = useRoute();
provider.value = route.query.provider as IntegrationProvider;
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
        v-if="provider === IntegrationProvider.GITHUB"
        :org-id="orgId"
      />
      <OrgIntegrationManageGitlab
        v-else-if="provider === IntegrationProvider.GITLAB"
        :org-id="orgId"
      />
      <OrgIntegrationManageClickUp
        v-else-if="provider === IntegrationProvider.CLICKUP"
        :org-id="orgId"
      />
    </div>
  </div>
</template>
