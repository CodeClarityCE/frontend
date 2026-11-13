<script setup lang="ts">
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

// Loaded on demand: the terms pull in the markdown renderer.
const Privacy = defineAsyncComponent(
  (() => import("./PrivacyTerms.vue")) as AsyncComponentLoader,
) as Component;
const Service = defineAsyncComponent(
  (() => import("./TermsOfService.vue")) as AsyncComponentLoader,
) as Component;

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
