import { Entity } from "../../utils/api/BaseEntity";
import {
  type AuthRepoMethodGetRequestOptions,
  BaseRepository,
  type PaginatedRepoMethodRequestOptions,
  type SortableRepoMethodRequestOptions,
} from "../../utils/api/BaseRepository";
import { DataResponse } from "../../utils/api/responses/DataResponse";
import { PaginatedResponse } from "../../utils/api/responses/PaginatedResponse";

import {
  AttackVectorDist,
  CIAImpact,
  type LatestVulns,
  type LicenseDist,
  ProjectQuickStats,
  type QuickStats,
  SeverityInfoByWeek,
} from "./dashboard.entity";

export interface GetProjectsQuickStatsRequestOptions
  extends
    AuthRepoMethodGetRequestOptions,
    PaginatedRepoMethodRequestOptions,
    SortableRepoMethodRequestOptions {
  orgId: string;
  integrationIds: string[];
}
export interface GetDashboardComponentRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  integrationIds: string[];
}

export class DashboardRepository extends BaseRepository {
  async getProjectsQuickStats(
    options: GetProjectsQuickStatsRequestOptions,
  ): Promise<PaginatedResponse<ProjectQuickStats>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/project_quick_stats`;

    const response = await this.getRequest<
      PaginatedResponse<ProjectQuickStats>
    >({
      queryParams: {
        page: options.pagination.page,
        entries_per_page: options.pagination.entries_per_page,
        integrationIds: options.integrationIds,
        sort_key: options.sort.sortKey,
        sort_direction: options.sort.sortDirection,
      },
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const paginatedData = Entity.unMarshal<
      PaginatedResponse<ProjectQuickStats>
    >(response, PaginatedResponse<ProjectQuickStats>);
    paginatedData.data = Entity.unMarshalMany<ProjectQuickStats>(
      paginatedData.data,
      ProjectQuickStats,
    );
    return paginatedData;
  }

  async getAttackVectorsDist(
    options: GetDashboardComponentRequestOptions,
  ): Promise<DataResponse<AttackVectorDist[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/overall_av_dist`;

    const response = await this.getRequest<DataResponse<AttackVectorDist[]>>({
      bearerToken: options.bearerToken,
      queryParams: {
        integrationIds: options.integrationIds,
      },
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const data = Entity.unMarshal<DataResponse<AttackVectorDist[]>>(
      response,
      DataResponse<AttackVectorDist[]>,
    );
    data.data = Entity.unMarshalMany<AttackVectorDist>(
      data.data,
      AttackVectorDist,
    );
    return data;
  }

  async getLicenseDist(
    options: GetDashboardComponentRequestOptions,
  ): Promise<DataResponse<LicenseDist>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/overall_license_dist`;

    const response = await this.getRequest<DataResponse<LicenseDist>>({
      bearerToken: options.bearerToken,
      queryParams: {
        integrationIds: options.integrationIds,
      },
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const data = Entity.unMarshal<DataResponse<LicenseDist>>(
      response,
      DataResponse<LicenseDist>,
    );
    // data.data = Entity.unMarshalMany<LicenseDist>(data.data, LicenseDist);
    return data;
  }

  async getQuickStats(
    options: GetDashboardComponentRequestOptions,
  ): Promise<DataResponse<QuickStats>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/quick_stats`;

    const response = await this.getRequest<DataResponse<QuickStats>>({
      bearerToken: options.bearerToken,
      queryParams: {
        integrationIds: options.integrationIds,
      },
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const data = Entity.unMarshal<DataResponse<QuickStats>>(
      response,
      DataResponse<QuickStats>,
    );
    return data;
  }

  async getRecentVulns(
    options: GetDashboardComponentRequestOptions,
  ): Promise<DataResponse<LatestVulns>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/recent_vulns`;

    const response = await this.getRequest<DataResponse<LatestVulns>>({
      bearerToken: options.bearerToken,
      queryParams: {
        integrationIds: options.integrationIds,
      },
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const data = Entity.unMarshal<DataResponse<LatestVulns>>(
      response,
      DataResponse<LatestVulns>,
    );
    return data;
  }

  async getCIAImpact(
    options: GetDashboardComponentRequestOptions,
  ): Promise<DataResponse<CIAImpact[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/overall_cia_impact`;

    const response = await this.getRequest<DataResponse<CIAImpact[]>>({
      bearerToken: options.bearerToken,
      queryParams: {
        integrationIds: options.integrationIds,
      },
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const data = Entity.unMarshal<DataResponse<CIAImpact[]>>(
      response,
      DataResponse<CIAImpact[]>,
    );
    data.data = Entity.unMarshalMany<CIAImpact>(data.data, CIAImpact);
    return data;
  }

  async getWeeklySeverityInfo(
    options: GetDashboardComponentRequestOptions,
  ): Promise<DataResponse<SeverityInfoByWeek[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/weekly_severity_info`;

    const response = await this.getRequest<DataResponse<SeverityInfoByWeek[]>>({
      bearerToken: options.bearerToken,
      queryParams: {
        integrationIds: options.integrationIds,
      },
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const data = Entity.unMarshal<DataResponse<SeverityInfoByWeek[]>>(
      response,
      DataResponse<SeverityInfoByWeek[]>,
    );
    data.data = Entity.unMarshalMany<SeverityInfoByWeek>(
      data.data,
      SeverityInfoByWeek,
    );
    return data;
  }
}
