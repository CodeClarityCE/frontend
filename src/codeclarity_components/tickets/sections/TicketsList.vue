<script setup lang="ts">
import { ArrowUpCircle, FileText, ShieldAlert } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";

import { DataTable } from "@/base_components/data-table";
import { StatusBadge } from "@/base_components/page";

import TicketPriorityBadge from "../components/TicketPriorityBadge.vue";
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

const emit = defineEmits<{
  select: [ticketId: string];
}>();

const columns: ColumnDef<TicketSummary, unknown>[] = [
  {
    id: "ticket",
    accessorFn: (ticket) =>
      [ticket.title, ticket.vulnerability_id, ticket.affected_package]
        .filter(Boolean)
        .join(" "),
    header: "Ticket",
  },
  { id: "status", accessorFn: statusLabel, header: "Status" },
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

function statusLabel(ticket: TicketSummary): string {
  return ticket.external_status ?? TicketStatusLabels[ticket.status];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <DataTable
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
          <button
            type="button"
            class="w-fit rounded-sm text-left font-semibold text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            @click="emit('select', row.id)"
          >
            {{ row.title }}
          </button>
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
        :label="statusLabel(row)"
      />
    </template>
    <template #cell-priority="{ row }">
      <TicketPriorityBadge :priority="row.priority" />
    </template>
    <template #cell-created="{ row }">
      {{ formatDate(row.created_on) }}
    </template>
  </DataTable>
</template>
