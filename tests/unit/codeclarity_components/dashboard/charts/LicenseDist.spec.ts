import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LicenseDist from "@/codeclarity_components/dashboard/charts/LicenseDist.vue";

const { getLicenseDist } = vi.hoisted(() => ({ getLicenseDist: vi.fn() }));

vi.mock("@/codeclarity_components/dashboard/dashboard.repository", () => ({
  DashboardRepository: class {
    getLicenseDist = getLicenseDist;
  },
}));

describe("LicenseDist", () => {
  beforeEach(() => getLicenseDist.mockReset());

  it("charts licences from the most used, with counts and shares", async () => {
    getLicenseDist.mockResolvedValue({ data: { ISC: 1, MIT: 3 } });
    const wrapper = mount(LicenseDist, { props: { integrationIds: [] } });
    await flushPromises();

    const chart = wrapper.find('[aria-label="Dependencies by licence"]');
    expect(
      chart.findAll('[role="img"]').map((c) => c.attributes("aria-label")),
    ).toEqual(["MIT: 3 dependencies (75%)", "ISC: 1 dependency (25%)"]);
  });

  it("says when no licence is known", async () => {
    getLicenseDist.mockResolvedValue({ data: {} });
    const wrapper = mount(LicenseDist, { props: { integrationIds: [] } });
    await flushPromises();

    expect(wrapper.text()).toContain("No data yet.");
  });
});
