import { Entity } from "../../utils/api/BaseEntity";
import {
  type AuthRepoMethodEmptyDeleteRequestOptions,
  type AuthRepoMethodGetRequestOptions,
  type AuthRepoMethodPostRequestOptions,
  BaseRepository,
  type PaginatedRepoMethodRequestOptions,
} from "../../utils/api/BaseRepository";
import { CreatedResponse } from "../../utils/api/responses/CreatedResponse";
import { DataResponse } from "../../utils/api/responses/DataResponse";
import { NoDataResponse } from "../../utils/api/responses/NoDataResponse";
import { PaginatedResponse } from "../../utils/api/responses/PaginatedResponse";

import {
  type CreateDatasetRequest,
  Dataset,
  DatasetEntry,
} from "./dataset.entity";

export interface GetDatasetsRequestOptions
  extends AuthRepoMethodGetRequestOptions, PaginatedRepoMethodRequestOptions {
  orgId: string;
}

export interface GetDatasetRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  datasetId: string;
}

export interface GetDatasetEntriesRequestOptions
  extends AuthRepoMethodGetRequestOptions, PaginatedRepoMethodRequestOptions {
  orgId: string;
  datasetId: string;
}

export interface CreateDatasetRequestOptions extends AuthRepoMethodPostRequestOptions<CreateDatasetRequest> {
  orgId: string;
}

export interface DeleteDatasetRequestOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
  orgId: string;
  datasetId: string;
}

export class DatasetsRepository extends BaseRepository {
  async getDatasets(
    options: GetDatasetsRequestOptions,
  ): Promise<PaginatedResponse<Dataset>> {
    const RELATIVE_URL = `/org/${options.orgId}/datasets`;

    const response = await this.getRequest<PaginatedResponse<Dataset>>({
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

    const paginatedData = Entity.unMarshal<PaginatedResponse<Dataset>>(
      response,
      PaginatedResponse<Dataset>,
    );
    paginatedData.data = Entity.unMarshalMany<Dataset>(
      paginatedData.data,
      Dataset,
    );
    return paginatedData;
  }

  async getDataset(
    options: GetDatasetRequestOptions,
  ): Promise<DataResponse<Dataset>> {
    const RELATIVE_URL = `/org/${options.orgId}/datasets/${options.datasetId}`;

    const response = await this.getRequest<DataResponse<Dataset>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    const data = Entity.unMarshal<DataResponse<Dataset>>(
      response,
      DataResponse<Dataset>,
    );
    data.data = Entity.unMarshal<Dataset>(data.data, Dataset);
    return data;
  }

  async getDatasetEntries(
    options: GetDatasetEntriesRequestOptions,
  ): Promise<PaginatedResponse<DatasetEntry>> {
    const RELATIVE_URL = `/org/${options.orgId}/datasets/${options.datasetId}/entries`;

    const response = await this.getRequest<PaginatedResponse<DatasetEntry>>({
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

    const paginatedData = Entity.unMarshal<PaginatedResponse<DatasetEntry>>(
      response,
      PaginatedResponse<DatasetEntry>,
    );
    paginatedData.data = Entity.unMarshalMany<DatasetEntry>(
      paginatedData.data,
      DatasetEntry,
    );
    return paginatedData;
  }

  async createDataset(
    options: CreateDatasetRequestOptions,
  ): Promise<CreatedResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/datasets`;

    const response = await this.postRequest<
      CreatedResponse,
      CreateDatasetRequest
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

  async deleteDataset(
    options: DeleteDatasetRequestOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/datasets/${options.datasetId}`;

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
}
