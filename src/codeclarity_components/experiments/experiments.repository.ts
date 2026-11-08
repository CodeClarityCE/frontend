import { Entity } from "../../utils/api/BaseEntity";
import {
  type AuthRepoMethodEmptyDeleteRequestOptions,
  type AuthRepoMethodEmptyPostRequestOptions,
  type AuthRepoMethodGetRequestOptions,
  type AuthRepoMethodPatchRequestOptions,
  type AuthRepoMethodPostRequestOptions,
  BaseRepository,
  type PaginatedRepoMethodRequestOptions,
} from "../../utils/api/BaseRepository";
import { CreatedResponse } from "../../utils/api/responses/CreatedResponse";
import { DataResponse } from "../../utils/api/responses/DataResponse";
import { NoDataResponse } from "../../utils/api/responses/NoDataResponse";
import { PaginatedResponse } from "../../utils/api/responses/PaginatedResponse";

import {
  type CreateExperimentRequest,
  Experiment,
  type ExperimentEstimateBasis,
  type ExperimentExportFile,
  type ExperimentResults,
  ExperimentRun,
} from "./experiment.entity";
import type {
  Figure,
  FigureCatalog,
  FigureData,
  FigureDefinition,
} from "./experiment-figure.entity";

export interface FigureRequestScope {
  orgId: string;
  experimentId: string;
}

export type GetFiguresRequestOptions = AuthRepoMethodGetRequestOptions &
  FigureRequestScope;

export type ComputeFigureDataRequestOptions = AuthRepoMethodPostRequestOptions<{
  definition: FigureDefinition;
}> &
  FigureRequestScope;

export type CreateFigureRequestOptions = AuthRepoMethodPostRequestOptions<{
  name: string;
  definition: FigureDefinition;
}> &
  FigureRequestScope;

export type UpdateFigureRequestOptions = AuthRepoMethodPatchRequestOptions<{
  name?: string;
  definition?: FigureDefinition;
}> &
  FigureRequestScope & { figureId: string };

export type DeleteFigureRequestOptions =
  AuthRepoMethodEmptyDeleteRequestOptions &
    FigureRequestScope & { figureId: string };

export interface GetExperimentsRequestOptions
  extends AuthRepoMethodGetRequestOptions, PaginatedRepoMethodRequestOptions {
  orgId: string;
}

export interface GetEstimateBasisRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
}

export interface GetExperimentRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  experimentId: string;
}

export interface GetExperimentRunsRequestOptions
  extends AuthRepoMethodGetRequestOptions, PaginatedRepoMethodRequestOptions {
  orgId: string;
  experimentId: string;
}

export interface GetExperimentResultsRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  experimentId: string;
}

export interface DownloadExperimentExportRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  experimentId: string;
  file: ExperimentExportFile;
}

export interface CreateExperimentRequestOptions extends AuthRepoMethodPostRequestOptions<CreateExperimentRequest> {
  orgId: string;
}

export interface CancelExperimentRequestOptions extends AuthRepoMethodEmptyPostRequestOptions {
  orgId: string;
  experimentId: string;
}

export interface DeleteExperimentRequestOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
  orgId: string;
  experimentId: string;
}

