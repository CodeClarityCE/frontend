import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFilteredDashboardRequest } from "@/codeclarity_components/dashboard/composables/useDashboardRequest";
import DashboardQuickStats from "@/codeclarity_components/dashboard/sections/DashboardQuickStats.vue";
import {
  TrendPeriod,
  type VulnerabilityTrend,
  type VulnerabilityTrendFilters,
  type VulnerabilityTrendPoint,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const getTrend = vi.fn();

function point(
  open: Partial<VulnerabilityTrendPoint["open"]>,
  project_count: number,
  security_score: number,
): VulnerabilityTrendPoint {
  return {
    start: "2026-11-09T00:00:00.000Z",
    end: "2026-11-16T00:00:00.000Z",
    open: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0, ...open },
    introduced: 0,
    fixed: 0,
    project_count,
    security_score,
  };
}

async function mountTiles(): Promise<ReturnType<typeof mount>> {
  const trend = useFilteredDashboardRequest<
    VulnerabilityTrend,
    VulnerabilityTrendFilters
  >(async () => await getTrend(), { period: TrendPeriod.Week });
  void trend.run();
  const wrapper = mount(DashboardQuickStats, { props: { trend } });
  await flushPromises();
  return wrapper;
}

const tiles = (wrapper: ReturnType<typeof mount>) =>
  wrapper
    .find('[aria-label="Project numbers"]')
    .findAll("li")
    .map((li) =>
      li
        .findAll(":scope > span")
        .map((span) => span.text().trim())
        .join(" "),
    );

describe("DashboardQuickStats", () => {
  beforeEach(() => getTrend.mockReset());

  it("shows the current numbers with their change since the previous period", async () => {
    getTrend.mockResolvedValue({
      period: TrendPeriod.Week,
      points: [
        point({ CRITICAL: 3, HIGH: 2 }, 2, 70),
        point({ CRITICAL: 1, HIGH: 2 }, 3, 80),
      ],
    });
    const wrapper = await mountTiles();

    expect(tiles(wrapper)).toEqual([
      "Critical vulnerabilities 1 2 fewer than last week",
      "High vulnerabilities 2 Same as last week",
      "Projects scanned 3 1 more than last week",
      "Security score B Up 10 points since last week",
    ]);
  });

  it("compares with last month when the trend is monthly", async () => {
    getTrend.mockResolvedValue({
      period: TrendPeriod.Month,
      points: [point({ HIGH: 1 }, 1, 90), point({ HIGH: 4 }, 1, 60)],
    });
    const wrapper = await mountTiles();

    expect(tiles(wrapper)[1]).toBe(
      "High vulnerabilities 4 3 more than last month",
    );
    expect(tiles(wrapper)[3]).toBe(
      "Security score C Down 30 points since last month",
    );
  });

  it("shows an error instead of numbers when the trend fails", async () => {
    getTrend.mockRejectedValueOnce(new Error("down"));
    getTrend.mockResolvedValueOnce({
      period: TrendPeriod.Week,
      points: [point({}, 1, 100)],
    });
    const wrapper = await mountTiles();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      "The project numbers could not be loaded.",
    );
    expect(wrapper.find('[aria-label="Project numbers"]').exists()).toBe(false);

    await wrapper.find('[role="alert"] button').trigger("click");
    await flushPromises();
    expect(tiles(wrapper)[3]).toBe("Security score A+");
  });
});
