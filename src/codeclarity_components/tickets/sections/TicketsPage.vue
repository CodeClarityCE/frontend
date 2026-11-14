<script setup lang="ts">
import { Columns3, List, Plug, RefreshCw } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import {
  BrandEmphasis,
  OwlEmptyState,
  PageHeading,
  StatTile,
} from "@/base_components/page";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import { useTicketsData } from "../composables/useTicketsData";
import IntegrationsConfigPanel from "../integrations/IntegrationsConfigPanel.vue";
import { TicketsRepository } from "../tickets.repository";

import TicketDetail from "./TicketDetail.vue";
import TicketsKanban from "./TicketsKanban.vue";
import TicketsList from "./TicketsList.vue";

const route = useRoute();
const router = useRouter();

const {
  tickets,
  isLoading,
  loaded,
  hasError,
  isEmpty,
  viewMode,
  selectedTicket,
  isLoadingDetail,
  vulnerabilityDetails,
  isLoadingVulnDetails,
  quickStats,
  ticketsByStatus,
  loadTicketDetail,
  clearSelectedTicket,
  updateTicketStatus,
  refresh,
} = useTicketsData({ autoLoad: true });

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();
const ticketsRepository = new TicketsRepository();

const showIntegrationsModal = ref(false);
const isBulkSyncing = ref(false);

const ticketsWithExternalLinks = computed(() =>
  tickets.value.filter((t) => t.has_external_links),
);

// Pulls the status of linked tickets from their external providers.
async function bulkSyncFromExternal(): Promise<void> {
  const orgId = defaultOrg?.value?.id;
  if (!orgId || !auth.getToken) return;
  if (ticketsWithExternalLinks.value.length === 0) return;

  isBulkSyncing.value = true;
  try {
    await ticketsRepository.bulkSyncFromExternal({
      orgId,
      data: { ticket_ids: ticketsWithExternalLinks.value.map((t) => t.id) },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
  } catch {
    // The list still shows the last known status.
  } finally {
    isBulkSyncing.value = false;
  }
}

async function handleRefresh(): Promise<void> {
  await bulkSyncFromExternal();
  refresh();
}

// Syncs linked tickets once, after the first load.
const hasAutoSynced = ref(false);
watch(
  () => ticketsWithExternalLinks.value.length,
  async (count) => {
    if (count > 0 && !hasAutoSynced.value && !isLoading.value) {
      hasAutoSynced.value = true;
      await bulkSyncFromExternal();
      refresh();
    }
  },
);

function handleTicketUpdated(): void {
  refresh();
  if (selectedTicket.value) void loadTicketDetail(selectedTicket.value.id);
}

onMounted(() => {
  // Back from the ClickUp authorisation: continue the setup.
  if (route.query.clickup_oauth === "success") {
    showIntegrationsModal.value = true;
    void router.replace({ path: route.path, query: {} });
  }
  // A link to one ticket opens its detail.
  if (typeof route.query.ticket_id === "string") {
    void loadTicketDetail(route.query.ticket_id);
  }
});
</script>

<template>
  <div class="flex flex-col gap-8">
    <PageHeading description="Track and manage security remediation tickets.">
      <BrandEmphasis>Tickets</BrandEmphasis>
      <template #actions>
        <div
          role="group"
          aria-label="View"
          class="flex items-center gap-1 rounded-full border bg-card p-1"
        >
          <Button
            size="sm"
            :variant="viewMode === 'list' ? 'secondary' : 'ghost'"
            :aria-pressed="viewMode === 'list'"
            @click="viewMode = 'list'"
          >
            <List aria-hidden="true" />
            List
          </Button>
          <Button
            size="sm"
            :variant="viewMode === 'kanban' ? 'secondary' : 'ghost'"
            :aria-pressed="viewMode === 'kanban'"
            @click="viewMode = 'kanban'"
          >
            <Columns3 aria-hidden="true" />
            Kanban
          </Button>
        </div>
        <Button variant="outline" @click="showIntegrationsModal = true">
          <Plug aria-hidden="true" />
          Integrations
        </Button>
        <Button
          variant="outline"
          :disabled="isLoading || isBulkSyncing"
          @click="handleRefresh"
        >
          <RefreshCw
            aria-hidden="true"
            :class="{
              'animate-spin motion-reduce:animate-none':
                isLoading || isBulkSyncing,
            }"
          />
          Refresh
        </Button>
      </template>
    </PageHeading>

    <Alert v-if="hasError" variant="destructive" class="flex flex-col gap-3">
      <AlertDescription>The tickets could not be loaded.</AlertDescription>
      <Button variant="outline" class="w-fit" @click="refresh">
        Try again
      </Button>
    </Alert>

    <OwlEmptyState
      v-else-if="isEmpty"
      title="No tickets yet"
      description="Tickets come from vulnerability results. Run an analysis on a project, then create tickets to track remediation."
    >
      <Button :as="RouterLink" :to="{ name: 'projects' }" arrow>
        Go to Projects
      </Button>
    </OwlEmptyState>

    <template v-else>
      <ul
        v-if="loaded"
        aria-label="Ticket numbers"
        class="grid grid-cols-4 gap-4"
      >
        <StatTile label="Total" :value="quickStats.total" />
        <StatTile label="Open" :value="quickStats.open" />
        <StatTile label="Critical" :value="quickStats.critical" />
        <StatTile label="High priority" :value="quickStats.high" />
      </ul>

      <TicketsList
        v-if="viewMode === 'list' || !loaded"
        :tickets="tickets"
        :is-loading="!loaded"
        @select="loadTicketDetail"
      />
      <TicketsKanban
        v-else
        :tickets-by-status="ticketsByStatus"
        @select="loadTicketDetail"
        @update-status="updateTicketStatus"
      />
    </template>

    <TicketDetail
      v-if="selectedTicket"
      :ticket="selectedTicket"
      :is-loading="isLoadingDetail"
      :vulnerability-details="vulnerabilityDetails"
      :is-loading-vuln-details="isLoadingVulnDetails"
      @close="clearSelectedTicket"
      @updated="handleTicketUpdated"
    />

    <Dialog v-model:open="showIntegrationsModal">
      <DialogContent class="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket integrations</DialogTitle>
          <DialogDescription>
            Connect a ticket tool to sync tickets automatically.
          </DialogDescription>
        </DialogHeader>
        <IntegrationsConfigPanel />
      </DialogContent>
    </Dialog>
  </div>
</template>
