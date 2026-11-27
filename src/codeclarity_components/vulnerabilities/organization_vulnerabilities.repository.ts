import {
  type AuthRepoMethodGetRequestOptions,
  BaseRepository,
} from "@/utils/api/BaseRepository";

import type { FixNextEntry } from "./fix_next.entity";
import type {
  OrganizationVulnerabilityFilters,
  OrganizationVulnerabilityList,
  OrganizationVulnerabilityPage,
} from "./organization_vulnerability.entity";
import type {
  OrganizationFreshness,
  VulnerabilityNotYetChecked,
} from "./project_freshness.entity";
import type {
  VulnerabilityTrend,
  VulnerabilityTrendFilters,
} from "./vulnerability_trend.entity";

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

export interface GetFreshnessOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
}

export interface GetTrendOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  filters: VulnerabilityTrendFilters;
  /** How many periods; the API defaults to 12 */
  periods?: number;
}

export interface GetFixNextOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  /** How many entries; the API defaults to 10 */
  limit?: number;
}

export interface GetNotYetCheckedOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  vulnerabilityId: string;
}

/** Organization-wide vulnerability views, read from the vulnerability instances. */
export class OrganizationVulnerabilitiesRepository extends BaseRepository {
  async getVulnerabilities(
    options: GetOrganizationVulnerabilitiesOptions,
  ): Promise<OrganizationVulnerabilityList> {
    const { known_exploited, ...filters } = options.filters ?? {};
    return await this.getRequest<OrganizationVulnerabilityList>({
      queryParams: {
        page: options.page ?? 0,
        entries_per_page: options.entriesPerPage ?? 50,
        ...filters,
        known_exploited:
          known_exploited === undefined ? undefined : String(known_exploited),
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
      url: this.buildUrl(
        `/org/${options.orgId}/vulnerabilities/${encodeURIComponent(options.vulnerabilityId)}`,
      ),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return response.data;
  }

  /** Each project's current analysis and whether it is stale. */
  async getFreshness(
    options: GetFreshnessOptions,
  ): Promise<OrganizationFreshness> {
    const response = await this.getRequest<{ data: OrganizationFreshness }>({
      url: this.buildUrl(`/org/${options.orgId}/freshness`),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return response.data;
  }

  /** The projects not yet checked for one vulnerability. */
  async getNotYetChecked(
    options: GetNotYetCheckedOptions,
  ): Promise<VulnerabilityNotYetChecked> {
    const response = await this.getRequest<{
      data: VulnerabilityNotYetChecked;
    }>({
      url: this.buildUrl(
        `/org/${options.orgId}/vulnerabilities/${encodeURIComponent(options.vulnerabilityId)}/freshness`,
      ),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return response.data;
  }

  /** Open vulnerability instances over time, with introduced and fixed counts. */
  async getTrend(options: GetTrendOptions): Promise<VulnerabilityTrend> {
    const response = await this.getRequest<{ data: VulnerabilityTrend }>({
      queryParams: {
        ...options.filters,
        ...(options.periods ? { periods: options.periods } : {}),
      },
      url: this.buildUrl(`/org/${options.orgId}/vulnerabilities/trend`),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return response.data;
  }

  /** The organization's remediations, most urgent first. */
  async getFixNext(options: GetFixNextOptions): Promise<FixNextEntry[]> {
    const response = await this.getRequest<{ data: FixNextEntry[] }>({
      queryParams: options.limit ? { limit: options.limit } : {},
      url: this.buildUrl(`/org/${options.orgId}/remediations/fix-next`),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
    return response.data;
  }
}
