import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useStateStore } from '@/stores/state';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { TicketsRepository } from '../tickets.repository';
import {
    type TicketSummary,
    type TicketDetails,
    type TicketFilters,
    type TicketSortField,
    TicketStatus,
    TicketPriority
} from '../tickets.entity';

export interface UseTicketsDataOptions {
    projectId?: string;
    autoLoad?: boolean;
}

/**
 * useTicketsData - Tickets data management composable
 *
 * Handles:
 * - Loading paginated tickets list
 * - Filtering and sorting
 * - CRUD operations
 * - Selected ticket detail view
 */
export function useTicketsData(options: UseTicketsDataOptions = {}) {
    // Store setup
    const state = useStateStore();
    const { defaultOrg } = storeToRefs(useUserStore());
    const auth = useAuthStore();

    state.$reset();
    state.page = 'tickets';

    // Repository
    const ticketsRepository = new TicketsRepository();

    // ============================================
    // Reactive State
    // ============================================

    // List state
    const tickets = ref<TicketSummary[]>([]);
    const isLoading = ref(false);
    const hasError = ref(false);
    const errorMessage = ref<string | null>(null);

    // Pagination
    const currentPage = ref(0);
    const entriesPerPage = ref(20);
    const totalEntries = ref(0);
    const totalPages = ref(0);

    // Sorting
    const sortKey = ref<TicketSortField>('created_on');
    const sortDirection = ref<'ASC' | 'DESC'>('DESC');

    // Filters
    const filters = ref<TicketFilters>({});

    // Selected ticket
    const selectedTicket = ref<TicketDetails | null>(null);
    const isLoadingDetail = ref(false);

    // View mode (list or kanban)
    const viewMode = ref<'list' | 'kanban'>('list');

    // ============================================
    // Computed Properties
    // ============================================

    const isReady = computed(() => defaultOrg?.value && auth.getAuthenticated && auth.getToken);

    const hasTickets = computed(() => tickets.value.length > 0);

    const isEmpty = computed(() => !isLoading.value && !hasError.value && !hasTickets.value);

    // Group tickets by status for Kanban view
    const ticketsByStatus = computed(() => {
        const grouped: Record<TicketStatus, TicketSummary[]> = {
            [TicketStatus.OPEN]: [],
            [TicketStatus.IN_PROGRESS]: [],
            [TicketStatus.RESOLVED]: [],
            [TicketStatus.CLOSED]: [],
            [TicketStatus.WONT_FIX]: []
        };

        for (const ticket of tickets.value) {
            if (grouped[ticket.status]) {
                grouped[ticket.status].push(ticket);
            }
        }

        return grouped;
    });

    // Quick stats from current data
    const quickStats = computed(() => ({
        total: tickets.value.length,
        open: tickets.value.filter((t) => t.status === TicketStatus.OPEN).length,
        inProgress: tickets.value.filter((t) => t.status === TicketStatus.IN_PROGRESS).length,
        critical: tickets.value.filter((t) => t.priority === TicketPriority.CRITICAL).length,
        high: tickets.value.filter((t) => t.priority === TicketPriority.HIGH).length
    }));

    // ============================================
    // Actions
    // ============================================

    /**
     * Load tickets list
     */
    async function loadTickets() {
        if (!isReady.value || !defaultOrg?.value || !auth.getToken) {
            return;
        }

        isLoading.value = true;
        hasError.value = false;
        errorMessage.value = null;

        try {
            const response = options.projectId
                ? await ticketsRepository.getProjectTickets({
                      orgId: defaultOrg.value.id,
                      projectId: options.projectId,
                      bearerToken: auth.getToken,
                      pagination: {
                          page: currentPage.value,
                          entries_per_page: entriesPerPage.value
                      },
                      sort: {
                          sortKey: sortKey.value,
                          sortDirection: sortDirection.value
                      },
                      filters: filters.value,
                      handleBusinessErrors: true
                  })
                : await ticketsRepository.getTickets({
                      orgId: defaultOrg.value.id,
                      bearerToken: auth.getToken,
                      pagination: {
                          page: currentPage.value,
                          entries_per_page: entriesPerPage.value
                      },
                      sort: {
                          sortKey: sortKey.value,
                          sortDirection: sortDirection.value
                      },
                      filters: filters.value,
                      handleBusinessErrors: true
                  });

            tickets.value = response.data;
            totalEntries.value = response.total_entries;
            totalPages.value = response.total_pages;
        } catch (error) {
            hasError.value = true;
            errorMessage.value = error instanceof Error ? error.message : 'Failed to load tickets';
            console.error('Failed to load tickets:', error);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Load all tickets for Kanban view (no pagination limit)
     */
    async function loadAllTickets() {
        if (!isReady.value || !defaultOrg?.value || !auth.getToken) {
            return;
        }

        isLoading.value = true;
        hasError.value = false;

        try {
            const response = await ticketsRepository.getTickets({
                orgId: defaultOrg.value.id,
                bearerToken: auth.getToken,
                pagination: {
                    page: 0,
                    entries_per_page: 500 // Load more for Kanban
                },
                sort: {
                    sortKey: 'priority',
                    sortDirection: 'ASC' // Critical first
                },
                filters: {
                    ...filters.value,
                    // Exclude closed and won't fix from Kanban by default
                    status: filters.value.status || [
                        TicketStatus.OPEN,
                        TicketStatus.IN_PROGRESS,
                        TicketStatus.RESOLVED
                    ]
                },
                handleBusinessErrors: true
            });

            tickets.value = response.data;
            totalEntries.value = response.total_entries;
        } catch (error) {
            hasError.value = true;
            console.error('Failed to load tickets for Kanban:', error);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Load ticket details
     */
    async function loadTicketDetail(ticketId: string) {
        if (!isReady.value || !defaultOrg?.value || !auth.getToken) {
            return;
        }

        isLoadingDetail.value = true;

        try {
            const response = await ticketsRepository.getTicketById({
                orgId: defaultOrg.value.id,
                ticketId,
                bearerToken: auth.getToken,
                handleBusinessErrors: true
            });

            selectedTicket.value = response.data;
        } catch (error) {
            console.error('Failed to load ticket detail:', error);
            selectedTicket.value = null;
        } finally {
            isLoadingDetail.value = false;
        }
    }

    /**
     * Update ticket status (for Kanban drag and drop)
     */
    async function updateTicketStatus(ticketId: string, newStatus: TicketStatus) {
        if (!isReady.value || !defaultOrg?.value || !auth.getToken) {
            return false;
        }

        try {
            await ticketsRepository.updateTicket({
                orgId: defaultOrg.value.id,
                ticketId,
                bearerToken: auth.getToken,
                data: { status: newStatus },
                handleBusinessErrors: true
            });

            // Update local state
            const ticket = tickets.value.find((t) => t.id === ticketId);
            if (ticket) {
                ticket.status = newStatus;
            }

            return true;
        } catch (error) {
            console.error('Failed to update ticket status:', error);
            return false;
        }
    }

    /**
     * Set filters and reload
     */
    function setFilters(newFilters: TicketFilters) {
        filters.value = newFilters;
        currentPage.value = 0;
        loadTickets();
    }

    /**
     * Set sort and reload
     */
    function setSort(key: TicketSortField, direction: 'ASC' | 'DESC' = 'DESC') {
        sortKey.value = key;
        sortDirection.value = direction;
        loadTickets();
    }

    /**
     * Go to page
     */
    function goToPage(page: number) {
        currentPage.value = page;
        loadTickets();
    }

    /**
     * Switch view mode
     */
    function setViewMode(mode: 'list' | 'kanban') {
        viewMode.value = mode;
        if (mode === 'kanban') {
            loadAllTickets();
        } else {
            loadTickets();
        }
    }

    /**
     * Clear selected ticket
     */
    function clearSelectedTicket() {
        selectedTicket.value = null;
    }

    /**
     * Refresh data
     */
    function refresh() {
        if (viewMode.value === 'kanban') {
            loadAllTickets();
        } else {
            loadTickets();
        }
    }

    // ============================================
    // Watchers
    // ============================================

    // Auto-load when ready
    watch(
        isReady,
        (ready) => {
            if (ready && options.autoLoad !== false) {
                loadTickets();
            }
        },
        { immediate: true }
    );

    // ============================================
    // Return
    // ============================================

    return {
        // List state
        tickets,
        isLoading,
        hasError,
        errorMessage,
        hasTickets,
        isEmpty,

        // Pagination
        currentPage,
        entriesPerPage,
        totalEntries,
        totalPages,

        // Sorting
        sortKey,
        sortDirection,

        // Filters
        filters,

        // Selected ticket
        selectedTicket,
        isLoadingDetail,

        // View mode
        viewMode,

        // Kanban helpers
        ticketsByStatus,

        // Quick stats
        quickStats,

        // Actions
        loadTickets,
        loadAllTickets,
        loadTicketDetail,
        updateTicketStatus,
        setFilters,
        setSort,
        goToPage,
        setViewMode,
        clearSelectedTicket,
        refresh,

        // Store refs
        defaultOrg
    };
}
