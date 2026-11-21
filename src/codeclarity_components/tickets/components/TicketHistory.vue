<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";

import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { formatShortDate } from "@/utils/dateUtils";

import type { TicketDetails, TicketEvent } from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

import { eventActor, eventLabel } from "./ticket-history";

const props = defineProps<{ ticket: TicketDetails }>();

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();
const ticketsRepository = new TicketsRepository();

const events = ref<TicketEvent[]>([]);
const isLoading = ref(false);
const loadFailed = ref(false);

async function loadEvents(): Promise<void> {
  const orgId = defaultOrg?.value?.id;
  if (!orgId || !auth.getToken) return;

  isLoading.value = true;
  loadFailed.value = false;
  try {
    const response = await ticketsRepository.getTicketEvents({
      orgId,
      ticketId: props.ticket.id,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    events.value = response.data;
  } catch {
    loadFailed.value = true;
  } finally {
    isLoading.value = false;
  }
}

// Reload whenever the ticket is reloaded, so new events show up.
watch(
  () => props.ticket,
  () => void loadEvents(),
  { immediate: true },
);
</script>

<template>
  <section
    aria-labelledby="ticket-history"
    class="rounded-card border bg-card p-5"
  >
    <h2
      id="ticket-history"
      class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
    >
      History
    </h2>
    <p
      v-if="isLoading && events.length === 0"
      role="status"
      class="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Spinner />
      Loading the history
    </p>
    <p v-else-if="loadFailed" role="alert" class="text-sm text-danger">
      The history could not be loaded.
    </p>
    <p v-else-if="events.length === 0" class="text-sm text-muted-foreground">
      Nothing has happened to this ticket yet.
    </p>
    <ol v-else class="flex flex-col gap-3">
      <li
        v-for="event in events"
        :key="event.id"
        class="flex flex-col gap-0.5 text-sm"
      >
        <span class="text-foreground-strong">{{ eventLabel(event) }}</span>
        <span class="text-xs text-muted-foreground">
          {{ eventActor(event) }},
          {{ formatShortDate(event.created_on, { time: true }) }}
        </span>
      </li>
    </ol>
  </section>
</template>
