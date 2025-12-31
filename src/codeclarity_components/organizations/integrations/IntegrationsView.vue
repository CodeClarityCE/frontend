<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";

const OrgIntegrationsList = defineAsyncComponent({
  loader: (() => import("./IntegrationsList.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const OrgIntegrationCreate = defineAsyncComponent({
  loader: (() => import("./IntegrationCreate.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const OrgIntegrationEdit = defineAsyncComponent({
  loader: (() => import("./IntegrationEdit.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

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
