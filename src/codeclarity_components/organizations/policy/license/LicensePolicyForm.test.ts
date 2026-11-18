import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LicensePolicyForm from "./LicensePolicyForm.vue";

const { getLicensePolicy, updatePolicy, getAllLicenses, push } = vi.hoisted(
  () => ({
    getLicensePolicy: vi.fn(),
    updatePolicy: vi.fn(),
    getAllLicenses: vi.fn(),
    push: vi.fn(),
  }),
);

vi.mock("vue-router", () => ({
  RouterLink: { template: "<a><slot /></a>" },
  useRoute: () => ({ query: { policyId: "p-1" } }),
}));

vi.mock("@/router", () => ({ default: { push } }));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "test-token" }),
}));

// @vueuse/core is mocked globally, which breaks the shadcn inputs: plain stand-ins.
vi.mock("@/shadcn/ui/input", () => ({
  Input: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

vi.mock("@/utils/toasts", () => ({ successToast: vi.fn() }));

vi.mock(
  "@/codeclarity_components/organizations/policy/license_policy.repository",
  () => ({
    LicensePolicyRepository: class {
      getLicensePolicy = getLicensePolicy;
      updatePolicy = updatePolicy;
    },
  }),
);

vi.mock("@/codeclarity_components/results/licenses/LicenseRepository", () => ({
  LicenseRepository: class {
    getAllLicenses = getAllLicenses;
  },
}));

let wrapper: VueWrapper | undefined;

async function renderEdit(): Promise<VueWrapper> {
  wrapper = mount(LicensePolicyForm, {
    props: { orgId: "org-1", mode: "edit" },
  });
  await flushPromises();
  return wrapper;
}

describe("LicensePolicyForm in edit mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllLicenses.mockResolvedValue({
      data: [{ licenseId: "GPL-3.0", name: "GNU GPL v3" }],
    });
    getLicensePolicy.mockResolvedValue({
      data: {
        id: "p-1",
        name: "No copyleft",
        description: "",
        default: false,
        content: ["GPL-3.0"],
      },
    });
    updatePolicy.mockResolvedValue({});
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("loads the policy into an editable form", async () => {
    const form = await renderEdit();

    expect(form.find("input").element.value).toBe("No copyleft");
    expect(form.find("fieldset").attributes("disabled")).toBeUndefined();
    expect(form.text()).not.toContain("not available yet");
  });

  it("saves the changed policy", async () => {
    const form = await renderEdit();

    await form.find("input").setValue("No strong copyleft");
    await form.find("form").trigger("submit");
    await vi.waitFor(() => expect(updatePolicy).toHaveBeenCalled());

    expect(updatePolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        policyId: "p-1",
        data: expect.objectContaining({
          name: "No strong copyleft",
          licenses: ["GPL-3.0"],
          default: false,
        }),
      }),
    );
    expect(push).toHaveBeenCalled();
  });
});
