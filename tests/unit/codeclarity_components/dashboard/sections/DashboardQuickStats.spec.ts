import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardQuickStats from "@/codeclarity_components/dashboard/sections/DashboardQuickStats.vue";

const { getRecentVulns, getQuickStats } = vi.hoisted(() => ({
  getRecentVulns: vi.fn(),
  getQuickStats: vi.fn(),
}));

vi.mock("@/codeclarity_components/dashboard/dashboard.repository", () => ({
  DashboardRepository: class {
    getRecentVulns = getRecentVulns;
    getQuickStats = getQuickStats;
  },
}));

describe("DashboardQuickStats", () => {
  beforeEach(() => {
    getRecentVulns.mockReset();
    getQuickStats.mockReset();
  });

  it("shows critical and high counts, projects scanned and the security grade", async () => {
    getRecentVulns.mockResolvedValue({
      data: {
        vulns: {},
        severity_count: [
          { severity_class: "CRITICAL", count: 1 },
          { severity_class: "HIGH", count: 0 },
        ],
      },
    });
    getQuickStats.mockResolvedValue({
      data: { nmb_projects: 3, max_grade: { score: 4.2, class: "B" } },
    });
    const wrapper = mount(DashboardQuickStats, {
      props: { integrationIds: [] },
    });
    await flushPromises();

    // Each tile reads label, value, hint.
    const tiles = wrapper
      .find('[aria-label="Project numbers"]')
      .findAll("li")
      .map((li) => li.findAll("span").map((span) => span.text()));
    expect(tiles).toEqual([
      ["Critical issues", "1", "1 issue found"],
      ["High severity", "0", "No high severity"],
      ["Projects scanned", "3", "Projects with an analysis"],
      ["Security score", "B", "Good security posture"],
    ]);
  });
});
