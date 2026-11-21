<script setup lang="ts">
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

// The page loads on demand, so the router's eager bundle stays small.
const TicketPage = defineAsyncComponent(
  (() => import("./page/TicketPage.vue")) as AsyncComponentLoader,
) as Component;

const state = useStateStore();
state.$reset();
state.page = "tickets";

defineProps<{
  ticketId: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <TicketPage :key="ticketId" :ticket-id="ticketId" />
  </div>
</template>
