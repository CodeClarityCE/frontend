import type { CreateProject } from '@/codeclarity_components/projects/create/create_project.http';
import { CreatedResponse } from '@/utils/api/responses/CreatedResponse';
import { Entity } from '../../utils/api/BaseEntity';
import {
    BaseRepository,
    type AuthRepoMethodPostRequestOptions,
    type AuthRepoMethodGetRequestOptions,
    type EmptyPostData,
    type AuthRepoMethodEmptyDeleteRequestOptions,
    type PaginatedRepoMethodRequestOptions,
    type SearchableRepoMethodRequestOptions,
    type SortableRepoMethodRequestOptions
} from '../../utils/api/BaseRepository';
import { DataResponse } from '../../utils/api/responses/DataResponse';
import { NoDataResponse } from '../../utils/api/responses/NoDataResponse';
import { PaginatedResponse } from '../../utils/api/responses/PaginatedResponse';
import { type Project } from './project.entity';

export interface GetProjectsRequestOptions
    extends AuthRepoMethodGetRequestOptions,
        PaginatedRepoMethodRequestOptions,
        SearchableRepoMethodRequestOptions,
        SortableRepoMethodRequestOptions {
    orgId: string;
}

export interface GetProjectByIdRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    projectId: string;
}

// export interface GetProjectAnalysesOptions
//     extends GetRequestOptions<PaginatedResponse<Analysis>>,
//         PaginatedRequestOptions {
//     projectId: string;
// }

// export interface DeleteProjectAnalysisOptions extends DeleteRequestOptions<NoDataResponse> {
//     analysisId: string;
// }

// export interface DeleteProjectOptions extends DeleteRequestOptions<NoDataResponse> {
//     projectId: string;
// }

export interface DeleteProjectOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
    orgId: string;
    projectId: string;
}

export interface CreateProjectOptions extends AuthRepoMethodPostRequestOptions<CreateProject> {
    orgId: string;
}

export enum ProjectsSortInterface {
    IMPORTED_ON = 'imported_on',
    URL = 'url',
    NAME = 'name',
    VERSION = 'version',
    LICENSES = 'licenses',
    COMBINED_SEVERITY = 'combined_severity',
    DEPRECATED = 'deprecated',
    OUTDATED = 'outdated',
    UNLICENSED = 'unlicensed',
    TYPE = 'user_installed',
    NEWEST_RELEASE = 'newest_release',
    PUBLISHED = 'release',
    CVE = 'cve',
    SEVERITY = 'severity',
    DEPENDENCY_NAME = 'dep_name',
    DEPENDENCY_VERSION = 'dep_version',
    WEAKNESS = 'weakness',
    OWASP_TOP_10 = 'owasp_top_10',
    EXPLOITABILITY = 'exploitability',
    PATCH_TYPE = 'patch_type',
    LICENSE_TYPE = 'type',
    DEPENDENCY_COUNT = 'dep_count',
    ID = 'id',
    DEV = 'dev',
    DIRECT = 'is_direct_count'
}

export class ProjectRepository extends BaseRepository {
    async getProjects(options: GetProjectsRequestOptions): Promise<PaginatedResponse<Project>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects`;

        const response = await this.getRequest<PaginatedResponse<Project>>({
            queryParams: {
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page,
                search_key: options.search.searchKey,
                sort_key: options.sort.sortKey,
                sort_direction: options.sort.sortDirection
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<PaginatedResponse<Project>>(response, PaginatedResponse<Project>);
    }

    async getProjectById(options: GetProjectByIdRequestOptions): Promise<DataResponse<Project>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}`;

        const response = await this.getRequest<DataResponse<Project>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<Project>>(response, DataResponse<Project>);
    }

    // getProjectAnalyses(options: GetProjectAnalysesOptions) {
    //     const RELATIVE_URL = `/projects/${options.projectId}/analyses`;

    //     this.getRequest<PaginatedResponse<Analysis>>({
    //         url: this.buildUrl(RELATIVE_URL),

    //         // Data
    //         queryParams: {
    //             // active_filters: options.activeFilters,
    //             // sort_by: options.sortBy,
    //             // sort_direction: options.sortDirection,
    //             // search_key: options.searchKey,
    //             page: options.page,
    //             entries_per_page: options.entriesPerPage
    //         },

    //         // Callbacks
    //         success: (response: PaginatedResponse<Analysis>) => {
    //             const entity = Entity.unMarshal(response, PaginatedResponse<Analysis>);
    //             options.success(entity);
    //         },

    //         finalize: options.finalize,
    //         businessLogicError: options.businessLogicError,
    //         httpError: options.httpError
    //     });
    // }

    // deleteProjectAnalyses(options: DeleteProjectAnalysisOptions) {
    //     const RELATIVE_URL = `/analysis/${options.analysisId}`;

    //     this.deleteRequest<NoDataResponse>({
    //         url: this.buildUrl(RELATIVE_URL),

    //         // Data
    //         queryParams: {},

    //         // Callbacks
    //         success: (response: NoDataResponse) => {
    //             options.success(response);
    //         },

    //         finalize: options.finalize,
    //         businessLogicError: options.businessLogicError,
    //         httpError: options.httpError
    //     });
    // }

    async deleteProject(options: DeleteProjectOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}`;

        const response = await this.deleteRequest<NoDataResponse, EmptyPostData>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors,
            data: {}
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async createProject(options: CreateProjectOptions): Promise<CreatedResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/projects`;

        const response = await this.postRequest<CreatedResponse, CreateProject>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
    }
}
