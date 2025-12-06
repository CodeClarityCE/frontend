import { Entity } from '../../utils/api/BaseEntity';
import { DataResponse } from '../../utils/api/responses/DataResponse';
import { PaginatedResponse } from '../../utils/api/responses/PaginatedResponse';
import { CreatedResponse } from '../../utils/api/responses/CreatedResponse';
import { NoDataResponse } from '../../utils/api/responses/NoDataResponse';
import {
    BaseRepository,
    type AuthRepoMethodGetRequestOptions,
    type AuthRepoMethodPostRequestOptions,
    type AuthRepoMethodPatchRequestOptions,
    type AuthRepoMethodEmptyDeleteRequestOptions,
    type PaginatedRepoMethodRequestOptions,
    type SortableRepoMethodRequestOptions
} from '../../utils/api/BaseRepository';
import {
    TicketSummary,
    TicketDetails,
    TicketEvent,
    TicketDashboardStats,
    type CreateTicketRequest,
    type UpdateTicketRequest,
    type BulkUpdateTicketsRequest,
    type CheckDuplicateRequest,
    type BulkUpdateResult,
    type DuplicateCheckResult,
    type TicketFilters,
    type TicketSortField
} from './tickets.entity';

// ============================================
// Request Option Interfaces
// ============================================

export interface GetTicketsRequestOptions
    extends AuthRepoMethodGetRequestOptions,
        PaginatedRepoMethodRequestOptions,
        SortableRepoMethodRequestOptions {
    orgId: string;
    filters?: TicketFilters;
}

export interface GetProjectTicketsRequestOptions
    extends AuthRepoMethodGetRequestOptions,
        PaginatedRepoMethodRequestOptions,
        SortableRepoMethodRequestOptions {
    orgId: string;
    projectId: string;
    filters?: TicketFilters;
}

export interface GetTicketByIdRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    ticketId: string;
}

export interface GetTicketEventsRequestOptions
    extends AuthRepoMethodGetRequestOptions,
        PaginatedRepoMethodRequestOptions {
    orgId: string;
    ticketId: string;
}

export interface GetDashboardStatsRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
}

export interface CreateTicketRequestOptions
    extends AuthRepoMethodPostRequestOptions<CreateTicketRequest> {
    orgId: string;
}

export interface UpdateTicketRequestOptions
    extends AuthRepoMethodPatchRequestOptions<UpdateTicketRequest> {
    orgId: string;
    ticketId: string;
}

export interface BulkUpdateTicketsRequestOptions
    extends AuthRepoMethodPatchRequestOptions<BulkUpdateTicketsRequest> {
    orgId: string;
}

export interface DeleteTicketRequestOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
    orgId: string;
    ticketId: string;
}

export interface CheckDuplicateRequestOptions
    extends AuthRepoMethodPostRequestOptions<CheckDuplicateRequest> {
    orgId: string;
}

// ============================================
// Repository Implementation
// ============================================

export class TicketsRepository extends BaseRepository {
    /**
     * Get paginated list of tickets for an organization
     */
    async getTickets(options: GetTicketsRequestOptions): Promise<PaginatedResponse<TicketSummary>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets`;

        const queryParams: Record<string, string | number | string[] | undefined> = {
            page: options.pagination.page,
            entries_per_page: options.pagination.entries_per_page,
            sort_key: options.sort.sortKey,
            sort_direction: options.sort.sortDirection
        };

        // Add filter parameters
        if (options.filters) {
            if (options.filters.status?.length) {
                queryParams.status = options.filters.status;
            }
            if (options.filters.priority?.length) {
                queryParams.priority = options.filters.priority;
            }
            if (options.filters.type?.length) {
                queryParams.type = options.filters.type;
            }
            if (options.filters.project_id) {
                queryParams.project_id = options.filters.project_id;
            }
            if (options.filters.assigned_to_id) {
                queryParams.assigned_to_id = options.filters.assigned_to_id;
            }
            if (options.filters.has_external_link !== undefined) {
                queryParams.has_external_link = options.filters.has_external_link ? '1' : '0';
            }
            if (options.filters.vulnerability_id) {
                queryParams.vulnerability_id = options.filters.vulnerability_id;
            }
            if (options.filters.severity_class?.length) {
                queryParams.severity_class = options.filters.severity_class;
            }
            if (options.filters.created_after) {
                queryParams.created_after = options.filters.created_after;
            }
            if (options.filters.created_before) {
                queryParams.created_before = options.filters.created_before;
            }
        }

        const response = await this.getRequest<PaginatedResponse<TicketSummary>>({
            queryParams,
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        const paginatedData = Entity.unMarshal<PaginatedResponse<TicketSummary>>(
            response,
            PaginatedResponse<TicketSummary>
        );
        paginatedData.data = Entity.unMarshalMany<TicketSummary>(paginatedData.data, TicketSummary);
        return paginatedData;
    }

    /**
     * Get paginated list of tickets for a specific project
     */
    async getProjectTickets(
        options: GetProjectTicketsRequestOptions
    ): Promise<PaginatedResponse<TicketSummary>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/tickets`;

