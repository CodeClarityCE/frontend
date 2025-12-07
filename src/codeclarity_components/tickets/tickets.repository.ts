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
    ExternalTicketProvider,
    type ExternalLink,
    type CreateTicketRequest,
    type UpdateTicketRequest,
    type BulkUpdateTicketsRequest,
    type CheckDuplicateRequest,
    type BulkUpdateResult,
    type DuplicateCheckResult,
    type TicketFilters,
    type IntegrationConfigSummary,
    type IntegrationHierarchyItem,
    type ConnectionTestResult,
    type ConfigureClickUpRequest,
    type SyncResult,
    type BulkSyncResult
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

// Integration Request Options
export interface GetIntegrationsRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
}

export interface ConfigureClickUpRequestOptions
    extends AuthRepoMethodPostRequestOptions<ConfigureClickUpRequest> {
    orgId: string;
}

export interface DeleteIntegrationRequestOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
    orgId: string;
    provider: ExternalTicketProvider;
}

export interface TestIntegrationRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    provider: ExternalTicketProvider;
}

export interface GetHierarchyRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    provider: ExternalTicketProvider;
    parentId?: string;
}

export interface CreateHierarchyItemRequestOptions
    extends AuthRepoMethodPostRequestOptions<{ name: string }> {
    orgId: string;
    provider: ExternalTicketProvider;
    parentId: string;
}

export interface SyncTicketRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    ticketId: string;
    provider: ExternalTicketProvider;
}

export interface UnlinkTicketRequestOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
    orgId: string;
    ticketId: string;
    linkId: string;
    deleteExternal?: boolean;
}

export interface BulkSyncRequestOptions
    extends AuthRepoMethodPostRequestOptions<{ ticket_ids: string[] }> {
    orgId: string;
    provider: ExternalTicketProvider;
}

export interface GetExternalLinksRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    ticketId: string;
}

// OAuth Request Options
export interface GetClickUpOAuthUrlRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    redirectUri: string;
}

