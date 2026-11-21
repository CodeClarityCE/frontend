<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  Archive,
  ArrowUpRight,
  ChevronDown,
  CircleCheck,
  CircleX,
  Link,
  Play,
  RefreshCw,
  Unlink,
} from "@lucide/vue";
import { computed, onMounted, ref } from "vue";

import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { formatShortDate } from "@/utils/dateUtils";
import { errorToast } from "@/utils/toasts";

import TicketDueDate from "../components/TicketDueDate.vue";
import {
  ExternalProviderIcons,
  ExternalProviderLabels,
  type ExternalTicketProvider,
  type IntegrationConfigSummary,
  type TicketDetails,
  TicketStatus,
} from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

// The ticket's actions and facts: status changes, sync, assignee, dates and external links.
const props = defineProps<{
  orgId: string;
  ticket: TicketDetails;
}>();

const emit = defineEmits<{ updated: [] }>();

const auth = useAuthStore();
const repository = new TicketsRepository();

const isSyncing = ref(false);
const isUnlinking = ref<string | null>(null);
const isSyncingFromExternal = ref<string | null>(null);
const isUpdatingStatus = ref(false);
const integrations = ref<IntegrationConfigSummary[]>([]);

const errorOptions = {
  handleBusinessErrors: true,
  handleHTTPErrors: true,
  handleOtherErrors: true,
} as const;

// Runs one request with the token, toasting on failure.
async function run(
  failure: string,
  request: (bearerToken: string) => Promise<unknown>,
): Promise<boolean> {
  if (!auth.getToken) return false;
  try {
    await request(auth.getToken);
    return true;
  } catch {
    errorToast(failure);
    return false;
  }
}

async function loadIntegrations(): Promise<void> {
  if (!auth.getToken) return;
  try {
    const response = await repository.getIntegrations({
      orgId: props.orgId,
      bearerToken: auth.getToken,
      ...errorOptions,
    });
    integrations.value = response.data.filter((i) => i.enabled);
  } catch {
    // Without integrations the Sync menu stays hidden.
  }
}

async function syncToProvider(provider: ExternalTicketProvider): Promise<void> {
  isSyncing.value = true;
  const ok = await run("Failed to sync the ticket", (bearerToken) =>
    repository.syncTicket({
      orgId: props.orgId,
      ticketId: props.ticket.id,
      provider,
      bearerToken,
      ...errorOptions,
    }),
  );
  isSyncing.value = false;
  if (ok) emit("updated");
}

async function unlink(linkId: string): Promise<void> {
  isUnlinking.value = linkId;
  const ok = await run("Failed to unlink the ticket", (bearerToken) =>
    repository.unlinkTicket({
      orgId: props.orgId,
      ticketId: props.ticket.id,
      linkId,
      bearerToken,
      ...errorOptions,
    }),
  );
  isUnlinking.value = null;
  if (ok) emit("updated");
}

async function syncFromExternal(linkId: string): Promise<void> {
  if (!auth.getToken) return;
  isSyncingFromExternal.value = linkId;
  try {
    const result = await repository.syncFromExternal({
      orgId: props.orgId,
      ticketId: props.ticket.id,
      linkId,
      bearerToken: auth.getToken,
      ...errorOptions,
    });
    if (result.data.updated) emit("updated");
  } catch {
    errorToast("Failed to sync the status");
  } finally {
    isSyncingFromExternal.value = null;
  }
}

async function updateStatus(status: TicketStatus): Promise<void> {
  isUpdatingStatus.value = true;
  const ok = await run("Failed to update the ticket status", (bearerToken) =>
    repository.updateTicket({
      orgId: props.orgId,
      ticketId: props.ticket.id,
      data: { status },
      bearerToken,
      ...errorOptions,
    }),
  );
  isUpdatingStatus.value = false;
  if (ok) emit("updated");
}

// Providers the ticket is not linked to yet.
const syncProviders = computed(() => {
  const linked = new Set(props.ticket.external_links.map((l) => l.provider));
  return integrations.value.filter((i) => !linked.has(i.provider));
});

const isActive = computed(
  () =>
    props.ticket.status === TicketStatus.OPEN ||
    props.ticket.status === TicketStatus.IN_PROGRESS,
);

const providerLabel = (provider: ExternalTicketProvider): string =>
  ExternalProviderLabels[provider] || provider;

onMounted(() => {
  void loadIntegrations();
});
</script>

