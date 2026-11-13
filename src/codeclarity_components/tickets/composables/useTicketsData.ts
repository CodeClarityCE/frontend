import { storeToRefs } from "pinia";
import { computed, type ComputedRef, type Ref, ref, watch } from "vue";

import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast } from "@/utils/toasts";

import {
  type TicketDetails,
  TicketPriority,
  TicketStatus,
  type TicketSummary,
  type VulnerabilityDetailsReport,
} from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

/** The API's largest page; every ticket is loaded so the table can sort and filter them all. */
const FETCH_PAGE_SIZE = 100;

export interface UseTicketsDataOptions {
  projectId?: string;
  autoLoad?: boolean;
}

export interface TicketsData {
  tickets: Ref<TicketSummary[]>;
  isLoading: Ref<boolean>;
  loaded: Ref<boolean>;
  hasError: Ref<boolean>;
  isEmpty: ComputedRef<boolean>;
  selectedTicket: Ref<TicketDetails | null>;
  isLoadingDetail: Ref<boolean>;
  vulnerabilityDetails: Ref<VulnerabilityDetailsReport | null>;
  isLoadingVulnDetails: Ref<boolean>;
  viewMode: Ref<"list" | "kanban">;
  ticketsByStatus: ComputedRef<Record<TicketStatus, TicketSummary[]>>;
  quickStats: ComputedRef<{
    total: number;
    open: number;
    inProgress: number;
    critical: number;
    high: number;
  }>;
  loadTickets: () => Promise<void>;
  loadTicketDetail: (ticketId: string) => Promise<void>;
  updateTicketStatus: (
    ticketId: string,
    newStatus: TicketStatus,
  ) => Promise<boolean>;
  clearSelectedTicket: () => void;
  refresh: () => void;
}

/** Loads every ticket of the organisation (or one project) and the selected ticket. */
export function useTicketsData(
  options: UseTicketsDataOptions = {},
): TicketsData {
  const { defaultOrg } = storeToRefs(useUserStore());
  const auth = useAuthStore();
  const ticketsRepository = new TicketsRepository();

  const tickets = ref<TicketSummary[]>([]);
  const isLoading = ref(false);
  const loaded = ref(false);
  const hasError = ref(false);

  const selectedTicket = ref<TicketDetails | null>(null);
  const isLoadingDetail = ref(false);
  const vulnerabilityDetails = ref<VulnerabilityDetailsReport | null>(null);
  const isLoadingVulnDetails = ref(false);

  const viewMode = ref<"list" | "kanban">("list");

  const isReady = computed(
    () => defaultOrg?.value && auth.getAuthenticated && auth.getToken,
  );

  const isEmpty = computed(
    () => loaded.value && !hasError.value && tickets.value.length === 0,
  );

  const ticketsByStatus = computed(() => {
    const grouped: Record<TicketStatus, TicketSummary[]> = {
      [TicketStatus.OPEN]: [],
      [TicketStatus.IN_PROGRESS]: [],
      [TicketStatus.RESOLVED]: [],
      [TicketStatus.CLOSED]: [],
      [TicketStatus.WONT_FIX]: [],
    };
    for (const ticket of tickets.value) {
      grouped[ticket.status]?.push(ticket);
    }
    return grouped;
  });

  const quickStats = computed(() => ({
    total: tickets.value.length,
    open: tickets.value.filter((t) => t.status === TicketStatus.OPEN).length,
    inProgress: tickets.value.filter(
      (t) => t.status === TicketStatus.IN_PROGRESS,
    ).length,
    critical: tickets.value.filter(
      (t) => t.priority === TicketPriority.CRITICAL,
    ).length,
    high: tickets.value.filter((t) => t.priority === TicketPriority.HIGH)
      .length,
  }));

  async function fetchAll(
    orgId: string,
    token: string,
  ): Promise<TicketSummary[]> {
    const all: TicketSummary[] = [];
    for (let page = 0; ; page++) {
      const request = {
        orgId,
        bearerToken: token,
        pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
        sort: { sortKey: "created_on", sortDirection: "DESC" },
        handleBusinessErrors: true,
      };
      const response = options.projectId
        ? await ticketsRepository.getProjectTickets({
            ...request,
            projectId: options.projectId,
          })
        : await ticketsRepository.getTickets(request);
      all.push(...response.data);
      if (page + 1 >= response.total_pages) return all;
    }
  }

  async function loadTickets(): Promise<void> {
    const orgId = defaultOrg?.value?.id;
    if (!auth.getAuthenticated || !orgId || !auth.getToken) return;

    isLoading.value = true;
    try {
      tickets.value = await fetchAll(orgId, auth.getToken);
      hasError.value = false;
    } catch {
      hasError.value = true;
    } finally {
      isLoading.value = false;
      loaded.value = true;
    }
  }

  async function loadTicketDetail(ticketId: string): Promise<void> {
    const orgId = defaultOrg?.value?.id;
    if (!auth.getAuthenticated || !orgId || !auth.getToken) return;

    isLoadingDetail.value = true;
    try {
      const response = await ticketsRepository.getTicketById({
        orgId,
        ticketId,
        bearerToken: auth.getToken,
        handleBusinessErrors: true,
      });
      selectedTicket.value = response.data;
      // The API reads the source analysis, or the knowledge DB as a fallback.
      if (response.data.vulnerability_id) {
        void loadVulnerabilityDetails(ticketId);
      } else {
        vulnerabilityDetails.value = null;
      }
    } catch {
      selectedTicket.value = null;
      vulnerabilityDetails.value = null;
      errorToast("Failed to load the ticket");
    } finally {
      isLoadingDetail.value = false;
    }
  }

  async function loadVulnerabilityDetails(ticketId: string): Promise<void> {
    const orgId = defaultOrg?.value?.id;
    if (!auth.getAuthenticated || !orgId || !auth.getToken) return;

    isLoadingVulnDetails.value = true;
    try {
      const response = await ticketsRepository.getVulnerabilityDetails({
        orgId,
        ticketId,
        bearerToken: auth.getToken,
        handleBusinessErrors: true,
        handleHTTPErrors: true,
        handleOtherErrors: true,
      });
      vulnerabilityDetails.value = response.data;
    } catch {
      vulnerabilityDetails.value = null;
    } finally {
      isLoadingVulnDetails.value = false;
    }
  }

  async function updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus,
  ): Promise<boolean> {
    const orgId = defaultOrg?.value?.id;
    if (!auth.getAuthenticated || !orgId || !auth.getToken) return false;

    try {
      await ticketsRepository.updateTicket({
        orgId,
        ticketId,
        bearerToken: auth.getToken,
        data: { status: newStatus },
        handleBusinessErrors: true,
      });
      const ticket = tickets.value.find((t) => t.id === ticketId);
      if (ticket) ticket.status = newStatus;
      return true;
    } catch {
      errorToast("Failed to update the ticket status");
      return false;
    }
  }

  function clearSelectedTicket(): void {
    selectedTicket.value = null;
    vulnerabilityDetails.value = null;
  }

  function refresh(): void {
    void loadTickets();
  }

  watch(
    isReady,
    (ready) => {
      if (ready && options.autoLoad !== false) void loadTickets();
    },
    { immediate: true },
  );

  return {
    tickets,
    isLoading,
    loaded,
    hasError,
    isEmpty,
    selectedTicket,
    isLoadingDetail,
    vulnerabilityDetails,
    isLoadingVulnDetails,
    viewMode,
    ticketsByStatus,
    quickStats,
    loadTickets,
    loadTicketDetail,
    updateTicketStatus,
    clearSelectedTicket,
    refresh,
  };
}
