<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import { useStateStore } from "@/stores/state";

const ExperimentsList = defineAsyncComponent({
  loader: (() =>
    import("./sections/ExperimentsList.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  delay: 200,
  errorComponent: ErrorComponent as Component,
  timeout: 3000,
}) as Component;

const ExperimentCreate = defineAsyncComponent({
  loader: (() =>
    import("./sections/ExperimentCreate.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  delay: 200,
  errorComponent: ErrorComponent as Component,
  timeout: 3000,
}) as Component;

const ExperimentDetail = defineAsyncComponent({
  loader: (() =>
    import("./sections/ExperimentDetail.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  delay: 200,
  errorComponent: ErrorComponent as Component,
  timeout: 3000,
}) as Component;

const state = useStateStore();
state.$reset();

state.page = "experiments";

const props = defineProps<{
  page?: string;
}>();
</script>
<template>
  <main class="p-8 space-y-6">
    <ExperimentCreate v-if="props.page === 'add'" />
    <ExperimentDetail v-else-if="props.page === 'detail'" />
    <ExperimentsList v-else />
  </main>
</template>
