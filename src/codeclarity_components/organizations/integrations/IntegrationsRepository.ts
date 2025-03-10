import { Entity } from '@/utils/api/BaseEntity';
import {
    BaseRepository,
    type AuthRepoMethodGetRequestOptions,
    type AuthRepoMethodPostRequestOptions,
    type PaginatedRepoMethodRequestOptions,
    type AuthRepoMethodEmptyDeleteRequestOptions,
    type EmptyPostData,
    type AuthRepoMethodPatchRequestOptions,
    type SearchableRepoMethodRequestOptions,
    type SortableRepoMethodRequestOptions
} from '../../../utils/api/BaseRepository';
import {
    GithubIntegration,
    GitlabIntegration,
    VCS
} from '@/codeclarity_components/organizations/integrations/Integrations';
import { Repository } from '@/codeclarity_components/projects/project.entity';
import { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import { NoDataResponse } from '../../../utils/api/responses/NoDataResponse';
import type {
    GilabIntegrationAdd,
    GithubIntegrationAdd,
    GithubIntegrationUpdate,
    GitlabIntegrationUpdate
} from './integration_add.http';
import type { DataResponse } from '../../../utils/api/responses/DataResponse';

export interface GetVCSIntegrationsRequestOptions
    extends AuthRepoMethodGetRequestOptions,
        PaginatedRepoMethodRequestOptions {
    orgId: string;
}

export interface GetGitlabIntegrationRequestOption extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    integrationId: string;
}

export interface GetGithubIntegrationRequestOption extends GetGitlabIntegrationRequestOption {}

export interface AddGitlabIntegrationRequestOptions
    extends AuthRepoMethodPostRequestOptions<GilabIntegrationAdd> {
    orgId: string;
}

export interface AddGithubIntegrationRequestOptions
    extends AuthRepoMethodPostRequestOptions<GithubIntegrationAdd> {
    orgId: string;
}

export interface UpdateGithubIntegrationRequestOptions
    extends AuthRepoMethodPatchRequestOptions<GithubIntegrationUpdate> {
    orgId: string;
    integrationId: string;
}

export interface UpdateGitlabIntegrationRequestOptions
    extends AuthRepoMethodPatchRequestOptions<GitlabIntegrationUpdate> {
    orgId: string;
    integrationId: string;
}

export interface DeleteIntegration extends AuthRepoMethodEmptyDeleteRequestOptions {
    orgId: string;
    integrationId: string;
}

export interface GetRepositoriesRequestOptions
    extends AuthRepoMethodGetRequestOptions,
        PaginatedRepoMethodRequestOptions,
        SearchableRepoMethodRequestOptions,
        SortableRepoMethodRequestOptions {
    orgId: string;
    integrationId: string;
    forceRefresh: boolean;
    activeFilters: string[];
}

export enum GetRepositoriesSortInterface {
    FULLY_QUALIFIED_NAME = 'fully_qualified_name',
    DESCRIPTION = 'description',
    CREATED = 'created_at',
    IMPORTED = 'imported'
}

export class IntegrationsRepository extends BaseRepository {
    async getGithubIntegration(
        options: GetGitlabIntegrationRequestOption
    ): Promise<GithubIntegration> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/github/${options.integrationId}`;

        const response = await this.getRequest<DataResponse<GithubIntegration>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<GithubIntegration>(response.data, GithubIntegration);
    }

    async getGitlabIntegration(
        options: GetGitlabIntegrationRequestOption
    ): Promise<GitlabIntegration> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/gitlab/${options.integrationId}`;

        const response = await this.getRequest<DataResponse<GitlabIntegration>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<GitlabIntegration>(response.data, GitlabIntegration);
    }

    async getVCS(options: GetVCSIntegrationsRequestOptions): Promise<PaginatedResponse<VCS>> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/vcs`;

        const response = await this.getRequest<PaginatedResponse<VCS>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors,
            queryParams: {
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page
            }
        });

        const res = Entity.unMarshal<PaginatedResponse<VCS>>(response, PaginatedResponse<VCS>);

        return res;
    }

    async getGithubRepositories(
        options: GetRepositoriesRequestOptions
    ): Promise<PaginatedResponse<Repository>> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/github/${options.integrationId}/repositories`;

        const response = await this.getRequest<PaginatedResponse<Repository>>({
            queryParams: {
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page,
                search_key: options.search.searchKey,
                force_refresh: `${options.forceRefresh}`,
                active_filters: `[${options.activeFilters.join(',')}]`,
                sort_key: options.sort.sortKey,
                sort_direction: options.sort.sortDirection
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        const res = Entity.unMarshal<PaginatedResponse<Repository>>(
            response,
            PaginatedResponse<Repository>
        );

        return res;
    }

    async getGitlabRepositories(
        options: GetRepositoriesRequestOptions
    ): Promise<PaginatedResponse<Repository>> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/gitlab/${options.integrationId}/repositories`;

        const response = await this.getRequest<PaginatedResponse<Repository>>({
            queryParams: {
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page,
                search_key: options.search.searchKey,
                force_refresh: `${options.forceRefresh}`,
                active_filters: `[${options.activeFilters.join(',')}]`,
                sort_key: options.sort.sortKey,
                sort_direction: options.sort.sortDirection
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        const res = Entity.unMarshal<PaginatedResponse<Repository>>(
            response,
            PaginatedResponse<Repository>
        );

        return res;
    }

    async addGitlabIntegration(
        options: AddGitlabIntegrationRequestOptions
    ): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/gitlab/add`;

        const response = await this.postRequest<NoDataResponse, GilabIntegrationAdd>({
            data: options.data,
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async updateGitlabIntegration(
        options: UpdateGitlabIntegrationRequestOptions
    ): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/gitlab/${options.integrationId}`;

        const response = await this.patchRequest<NoDataResponse, GitlabIntegrationUpdate>({
            data: options.data,
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async addGithubIntegration(
        options: AddGithubIntegrationRequestOptions
    ): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/github/add`;

        const response = await this.postRequest<NoDataResponse, GithubIntegrationAdd>({
            data: options.data,
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async updateGithubIntegration(
        options: UpdateGithubIntegrationRequestOptions
    ): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/github/${options.integrationId}`;

        const response = await this.patchRequest<NoDataResponse, GithubIntegrationUpdate>({
            data: options.data,
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async deleteGithubIntegration(options: DeleteIntegration): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/github/${options.integrationId}`;

        const response = await this.deleteRequest<NoDataResponse, EmptyPostData>({
            data: {},
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async deleteGitlabIntegration(options: DeleteIntegration): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/integrations/gitlab/${options.integrationId}`;

        const response = await this.deleteRequest<NoDataResponse, EmptyPostData>({
            data: {},
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }
}
