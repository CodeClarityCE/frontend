<script setup lang="ts">
import { Icon } from "@iconify/vue";

import { PaginationComponent } from "@/base_components";

import {
  TicketPriorityColors,
  TicketPriorityLabels,
  TicketStatusColors,
  TicketStatusLabels,
  type TicketSummary,
  TicketTypeColors,
} from "../tickets.entity";

defineProps<{
  tickets: TicketSummary[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
}>();

const emit = defineEmits<{
  select: [ticketId: string];
  pageChange: [page: number];
}>();

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(date);
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Table Header -->
    <div
      class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      <div class="col-span-4">Ticket</div>
      <div class="col-span-2">Status</div>
      <div class="col-span-2">Priority</div>
      <div class="col-span-2">Project</div>
      <div class="col-span-2">Created</div>
    </div>

    <!-- Table Body -->
    <div class="divide-y divide-gray-100">
      <div
        v-for="ticket in tickets"
        :key="ticket.id"
        class="group px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
        @click="emit('select', ticket.id)"
      >
        <!-- Desktop Layout -->
        <div class="hidden lg:grid grid-cols-12 gap-4 items-center">
          <!-- Ticket Info -->
          <div class="col-span-4">
            <div class="flex items-start gap-3">
              <div
                class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                :class="TicketTypeColors[ticket.type]"
              >
                <Icon
                  v-if="ticket.type === 'VULNERABILITY'"
                  icon="solar:shield-warning-bold"
                  class="w-4 h-4"
                />
                <Icon
                  v-else-if="ticket.type === 'LICENSE'"
                  icon="solar:document-bold"
                  class="w-4 h-4"
                />
                <Icon v-else icon="solar:upload-bold" class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p
                  class="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600"
                >
                  {{ ticket.title }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    v-if="ticket.vulnerability_id"
                    class="text-xs text-gray-500 font-mono"
                  >
                    {{ ticket.vulnerability_id }}
                  </span>
                  <span
                    v-if="ticket.affected_package"
                    class="text-xs text-gray-400"
                  >
                    {{ ticket.affected_package }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div class="col-span-2">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
              :class="TicketStatusColors[ticket.status]"
            >
              {{ ticket.external_status ?? TicketStatusLabels[ticket.status] }}
            </span>
          </div>

          <!-- Priority -->
          <div class="col-span-2">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="TicketPriorityColors[ticket.priority]"
            >
              {{ TicketPriorityLabels[ticket.priority] }}
            </span>
          </div>

          <!-- Project -->
          <div class="col-span-2">
            <p class="text-sm text-gray-600 truncate">
              {{ ticket.project_name }}
            </p>
          </div>

          <!-- Created -->
          <div class="col-span-2 flex items-center justify-between">
            <span class="text-sm text-gray-500">
              {{ getRelativeTime(ticket.created_on) }}
            </span>
            <Icon
              icon="solar:alt-arrow-right-linear"
              class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>

        <!-- Mobile Layout -->
        <div class="lg:hidden space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div
                class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                :class="TicketTypeColors[ticket.type]"
              >
                <Icon
                  v-if="ticket.type === 'VULNERABILITY'"
                  icon="solar:shield-warning-bold"
                  class="w-4 h-4"
                />
                <Icon
                  v-else-if="ticket.type === 'LICENSE'"
                  icon="solar:document-bold"
                  class="w-4 h-4"
                />
                <Icon v-else icon="solar:upload-bold" class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ ticket.title }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ ticket.project_name }}
                </p>
              </div>
            </div>
            <Icon
              icon="solar:alt-arrow-right-linear"
              class="w-4 h-4 text-gray-400 shrink-0"
            />
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
              :class="TicketStatusColors[ticket.status]"
            >
              {{ ticket.external_status ?? TicketStatusLabels[ticket.status] }}
            </span>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="TicketPriorityColors[ticket.priority]"
            >
              {{ TicketPriorityLabels[ticket.priority] }}
            </span>
            <span class="text-xs text-gray-400">
              {{ getRelativeTime(ticket.created_on) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between"
    >
      <p class="text-sm text-gray-500">
        Showing {{ tickets.length }} of {{ totalEntries }} tickets
      </p>
      <PaginationComponent
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="emit('pageChange', $event)"
      />
    </div>
  </div>
</template>