<template>
  <aside aria-label="Ticket details" class="flex flex-col gap-4">
    <div class="flex flex-col gap-2 rounded-card border bg-card p-4">
      <Button
        v-if="ticket.status === TicketStatus.OPEN"
        :disabled="isUpdatingStatus"
        @click="updateStatus(TicketStatus.IN_PROGRESS)"
      >
        <Play aria-hidden="true" />
        Start progress
      </Button>
      <Button
        v-if="ticket.status === TicketStatus.IN_PROGRESS"
        :disabled="isUpdatingStatus"
        @click="updateStatus(TicketStatus.RESOLVED)"
      >
        <CircleCheck aria-hidden="true" />
        Mark resolved
      </Button>
      <Button
        v-if="ticket.status === TicketStatus.RESOLVED"
        variant="outline"
        :disabled="isUpdatingStatus"
        @click="updateStatus(TicketStatus.CLOSED)"
      >
        <Archive aria-hidden="true" />
        Close ticket
      </Button>
      <Button
        v-if="isActive"
        variant="outline"
        :disabled="isUpdatingStatus"
        @click="updateStatus(TicketStatus.WONT_FIX)"
      >
        <CircleX aria-hidden="true" />
        Won't fix
      </Button>
      <DropdownMenu v-if="syncProviders.length > 0">
        <DropdownMenuTrigger as-child>
          <Button variant="outline" :disabled="isSyncing">
            <Spinner v-if="isSyncing" />
            <Link v-else aria-hidden="true" />
            Sync
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            v-for="integration in syncProviders"
            :key="integration.provider"
            @click="syncToProvider(integration.provider)"
          >
            <Icon
              :icon="ExternalProviderIcons[integration.provider]"
              aria-hidden="true"
              class="size-4"
            />
            Sync to {{ ExternalProviderLabels[integration.provider] }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <dl
      class="grid grid-cols-2 gap-4 rounded-card border bg-card p-4 text-sm lg:grid-cols-1"
    >
      <div>
        <dt class="text-xs text-muted-foreground">Project</dt>
        <dd class="font-medium break-words text-foreground-strong">
          {{ ticket.project_name }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">Assigned to</dt>
        <dd class="text-foreground-strong">
          {{ ticket.assigned_to_name ?? "Unassigned" }}
        </dd>
      </div>
      <div class="col-span-2 lg:col-span-1">
        <dt class="text-xs text-muted-foreground">Due date</dt>
        <dd class="text-foreground-strong">
          <TicketDueDate
            :ticket-id="ticket.id"
            :due-date="ticket.due_date"
            @updated="emit('updated')"
          />
        </dd>
      </div>
      <div v-if="ticket.occurrence_count > 0 && !ticket.remediation">
        <dt class="text-xs text-muted-foreground">Occurrences</dt>
        <dd class="text-foreground-strong tabular-nums">
          {{ ticket.active_occurrence_count }} active of
          {{ ticket.occurrence_count }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">Created</dt>
        <dd class="text-foreground-strong">
          {{ formatShortDate(ticket.created_on, { fallback: "Not set" }) }}
          <span class="text-muted-foreground">by</span>
          {{ ticket.created_by_name }}
        </dd>
      </div>
      <div v-if="ticket.resolved_on">
        <dt class="text-xs text-muted-foreground">Resolved</dt>
        <dd class="text-foreground-strong">
          {{ formatShortDate(ticket.resolved_on, { fallback: "Not set" }) }}
        </dd>
      </div>
    </dl>

    <section
      v-if="ticket.external_links.length > 0"
      aria-labelledby="ticket-links"
      class="flex flex-col gap-3 rounded-card border bg-card p-4"
    >
      <h2
        id="ticket-links"
        class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        External links
      </h2>
      <ul class="flex flex-col gap-2">
        <li
          v-for="link in ticket.external_links"
          :key="link.id"
          class="flex items-center gap-1"
        >
          <a
            :href="link.external_url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon
              v-if="ExternalProviderIcons[link.provider]"
              :icon="ExternalProviderIcons[link.provider]"
              aria-hidden="true"
              class="size-4 shrink-0"
            />
            <Link v-else aria-hidden="true" class="size-4 shrink-0" />
            <span class="flex min-w-0 flex-col">
              <span class="font-medium text-foreground-strong">{{
                providerLabel(link.provider)
              }}</span>
              <span class="text-xs break-all text-muted-foreground">{{
                link.external_id
              }}</span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              class="size-3.5 shrink-0 text-muted-foreground"
            />
          </a>
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-label="`Sync status from ${providerLabel(link.provider)}`"
            :disabled="isSyncingFromExternal === link.id"
            @click="syncFromExternal(link.id)"
          >
            <RefreshCw
              aria-hidden="true"
              :class="{
                'animate-spin motion-reduce:animate-none':
                  isSyncingFromExternal === link.id,
              }"
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-label="`Unlink from ${providerLabel(link.provider)}`"
            :disabled="isUnlinking === link.id"
            @click="unlink(link.id)"
          >
            <Unlink aria-hidden="true" />
          </Button>
        </li>
      </ul>
    </section>
  </aside>
</template>
