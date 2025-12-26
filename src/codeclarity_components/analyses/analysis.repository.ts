import { Entity } from "../../utils/api/BaseEntity";
import {
  BaseRepository,
  type AuthRepoMethodGetRequestOptions,
  type AuthRepoMethodPostRequestOptions,
  type AuthRepoMethodPutRequestOptions,
  type EmptyPostData,
  type AuthRepoMethodEmptyDeleteRequestOptions,
} from "../../utils/api/BaseRepository";
import { CreatedResponse } from "../../utils/api/responses/CreatedResponse";
import { DataResponse } from "../../utils/api/responses/DataResponse";
import { NoDataResponse } from "../../utils/api/responses/NoDataResponse";
import { PaginatedResponse } from "../../utils/api/responses/PaginatedResponse";
import type { Analysis } from "./analysis.entity";
import type { CreateAnalysis, UpdateSchedule } from "./analysis.http";

export interface GetAnalysesRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  page: number;
  entries_per_page: number;
  search_key: string;
}

export interface GetAnalysisByIdRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
}

export interface DeleteAnalysisOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
}

export interface CreateAnalysisOptions extends AuthRepoMethodPostRequestOptions<CreateAnalysis> {
  orgId: string;
  projectId: string;
}

export interface GetScheduledAnalysesOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
}

export interface UpdateScheduleOptions extends AuthRepoMethodPutRequestOptions<UpdateSchedule> {
  orgId: string;
  projectId: string;
  analysisId: string;
}

export interface CancelScheduleOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
}

export class AnalysisRepository extends BaseRepository {
  async createAnalysis(
    options: CreateAnalysisOptions,
  ): Promise<CreatedResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses`;

    const response = await this.postRequest<CreatedResponse, CreateAnalysis>({
      bearerToken: options.bearerToken,
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
  }

  async getAnalyses(
    options: GetAnalysesRequestOptions,
  ): Promise<PaginatedResponse<Analysis>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses`;

    const response = await this.getRequest<PaginatedResponse<Analysis>>({
      queryParams: {
        page: options.page,
        entries_per_page: options.entries_per_page,
        search_key: options.search_key,
      },
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<PaginatedResponse<Analysis>>(
      response,
      PaginatedResponse<Analysis>,
    );
  }

  async getProjectById(
    options: GetAnalysisByIdRequestOptions,
  ): Promise<DataResponse<Analysis>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses/${options.analysisId}`;

    const response = await this.getRequest<DataResponse<Analysis>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<Analysis>>(
      response,
      DataResponse<Analysis>,
    );
  }

  async getAnalysisChartById(
    options: GetAnalysisByIdRequestOptions,
  ): Promise<DataResponse<object[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses/${options.analysisId}/chart`;

    const response = await this.getRequest<DataResponse<object[]>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<object[]>>(
      response,
      DataResponse<object[]>,
    );
  }

  async deleteAnalysis(
    options: DeleteAnalysisOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses/${options.analysisId}`;

    const response = await this.deleteRequest<NoDataResponse, EmptyPostData>({
      data: {},
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async getScheduledAnalyses(
    options: GetScheduledAnalysesOptions,
  ): Promise<DataResponse<Analysis[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses/scheduled`;

    const response = await this.getRequest<DataResponse<Analysis[]>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<Analysis[]>>(
      response,
      DataResponse<Analysis[]>,
    );
  }

  async updateSchedule(
    options: UpdateScheduleOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses/${options.analysisId}/schedule`;

    const response = await this.putRequest<NoDataResponse, UpdateSchedule>({
      bearerToken: options.bearerToken,
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async cancelSchedule(
    options: CancelScheduleOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses/${options.analysisId}/schedule`;

    const response = await this.deleteRequest<NoDataResponse, EmptyPostData>({
      data: {},
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async getAnalysisRuns(
    options: GetAnalysisByIdRequestOptions,
  ): Promise<DataResponse<Analysis[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/projects/${options.projectId}/analyses/${options.analysisId}/runs`;

    const response = await this.getRequest<DataResponse<Analysis[]>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<DataResponse<Analysis[]>>(
      response,
      DataResponse<Analysis[]>,
    );
  }
}
