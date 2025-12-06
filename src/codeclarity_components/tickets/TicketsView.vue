<script setup lang="ts">
import { useStateStore } from '@/stores/state';
import { defineAsyncComponent } from 'vue';
import { Icon } from '@iconify/vue';

import { PageHeader } from '@/base_components';
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';

import { useTicketsData } from './composables/useTicketsData';
import { Button } from '@/shadcn/ui/button';

// Async loaded sections
const TicketsList = defineAsyncComponent({
    loader: () => import('./sections/TicketsList.vue'),
    loadingComponent: LoadingComponent,
    delay: 200,
    errorComponent: ErrorComponent,
    timeout: 5000
});

const TicketsKanban = defineAsyncComponent({
    loader: () => import('./sections/TicketsKanban.vue'),
    loadingComponent: LoadingComponent,
    delay: 200,
    errorComponent: ErrorComponent,
    timeout: 5000
});

const TicketDetail = defineAsyncComponent({
    loader: () => import('./sections/TicketDetail.vue'),
    loadingComponent: LoadingComponent,
    delay: 200,
    errorComponent: ErrorComponent,
    timeout: 5000
});

// Page state
const state = useStateStore();
state.$reset();
state.page = 'tickets';

// Props
const props = defineProps<{
    page?: string;
}>();

// Get tickets data
const {
    tickets,
    isLoading,
    hasError,
    isEmpty,
    viewMode,
    selectedTicket,
    isLoadingDetail,
    quickStats,
    currentPage,
    totalPages,
    totalEntries,
    ticketsByStatus,
    setViewMode,
    loadTicketDetail,
    clearSelectedTicket,
    updateTicketStatus,
    refresh,
    goToPage
} = useTicketsData({ autoLoad: true });
</script>

<template>
    <main class="p-8 space-y-6">
        <div class="space-y-8 relative min-h-screen">
            <!-- Page Header -->
            <div class="mb-10">
                <div
                    class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
                >
                    <div>
                        <h1 class="text-4xl font-bold tracking-tight text-gray-900">Tickets</h1>
                        <p class="text-gray-600 mt-2 text-lg">
                            Track and manage security remediation tickets
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <!-- View Mode Toggle -->
                        <div
                            class="flex items-center bg-white rounded-lg border border-gray-200 p-1"
                        >
                            <button
                                class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                :class="
                                    viewMode === 'list'
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                "
                                @click="setViewMode('list')"
                            >
                                <Icon icon="solar:list-bold" class="h-4 w-4 inline mr-1" />
                                List
                            </button>
                            <button
                                class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                :class="
                                    viewMode === 'kanban'
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                "
                                @click="setViewMode('kanban')"
                            >
                                <Icon icon="solar:widget-4-bold" class="h-4 w-4 inline mr-1" />
                                Kanban
                            </button>
                        </div>

                        <!-- Refresh Button -->
                        <Button
                            variant="outline"
                            size="sm"
                            class="hidden sm:flex items-center gap-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                            :disabled="isLoading"
                            @click="refresh"
                        >
                            <Icon
                                :icon="
                                    isLoading ? 'solar:loading-linear' : 'solar:refresh-linear'
                                "
                                class="h-4 w-4"
                                :class="{ 'animate-spin': isLoading }"
                            />
                            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div
                v-if="!isEmpty && !hasError"
                class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
            >
                <div
                    class="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3"
                >
                    <div class="p-2 bg-blue-100 rounded-lg">
                        <Icon icon="solar:ticket-bold" class="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Total</p>
                        <p class="text-xl font-semibold">{{ totalEntries }}</p>
                    </div>
                </div>
                <div
                    class="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3"
                >
                    <div class="p-2 bg-yellow-100 rounded-lg">
                        <Icon icon="solar:hourglass-bold" class="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Open</p>
                        <p class="text-xl font-semibold">{{ quickStats.open }}</p>
                    </div>
                </div>
                <div
                    class="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3"
                >
                    <div class="p-2 bg-red-100 rounded-lg">
                        <Icon icon="solar:danger-bold" class="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Critical</p>
                        <p class="text-xl font-semibold">{{ quickStats.critical }}</p>
                    </div>
                </div>
                <div
                    class="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3"
                >
                    <div class="p-2 bg-orange-100 rounded-lg">
                        <Icon icon="solar:bell-bold" class="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">High Priority</p>
                        <p class="text-xl font-semibold">{{ quickStats.high }}</p>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading && isEmpty" class="flex items-center justify-center py-20">
                <LoadingComponent />
            </div>

            <!-- Error State -->
            <div v-else-if="hasError" class="text-center py-20">
                <Icon icon="solar:danger-triangle-bold" class="h-16 w-16 text-red-400 mx-auto" />
                <h3 class="mt-4 text-lg font-semibold text-gray-900">
                    Failed to load tickets
                </h3>
                <p class="mt-2 text-gray-600">Please try again later or contact support.</p>
                <Button class="mt-4" @click="refresh">
                    <Icon icon="solar:refresh-linear" class="h-4 w-4 mr-2" />
                    Try Again
                </Button>
            </div>

            <!-- Empty State -->
            <div v-else-if="isEmpty" class="text-center py-20">
                <div
                    class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"
                >
                    <Icon icon="solar:ticket-bold-duotone" class="h-12 w-12 text-gray-400" />
                </div>
                <h3 class="mt-6 text-lg font-semibold text-gray-900">No tickets yet</h3>
                <p class="mt-2 text-gray-600 max-w-md mx-auto">
                    Tickets are created from vulnerability scan results. Run an analysis on your
                    projects to find vulnerabilities, then create tickets to track remediation.
                </p>
                <RouterLink :to="{ name: 'projects' }">
                    <Button class="mt-6">
                        <Icon icon="solar:folder-bold" class="h-4 w-4 mr-2" />
                        Go to Projects
                    </Button>
                </RouterLink>
            </div>

            <!-- Content -->
            <div v-else>
                <!-- List View -->
                <TicketsList
                    v-if="viewMode === 'list'"
                    :tickets="tickets"
                    :is-loading="isLoading"
                    :current-page="currentPage"
                    :total-pages="totalPages"
                    :total-entries="totalEntries"
                    @select="loadTicketDetail"
                    @page-change="goToPage"
                />

                <!-- Kanban View -->
                <TicketsKanban
                    v-else
                    :tickets-by-status="ticketsByStatus"
                    :is-loading="isLoading"
                    @select="loadTicketDetail"
                    @update-status="updateTicketStatus"
                />
            </div>

            <!-- Ticket Detail Slide-over -->
            <TicketDetail
                v-if="selectedTicket"
                :ticket="selectedTicket"
                :is-loading="isLoadingDetail"
                @close="clearSelectedTicket"
                @updated="refresh"
            />
        </div>
    </main>
</template>
