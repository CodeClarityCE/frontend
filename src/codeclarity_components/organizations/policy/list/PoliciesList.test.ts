import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import PoliciesList from "./PoliciesList.vue";

const { getLicensePolicies, push } = vi.hoisted(() => ({
  getLicensePolicies: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getAuthenticated: true, getToken: "test-token" }),
}));

// The global @vueuse/core mock leaves shadcn Input inert, so use a plain input.
vi.mock("@/shadcn/ui/input", () => ({
  Input: defineComponent({
    props: { modelValue: { type: String, default: "" } },
    emits: ["update:modelValue"],
    setup(props, { emit, attrs }) {
      return () =>
        h("input", {
          ...attrs,
          value: props.modelValue,
          onInput: (e: Event) =>
            emit("update:modelValue", (e.target as HTMLInputElement).value),
        });
    },
  }),
}));

vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError: class BusinessLogicError extends Error {
    error_message: string;
    constructor(message: string) {
      super(message);
      this.error_message = message;
    }
  },
}));

vi.mock(
  "@/codeclarity_components/organizations/policy/license_policy.repository",
  () => ({
    LicensePolicyRepository: class {
      getLicensePolicies = getLicensePolicies;
    },
  }),
);

vi.mock("vue-router", async () => {
  const actual =
    await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRouter: () => ({ push }),
    RouterLink: defineComponent({
      props: { to: { type: Object, required: true } },
      setup(_, { slots, attrs }) {
        return () => h("a", { ...attrs, href: "#" }, slots.default?.());
      },
    }),
  };
});

const sample = [
  {
    id: "p-1",
    name: "No copyleft",
    description: "Blocks GPL licences",
    policy_type: "BLACKLIST",
    default: true,
    created_by: "Jane",
    created_on: "2025-01-10T10:00:00Z",
    content: ["GPL-3.0", "AGPL-3.0"],
  },
  {
    id: "p-2",
    name: "Strict",
    description: "Also blocks LGPL",
    policy_type: "BLACKLIST",
    default: false,
    created_by: "Bob",
    created_on: "2025-02-10T10:00:00Z",
    content: ["GPL-3.0", "LGPL-3.0"],
  },
];

let wrapper: VueWrapper | undefined;

async function render(): Promise<void> {
  wrapper = mount(PoliciesList, {
    props: { page: "policy", orgId: "org-1" },
    attachTo: document.body,
  });
  await flushPromises();
}

function button(name: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>("button, a")].find(
    (el) =>
      el.getAttribute("aria-label") === name || el.textContent?.trim() === name,
  );
}

function tile(label: string): string {
  const item = [...document.querySelectorAll("li")].find((li) =>
    li.textContent?.includes(label),
  );
  return item?.textContent ?? "";
}

describe("PoliciesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLicensePolicies.mockResolvedValue({ data: sample });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  it("lists each license policy", async () => {
    await render();

    const text = document.querySelector("table")?.textContent ?? "";
    expect(text).toContain("No copyleft");
    expect(text).toContain("Default");
    expect(text).toContain("Strict");
  });

  it("counts policies and the distinct licenses they cover", async () => {
    await render();

    expect(tile("Policies")).toContain("2");
    expect(tile("Licenses covered")).toContain("3");
  });

  it("shows an empty state when there are no policies", async () => {
    getLicensePolicies.mockResolvedValue({ data: [] });
    await render();

    expect(document.body.textContent).toContain("No license policies yet");
    expect(button("Create a license policy")).toBeDefined();
  });

  it("says when the policies could not be loaded", async () => {
    getLicensePolicies.mockRejectedValueOnce(new Error("boom"));
    await render();

    expect(document.body.textContent).toContain(
      "The license policies could not be loaded.",
    );
  });

  it("opens the editor for a policy", async () => {
    await render();

    button("Edit Strict")?.click();
    await flushPromises();

    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({ query: { policyId: "p-2" } }),
    );
  });
});
