<script setup lang="ts">
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

// The page loads on demand, so the router's eager bundle stays small.
const TicketsPage = defineAsyncComponent(
  (() => import("./sections/TicketsPage.vue")) as AsyncComponentLoader,
) as Component;

const state = useStateStore();
state.$reset();
state.page = "tickets";

defineProps<{
  page?: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <TicketsPage />
  </div>
</template>
