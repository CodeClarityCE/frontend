import { Entity } from '../../utils/api/BaseEntity';
import {
    BaseRepository,
    type AuthRepoMethodGetRequestOptions,
    type PaginatedRepoMethodRequestOptions,
    type SortableRepoMethodRequestOptions
} from '../../utils/api/BaseRepository';
import { DataResponse } from '../../utils/api/responses/DataResponse';
import type { AnalysisStats, PatchingStats, SbomStats } from './stats.entity';
import { PaginatedResponse } from '../../utils/api/responses/PaginatedResponse';
import type { License } from './licenses/License';
import type { VulnerabilityMerged } from '@/codeclarity_components/results/vulnerabilities/VulnStats';
import type { PatchOccurenceInfo, PatchedManifestData, Workspace } from './patching/Patching';
import type { VulnerabilityDetails } from './vulnerabilities/VulnDetails/VulnDetails';
import { DependencyDetails } from './sbom/SbomDetails/SbomDetails';
import type { Result } from './result.entity';
import type { WorkspacesOutput } from './workspace.entity';
import type { Dependency, GraphDependency } from './graph.entity';

export interface GetSbomStatsRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    projectId: string;
    analysisId: string;
    workspace: string;
}

export interface GetSbomWorkspacesRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    projectId: string;
    analysisId: string;
}

export interface GetFindingRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    projectId: string;
    analysisId: string;
    vulnerability_id: string;
    workspace: string;
}

export interface GetSbomRequestOptions
    extends AuthRepoMethodGetRequestOptions,
        PaginatedRepoMethodRequestOptions,
        SortableRepoMethodRequestOptions {
    orgId: string;
    projectId: string;
    analysisId: string;
    workspace: string;
    active_filters: string;
    search_key: string;
}

export interface GetDependencyRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    projectId: string;
    analysisId: string;
    dependency: string;
    workspace: string;
}

export interface GetResultByTypeRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    projectId: string;
    analysisId: string;
    type: string;
}

export class ResultsRepository extends BaseRepository {
    async getSbomStat(options: GetSbomStatsRequestOptions): Promise<DataResponse<SbomStats>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom/stats`;

        const response = await this.getRequest<DataResponse<SbomStats>>({
            queryParams: {
                workspace: options.workspace
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<SbomStats>>(response, DataResponse<SbomStats>);
    }

    async getSbomWorkspaces(
        options: GetSbomWorkspacesRequestOptions
    ): Promise<DataResponse<WorkspacesOutput>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom/workspaces`;

