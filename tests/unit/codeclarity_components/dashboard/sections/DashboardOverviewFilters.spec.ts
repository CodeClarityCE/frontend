import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { useFilteredDashboardRequest } from "@/codeclarity_components/dashboard/composables/useDashboardRequest";
import DashboardOverviewFilters from "@/codeclarity_components/dashboard/sections/DashboardOverviewFilters.vue";
import {
  TrendPeriod,
  type VulnerabilityTrend,
  type VulnerabilityTrendFilters,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

function mountFilters() {
  const load = vi.fn((_filters: VulnerabilityTrendFilters) =>
    Promise.resolve({
      period: TrendPeriod.Week,
      points: [],
    } as VulnerabilityTrend),
  );
  const trend = useFilteredDashboardRequest(load, { period: TrendPeriod.Week });
  const wrapper = mount(DashboardOverviewFilters, {
    props: {
      trend,
      projects: [
        { id: "p-api", name: "api" },
        { id: "p-web", name: "web" },
      ],
    },
  });
  return { wrapper, load };
}

describe("DashboardOverviewFilters", () => {
  it("narrows the numbers and the trend to one project", async () => {
    const { wrapper, load } = mountFilters();

    await wrapper.find('select[aria-label="Project"]').setValue("p-web");

    expect(load).toHaveBeenLastCalledWith({
      period: TrendPeriod.Week,
      project: "p-web",
    });

    await wrapper.find('select[aria-label="Project"]').setValue("");

    expect(load).toHaveBeenLastCalledWith({ period: TrendPeriod.Week });
  });

  it("switches between weeks and months", async () => {
    const { wrapper, load } = mountFilters();

    await wrapper.find('select[aria-label="Period"]').setValue("month");

    expect(load).toHaveBeenLastCalledWith({ period: TrendPeriod.Month });
  });
});
