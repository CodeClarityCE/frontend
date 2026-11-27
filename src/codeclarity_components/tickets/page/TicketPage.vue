<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { type RouteLocationRaw, RouterLink } from "vue-router";

import { OwlEmptyState, StatusBadge } from "@/base_components/page";
import { Button } from "@/shadcn/ui/button";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import TicketHistory from "../components/TicketHistory.vue";
import TicketPriorityBadge from "../components/TicketPriorityBadge.vue";
import TicketRemediation from "../components/TicketRemediation.vue";
import { useTicketsData } from "../composables/useTicketsData";
import {
  TicketStatusLabels,
  TicketStatusTones,
  TicketTypeLabels,
} from "../tickets.entity";

import { groupByVulnerability } from "./ticket-fix";
import TicketRisk from "./TicketRisk.vue";
import TicketSidebar from "./TicketSidebar.vue";
import TicketVulnerability from "./TicketVulnerability.vue";

// One ticket on its own page: the fix first, then risk and history, with actions and facts beside them.
const props = defineProps<{ ticketId: string }>();

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();
const {
  selectedTicket: ticket,
  isLoadingDetail,
  vulnerabilityDetails,
  isLoadingVulnDetails,
  loadTicketDetail,
} = useTicketsData({ autoLoad: false });

const attempted = ref(false);

async function load(): Promise<void> {
  await loadTicketDetail(props.ticketId);
  attempted.value = true;
}

// Loads once the organization and token are known, which can be after mount.
watch(
  () => Boolean(defaultOrg?.value?.id && auth.getAuthenticated),
  (ready) => {
    if (ready && !attempted.value) void load();
  },
  { immediate: true },
);

// Back to the list as the reader left it (its filter is in the URL), else the plain list.
const backTo = computed((): RouteLocationRaw => {
  const back: unknown = (window.history.state as { back?: unknown } | null)
    ?.back;
  return typeof back === "string" && back.startsWith("/tickets")
    ? back
    : { name: "tickets" };
});

// Risk is shown for one vulnerability only; a remediation of several links to each instead.
const showsRisk = computed(() => {
  const current = ticket.value;
  if (!current?.vulnerability_id) return false;
  if (!current.remediation) return true;
  return groupByVulnerability(current.instances ?? []).length === 1;
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
    <RouterLink
      :to="backTo"
      class="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" class="size-4" />
      Tickets
    </RouterLink>

    <div
      v-if="!ticket && (!attempted || isLoadingDetail)"
      role="status"
      aria-label="Loading the ticket"
      class="flex flex-col gap-6"
    >
      <Skeleton class="h-9 w-2/3" />
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton class="h-96" />
        <Skeleton class="h-64" />
      </div>
    </div>

    <OwlEmptyState
      v-else-if="!ticket"
      title="Ticket not found"
      description="It may have been deleted with its project, or belong to another organization."
    >
      <Button :as="RouterLink" :to="{ name: 'tickets' }" arrow>
        All tickets
      </Button>
    </OwlEmptyState>

    <template v-else-if="defaultOrg">
      <header class="flex flex-col gap-2">
        <p
          class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {{
            ticket.remediation ? "Remediation" : TicketTypeLabels[ticket.type]
          }}
          ticket
        </p>
        <h1
          class="text-2xl font-bold break-words text-foreground-strong sm:text-3xl"
        >
          {{ ticket.title }}
        </h1>
        <p class="flex flex-wrap items-center gap-2">
          <StatusBadge
            :tone="TicketStatusTones[ticket.status]"
            :label="TicketStatusLabels[ticket.status]"
          />
          <TicketPriorityBadge :priority="ticket.priority" />
          <span class="sr-only">priority</span>
        </p>
      </header>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <!-- First in the page so small screens see the facts before the details. -->
        <TicketSidebar
          :org-id="defaultOrg.id"
          :ticket="ticket"
          class="lg:sticky lg:top-8 lg:order-2"
          @updated="load"
        />

        <div class="flex min-w-0 flex-col gap-6 lg:order-1">
          <TicketRemediation
            v-if="ticket.remediation"
            :org-id="defaultOrg.id"
            :remediation="ticket.remediation"
            :ticket-title="ticket.title"
            :instances="ticket.instances ?? []"
          />
          <TicketVulnerability
            v-else
            :org-id="defaultOrg.id"
            :ticket="ticket"
          />

          <template v-if="showsRisk && ticket.vulnerability_id">
            <p
              v-if="isLoadingVulnDetails"
              role="status"
              class="flex items-center gap-2 rounded-card border bg-card p-5 text-sm text-muted-foreground"
            >
              <Spinner />
              Loading the risk scores
            </p>
            <TicketRisk
              v-else-if="vulnerabilityDetails"
              :org-id="defaultOrg.id"
              :vulnerability-id="ticket.vulnerability_id"
              :details="vulnerabilityDetails"
            />
          </template>

          <section
            v-if="ticket.remediation_notes"
            aria-labelledby="ticket-notes"
            class="flex flex-col gap-2 rounded-card border bg-card p-5"
          >
            <h2
              id="ticket-notes"
              class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Remediation notes
            </h2>
            <p class="text-sm break-words whitespace-pre-wrap text-foreground">
              {{ ticket.remediation_notes }}
            </p>
          </section>

          <TicketHistory :ticket="ticket" />
        </div>
      </div>
    </template>
  </div>
</template>
