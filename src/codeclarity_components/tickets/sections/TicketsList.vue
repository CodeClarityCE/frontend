<script setup lang="ts">
import { ArrowUpCircle, FileText, ShieldAlert } from "@lucide/vue";

import { DataTable, type DataTableColumn } from "@/base_components/data-table";
import { StatusBadge } from "@/base_components/page";
import { formatShortDate } from "@/utils/dateUtils";

import TicketPriorityBadge from "../components/TicketPriorityBadge.vue";
import { ticketRoute } from "../ticket-route";
import {
  TicketPriorityRank,
  TicketStatusLabels,
  TicketStatusTones,
  type TicketSummary,
  TicketType,
  TicketTypeLabels,
} from "../tickets.entity";

defineProps<{
  tickets: TicketSummary[];
  isLoading: boolean;
}>();

// The text filter, kept by the parent so it survives a visit to a ticket.
const filter = defineModel<string>("filter", { default: "" });

const columns: DataTableColumn<TicketSummary>[] = [
  {
    id: "ticket",
    accessorFn: (ticket) =>
      [ticket.title, ticket.vulnerability_id, ticket.affected_package]
        .filter(Boolean)
        .join(" "),
    header: "Ticket",
  },
  {
    id: "status",
    accessorFn: (ticket) => TicketStatusLabels[ticket.status],
    header: "Status",
  },
  {
    id: "priority",
    accessorFn: (ticket) => TicketPriorityRank[ticket.priority],
    header: "Priority",
    enableGlobalFilter: false,
  },
  { id: "project", accessorKey: "project_name", header: "Project" },
  {
    id: "created",
    accessorFn: (ticket) => new Date(ticket.created_on).getTime(),
    header: "Created",
    enableGlobalFilter: false,
  },
];
</script>

<template>
  <DataTable
    v-model:filter="filter"
    :columns="columns"
    :data="tickets"
    :loading="isLoading"
    :initial-sorting="[{ id: 'created', desc: true }]"
    :row-key="(ticket: TicketSummary) => ticket.id"
    caption="Tickets"
    filter-label="Filter tickets"
    empty-text="No tickets match."
    row-testid="ticket-row"
  >
    <template #cell-ticket="{ row }">
      <div class="flex items-start gap-3">
        <ShieldAlert
          v-if="row.type === TicketType.VULNERABILITY"
          aria-hidden="true"
          class="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <FileText
          v-else-if="row.type === TicketType.LICENSE"
          aria-hidden="true"
          class="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <ArrowUpCircle
          v-else
          aria-hidden="true"
          class="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div class="flex min-w-0 flex-col">
          <RouterLink
            :to="ticketRoute(row.id)"
            class="w-fit rounded-sm text-left font-semibold text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {{ row.title }}
          </RouterLink>
          <span class="text-xs text-muted-foreground">
            <span class="sr-only">{{ TicketTypeLabels[row.type] }}</span>
            <span v-if="row.vulnerability_id" class="font-mono">
              {{ row.vulnerability_id }}
            </span>
            <span v-if="row.vulnerability_id && row.affected_package">
              &middot;
            </span>
            <span v-if="row.affected_package">{{ row.affected_package }}</span>
          </span>
        </div>
      </div>
    </template>
    <template #cell-status="{ row }">
      <StatusBadge
        :tone="TicketStatusTones[row.status]"
        :label="TicketStatusLabels[row.status]"
      />
    </template>
    <template #cell-priority="{ row }">
      <TicketPriorityBadge :priority="row.priority" />
    </template>
    <template #cell-created="{ row }">
      {{ formatShortDate(row.created_on) }}
    </template>
  </DataTable>
</template>
