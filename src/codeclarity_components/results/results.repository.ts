import type { VulnerabilityMerged } from "@/codeclarity_components/results/vulnerabilities/VulnStats";

import { Entity } from "../../utils/api/BaseEntity";
import {
  type AuthRepoMethodGetRequestOptions,
  BaseRepository,
  type PaginatedRepoMethodRequestOptions,
  type SortableRepoMethodRequestOptions,
} from "../../utils/api/BaseRepository";
import { DataResponse } from "../../utils/api/responses/DataResponse";
import { PaginatedResponse } from "../../utils/api/responses/PaginatedResponse";

import type { Dependency, GraphDependency } from "./graph.entity";
import type { License } from "./licenses/License";
import type { PatchedManifestData, Workspace } from "./patching/Patching";
import type { Result } from "./result.entity";
import { type DependencyDetails } from "./sbom/SbomDetails/SbomDetails";
import type { AnalysisStats, PatchingStats, SbomStats } from "./stats.entity";
import type { VulnerabilityDetails } from "./vulnerabilities/VulnDetails/VulnDetails";
import type { WorkspacesOutput } from "./workspace.entity";

export interface GetSbomStatsRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  workspace: string;
  ecosystem_filter?: string;
  runIndex?: number | null;
}

export interface GetVulnerabilityStatsRequestOptions extends GetSbomStatsRequestOptions {
  // Count vulnerabilities a policy excludes, like the list's toggle.
  show_blacklisted?: boolean;
}

export type SourceVerdictExportFormat = "csv" | "json";

export interface DownloadSourceVerdictsRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  format: SourceVerdictExportFormat;
}

export interface GetPatchesRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  workspace: string;
}

export interface GetSbomWorkspacesRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  runIndex?: number | null;
}

export interface GetFindingRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  vulnerability_id: string;
  workspace: string;
  runIndex?: number | null;
  // The affected dependency and version to show; the first occurrence when left out.
  dependency?: string | null;
  version?: string | null;
}

export interface GetSbomRequestOptions
  extends
    AuthRepoMethodGetRequestOptions,
    PaginatedRepoMethodRequestOptions,
    SortableRepoMethodRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  workspace: string;
  active_filters: string;
  search_key: string;
  ecosystem_filter?: string;
  runIndex?: number | null;
  show_blacklisted?: boolean;
}

export interface GetDependencyRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  dependency: string;
  workspace: string;
  runIndex?: number | null;
}

export interface GetResultByTypeRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  type: string;
  runIndex?: number | null;
}

export interface MaliciousPackageAdvisory {
  AdvisoryId: string;
  AffectedDependency: string;
  AffectedVersion: string;
  DirectDependency: boolean;
  Summary?: string;
  Details?: string;
  Published?: string;
  Modified?: string;
  Aliases?: string[];
  References?: string[];
}

export interface GetMaliciousPackageAdvisoriesRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
  workspace: string;
}

export class ResultsRepository extends BaseRepository {
  async getSbomStat(
    options: GetSbomStatsRequestOptions,
  ): Promise<DataResponse<SbomStats>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom/stats`;

    const queryParams: Record<string, string | number> = {
      workspace: options.workspace,
    };

    if (options.ecosystem_filter) {
      queryParams.ecosystem_filter = options.ecosystem_filter;
    }

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<DataResponse<SbomStats>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<SbomStats>>(
      response,
      DataResponse<SbomStats>,
    );
  }

  async getSbomWorkspaces(
    options: GetSbomWorkspacesRequestOptions,
  ): Promise<DataResponse<WorkspacesOutput>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom/workspaces`;

