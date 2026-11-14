<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

const OrgIntegrationsList = defineAsyncComponent(
  (() => import("./IntegrationsList.vue")) as AsyncComponentLoader,
) as Component;
const OrgIntegrationCreate = defineAsyncComponent(
  (() => import("./IntegrationCreate.vue")) as AsyncComponentLoader,
) as Component;
const OrgIntegrationEdit = defineAsyncComponent(
  (() => import("./IntegrationEdit.vue")) as AsyncComponentLoader,
) as Component;

defineProps<{
  page: string;
  orgId: string;
  action?: string;
}>();
</script>
<template>
  <OrgIntegrationsList
    v-if="action === 'manage'"
    :page="page"
    :org-id="orgId"
  />
  <OrgIntegrationCreate
    v-else-if="action === 'add'"
    :page="page"
    :org-id="orgId"
  />
  <OrgIntegrationEdit
    v-else-if="action === 'edit'"
    :page="page"
    :org-id="orgId"
  />
</template>
