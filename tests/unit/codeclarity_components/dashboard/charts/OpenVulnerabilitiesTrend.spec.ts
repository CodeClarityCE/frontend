import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import OpenVulnerabilitiesTrend from "@/codeclarity_components/dashboard/charts/OpenVulnerabilitiesTrend.vue";
import { useFilteredDashboardRequest } from "@/codeclarity_components/dashboard/composables/useDashboardRequest";
import {
  TrendPeriod,
  type VulnerabilityTrend,
  type VulnerabilityTrendFilters,
  type VulnerabilityTrendPoint,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";

function point(
  start: string,
  end: string,
  open: Partial<VulnerabilityTrendPoint["open"]>,
  introduced: number,
  fixed: number,
): VulnerabilityTrendPoint {
  return {
    start,
    end,
    open: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0, ...open },
    introduced,
    fixed,
    project_count: 1,
    security_score: 50,
  };
}

const weekly: VulnerabilityTrend = {
  period: TrendPeriod.Week,
  points: [
    point(
      "2026-11-09T00:00:00.000Z",
      "2026-11-16T00:00:00.000Z",
      { CRITICAL: 1, HIGH: 2 },
      3,
      0,
    ),
    point(
      "2026-11-16T00:00:00.000Z",
      "2026-11-23T00:00:00.000Z",
      { HIGH: 1 },
      0,
      2,
    ),
  ],
};

async function mountTrend(
  trend: VulnerabilityTrend,
): Promise<ReturnType<typeof mount>> {
  const request = useFilteredDashboardRequest<
    VulnerabilityTrend,
    VulnerabilityTrendFilters
  >(() => Promise.resolve(trend), { period: trend.period });
  await request.run();
  const wrapper = mount(OpenVulnerabilitiesTrend, { props: { request } });
  await flushPromises();
  return wrapper;
}

const descriptions = (wrapper: ReturnType<typeof mount>, caption: string) =>
  wrapper
    .find(`[aria-label="${caption}"]`)
    .findAll('[role="img"]')
    .map((column) => column.attributes("aria-label"));

describe("OpenVulnerabilitiesTrend", () => {
  it("charts each week's open vulnerability instances by severity", async () => {
    const wrapper = await mountTrend(weekly);

    expect(
      descriptions(
        wrapper,
        "Open vulnerability instances by severity, per week",
      ),
    ).toEqual([
      "Week of Nov 09, 2026: 3 open (1 critical, 2 high)",
      "Week of Nov 16, 2026: 1 open (1 high)",
    ]);
    // One stacked column per severity present in the week.
    expect(
      wrapper
        .find(
          '[aria-label="Open vulnerability instances by severity, per week"]',
        )
        .findAll('[data-testid="figure-bar"]'),
    ).toHaveLength(3);
  });

  it("charts how many instances each week introduced and fixed", async () => {
    const wrapper = await mountTrend(weekly);

    expect(
      descriptions(
        wrapper,
        "Vulnerability instances introduced and fixed per week",
      ),
    ).toEqual([
      "Week of Nov 09, 2026: 3 introduced, 0 fixed",
      "Week of Nov 16, 2026: 0 introduced, 2 fixed",
    ]);
  });

  it("names months when the trend is monthly", async () => {
    const wrapper = await mountTrend({
      period: TrendPeriod.Month,
      points: [
        point("2026-10-01T00:00:00.000Z", "2026-11-01T00:00:00.000Z", {}, 0, 0),
      ],
    });

    expect(
      descriptions(
        wrapper,
        "Open vulnerability instances by severity, per month",
      ),
    ).toEqual(["October 2026: 0 open"]);
  });

  it("says when no project has been analysed in the period", async () => {
    const wrapper = await mountTrend({
      period: TrendPeriod.Week,
      points: [
        {
          ...weekly.points[0]!,
          open: point("", "", {}, 0, 0).open,
          project_count: 0,
        },
      ],
    });

    expect(wrapper.text()).toContain("No data yet.");
  });
});
