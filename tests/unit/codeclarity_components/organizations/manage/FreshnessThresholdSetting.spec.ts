import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FreshnessThresholdSetting from "@/codeclarity_components/organizations/manage/FreshnessThresholdSetting.vue";

// The real v-model helper, so the shadcn input binds its value.
vi.unmock("@vueuse/core");

const { updateSettings } = vi.hoisted(() => ({ updateSettings: vi.fn() }));

vi.mock(
  "@/codeclarity_components/organizations/organization.repository",
  () => ({
    OrgRepository: class {
      updateSettings = updateSettings;
    },
  }),
);
vi.mock("@/utils/toasts", () => ({
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

const mountSetting = () =>
  mount(FreshnessThresholdSetting, { props: { orgId: "org-1", days: 14 } });

describe("FreshnessThresholdSetting", () => {
  beforeEach(() => updateSettings.mockReset());

  it("saves the number of days after which a project is stale", async () => {
    updateSettings.mockResolvedValue({});
    const wrapper = mountSetting();
    const input = wrapper.get<HTMLInputElement>("input#org-freshness-days");
    expect(input.element.value).toBe("14");

    await input.setValue("30");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        data: { freshness_threshold_days: 30 },
      }),
    );
  });

  it("does not send a number of days outside 1 to 365", async () => {
    const wrapper = mountSetting();

    await wrapper.get("input#org-freshness-days").setValue("0");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(updateSettings).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      "Enter a whole number of days from 1 to 365.",
    );
  });
});