        const queryParams: Record<string, string | number | string[] | undefined> = {
            page: options.pagination.page,
            entries_per_page: options.pagination.entries_per_page,
            sort_key: options.sort.sortKey,
            sort_direction: options.sort.sortDirection
        };

        // Add filter parameters (excluding project_id since it's in the URL)
        if (options.filters) {
            if (options.filters.status?.length) {
                queryParams.status = options.filters.status;
            }
            if (options.filters.priority?.length) {
                queryParams.priority = options.filters.priority;
            }
            if (options.filters.type?.length) {
                queryParams.type = options.filters.type;
            }
        }

        const response = await this.getRequest<PaginatedResponse<TicketSummary>>({
            queryParams,
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        const paginatedData = Entity.unMarshal<PaginatedResponse<TicketSummary>>(
            response,
            PaginatedResponse<TicketSummary>
        );
        paginatedData.data = Entity.unMarshalMany<TicketSummary>(paginatedData.data, TicketSummary);
        return paginatedData;
    }

    /**
     * Get ticket details by ID
     */
    async getTicketById(options: GetTicketByIdRequestOptions): Promise<DataResponse<TicketDetails>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/${options.ticketId}`;

        const response = await this.getRequest<DataResponse<TicketDetails>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        const data = Entity.unMarshal<DataResponse<TicketDetails>>(
            response,
            DataResponse<TicketDetails>
        );
        data.data = Entity.unMarshal<TicketDetails>(data.data, TicketDetails);
        return data;
    }

    /**
     * Get ticket events (audit trail)
     */
    async getTicketEvents(
        options: GetTicketEventsRequestOptions
    ): Promise<PaginatedResponse<TicketEvent>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/${options.ticketId}/events`;

        const response = await this.getRequest<PaginatedResponse<TicketEvent>>({
            queryParams: {
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        const paginatedData = Entity.unMarshal<PaginatedResponse<TicketEvent>>(
            response,
            PaginatedResponse<TicketEvent>
        );
        paginatedData.data = Entity.unMarshalMany<TicketEvent>(paginatedData.data, TicketEvent);
        return paginatedData;
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(
        options: GetDashboardStatsRequestOptions
    ): Promise<DataResponse<TicketDashboardStats>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/stats`;

        const response = await this.getRequest<DataResponse<TicketDashboardStats>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        const data = Entity.unMarshal<DataResponse<TicketDashboardStats>>(
            response,
            DataResponse<TicketDashboardStats>
        );
        data.data = Entity.unMarshal<TicketDashboardStats>(data.data, TicketDashboardStats);
        return data;
    }

    /**
     * Create a new ticket
     */
    async createTicket(options: CreateTicketRequestOptions): Promise<CreatedResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets`;

        const response = await this.postRequest<CreatedResponse, CreateTicketRequest>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
    }

    /**
     * Update a ticket
     */
    async updateTicket(options: UpdateTicketRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/${options.ticketId}`;

        const response = await this.patchRequest<NoDataResponse, UpdateTicketRequest>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    /**
     * Bulk update tickets
     */
    async bulkUpdateTickets(
        options: BulkUpdateTicketsRequestOptions
    ): Promise<DataResponse<BulkUpdateResult>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/bulk`;

        const response = await this.patchRequest<
            DataResponse<BulkUpdateResult>,
            BulkUpdateTicketsRequest
        >({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<BulkUpdateResult>>(
            response,
            DataResponse<BulkUpdateResult>
        );
    }

    /**
     * Delete a ticket
     */
    async deleteTicket(options: DeleteTicketRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/${options.ticketId}`;

        const response = await this.deleteRequest<NoDataResponse, Record<string, never>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors,
            data: {}
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    /**
     * Check if a duplicate ticket exists
     */
    async checkDuplicate(
        options: CheckDuplicateRequestOptions
    ): Promise<DataResponse<DuplicateCheckResult>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/check-duplicate`;

        const response = await this.postRequest<
            DataResponse<DuplicateCheckResult>,
            CheckDuplicateRequest
        >({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<DuplicateCheckResult>>(
            response,
            DataResponse<DuplicateCheckResult>
        );
    }
}