export class ExperimentsRepository extends BaseRepository {
  async getExperiments(
    options: GetExperimentsRequestOptions,
  ): Promise<PaginatedResponse<Experiment>> {
    const RELATIVE_URL = `/org/${options.orgId}/experiments`;

    const response = await this.getRequest<PaginatedResponse<Experiment>>({
      queryParams: {
        page: options.pagination.page,
        entries_per_page: options.pagination.entries_per_page,
      },
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const paginatedData = Entity.unMarshal<PaginatedResponse<Experiment>>(
      response,
      PaginatedResponse<Experiment>,
    );
    paginatedData.data = Entity.unMarshalMany<Experiment>(
      paginatedData.data,
      Experiment,
    );
    return paginatedData;
  }

  /** What the create form estimates an experiment's analyses from. */
  async getEstimateBasis(
    options: GetEstimateBasisRequestOptions,
  ): Promise<DataResponse<ExperimentEstimateBasis>> {
    const response = await this.getRequest<
      DataResponse<ExperimentEstimateBasis>
    >({
      bearerToken: options.bearerToken,
      url: this.buildUrl(`/org/${options.orgId}/experiments/estimate`),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshal<DataResponse<ExperimentEstimateBasis>>(
      response,
      DataResponse<ExperimentEstimateBasis>,
    );
  }

  async getExperiment(
    options: GetExperimentRequestOptions,
  ): Promise<DataResponse<Experiment>> {
    const RELATIVE_URL = `/org/${options.orgId}/experiments/${options.experimentId}`;

    const response = await this.getRequest<DataResponse<Experiment>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const data = Entity.unMarshal<DataResponse<Experiment>>(
      response,
      DataResponse<Experiment>,
    );
    data.data = Entity.unMarshal<Experiment>(data.data, Experiment);
    return data;
  }

  async getExperimentRuns(
    options: GetExperimentRunsRequestOptions,
  ): Promise<PaginatedResponse<ExperimentRun>> {
    const RELATIVE_URL = `/org/${options.orgId}/experiments/${options.experimentId}/runs`;

    const response = await this.getRequest<PaginatedResponse<ExperimentRun>>({
      queryParams: {
        page: options.pagination.page,
        entries_per_page: options.pagination.entries_per_page,
      },
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const paginatedData = Entity.unMarshal<PaginatedResponse<ExperimentRun>>(
      response,
      PaginatedResponse<ExperimentRun>,
    );
    paginatedData.data = Entity.unMarshalMany<ExperimentRun>(
      paginatedData.data,
      ExperimentRun,
    );
    return paginatedData;
  }

  async createExperiment(
    options: CreateExperimentRequestOptions,
  ): Promise<CreatedResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/experiments`;

    const response = await this.postRequest<
      CreatedResponse,
      CreateExperimentRequest
    >({
      bearerToken: options.bearerToken,
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
  }

  async cancelExperiment(
    options: CancelExperimentRequestOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/experiments/${options.experimentId}/cancel`;

    const response = await this.postRequest<
      NoDataResponse,
      Record<string, never>
    >({
      bearerToken: options.bearerToken,
      data: {},
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async deleteExperiment(
    options: DeleteExperimentRequestOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/experiments/${options.experimentId}`;

    const response = await this.deleteRequest<
      NoDataResponse,
      Record<string, never>
    >({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
      data: {},
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async getExperimentResults(
    options: GetExperimentResultsRequestOptions,
  ): Promise<DataResponse<ExperimentResults>> {
    const RELATIVE_URL = `/org/${options.orgId}/experiments/${options.experimentId}/results`;

    const response = await this.getRequest<DataResponse<ExperimentResults>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    // Plain aggregates: no class to unmarshal the payload into
    return Entity.unMarshal<DataResponse<ExperimentResults>>(
      response,
      DataResponse<ExperimentResults>,
    );
  }

  /** One export file, fetched with the bearer token so it can be saved. */
  async downloadExperimentExport(
    options: DownloadExperimentExportRequestOptions,
  ): Promise<Blob> {
    const RELATIVE_URL = `/org/${options.orgId}/experiments/${options.experimentId}/export/${options.file}`;

    return await this.getBlobRequest({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
  }

  /** The combinations the Figure composer may offer. */
  async getFigureCatalog(
    options: GetFiguresRequestOptions,
  ): Promise<DataResponse<FigureCatalog>> {
    const response = await this.getRequest<DataResponse<FigureCatalog>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(this.experimentUrl(options, "figure-catalog")),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshal<DataResponse<FigureCatalog>>(
      response,
      DataResponse<FigureCatalog>,
    );
  }

  async getFigures(
    options: GetFiguresRequestOptions,
  ): Promise<DataResponse<Figure[]>> {
    const response = await this.getRequest<DataResponse<Figure[]>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(this.experimentUrl(options, "figures")),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshal<DataResponse<Figure[]>>(
      response,
      DataResponse<Figure[]>,
    );
  }

  /** The plotted values of a definition, for previews and reopened Figures. */
  async computeFigureData(
    options: ComputeFigureDataRequestOptions,
  ): Promise<DataResponse<FigureData>> {
    const response = await this.postRequest<
      DataResponse<FigureData>,
      { definition: FigureDefinition }
    >({
      bearerToken: options.bearerToken,
      data: options.data,
      url: this.buildUrl(this.experimentUrl(options, "figure-data")),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshal<DataResponse<FigureData>>(
      response,
      DataResponse<FigureData>,
    );
  }

  async createFigure(
    options: CreateFigureRequestOptions,
  ): Promise<CreatedResponse> {
    const response = await this.postRequest<
      CreatedResponse,
      { name: string; definition: FigureDefinition }
    >({
      bearerToken: options.bearerToken,
      data: options.data,
      url: this.buildUrl(this.experimentUrl(options, "figures")),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
  }

  async updateFigure(
    options: UpdateFigureRequestOptions,
  ): Promise<NoDataResponse> {
    const response = await this.patchRequest<
      NoDataResponse,
      { name?: string; definition?: FigureDefinition }
    >({
      bearerToken: options.bearerToken,
      data: options.data,
      url: this.buildUrl(
        this.experimentUrl(options, `figures/${options.figureId}`),
      ),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async deleteFigure(
    options: DeleteFigureRequestOptions,
  ): Promise<NoDataResponse> {
    const response = await this.deleteRequest<
      NoDataResponse,
      Record<string, never>
    >({
      bearerToken: options.bearerToken,
      url: this.buildUrl(
        this.experimentUrl(options, `figures/${options.figureId}`),
      ),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
      data: {},
    });
    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  private experimentUrl(scope: FigureRequestScope, path: string): string {
    return `/org/${scope.orgId}/experiments/${scope.experimentId}/${path}`;
  }
}
