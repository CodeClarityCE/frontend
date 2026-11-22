import { Entity } from "@/utils/api/BaseEntity";
import {
  type AuthRepoMethodPostRequestOptions,
  BaseRepository,
} from "@/utils/api/BaseRepository";
import { type DataResponse } from "@/utils/api/responses/DataResponse";

import {
  CreatedOrganizationToken,
  type OrganizationTokenCreate,
} from "./organization_token.entity";

export interface CreateOrganizationTokenRequestOptions extends AuthRepoMethodPostRequestOptions<OrganizationTokenCreate> {
  orgId: string;
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
      bearerToken: options.bearerToken,
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
}
