import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CurrentVulns from "@/codeclarity_components/dashboard/charts/CurrentVulns.vue";

const { getRecentVulns } = vi.hoisted(() => ({ getRecentVulns: vi.fn() }));

vi.mock("@/codeclarity_components/dashboard/dashboard.repository", () => ({
  DashboardRepository: class {
    getRecentVulns = getRecentVulns;
  },
}));

const recent = {
  data: {
    vulns: {
      a: {
        severity: 5.3,
        severity_class: "MEDIUM",
        cwe_name: "Uncontrolled Resource Consumption",
      },
      b: {
        severity: 9.8,
        severity_class: "CRITICAL",
        cwe_name: "Code Injection",
      },
    },
    severity_count: [
      { severity_class: "CRITICAL", count: 1 },
      { severity_class: "MEDIUM", count: 4 },
    ],
  },
};

describe("CurrentVulns", () => {
  beforeEach(() => getRecentVulns.mockReset());

  it("counts vulnerabilities by severity and lists the most severe first", async () => {
    getRecentVulns.mockResolvedValue(recent);
    const wrapper = mount(CurrentVulns, { props: { integrationIds: [] } });
    await flushPromises();

    const counts = wrapper.find('[aria-label="Vulnerabilities by severity"]');
    expect(
      counts.findAll("li").map((li) => li.findAll("span").map((s) => s.text())),
    ).toEqual([
      ["Critical", "1"],
      ["High", "0"],
      ["Medium", "4"],
    ]);
    const list = wrapper.find('[aria-label="Most severe vulnerabilities"]');
    const rows = list.findAll("li");
    expect(rows.map((li) => li.text())).toEqual([
      expect.stringMatching(/^Critical\s*9\.8\s*Code Injection$/),
      expect.stringMatching(
        /^Medium\s*5\.3\s*Uncontrolled Resource Consumption$/,
      ),
    ]);
  });

  it("says when there are no vulnerabilities", async () => {
    getRecentVulns.mockResolvedValue({
      data: { vulns: {}, severity_count: [] },
    });
    const wrapper = mount(CurrentVulns, { props: { integrationIds: [] } });
    await flushPromises();

    expect(wrapper.text()).toContain("No vulnerabilities found.");
  });

  it("offers to try again after a failed load", async () => {
    getRecentVulns.mockRejectedValueOnce(new Error("down"));
    getRecentVulns.mockResolvedValueOnce(recent);
    const wrapper = mount(CurrentVulns, { props: { integrationIds: [] } });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      "The vulnerabilities summary could not be loaded.",
    );
    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Code Injection");
  });
});