    const queryParams: Record<string, string | number> = {};

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<DataResponse<WorkspacesOutput>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<WorkspacesOutput>>(
      response,
      DataResponse<WorkspacesOutput>,
    );
  }

  async getSbom(
    options: GetSbomRequestOptions,
  ): Promise<PaginatedResponse<Dependency>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom`;

    const queryParams: Record<string, string | number | undefined> = {
      workspace: options.workspace,
      page: options.pagination.page,
      entries_per_page: options.pagination.entries_per_page,
      sort_by: options.sort.sortKey,
      sort_direction: options.sort.sortDirection,
      active_filters: options.active_filters,
      search_key: options.search_key,
    };

    if (options.ecosystem_filter) {
      queryParams.ecosystem_filter = options.ecosystem_filter;
    }

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<PaginatedResponse<Dependency>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<PaginatedResponse<Dependency>>(
      response,
      PaginatedResponse<Dependency>,
    );
  }

  async getDependency(
    options: GetDependencyRequestOptions,
  ): Promise<DataResponse<DependencyDetails>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom/dependency`;

    const queryParams: Record<string, string | number> = {
      workspace: options.workspace,
      dependency: options.dependency,
    };

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<DataResponse<DependencyDetails>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<DependencyDetails>>(
      response,
      DataResponse<DependencyDetails>,
    );
  }

  async getDependencyGraph(
    options: GetDependencyRequestOptions,
  ): Promise<DataResponse<GraphDependency[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/sbom/dependency/graph`;

    const queryParams: Record<string, string | number> = {
      workspace: options.workspace,
      dependency: options.dependency,
    };

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<DataResponse<GraphDependency[]>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<GraphDependency[]>>(
      response,
      DataResponse<GraphDependency[]>,
    );
  }

  async getLicenses(
    options: GetSbomRequestOptions,
  ): Promise<PaginatedResponse<License>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/licenses`;

    const queryParams: Record<string, string | number | undefined> = {
      workspace: options.workspace,
      page: options.pagination.page,
      entries_per_page: options.pagination.entries_per_page,
      sort_by: options.sort.sortKey,
      sort_direction: options.sort.sortDirection,
      active_filters: options.active_filters,
      search_key: options.search_key,
    };

    if (options.ecosystem_filter) {
      queryParams.ecosystem_filter = options.ecosystem_filter;
    }

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<PaginatedResponse<License>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<PaginatedResponse<License>>(
      response,
      PaginatedResponse<License>,
    );
  }

  async getVulnerabilitiesStat(
    options: GetVulnerabilityStatsRequestOptions,
  ): Promise<DataResponse<AnalysisStats>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities/stats`;

    const queryParams: Record<string, string | number> = {
      workspace: options.workspace,
    };

    if (options.ecosystem_filter) {
      queryParams.ecosystem_filter = options.ecosystem_filter;
    }

    if (options.show_blacklisted !== undefined) {
      queryParams.show_blacklisted = options.show_blacklisted.toString();
    }

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<DataResponse<AnalysisStats>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<AnalysisStats>>(
      response,
      DataResponse<AnalysisStats>,
    );
  }

  /** Every source verdict of the analysis, one row per instance and source. */
  async downloadSourceVerdicts(
    options: DownloadSourceVerdictsRequestOptions,
  ): Promise<Blob> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities/source-verdicts`;

    return await this.getBlobRequest({
      queryParams: { format: options.format },
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
  }

  async getMaliciousPackageAdvisories(
    options: GetMaliciousPackageAdvisoriesRequestOptions,
  ): Promise<DataResponse<MaliciousPackageAdvisory[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities/malicious-packages`;

    return this.getRequest<DataResponse<MaliciousPackageAdvisory[]>>({
      queryParams: { workspace: options.workspace },
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
  }

  async getVulnerabilities(
    options: GetSbomRequestOptions,
  ): Promise<PaginatedResponse<VulnerabilityMerged>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities`;

    const queryParams: Record<string, string | number | undefined> = {
      workspace: options.workspace,
      page: options.pagination.page,
      entries_per_page: options.pagination.entries_per_page,
      sort_by: options.sort.sortKey,
      sort_direction: options.sort.sortDirection,
      active_filters: options.active_filters,
      search_key: options.search_key,
    };

    if (options.ecosystem_filter) {
      queryParams.ecosystem_filter = options.ecosystem_filter;
    }

    if (options.show_blacklisted !== undefined) {
      queryParams.show_blacklisted = options.show_blacklisted.toString();
    }

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<
      PaginatedResponse<VulnerabilityMerged>
    >({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<PaginatedResponse<VulnerabilityMerged>>(
      response,
      PaginatedResponse<VulnerabilityMerged>,
    );
  }

  async getFinding(
    options: GetFindingRequestOptions,
  ): Promise<DataResponse<VulnerabilityDetails>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities/vulnerability/${encodeURIComponent(options.vulnerability_id)}`;

    const queryParams: Record<string, string | number> = {
      workspace: options.workspace,
    };

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }
    if (options.dependency) queryParams.dependency = options.dependency;
    if (options.version) queryParams.version = options.version;

    const response = await this.getRequest<DataResponse<VulnerabilityDetails>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<VulnerabilityDetails>>(
      response,
      DataResponse<VulnerabilityDetails>,
    );
  }

  async getPatchesStat(
    options: GetSbomStatsRequestOptions,
  ): Promise<DataResponse<PatchingStats>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/patching/stats`;

    const queryParams: Record<string, string | number> = {
      workspace: options.workspace,
    };

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<DataResponse<PatchingStats>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<PatchingStats>>(
      response,
      DataResponse<PatchingStats>,
    );
  }

  /** Every patch of the workspace; the API takes no other parameter. */
  async getPatches(
    options: GetPatchesRequestOptions,
  ): Promise<DataResponse<Workspace>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/patching`;

    const queryParams = { workspace: options.workspace };

    const response = await this.getRequest<DataResponse<Workspace>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<Workspace>>(
      response,
      DataResponse<Workspace>,
    );
  }

  async getPatchesManifest(
    options: GetSbomStatsRequestOptions,
  ): Promise<DataResponse<PatchedManifestData>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/patching/manifest`;

    const response = await this.getRequest<DataResponse<PatchedManifestData>>({
      queryParams: {
        workspace: options.workspace,
      },
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<PatchedManifestData>>(
      response,
      DataResponse<PatchedManifestData>,
    );
  }

  async getResultByType(
    options: GetResultByTypeRequestOptions,
  ): Promise<DataResponse<Result>> {
    const RELATIVE_URL = `/result`;

    const queryParams: Record<string, string | number> = {
      org_id: options.orgId,
      project_id: options.projectId,
      analysis_id: options.analysisId,
      type: options.type,
    };

    if (options.runIndex !== null && options.runIndex !== undefined) {
      queryParams.run_index = options.runIndex;
    }

    const response = await this.getRequest<DataResponse<Result>>({
      queryParams,
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<Result>>(
      response,
      DataResponse<Result>,
    );
  }
}
