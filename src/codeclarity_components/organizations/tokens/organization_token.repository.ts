import { Entity } from "@/utils/api/BaseEntity";
import {
  type AuthRepoMethodEmptyDeleteRequestOptions,
  type AuthRepoMethodGetRequestOptions,
  type AuthRepoMethodPostRequestOptions,
  BaseRepository,
  type EmptyPostData,
} from "@/utils/api/BaseRepository";
import { type DataResponse } from "@/utils/api/responses/DataResponse";
import { NoDataResponse } from "@/utils/api/responses/NoDataResponse";

import {
  CreatedOrganizationToken,
  type OrganizationTokenCreate,
  OrganizationTokenSummary,
} from "./organization_token.entity";

export interface CreateOrganizationTokenRequestOptions extends AuthRepoMethodPostRequestOptions<OrganizationTokenCreate> {
  orgId: string;
}

export interface ListOrganizationTokensRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
}

export interface RevokeOrganizationTokenRequestOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
  orgId: string;
  tokenId: string;
}

export class OrganizationTokenRepository extends BaseRepository {
  /** Creates a token; the response is the only time its secret is sent. */
  async create(
    options: CreateOrganizationTokenRequestOptions,
  ): Promise<CreatedOrganizationToken> {
    const response = await this.postRequest<
      DataResponse<CreatedOrganizationToken>,
      OrganizationTokenCreate
    >({
      data: options.data,
      url: this.buildUrl(`/org/${options.orgId}/tokens`),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshal<CreatedOrganizationToken>(
      response.data,
      CreatedOrganizationToken,
    );
  }

  /** The organization's live tokens, newest first, without secrets. */
  async list(
    options: ListOrganizationTokensRequestOptions,
  ): Promise<OrganizationTokenSummary[]> {
    const response = await this.getRequest<
      DataResponse<OrganizationTokenSummary[]>
    >({
      url: this.buildUrl(`/org/${options.orgId}/tokens`),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshalMany<OrganizationTokenSummary>(
      response.data,
      OrganizationTokenSummary,
    );
  }

  /** Revokes a token; the API refuses it from the next request on. */
  async revoke(
    options: RevokeOrganizationTokenRequestOptions,
  ): Promise<NoDataResponse> {
    const response = await this.deleteRequest<NoDataResponse, EmptyPostData>({
      data: {},
      url: this.buildUrl(`/org/${options.orgId}/tokens/${options.tokenId}`),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }
}
