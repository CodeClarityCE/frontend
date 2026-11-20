import {
  type AuthRepoMethodGetRequestOptions,
  BaseRepository,
} from "@/utils/api/BaseRepository";

import type {
  OrganizationVulnerabilityFilters,
  OrganizationVulnerabilityList,
} from "./organization_vulnerability.entity";

export interface GetOrganizationVulnerabilitiesOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  page?: number;
  entriesPerPage?: number;
  filters?: OrganizationVulnerabilityFilters;
}

/** Organization-wide vulnerability views, read from the vulnerability instances. */
export class OrganizationVulnerabilitiesRepository extends BaseRepository {
  async getVulnerabilities(
    options: GetOrganizationVulnerabilitiesOptions,
  ): Promise<OrganizationVulnerabilityList> {
    return await this.getRequest<OrganizationVulnerabilityList>({
      bearerToken: options.bearerToken,
      queryParams: {
        page: options.page ?? 0,
        entries_per_page: options.entriesPerPage ?? 50,
        ...options.filters,
      },
      url: this.buildUrl(`/org/${options.orgId}/vulnerabilities`),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
  }
}
