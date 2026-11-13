<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

const OrgAnalyzersList = defineAsyncComponent(
  (() => import("./AnalyzersList.vue")) as AsyncComponentLoader,
) as Component;
const OrgAnalyzerEdit = defineAsyncComponent(
  (() => import("./AnalyzerEdit.vue")) as AsyncComponentLoader,
) as Component;
const OrgAnalyzerCreate = defineAsyncComponent(
  (() => import("./AnalyzerCreate.vue")) as AsyncComponentLoader,
) as Component;
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
