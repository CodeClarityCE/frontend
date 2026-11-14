<script setup lang="ts">
import { computed, type Ref, ref } from "vue";
import { RouterLink } from "vue-router";

import TicketPriorityBadge from "@/codeclarity_components/tickets/components/TicketPriorityBadge.vue";
import {
  type TicketDashboardStats,
  TicketPriority,
} from "@/codeclarity_components/tickets/tickets.entity";
import { TicketsRepository } from "@/codeclarity_components/tickets/tickets.repository";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { formatShortDate } from "@/utils/dateUtils";

import CardState from "../layout/CardState.vue";

// Ticket stats are organisation wide, so integrations do not change them.
defineProps<{
  integrationIds: string[];
}>();

const authStore = useAuthStore();
const userStore = useUserStore();
const ticketsRepository = new TicketsRepository();

const error = ref(false);
const loading = ref(true);
const stats: Ref<TicketDashboardStats | null> = ref(null);

async function fetch(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getAuthenticated || !authStore.getToken) return;

  loading.value = true;
  error.value = false;

  try {
    const resp = await ticketsRepository.getDashboardStats({
      orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    stats.value = resp.data;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
void fetch();

const noData = computed(
  () =>
    !stats.value ||
    (stats.value.total_open === 0 &&
      stats.value.total_in_progress === 0 &&
      stats.value.total_resolved_this_week === 0),
);

const states = computed(() => [
  { label: "Open", value: stats.value?.total_open ?? 0 },
  { label: "In progress", value: stats.value?.total_in_progress ?? 0 },
  {
    label: "Resolved this week",
    value: stats.value?.total_resolved_this_week ?? 0,
  },
]);

const PRIORITY_KEYS = [
  [TicketPriority.CRITICAL, "critical"],
  [TicketPriority.HIGH, "high"],
  [TicketPriority.MEDIUM, "medium"],
  [TicketPriority.LOW, "low"],
] as const;

/** Priorities that have tickets, most urgent first */
const priorities = computed(() =>
  PRIORITY_KEYS.map(([priority, key]) => ({
    priority,
    count: stats.value?.by_priority[key] ?? 0,
  })).filter((entry) => entry.count > 0),
);
</script>

<template>
  <CardState
    label="ticket statistics"
    :loading="loading"
    :error="error"
    :empty="noData"
    empty-text="No tickets yet. Create tickets from vulnerability results."
    @retry="() => void fetch()"
  >
    <div v-if="stats" class="flex flex-col gap-4">
      <ul aria-label="Tickets by state" class="grid grid-cols-3 gap-3">
        <li
          v-for="state in states"
          :key="state.label"
          class="flex flex-col items-center gap-1 rounded-control border p-3 text-center"
        >
          <span class="text-sm text-muted-foreground">{{ state.label }}</span>
          <span
            class="text-2xl font-bold tabular-nums text-foreground-strong"
            >{{ state.value }}</span
          >
        </li>
      </ul>

      <ul
        v-if="priorities.length > 0"
        aria-label="Tickets by priority"
        class="flex flex-wrap gap-3"
      >
        <li
          v-for="entry in priorities"
          :key="entry.priority"
          class="flex items-center gap-2 text-sm"
        >
          <TicketPriorityBadge :priority="entry.priority" />
          <span class="font-semibold tabular-nums">{{ entry.count }}</span>
        </li>
      </ul>

      <div
        v-if="stats.recent_tickets && stats.recent_tickets.length > 0"
        class="flex flex-col gap-2"
      >
        <h4
          id="dashboard-recent-tickets"
          class="text-sm font-semibold text-foreground-strong"
        >
          Recent tickets
        </h4>
        <ul
          aria-labelledby="dashboard-recent-tickets"
          class="flex flex-col divide-y rounded-control border"
        >
          <li v-for="ticket in stats.recent_tickets" :key="ticket.id">
            <RouterLink
              :to="{ name: 'tickets', query: { ticket_id: ticket.id } }"
              class="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span class="flex min-w-0 items-center gap-2">
                <TicketPriorityBadge :priority="ticket.priority" />
                <span class="truncate text-foreground">{{ ticket.title }}</span>
              </span>
              <span class="shrink-0 text-xs text-muted-foreground">
                {{ formatShortDate(ticket.created_on, { year: false }) }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <Button
        :as="RouterLink"
        :to="{ name: 'tickets' }"
        variant="outline"
        size="sm"
      >
        View all tickets
      </Button>
    </div>
  </CardState>
</template>
