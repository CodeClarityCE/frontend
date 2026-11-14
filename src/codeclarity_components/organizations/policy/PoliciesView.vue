<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  computed,
  defineAsyncComponent,
  ref,
} from "vue";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import router from "@/router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";

const LicensePoliciesList = defineAsyncComponent(
  (() => import("./list/PoliciesList.vue")) as AsyncComponentLoader,
) as Component;
const LicensePolicyForm = defineAsyncComponent(
  (() => import("./license/LicensePolicyForm.vue")) as AsyncComponentLoader,
) as Component;
const VulnerabilityPolicyList = defineAsyncComponent(
  (() =>
    import("./vulnerability/VulnerabilityPolicyList.vue")) as AsyncComponentLoader,
) as Component;
const VulnerabilityPolicyForm = defineAsyncComponent(
  (() =>
    import("./vulnerability/VulnerabilityPolicyForm.vue")) as AsyncComponentLoader,
) as Component;

const props = defineProps<{
  page: string;
  orgId: string;
  action?: string;
}>();

const activeTab = ref(
  props.page === "vulnerability-policy" ? "vulnerability" : "license",
);

// The list shows both kinds in tabs; add and edit open one kind's form.
const showList = computed(() => props.action === "manage" || !props.action);
const isForm = computed(
  () => props.action === "add" || props.action === "edit",
);
const policyType = computed(() =>
  props.page.includes("vulnerability") ? "vulnerability" : "license",
);

// Only admins may add or edit policies; others go back to the list.
function checkRole(org: Organization): void {
  if (
    isForm.value &&
    !isMemberRoleGreaterOrEqualTo(org.role, MemberRole.ADMIN)
  ) {
    void router.replace({
      name: "orgs",
      params: { action: "manage", page: "policies", orgId: props.orgId },
    });
  }
}
</script>
<template>
  <div class="flex flex-col gap-8">
    <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="checkRole" />

    <template v-if="showList">
      <PageHeading
        description="License and vulnerability rules applied to the analyses of this organisation."
      >
        <BrandEmphasis>Policies</BrandEmphasis>
      </PageHeading>

      <Tabs v-model="activeTab" class="flex flex-col gap-6">
        <TabsList class="w-fit">
          <TabsTrigger value="license">License policies</TabsTrigger>
          <TabsTrigger value="vulnerability"
            >Vulnerability policies</TabsTrigger
          >
        </TabsList>
        <TabsContent value="license" class="mt-0">
          <LicensePoliciesList :page="page" :org-id="orgId" />
        </TabsContent>
        <TabsContent value="vulnerability" class="mt-0">
          <VulnerabilityPolicyList :page="page" :org-id="orgId" />
        </TabsContent>
      </Tabs>
    </template>

    <LicensePolicyForm
      v-else-if="isForm && policyType === 'license'"
      :org-id="orgId"
      :mode="action"
    />
    <VulnerabilityPolicyForm
      v-else-if="isForm && policyType === 'vulnerability'"
      :org-id="orgId"
      :mode="action"
    />
  </div>
</template>
