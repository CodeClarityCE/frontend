<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import { useStateStore } from "@/stores/state";

const DatasetsList = defineAsyncComponent({
  loader: (() => import("./sections/DatasetsList.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  delay: 200,
  errorComponent: ErrorComponent as Component,
  timeout: 3000,
}) as Component;

const DatasetCreate = defineAsyncComponent({
  loader: (() =>
    import("./sections/DatasetCreate.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  delay: 200,
  errorComponent: ErrorComponent as Component,
  timeout: 3000,
}) as Component;

const DatasetDetail = defineAsyncComponent({
  loader: (() =>
    import("./sections/DatasetDetail.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  delay: 200,
  errorComponent: ErrorComponent as Component,
  timeout: 3000,
}) as Component;

const state = useStateStore();
state.$reset();

state.page = "datasets";

const props = defineProps<{
  page?: string;
}>();
</script>
<template>
  <main class="p-8 space-y-6">
    <DatasetCreate v-if="props.page === 'add'" />
    <DatasetDetail v-else-if="props.page === 'detail'" />
    <DatasetsList v-else />
  </main>
</template>
