<script setup lang="ts">
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import { useStateStore } from "@/stores/state";

const Privacy = defineAsyncComponent({
  loader: (() => import("./PrivacyTerms.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const Service = defineAsyncComponent({
  loader: (() => import("./TermsOfService.vue")) as AsyncComponentLoader,
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

state.page = "terms";

const props = defineProps<{
  page?: string;
}>();
</script>

<template>
  <Privacy v-if="props.page === 'privacy'" />
  <Service v-else />
</template>
