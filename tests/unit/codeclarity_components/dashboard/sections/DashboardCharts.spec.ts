import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardCharts from "@/codeclarity_components/dashboard/sections/DashboardCharts.vue";

describe("DashboardCharts", () => {
  it("shows a titled card for each part of the project overview", () => {
    const wrapper = mount(DashboardCharts, {
      props: { integrationIds: [] },
      global: {
        stubs: {
          CurrentVulns: true,
          ExposureOverview: true,
          LicenseDist: true,
          TicketsDashboardCard: true,
          VulnerabilityImpact: true,
        },
      },
    });

    expect(wrapper.findAll("h3").map((h) => h.text())).toEqual([
      "Vulnerability exposure",
      "Vulnerabilities summary",
      "Tickets",
      "Open source licences",
      "Impact analysis",
    ]);
  });
});
