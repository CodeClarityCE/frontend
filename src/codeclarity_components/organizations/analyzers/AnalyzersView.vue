<script lang="ts" setup>
import {
  defineAsyncComponent,
  type AsyncComponentLoader,
  type Component,
} from "vue";
import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import { useStateStore } from "@/stores/state";

const OrgAnalyzersList = defineAsyncComponent({
  loader: (() => import("./AnalyzersList.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const OrgAnalyzerEdit = defineAsyncComponent({
  loader: (() => import("./AnalyzerEdit.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const OrgAnalyzerCreate = defineAsyncComponent({
  loader: (() => import("./AnalyzerCreate.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const state = useStateStore();
state.$reset();

state.page = "orgs";

defineProps<{
  page: string;
  orgId: string;
  action?: string;
}>();
</script>
<template>
  <OrgAnalyzersList v-if="action === 'manage'" :page="page" :org-id="orgId" />
  <OrgAnalyzerEdit v-else-if="action === 'edit'" :page="page" :org-id="orgId" />
  <OrgAnalyzerCreate
    v-else-if="action === 'add'"
    :page="page"
    :org-id="orgId"
  />
</template>