        const response = await this.getRequest<DataResponse<WorkspacesOutput>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<WorkspacesOutput>>(
            response,
            DataResponse<WorkspacesOutput>
        );
    }

    async getSbom(options: GetSbomRequestOptions): Promise<PaginatedResponse<Dependency>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom`;

        const response = await this.getRequest<PaginatedResponse<Dependency>>({
            queryParams: {
                workspace: options.workspace,
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page,
                sort_by: options.sort.sortKey,
                sort_direction: options.sort.sortDirection,
                active_filters: options.active_filters,
                search_key: options.search_key
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<PaginatedResponse<Dependency>>(
            response,
            PaginatedResponse<Dependency>
        );
    }

    async getDependency(
        options: GetDependencyRequestOptions
    ): Promise<DataResponse<DependencyDetails>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom/dependency`;

        const response = await this.getRequest<DataResponse<DependencyDetails>>({
            queryParams: {
                workspace: options.workspace,
                dependency: options.dependency
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<DependencyDetails>>(
            response,
            DataResponse<DependencyDetails>
        );
    }

    async getDependencyGraph(
        options: GetDependencyRequestOptions
    ): Promise<DataResponse<Array<GraphDependency>>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom/dependency/graph`;

        const response = await this.getRequest<DataResponse<Array<GraphDependency>>>({
            queryParams: {
                workspace: options.workspace,
                dependency: options.dependency
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<Array<GraphDependency>>>(
            response,
            DataResponse<Array<GraphDependency>>
        );
    }

    async getLicenses(options: GetSbomRequestOptions): Promise<PaginatedResponse<License>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/licenses`;

        const response = await this.getRequest<PaginatedResponse<License>>({
            queryParams: {
                workspace: options.workspace,
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page,
                sort_by: options.sort.sortKey,
                sort_direction: options.sort.sortDirection,
                active_filters: options.active_filters,
                search_key: options.search_key
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<PaginatedResponse<License>>(response, PaginatedResponse<License>);
    }

    async getVulnerabilitiesStat(
        options: GetSbomStatsRequestOptions
    ): Promise<DataResponse<AnalysisStats>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities/stats`;

        const response = await this.getRequest<DataResponse<AnalysisStats>>({
            queryParams: {
                workspace: options.workspace
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<AnalysisStats>>(response, DataResponse<AnalysisStats>);
    }

    async getVulnerabilities(
        options: GetSbomRequestOptions
    ): Promise<PaginatedResponse<VulnerabilityMerged>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities`;

        const response = await this.getRequest<PaginatedResponse<VulnerabilityMerged>>({
            queryParams: {
                workspace: options.workspace,
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page,
                sort_by: options.sort.sortKey,
                sort_direction: options.sort.sortDirection,
                active_filters: options.active_filters,
                search_key: options.search_key
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<PaginatedResponse<VulnerabilityMerged>>(
            response,
            PaginatedResponse<VulnerabilityMerged>
        );
    }

    async getFinding(
        options: GetFindingRequestOptions
    ): Promise<DataResponse<VulnerabilityDetails>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities/vulnerability/${options.vulnerability_id}`;

        const response = await this.getRequest<DataResponse<VulnerabilityDetails>>({
            queryParams: {
                workspace: options.workspace
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<VulnerabilityDetails>>(
            response,
            DataResponse<VulnerabilityDetails>
        );
    }

    async getPatchesStat(
        options: GetSbomStatsRequestOptions
    ): Promise<DataResponse<PatchingStats>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/patching/stats`;

        const response = await this.getRequest<DataResponse<PatchingStats>>({
            queryParams: {
                workspace: options.workspace
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<PatchingStats>>(response, DataResponse<PatchingStats>);
    }

    async getPatches(options: GetSbomRequestOptions): Promise<DataResponse<Workspace>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/patching`;

        const response = await this.getRequest<DataResponse<Workspace>>({
            queryParams: {
                workspace: options.workspace,
                page: options.pagination.page,
                entries_per_page: options.pagination.entries_per_page,
                sort_by: options.sort.sortKey,
                sort_direction: options.sort.sortDirection,
                active_filters: options.active_filters,
                search_key: options.search_key
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        console.error(response);

        return Entity.unMarshal<DataResponse<Workspace>>(response, DataResponse<Workspace>);
    }

    async getPatchesManifest(
        options: GetSbomStatsRequestOptions
    ): Promise<DataResponse<PatchedManifestData>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/patching/manifest`;

        const response = await this.getRequest<DataResponse<PatchedManifestData>>({
            queryParams: {
                workspace: options.workspace
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<PatchedManifestData>>(
            response,
            DataResponse<PatchedManifestData>
        );
    }

    async getPatchingGraph(
        options: GetSbomStatsRequestOptions
    ): Promise<DataResponse<Map<string, PatchOccurenceInfo>>> {
        const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/patching/tree`;

        const response = await this.getRequest<DataResponse<Map<string, PatchOccurenceInfo>>>({
            queryParams: {
                workspace: options.workspace
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<Map<string, PatchOccurenceInfo>>>(
            response,
            DataResponse<Map<string, PatchOccurenceInfo>>
        );
    }

    async getResultByType(options: GetResultByTypeRequestOptions): Promise<DataResponse<Result>> {
        const RELATIVE_URL = `/result`;

        const response = await this.getRequest<DataResponse<Result>>({
            queryParams: {
                org_id: options.orgId,
                project_id: options.projectId,
                analysis_id: options.analysisId,
                type: options.type
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<Result>>(response, DataResponse<Result>);
    }
}
