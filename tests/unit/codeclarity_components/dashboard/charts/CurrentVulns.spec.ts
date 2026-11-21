import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter, type Router } from "vue-router";

import CurrentVulns from "@/codeclarity_components/dashboard/charts/CurrentVulns.vue";
import { useFilteredDashboardRequest } from "@/codeclarity_components/dashboard/composables/useDashboardRequest";
import type {
  OrganizationVulnerabilityFilters,
  OrganizationVulnerabilityList,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const getVulnerabilities =
  vi.fn<
    (
      filters: OrganizationVulnerabilityFilters,
    ) => Promise<OrganizationVulnerabilityList>
  >();

const PROJECTS = [
  { id: "p-api", name: "api" },
  { id: "p-web", name: "web" },
];

function testRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      {
        path: "/org/:orgId/vulnerabilities/:vulnerabilityId",
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
  const request = useFilteredDashboardRequest(
    async (filters: OrganizationVulnerabilityFilters) =>
      await getVulnerabilities(filters),
    {},
  );
  void request.run();
  const wrapper = mount(CurrentVulns, {
    props: { request, projects: PROJECTS, orgId: "org-1" },
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
  hidden_counts: { contradicted: 0, retired_all: 0, excluded_by_policy: 0 },
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
      uncorroborated_count: 0,
      known_exploited: false,
      ticketed_instance_count: 0,
      overdue_instance_count: 0,
      epss: 0.42,
    },
    {
      vulnerability_id: "CVE-2024-0002",
      severity_class: "MEDIUM",
      severity_score: 5.3,
      project_count: 1,
      instance_count: 1,
      uncorroborated_count: 0,
      known_exploited: false,
      ticketed_instance_count: 0,
      overdue_instance_count: 0,
      epss: null,
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
        /^Critical\s*9\.8\s*CVE-2024-0001\s*EPSS 42\.0%\s*2 projects\s*3 instances$/,
      ),
      expect.stringMatching(
        /^Medium\s*5\.3\s*CVE-2024-0002\s*No EPSS\s*1 project\s*1 instance$/,
      ),
    ]);
  });

  it("opens the vulnerability page when a row is clicked", async () => {
    getVulnerabilities.mockResolvedValue(two);
    const { wrapper, router } = await mountCard();

    const link = wrapper.find(
      'a[href="/org/org-1/vulnerabilities/CVE-2024-0001"]',
    );
    expect(link.exists()).toBe(true);
    await link.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("orgVulnerability");
    expect(router.currentRoute.value.params["vulnerabilityId"]).toBe(
      "CVE-2024-0001",
    );
  });

  it("labels a vulnerability with uncorroborated instances", async () => {
    getVulnerabilities.mockResolvedValue(
      list([
        { ...two.data[0]!, uncorroborated_count: 1 },
        { ...two.data[1]!, uncorroborated_count: 0 },
      ]),
    );
    const { wrapper } = await mountCard();

    const rows = wrapper
      .find('[aria-label="Vulnerabilities in your projects"]')
      .findAll("li");
    expect(rows[0]!.text()).toContain("Uncorroborated");
    expect(rows[1]!.text()).not.toContain("Uncorroborated");
  });

  it("flags a known exploited vulnerability", async () => {
    getVulnerabilities.mockResolvedValue(
      list([{ ...two.data[0]!, known_exploited: true }, two.data[1]!]),
    );
    const { wrapper } = await mountCard();

    const rows = wrapper
      .find('[aria-label="Vulnerabilities in your projects"]')
      .findAll("li");
    expect(rows[0]!.text()).toContain("Known exploited");
    expect(rows[1]!.text()).not.toContain("Known exploited");
  });

  it("greys out vulnerabilities whose every instance has an open ticket", async () => {
    getVulnerabilities.mockResolvedValue(
      list([
        { ...two.data[0]!, ticketed_instance_count: 3 },
        { ...two.data[1]!, ticketed_instance_count: 0 },
      ]),
    );
    const { wrapper } = await mountCard();

    const links = wrapper
      .find('[aria-label="Vulnerabilities in your projects"]')
      .findAll("li a");
    expect(links[0]!.text()).toContain("Ticketed");
    expect(links[0]!.classes()).toContain("opacity-60");
    expect(links[1]!.text()).not.toContain("Ticketed");
    expect(links[1]!.classes()).not.toContain("opacity-60");
  });

  it("flags a vulnerability with an overdue ticket", async () => {
    getVulnerabilities.mockResolvedValue(
      list([
        {
          ...two.data[0]!,
          ticketed_instance_count: 3,
          overdue_instance_count: 1,
        },
        two.data[1]!,
      ]),
    );
    const { wrapper } = await mountCard();

    const links = wrapper
      .find('[aria-label="Vulnerabilities in your projects"]')
      .findAll("li a");
    expect(links[0]!.text()).toContain("Overdue");
    expect(links[1]!.text()).not.toContain("Overdue");
  });

  it("does not grey out a vulnerability with some instances left untracked", async () => {
    getVulnerabilities.mockResolvedValue(
      list([{ ...two.data[0]!, ticketed_instance_count: 2 }]),
    );
    const { wrapper } = await mountCard();

    const link = wrapper.find(
      '[aria-label="Vulnerabilities in your projects"] li a',
    );
    expect(link.classes()).not.toContain("opacity-60");
    expect(link.text()).toContain("2 of 3 ticketed");
  });

  it("narrows the list by ticket state", async () => {
    getVulnerabilities.mockResolvedValue(two);
    const { wrapper } = await mountCard();
    const select = wrapper.find('select[aria-label="Ticket"]');

    await select.setValue("none");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({ ticket: "none" });

    await select.setValue("open");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({ ticket: "open" });

    await select.setValue("overdue");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({ ticket: "overdue" });

    await select.setValue("");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({});
  });

  it("narrows the list to known exploited vulnerabilities or the others", async () => {
    getVulnerabilities.mockResolvedValue(two);
    const { wrapper } = await mountCard();
    const select = wrapper.find('select[aria-label="Known exploited"]');

    await select.setValue("true");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({
      known_exploited: true,
    });

    await select.setValue("false");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({
      known_exploited: false,
    });

    await select.setValue("");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({});
  });

  it("requests the list again narrowed by each filter control", async () => {
    getVulnerabilities.mockResolvedValue(two);
    const { wrapper } = await mountCard();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({});

    await wrapper.find('select[aria-label="Project"]').setValue("p-web");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({ project: ["p-web"] });

    await wrapper.find('select[aria-label="Severity"]').setValue("HIGH");
    await wrapper.find('select[aria-label="Ecosystem"]').setValue("Packagist");
    await wrapper.find('select[aria-label="Dependency type"]').setValue("dev");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({
      project: ["p-web"],
      severity: ["HIGH"],
      ecosystem: ["Packagist"],
      scope: "dev",
    });

    await wrapper.find('select[aria-label="Project"]').setValue("");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({
      severity: ["HIGH"],
      ecosystem: ["Packagist"],
      scope: "dev",
    });
  });

  it("narrows the list to instances with a fix, or without one", async () => {
    getVulnerabilities.mockResolvedValue(two);
    const { wrapper } = await mountCard();
    const fix = wrapper.find('select[aria-label="Fix"]');

    await fix.setValue("available");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({ fix: "available" });

    await fix.setValue("none");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({ fix: "none" });

    await fix.setValue("");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({});
  });

  it("says how many instances it hid and why, and shows them on request", async () => {
    const hiding = {
      ...two,
      hidden_counts: { contradicted: 2, retired_all: 0, excluded_by_policy: 1 },
    };
    getVulnerabilities.mockResolvedValue(hiding);
    const { wrapper } = await mountCard();

    const hidden = () =>
      wrapper
        .find('[aria-label="Hidden instances"]')
        .findAll("li")
        .map((li) => li.text());
    expect(hidden()).toEqual([
      expect.stringMatching(
        /^2 hidden: contradicted by another source\s*Show$/,
      ),
      expect.stringMatching(
        /^1 hidden: excluded by a vulnerability policy\s*Show$/,
      ),
    ]);

    await wrapper
      .find(
        'button[aria-label="Show instances excluded by a vulnerability policy"]',
      )
      .trigger("click");
    await flushPromises();

    expect(getVulnerabilities).toHaveBeenLastCalledWith({
      show: ["excluded_by_policy"],
    });
    expect(hidden()[1]).toMatch(
      /^1 shown: excluded by a vulnerability policy\s*Hide$/,
    );

    await wrapper
      .find(
        'button[aria-label="Hide instances excluded by a vulnerability policy"]',
      )
      .trigger("click");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenLastCalledWith({});
  });

  it("keeps the filters when a filter leaves nothing to list", async () => {
    getVulnerabilities.mockResolvedValueOnce(two);
    getVulnerabilities.mockResolvedValue(list([]));
    const { wrapper } = await mountCard();

    await wrapper.find('select[aria-label="Severity"]').setValue("LOW");
    await flushPromises();

    expect(wrapper.text()).toContain("No vulnerabilities match these filters.");
    expect(wrapper.find('select[aria-label="Severity"]').exists()).toBe(true);
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
