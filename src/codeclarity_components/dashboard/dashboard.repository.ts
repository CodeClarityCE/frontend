import { Entity } from "../../utils/api/BaseEntity";
import {
  type AuthRepoMethodGetRequestOptions,
  BaseRepository,
} from "../../utils/api/BaseRepository";
import { DataResponse } from "../../utils/api/responses/DataResponse";

import { CIAImpact, type LicenseDist } from "./dashboard.entity";

export interface GetDashboardComponentRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  integrationIds: string[];
}

export class DashboardRepository extends BaseRepository {
  async getLicenseDist(
    options: GetDashboardComponentRequestOptions,
  ): Promise<DataResponse<LicenseDist>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/overall_license_dist`;

    const response = await this.getRequest<DataResponse<LicenseDist>>({
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

  async getCIAImpact(
    options: GetDashboardComponentRequestOptions,
  ): Promise<DataResponse<CIAImpact[]>> {
    const RELATIVE_URL = `/org/${options.orgId}/dashboard/overall_cia_impact`;

    const response = await this.getRequest<DataResponse<CIAImpact[]>>({
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
}
