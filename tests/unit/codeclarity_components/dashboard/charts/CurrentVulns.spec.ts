import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter, type Router } from "vue-router";

import CurrentVulns from "@/codeclarity_components/dashboard/charts/CurrentVulns.vue";
import { useDashboardRequest } from "@/codeclarity_components/dashboard/composables/useDashboardRequest";
import type { OrganizationVulnerabilityList } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

const getVulnerabilities =
  vi.fn<() => Promise<OrganizationVulnerabilityList>>();

function testRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      {
        path: "/vulnerabilities/:vulnerabilityId",
        name: "orgVulnerability",
        component: { template: "<div />" },
      },
    ],
  });
}

// Mounts the card on a shared request, sent once as the dashboard does.
async function mountCard(): Promise<{
  wrapper: ReturnType<typeof mount>;
  router: Router;
}> {
  const router = testRouter();
  await router.push("/");
  const request = useDashboardRequest(async () => await getVulnerabilities());
  void request.run();
  const wrapper = mount(CurrentVulns, {
    props: { request },
    // The real link, which the shared test setup stubs.
    global: { plugins: [router], stubs: { RouterLink: false } },
  });
  await flushPromises();
  return { wrapper, router };
}

const list = (
  data: OrganizationVulnerabilityList["data"],
  severity_counts: Partial<
    OrganizationVulnerabilityList["severity_counts"]
  > = {},
): OrganizationVulnerabilityList => ({
  data,
  page: 0,
  entry_count: data.length,
  entries_per_page: 50,
  total_entries: data.length,
  total_pages: 1,
  matching_count: data.length,
  filter_count: {},
  severity_counts: {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    NONE: 0,
    ...severity_counts,
  },
});

const two = list(
  [
    {
      vulnerability_id: "CVE-2024-0001",
      severity_class: "CRITICAL",
      severity_score: 9.8,
      project_count: 2,
      instance_count: 3,
    },
    {
      vulnerability_id: "CVE-2024-0002",
      severity_class: "MEDIUM",
      severity_score: 5.3,
      project_count: 1,
      instance_count: 1,
    },
  ],
  { CRITICAL: 3, MEDIUM: 1 },
);

describe("CurrentVulns", () => {
  beforeEach(() => getVulnerabilities.mockReset());

  it("counts vulnerability instances by severity and lists each vulnerability with its reach", async () => {
    getVulnerabilities.mockResolvedValue(two);
    const { wrapper } = await mountCard();

    const counts = wrapper.find('[aria-label="Vulnerabilities by severity"]');
    expect(
      counts.findAll("li").map((li) => li.findAll("span").map((s) => s.text())),
    ).toEqual([
      ["Critical", "3"],
      ["High", "0"],
      ["Medium", "1"],
    ]);
    const rows = wrapper
      .find('[aria-label="Vulnerabilities in your projects"]')
      .findAll("li");
    expect(rows.map((li) => li.text())).toEqual([
      expect.stringMatching(
        /^Critical\s*9\.8\s*CVE-2024-0001\s*2 projects\s*3 instances$/,
      ),
      expect.stringMatching(
        /^Medium\s*5\.3\s*CVE-2024-0002\s*1 project\s*1 instance$/,
      ),
    ]);
  });

  it("opens the vulnerability page when a row is clicked", async () => {
    getVulnerabilities.mockResolvedValue(two);
    const { wrapper, router } = await mountCard();

    const link = wrapper.find('a[href="/vulnerabilities/CVE-2024-0001"]');
    expect(link.exists()).toBe(true);
    await link.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("orgVulnerability");
    expect(router.currentRoute.value.params["vulnerabilityId"]).toBe(
      "CVE-2024-0001",
    );
  });

  it("says when there are no vulnerabilities", async () => {
    getVulnerabilities.mockResolvedValue(list([]));
    const { wrapper } = await mountCard();

    expect(wrapper.text()).toContain("No vulnerabilities found.");
  });

  it("offers to try again after a failed load", async () => {
    getVulnerabilities.mockRejectedValueOnce(new Error("down"));
    getVulnerabilities.mockResolvedValueOnce(two);
    const { wrapper } = await mountCard();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      "The vulnerabilities summary could not be loaded.",
    );
    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("CVE-2024-0001");
  });
});
