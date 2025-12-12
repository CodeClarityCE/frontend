<script setup lang="ts">
import { Icon } from '@iconify/vue';
import {
    type TicketSummary,
    type TicketStatus,
    TicketPriorityColors,
    TicketPriorityLabels,
    KanbanColumns
} from '../tickets.entity';

const props = defineProps<{
    ticketsByStatus: Record<TicketStatus, TicketSummary[]>;
    isLoading: boolean;
}>();

const emit = defineEmits<{
    select: [ticketId: string];
    updateStatus: [ticketId: string, newStatus: TicketStatus];
}>();

// Drag and drop state
let draggedTicketId: string | null = null;

function onDragStart(event: DragEvent, ticketId: string) {
    draggedTicketId = ticketId;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', ticketId);
    }
}

function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }
}

function onDrop(event: DragEvent, newStatus: TicketStatus) {
    event.preventDefault();
    if (draggedTicketId) {
        emit('updateStatus', draggedTicketId, newStatus);
        draggedTicketId = null;
    }
}

function getColumnCount(status: TicketStatus): number {
    return props.ticketsByStatus[status]?.length || 0;
}
</script>

<template>
    <div class="flex gap-4 overflow-x-auto pb-4">
        <!-- Kanban Columns -->
        <div
            v-for="column in KanbanColumns"
            :key="column.status"
            class="flex-shrink-0 w-80 bg-gray-50 rounded-xl border border-gray-200"
            @dragover="onDragOver"
            @drop="onDrop($event, column.status)"
        >
            <!-- Column Header -->
            <div
                class="px-4 py-3 border-b-2 flex items-center justify-between"
                :class="column.color"
            >
                <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-gray-900">{{ column.label }}</h3>
                    <span
                        class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-white rounded-full border border-gray-200"
                    >
                        {{ getColumnCount(column.status) }}
                    </span>
                </div>
            </div>

            <!-- Column Body -->
            <div class="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                <div
                    v-for="ticket in ticketsByStatus[column.status]"
                    :key="ticket.id"
                    class="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow group"
                    draggable="true"
                    @dragstart="onDragStart($event, ticket.id)"
                    @click="emit('select', ticket.id)"
                >
                    <!-- Ticket Card -->
                    <div class="space-y-3">
                        <!-- Priority Badge -->
                        <div class="flex items-center justify-between">
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                :class="TicketPriorityColors[ticket.priority]"
                            >
                                {{ TicketPriorityLabels[ticket.priority] }}
                            </span>
                            <Icon
                                icon="solar:menu-dots-bold"
                                class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>

                        <!-- Title -->
                        <h4 class="text-sm font-medium text-gray-900 line-clamp-2">
                            {{ ticket.title }}
                        </h4>

                        <!-- Metadata -->
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                            <span
                                v-if="ticket.vulnerability_id"
                                class="font-mono bg-gray-100 px-1.5 py-0.5 rounded"
                            >
                                {{ ticket.vulnerability_id }}
                            </span>
                            <span v-if="ticket.affected_package" class="truncate">
                                {{ ticket.affected_package }}
                            </span>
                        </div>

                        <!-- Footer -->
                        <div
                            class="flex items-center justify-between pt-2 border-t border-gray-100"
                        >
                            <span class="text-xs text-gray-400">
                                {{ ticket.project_name }}
                            </span>
                            <div class="flex items-center gap-1">
                                <div
                                    v-if="ticket.assigned_to_name"
                                    class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                                    :title="ticket.assigned_to_name"
                                >
                                    {{ ticket.assigned_to_name.charAt(0).toUpperCase() }}
                                </div>
                                <div
                                    v-if="ticket.has_external_links"
                                    class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"
                                    title="Synced to external system"
                                >
                                    <Icon icon="solar:link-bold" class="w-3 h-3 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div
                    v-if="getColumnCount(column.status) === 0"
                    class="flex flex-col items-center justify-center py-8 text-gray-400"
                >
                    <Icon icon="solar:inbox-linear" class="w-8 h-8 mb-2" />
                    <p class="text-sm">No tickets</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
