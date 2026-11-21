import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ServiceLevelTargetsSetting from "@/codeclarity_components/organizations/manage/ServiceLevelTargetsSetting.vue";

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

const SUGGESTED = { critical: 7, high: 30, medium: 90, low: null };

const mountSetting = (enabled = false) =>
  mount(ServiceLevelTargetsSetting, {
    props: { orgId: "org-1", enabled, days: SUGGESTED },
  });

describe("ServiceLevelTargetsSetting", () => {
  beforeEach(() => updateSettings.mockReset());

  it("shows the suggested days, with no target for Low", () => {
    const wrapper = mountSetting();
    const value = (id: string) =>
      wrapper.get<HTMLInputElement>(`input#slt-${id}`).element.value;

    expect(value("critical")).toBe("7");
    expect(value("high")).toBe("30");
    expect(value("medium")).toBe("90");
    expect(value("low")).toBe("");
    expect(wrapper.get("[role=switch]").attributes("aria-checked")).toBe(
      "false",
    );
  });

  it("turns targets on and saves the days, a blank field meaning no target", async () => {
    updateSettings.mockResolvedValue({});
    const wrapper = mountSetting();

    await wrapper.get("[role=switch]").trigger("click");
    await wrapper.get("input#slt-critical").setValue("3");
    await wrapper.get("input#slt-medium").setValue("");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        data: {
          service_level_targets_enabled: true,
          service_level_targets: {
            critical: 3,
            high: 30,
            medium: null,
            low: null,
          },
        },
      }),
    );
  });

  it("does not send days that are not whole and positive", async () => {
    const wrapper = mountSetting(true);

    await wrapper.get("input#slt-high").setValue("2.5");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(updateSettings).not.toHaveBeenCalled();
    expect(wrapper.get("[role=alert]").text()).toContain(
      "Enter whole days from 1 to 3650, or leave a field blank for no target.",
    );
  });
});
