import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ExposureOverview from "@/codeclarity_components/dashboard/charts/ExposureOverview.vue";

const { getWeeklySeverityInfo } = vi.hoisted(() => ({
  getWeeklySeverityInfo: vi.fn(),
}));

vi.mock("@/codeclarity_components/dashboard/dashboard.repository", () => ({
  DashboardRepository: class {
    getWeeklySeverityInfo = getWeeklySeverityInfo;
  },
}));

function week(
  n: number,
  summed: number,
  critical: number,
  low: number,
): object {
  return {
    week_number: { week: n, year: 2026 },
    summed_severity: summed,
    nmb_critical: critical,
    nmb_high: 0,
    nmb_medium: 0,
    nmb_low: low,
    nmb_none: 0,
  };
}

describe("ExposureOverview", () => {
  beforeEach(() => getWeeklySeverityInfo.mockReset());

  it("charts the summed severity of each week", async () => {
    getWeeklySeverityInfo.mockResolvedValue({
      data: [week(43, 98.1, 2, 4), week(44, 0, 0, 0)],
    });
    const wrapper = mount(ExposureOverview, { props: { integrationIds: [] } });
    await flushPromises();

    const chart = wrapper.find(
      '[aria-label="Summed severity of vulnerabilities by week"]',
    );
    expect(
      chart.findAll('[role="img"]').map((c) => c.attributes("aria-label")),
    ).toEqual([
      "Oct 26 - Nov 01, 2026: summed severity 98",
      "Nov 02 - Nov 08, 2026: summed severity 0",
    ]);
  });

  it("lists each week's counts by severity, newest week first", async () => {
    getWeeklySeverityInfo.mockResolvedValue({
      data: [week(43, 98.1, 2, 4), week(44, 0, 0, 0)],
    });
    const wrapper = mount(ExposureOverview, { props: { integrationIds: [] } });
    await flushPromises();

    const weeks = wrapper
      .find('[aria-labelledby="dashboard-weekly-exposure"]')
      .findAll(":scope > li");
    expect(weeks).toHaveLength(2);
    expect(weeks[0]!.text()).toContain("Nov 02 - Nov 08, 2026");
    expect(weeks[0]!.text()).toContain("No vulnerabilities");
    expect(weeks[1]!.text()).toContain("Oct 26 - Nov 01, 2026");
    expect(weeks[1]!.text()).toContain("2 Critical");
    expect(weeks[1]!.text()).toContain("4 Low");
  });

  it("says when there is no data yet", async () => {
    getWeeklySeverityInfo.mockResolvedValue({ data: [] });
    const wrapper = mount(ExposureOverview, { props: { integrationIds: [] } });
    await flushPromises();

    expect(wrapper.text()).toContain("No data yet.");
  });
});
