import {
  type AuthRepoMethodGetRequestOptions,
  BaseRepository,
} from "@/utils/api/BaseRepository";

import type {
  OrganizationVulnerabilityFilters,
  OrganizationVulnerabilityList,
  OrganizationVulnerabilityPage,
} from "./organization_vulnerability.entity";

export interface GetOrganizationVulnerabilitiesOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  page?: number;
  entriesPerPage?: number;
  filters?: OrganizationVulnerabilityFilters;
}

export interface GetOrganizationVulnerabilityOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  vulnerabilityId: string;
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

  async getVulnerability(
    options: GetOrganizationVulnerabilityOptions,
  ): Promise<OrganizationVulnerabilityPage> {
    const response = await this.getRequest<{
      data: OrganizationVulnerabilityPage;
    }>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(
        `/org/${options.orgId}/vulnerabilities/${encodeURIComponent(options.vulnerabilityId)}`,
      ),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return response.data;
  }
}