export interface ExchangeClickUpOAuthCodeRequestOptions
    extends AuthRepoMethodPostRequestOptions<{ code: string; redirect_uri: string }> {
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
    async getTicketById(
        options: GetTicketByIdRequestOptions
    ): Promise<DataResponse<TicketDetails>> {
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

    // ============================================
    // Integration Methods
    // ============================================

    /**
     * Get all configured integrations for an organization
     */
    async getIntegrations(
        options: GetIntegrationsRequestOptions
    ): Promise<DataResponse<IntegrationConfigSummary[]>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations`;

        const response = await this.getRequest<DataResponse<IntegrationConfigSummary[]>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationConfigSummary[]>>(
            response,
            DataResponse<IntegrationConfigSummary[]>
        );
    }

    /**
     * Configure ClickUp integration
     */
    async configureClickUp(options: ConfigureClickUpRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/clickup`;

        const response = await this.postRequest<NoDataResponse, ConfigureClickUpRequest>({
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
     * Delete an integration
     */
    async deleteIntegration(options: DeleteIntegrationRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}`;

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
     * Test an integration connection
     */
    async testIntegration(
        options: TestIntegrationRequestOptions
    ): Promise<DataResponse<ConnectionTestResult>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/test`;

        const response = await this.postRequest<
            DataResponse<ConnectionTestResult>,
            Record<string, never>
        >({
            bearerToken: options.bearerToken,
            data: {},
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<ConnectionTestResult>>(
            response,
            DataResponse<ConnectionTestResult>
        );
    }

    /**
     * Get workspaces for an integration
     */
    async getWorkspaces(
        options: GetHierarchyRequestOptions
    ): Promise<DataResponse<IntegrationHierarchyItem[]>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/workspaces`;

        const response = await this.getRequest<DataResponse<IntegrationHierarchyItem[]>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationHierarchyItem[]>>(
            response,
            DataResponse<IntegrationHierarchyItem[]>
        );
    }

    /**
     * Get spaces for a workspace
     */
    async getSpaces(
        options: GetHierarchyRequestOptions
    ): Promise<DataResponse<IntegrationHierarchyItem[]>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/spaces/${options.parentId}`;

        const response = await this.getRequest<DataResponse<IntegrationHierarchyItem[]>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationHierarchyItem[]>>(
            response,
            DataResponse<IntegrationHierarchyItem[]>
        );
    }

    /**
     * Get folders for a space
     */
    async getFolders(
        options: GetHierarchyRequestOptions
    ): Promise<DataResponse<IntegrationHierarchyItem[]>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/folders/${options.parentId}`;

        const response = await this.getRequest<DataResponse<IntegrationHierarchyItem[]>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationHierarchyItem[]>>(
            response,
            DataResponse<IntegrationHierarchyItem[]>
        );
    }

    /**
     * Get lists for a folder or space
     */
    async getLists(
        options: GetHierarchyRequestOptions
    ): Promise<DataResponse<IntegrationHierarchyItem[]>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/lists/${options.parentId}`;

        const response = await this.getRequest<DataResponse<IntegrationHierarchyItem[]>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationHierarchyItem[]>>(
            response,
            DataResponse<IntegrationHierarchyItem[]>
        );
    }

    // ============================================
    // Hierarchy Creation Methods
    // ============================================

    /**
     * Create a space in a workspace
     */
    async createSpace(
        options: CreateHierarchyItemRequestOptions
    ): Promise<DataResponse<IntegrationHierarchyItem>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/workspaces/${options.parentId}/spaces`;

        const response = await this.postRequest<
            DataResponse<IntegrationHierarchyItem>,
            { name: string }
        >({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationHierarchyItem>>(
            response,
            DataResponse<IntegrationHierarchyItem>
        );
    }

    /**
     * Create a folder in a space
     */
    async createFolder(
        options: CreateHierarchyItemRequestOptions
    ): Promise<DataResponse<IntegrationHierarchyItem>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/spaces/${options.parentId}/folders`;

        const response = await this.postRequest<
            DataResponse<IntegrationHierarchyItem>,
            { name: string }
        >({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationHierarchyItem>>(
            response,
            DataResponse<IntegrationHierarchyItem>
        );
    }

    /**
     * Create a list in a folder
     */
    async createList(
        options: CreateHierarchyItemRequestOptions
    ): Promise<DataResponse<IntegrationHierarchyItem>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/folders/${options.parentId}/lists`;

        const response = await this.postRequest<
            DataResponse<IntegrationHierarchyItem>,
            { name: string }
        >({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationHierarchyItem>>(
            response,
            DataResponse<IntegrationHierarchyItem>
        );
    }

    /**
     * Create a folderless list directly in a space
     */
    async createFolderlessList(
        options: CreateHierarchyItemRequestOptions
    ): Promise<DataResponse<IntegrationHierarchyItem>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/${options.provider}/spaces/${options.parentId}/lists`;

        const response = await this.postRequest<
            DataResponse<IntegrationHierarchyItem>,
            { name: string }
        >({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<IntegrationHierarchyItem>>(
            response,
            DataResponse<IntegrationHierarchyItem>
        );
    }

    /**
     * Sync a ticket to an external provider
     */
    async syncTicket(options: SyncTicketRequestOptions): Promise<DataResponse<SyncResult>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/${options.ticketId}/sync/${options.provider}`;

        const response = await this.postRequest<DataResponse<SyncResult>, Record<string, never>>({
            bearerToken: options.bearerToken,
            data: {},
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<SyncResult>>(response, DataResponse<SyncResult>);
    }

    /**
     * Unlink a ticket from an external provider
     */
    async unlinkTicket(options: UnlinkTicketRequestOptions): Promise<NoDataResponse> {
        const queryParams: Record<string, string> = {};
        if (options.deleteExternal) {
            queryParams.delete_external = '1';
        }

        const RELATIVE_URL = `/org/${options.orgId}/tickets/${options.ticketId}/sync/${options.linkId}`;

        const response = await this.deleteRequest<NoDataResponse, Record<string, never>>({
            bearerToken: options.bearerToken,
            queryParams,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors,
            data: {}
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    /**
     * Bulk sync tickets to an external provider
     */
    async bulkSync(options: BulkSyncRequestOptions): Promise<DataResponse<BulkSyncResult>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/bulk-sync/${options.provider}`;

        const response = await this.postRequest<
            DataResponse<BulkSyncResult>,
            { ticket_ids: string[] }
        >({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<BulkSyncResult>>(
            response,
            DataResponse<BulkSyncResult>
        );
    }

    /**
     * Get external links for a ticket
     */
    async getExternalLinks(
        options: GetExternalLinksRequestOptions
    ): Promise<DataResponse<ExternalLink[]>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/${options.ticketId}/external-links`;

        const response = await this.getRequest<DataResponse<ExternalLink[]>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<ExternalLink[]>>(
            response,
            DataResponse<ExternalLink[]>
        );
    }

    // ============================================
    // OAuth Methods
    // ============================================

    /**
     * Get ClickUp OAuth authorization URL
     */
    async getClickUpOAuthUrl(
        options: GetClickUpOAuthUrlRequestOptions
    ): Promise<DataResponse<{ url: string }>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/clickup/oauth/url`;

        const response = await this.getRequest<DataResponse<{ url: string }>>({
            bearerToken: options.bearerToken,
            queryParams: {
                redirect_uri: options.redirectUri
            },
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<{ url: string }>>(
            response,
            DataResponse<{ url: string }>
        );
    }

    /**
     * Exchange ClickUp OAuth code for access token
     */
    async exchangeClickUpOAuthCode(
        options: ExchangeClickUpOAuthCodeRequestOptions
    ): Promise<DataResponse<{ access_token: string }>> {
        const RELATIVE_URL = `/org/${options.orgId}/tickets/integrations/clickup/oauth/callback`;

        const response = await this.postRequest<
            DataResponse<{ access_token: string }>,
            { code: string; redirect_uri: string }
        >({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<{ access_token: string }>>(
            response,
            DataResponse<{ access_token: string }>
        );
    }
}
