import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import DashboardView from "@/codeclarity_components/dashboard/DashboardView.vue";
import { TrendPeriod } from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";

import { createTestApp, org, type TestApp } from "../../../real-app";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

// The trend the overview reads, with this many analysed projects now.
const trend = (projectCount: number) => ({
  data: {
    period: TrendPeriod.Week,
    points: [
      {
        start: "2026-11-09T00:00:00.000Z",
        end: "2026-11-16T00:00:00.000Z",
        open: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 },
        introduced: 0,
        fixed: 0,
        project_count: projectCount,
        security_score: 100,
      },
    ],
  },
});

// The dashboard page of an organisation with one project.
async function openDashboard(analysedProjects: number): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}/meta_data`, {
    data: {
      id: org.id,
      created_on: "2024-01-01T00:00:00Z",
      projects: [{ id: "p-1", name: "api" }],
      integrations: [],
    },
  });
  app.http.on(
    "GET",
    `/org/${org.id}/vulnerabilities/trend`,
    trend(analysedProjects),
  );
  await app.visit("/");
  return app;
}

describe("DashboardView", () => {
  it("puts Research above the project overview", async () => {
    const app = await openDashboard(1);
    const wrapper = mount(DashboardView, { global: app.global });
    await flushPromises();

    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings.indexOf("Research")).toBeLessThan(
      headings.indexOf("Projects"),
    );
    expect(wrapper.text()).toContain("Fix next");
    expect(wrapper.text()).toContain("My work");
    expect(wrapper.text()).not.toContain("Run your first analysis");
  });

  it("shows the project empty state when nothing has been analysed", async () => {
    const app = await openDashboard(0);
    const wrapper = mount(DashboardView, { global: app.global });
    await flushPromises();

    expect(wrapper.text()).toContain("Run your first analysis");
    expect(wrapper.text()).not.toContain("Fix next");
  });

  it("shows a loading status while the project overview loads", async () => {
    const app = await openDashboard(1);
    const wrapper = mount(DashboardView, { global: app.global });

    expect(
      wrapper.find('[aria-label="Loading the project overview"]').exists(),
    ).toBe(true);
    await flushPromises();
    expect(
      wrapper.find('[aria-label="Loading the project overview"]').exists(),
    ).toBe(false);
  });

  it("says so when the projects can't be loaded", async () => {
    const app = await openDashboard(1);
    app.http.on("GET", `/org/${org.id}/meta_data`, {}, 500);
    const wrapper = mount(DashboardView, { global: app.global });
    await flushPromises();

    expect(wrapper.text()).toContain("Unable to load the project overview");
  });
});
