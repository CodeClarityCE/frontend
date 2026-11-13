import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import DashboardView from "@/codeclarity_components/dashboard/DashboardView.vue";

const data = vi.hoisted(() => ({ current: {} }));

vi.mock(
  "@/codeclarity_components/dashboard/composables/useDashboardData",
  () => ({ useDashboardData: () => data.current }),
);

function dashboardData(overrides: Record<string, boolean> = {}) {
  const flags = {
    isLoading: false,
    hasError: false,
    hasData: true,
    hasIntegrations: true,
    hasProjects: true,
    hasAnalyses: true,
    ...overrides,
  };
  return {
    ...Object.fromEntries(
      Object.entries(flags).map(([key, value]) => [key, ref(value)]),
    ),
    activeIntegrationIds: ref([]),
    defaultOrg: ref({ id: "org-1" }),
    refreshData: vi.fn(),
  };
}

function mountView() {
  return mount(DashboardView, {
    global: {
      stubs: {
        DashboardResearch: { template: "<section>Research stub</section>" },
        DashboardQuickStats: { template: "<div>Quick stats stub</div>" },
        DashboardCharts: { template: "<div>Charts stub</div>" },
        DashboardEmptyState: { template: "<div>Empty state stub</div>" },
      },
    },
  });
}

describe("DashboardView", () => {
  beforeEach(() => {
    data.current = dashboardData();
  });

  it("puts Research above the project overview", () => {
    const text = mountView().text();

    expect(text.indexOf("Research stub")).toBeLessThan(
      text.indexOf("Projects"),
    );
    expect(text).toContain("Quick stats stub");
    expect(text).toContain("Charts stub");
  });

  it("shows the project empty state when nothing has been analysed", () => {
    data.current = dashboardData({ hasData: false, hasAnalyses: false });
    const text = mountView().text();

    expect(text).toContain("Empty state stub");
    expect(text).not.toContain("Charts stub");
  });

  it("shows a loading status while the project overview loads", () => {
    data.current = dashboardData({ isLoading: true });
    const wrapper = mountView();

    expect(
      wrapper.find('[aria-label="Loading the project overview"]').exists(),
    ).toBe(true);
  });
});
