<script setup lang="ts">
import { Link } from "@lucide/vue";

import TicketPriorityBadge from "../components/TicketPriorityBadge.vue";
import {
  KanbanColumns,
  type TicketStatus,
  type TicketSummary,
} from "../tickets.entity";

const props = defineProps<{
  ticketsByStatus: Record<TicketStatus, TicketSummary[]>;
}>();

const emit = defineEmits<{
  select: [ticketId: string];
  updateStatus: [ticketId: string, newStatus: TicketStatus];
}>();

// Dragging a card to another column changes its status; the detail panel
// offers the same change from the keyboard.
let draggedTicketId: string | null = null;

function onDragStart(event: DragEvent, ticketId: string): void {
  draggedTicketId = ticketId;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ticketId);
  }
}

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

function onDrop(event: DragEvent, newStatus: TicketStatus): void {
  event.preventDefault();
  if (draggedTicketId) {
    emit("updateStatus", draggedTicketId, newStatus);
    draggedTicketId = null;
  }
}

function count(status: TicketStatus): number {
  return props.ticketsByStatus[status]?.length ?? 0;
}

function columnLabel(label: string, status: TicketStatus): string {
  const n = count(status);
  return `${label}, ${n} ${n === 1 ? "ticket" : "tickets"}`;
}
</script>

<template>
  <div class="grid grid-cols-4 gap-4">
    <section
      v-for="column in KanbanColumns"
      :key="column.status"
      :aria-labelledby="`kanban-${column.status}`"
      class="flex min-w-0 flex-col rounded-card border bg-muted"
      @dragover="onDragOver"
      @drop="onDrop($event, column.status)"
    >
      <h2
        :id="`kanban-${column.status}`"
        class="flex items-center justify-between border-b px-4 py-3 text-sm font-semibold text-foreground-strong"
      >
        {{ column.label }}
        <span
          class="rounded-full border bg-card px-2 py-0.5 text-xs tabular-nums text-muted-foreground"
        >
          {{ count(column.status) }}
        </span>
      </h2>
      <ul
        :aria-label="columnLabel(column.label, column.status)"
        class="flex min-h-48 flex-col gap-3 p-3"
      >
        <li
          v-for="ticket in ticketsByStatus[column.status]"
          :key="ticket.id"
          draggable="true"
          @dragstart="onDragStart($event, ticket.id)"
        >
          <button
            type="button"
            class="flex w-full flex-col gap-3 rounded-card border bg-card p-4 text-left shadow-card transition-shadow duration-150 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            @click="emit('select', ticket.id)"
          >
            <TicketPriorityBadge :priority="ticket.priority" />
            <span
              class="line-clamp-2 text-sm font-semibold text-foreground-strong"
            >
              {{ ticket.title }}
            </span>
            <span
              v-if="ticket.vulnerability_id || ticket.affected_package"
              class="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span v-if="ticket.vulnerability_id" class="font-mono">
                {{ ticket.vulnerability_id }}
              </span>
              <span v-if="ticket.affected_package" class="truncate">
                {{ ticket.affected_package }}
              </span>
            </span>
            <span
              class="flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground"
            >
              <span class="truncate">{{ ticket.project_name }}</span>
              <span class="flex items-center gap-2">
                <span v-if="ticket.assigned_to_name">
                  {{ ticket.assigned_to_name }}
                </span>
                <span
                  v-if="ticket.has_external_links"
                  class="flex items-center gap-1"
                >
                  <Link aria-hidden="true" class="size-3" />
                  Synced
                </span>
              </span>
            </span>
          </button>
        </li>
        <li
          v-if="count(column.status) === 0"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          No tickets
        </li>
      </ul>
    </section>
  </div>
</template>
