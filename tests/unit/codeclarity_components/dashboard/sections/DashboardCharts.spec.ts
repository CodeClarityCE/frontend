import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { useFilteredDashboardRequest } from "@/codeclarity_components/dashboard/composables/useDashboardRequest";
import DashboardCharts from "@/codeclarity_components/dashboard/sections/DashboardCharts.vue";
import type {
  OrganizationVulnerabilityFilters,
  OrganizationVulnerabilityList,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

describe("DashboardCharts", () => {
  it("shows a titled card for each part of the project overview", () => {
    const wrapper = mount(DashboardCharts, {
      props: {
        integrationIds: [],
        vulnerabilityList: useFilteredDashboardRequest<
          OrganizationVulnerabilityList,
          OrganizationVulnerabilityFilters
        >(() => new Promise(() => {}), {}),
        projects: [],
      },
      global: {
        stubs: {
          CurrentVulns: true,
          ExposureOverview: true,
          LicenseDist: true,
          StaleProjects: true,
          TicketsDashboardCard: true,
          VulnerabilityImpact: true,
        },
      },
    });

    expect(wrapper.findAll("h3").map((h) => h.text())).toEqual([
      "Vulnerability exposure",
      "Vulnerabilities summary",
      "Tickets",
      "Stale projects",
      "Open source licenses",
      "Impact analysis",
    ]);
  });
});
