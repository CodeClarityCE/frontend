import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { useFilteredDashboardRequest } from "@/codeclarity_components/dashboard/composables/useDashboardRequest";
import DashboardCharts from "@/codeclarity_components/dashboard/sections/DashboardCharts.vue";
import type {
  OrganizationVulnerabilityFilters,
  OrganizationVulnerabilityList,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import {
  TrendPeriod,
  type VulnerabilityTrend,
  type VulnerabilityTrendFilters,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";

describe("DashboardCharts", () => {
  it("shows a titled card for each part of the project overview", () => {
    const wrapper = mount(DashboardCharts, {
      props: {
        integrationIds: [],
        vulnerabilityList: useFilteredDashboardRequest<
          OrganizationVulnerabilityList,
          OrganizationVulnerabilityFilters
        >(() => new Promise(() => {}), {}),
        trend: useFilteredDashboardRequest<
          VulnerabilityTrend,
          VulnerabilityTrendFilters
        >(() => new Promise(() => {}), { period: TrendPeriod.Week }),
        projects: [],
      },
      global: {
        stubs: {
          CurrentVulns: true,
          OpenVulnerabilitiesTrend: true,
          LicenseDist: true,
          StaleProjects: true,
          TicketsDashboardCard: true,
          VulnerabilityImpact: true,
        },
      },
    });

    expect(wrapper.findAll("h3").map((h) => h.text())).toEqual([
      "Open vulnerabilities over time",
      "Vulnerabilities summary",
      "Tickets",
      "Stale projects",
      "Open source licenses",
      "Impact analysis",
    ]);
  });
});
