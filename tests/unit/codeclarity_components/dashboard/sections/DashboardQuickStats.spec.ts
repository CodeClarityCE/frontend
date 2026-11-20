import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDashboardRequest } from "@/codeclarity_components/dashboard/composables/useDashboardRequest";
import DashboardQuickStats from "@/codeclarity_components/dashboard/sections/DashboardQuickStats.vue";

const getVulnerabilities = vi.fn();
const getQuickStats = vi.fn();

async function mountTiles(): Promise<ReturnType<typeof mount>> {
  const quickStats = useDashboardRequest(
    async () => (await getQuickStats()).data,
  );
  const vulnerabilityList = useDashboardRequest(
    async () => await getVulnerabilities(),
  );
  void quickStats.run();
  void vulnerabilityList.run();
  const wrapper = mount(DashboardQuickStats, {
    props: { quickStats, vulnerabilityList },
  });
  await flushPromises();
  return wrapper;
}

describe("DashboardQuickStats", () => {
  beforeEach(() => {
    getVulnerabilities.mockReset();
    getQuickStats.mockReset();
  });

  it("shows critical and high counts, projects scanned and the security grade", async () => {
    getVulnerabilities.mockResolvedValue({
      data: [],
      severity_counts: { CRITICAL: 1, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 },
    });
    getQuickStats.mockResolvedValue({
      data: { nmb_projects: 3, max_grade: { score: 4.2, class: "B" } },
    });
    const wrapper = await mountTiles();

    // Each tile reads label, value, hint.
    const tiles = wrapper
      .find('[aria-label="Project numbers"]')
      .findAll("li")
      .map((li) => li.findAll("span").map((span) => span.text()));
    expect(tiles).toEqual([
      ["Critical issues", "1", "1 issue found"],
      ["High severity", "0", "No high severity"],
      ["Projects scanned", "3", "Projects with an analysis"],
      ["Security score", "B", "Good security posture"],
    ]);
  });

  it("shows an error instead of numbers when a request fails", async () => {
    getVulnerabilities.mockResolvedValue({
      data: [],
      severity_counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 },
    });
    getQuickStats.mockRejectedValueOnce(new Error("down"));
    getQuickStats.mockResolvedValueOnce({
      data: { nmb_projects: 3, max_grade: { score: 4.2, class: "B" } },
    });
    const wrapper = await mountTiles();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      "The project numbers could not be loaded.",
    );
    expect(wrapper.find('[aria-label="Project numbers"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain("A+");

    await wrapper.find('[role="alert"] button').trigger("click");
    await flushPromises();
    expect(getVulnerabilities).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[aria-label="Project numbers"]').text()).toContain(
      "B",
    );
  });
});
