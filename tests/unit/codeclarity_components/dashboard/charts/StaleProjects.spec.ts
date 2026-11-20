import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StaleProjects from "@/codeclarity_components/dashboard/charts/StaleProjects.vue";
import type { OrganizationFreshness } from "@/codeclarity_components/vulnerabilities/project_freshness.entity";

const { getFreshness, reanalyse } = vi.hoisted(() => ({
  getFreshness: vi.fn(),
  reanalyse: vi.fn(),
}));

vi.mock(
  "@/codeclarity_components/vulnerabilities/organization_vulnerabilities.repository",
  () => ({
    OrganizationVulnerabilitiesRepository: class {
      getFreshness = getFreshness;
    },
  }),
);
vi.mock("@/codeclarity_components/analyses/analysis.repository", () => ({
  AnalysisRepository: class {
    reanalyse = reanalyse;
  },
}));

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

describe("StaleProjects", () => {
  beforeEach(() => {
    getFreshness.mockReset();
    reanalyse.mockReset();
  });

  it("lists only the stale projects with the age of their current analysis", async () => {
    getFreshness.mockResolvedValue(freshness);
    const wrapper = mount(StaleProjects);
    await flushPromises();

    const rows = wrapper.findAll('[data-testid="stale-project"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.text()).toContain("old-api");
    expect(rows[0]!.text()).toContain("Analysed 30 days ago");
    expect(wrapper.text()).toContain("older than 14 days");
  });

  it("re-analyses a stale project and says the analysis started", async () => {
    getFreshness.mockResolvedValue(freshness);
    reanalyse.mockResolvedValue({ id: "a-new" });
    const wrapper = mount(StaleProjects);
    await flushPromises();

    await wrapper
      .get('button[aria-label="Re-analyse old-api"]')
      .trigger("click");
    await flushPromises();

    expect(reanalyse).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "test-org-id", projectId: "p-old" }),
    );
    expect(wrapper.find('[data-testid="stale-project"]').text()).toContain(
      "Analysis started",
    );
  });

  it("says when every project is fresh", async () => {
    getFreshness.mockResolvedValue({
      ...freshness,
      projects: [freshness.projects[1]!],
    });
    const wrapper = mount(StaleProjects);
    await flushPromises();

    expect(wrapper.text()).toContain(
      "Every project was analysed in the last 14 days.",
    );
  });
});
