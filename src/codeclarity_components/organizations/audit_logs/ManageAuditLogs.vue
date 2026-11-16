<script lang="ts" setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import {
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";

const props = defineProps<{ orgId?: string; page?: string }>();

const route = useRoute();

const orgId =
  props.orgId ??
  (typeof route.params.orgId === "string" ? route.params.orgId : "");

// Audit logs need an admin, as on the API.
function setOrgInfo(info: Organization): void {
  if (info.role !== MemberRole.OWNER && info.role !== MemberRole.ADMIN) {
    void router.push({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: info.id },
    });
  }
}

onMounted(() => {
  if (!orgId) router.back();
});
</script>

<template>
  <div class="flex flex-col gap-8">
    <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo" />

    <PageHeading description="Who changed what in the organisation, and when.">
      Audit <BrandEmphasis>logs</BrandEmphasis>
    </PageHeading>

    <!-- The API records changes but has no way to read them back yet. -->
    <Alert>
      <AlertDescription>
        <p>Reading audit logs is not available yet.</p>
        <p>
          CodeClarity records changes to the organisation, but cannot show them
          here.
        </p>
      </AlertDescription>
    </Alert>
  </div>
</template>
