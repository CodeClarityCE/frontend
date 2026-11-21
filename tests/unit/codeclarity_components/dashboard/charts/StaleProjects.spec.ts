import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import StaleProjects from "@/codeclarity_components/dashboard/charts/StaleProjects.vue";
import type { OrganizationFreshness } from "@/codeclarity_components/vulnerabilities/project_freshness.entity";

import { createTestApp, org, type TestApp } from "../../../../real-app";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString();

const freshness: OrganizationFreshness = {
  threshold_days: 14,
  projects: [
    {
      project_id: "p-old",
      project_name: "old-api",
      analysis_id: "a-old",
      analyzed_on: daysAgo(30),
      stale: true,
    },
    {
      project_id: "p-recent",
      project_name: "recent-web",
      analysis_id: "a-recent",
      analyzed_on: daysAgo(2),
      stale: false,
    },
  ],
};

const reanalysePath = `/org/${org.id}/projects/p-old/analyses/reanalyse`;

// The card on the dashboard, with the freshness the API answers.
async function mountCard(answer: OrganizationFreshness) {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}/freshness`, { data: answer });
  app.http.on("POST", reanalysePath, { id: "a-new" }, 201);
  await app.visit("/");
  const wrapper = mount(StaleProjects, { global: app.global });
  await flushPromises();
  return { app, wrapper };
}

const reanalyses = (app: TestApp) =>
  app.http.requests.filter(
    (r) => r.method === "POST" && r.path === reanalysePath,
  );

describe("StaleProjects", () => {
  it("lists only the stale projects with the age of their current analysis", async () => {
    const { wrapper } = await mountCard(freshness);

    const rows = wrapper.findAll('[data-testid="stale-project"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.text()).toContain("old-api");
    expect(rows[0]!.text()).toContain("Analysed 30 days ago");
    expect(wrapper.text()).toContain("older than 14 days");
  });

  it("re-analyses a stale project and says the analysis started", async () => {
    const { app, wrapper } = await mountCard(freshness);

    await wrapper
      .get('button[aria-label="Re-analyse old-api"]')
      .trigger("click");
    await flushPromises();

    expect(reanalyses(app)).toHaveLength(1);
    expect(wrapper.find('[data-testid="stale-project"]').text()).toContain(
      "Analysis started",
    );
  });

  it("says when every project is fresh", async () => {
    const { wrapper } = await mountCard({
      ...freshness,
      projects: [freshness.projects[1]!],
    });

    expect(wrapper.text()).toContain(
      "Every project was analysed in the last 14 days.",
    );
  });
});
