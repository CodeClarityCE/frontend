import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, onMounted } from "vue";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";
import router from "@/router";
import { errorToast, successToast } from "@/utils/toasts";

import AnalyzersList from "./AnalyzersList.vue";

const { getAnalyzers, deleteAnalyzer, orgInfo } = vi.hoisted(() => ({
  getAnalyzers: vi.fn(),
  deleteAnalyzer: vi.fn(),
  orgInfo: { current: {} },
}));

vi.mock("@/router", () => ({ default: { push: vi.fn() } }));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getAuthenticated: true, getToken: "test-token" }),
}));

vi.mock("@/utils/toasts", () => ({
  successToast: vi.fn(),
  errorToast: vi.fn(),
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
  BusinessLogicError: class BusinessLogicError extends Error {},
}));

vi.mock(
  "@/codeclarity_components/organizations/analyzers/AnalyzerRepository",
  () => ({
    AnalyzerRepository: class {
      getAnalyzers = getAnalyzers;
      deleteAnalyzer = deleteAnalyzer;
    },
  }),
);

// The header reports the organisation, as the real one does once loaded.
vi.mock(
  "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue",
  () => ({
    default: defineComponent({
      emits: ["onOrgInfo"],
      setup(_, { emit }) {
        onMounted(() => emit("onOrgInfo", orgInfo.current));
        return () => h("div", "Organisation header");
      },
    }),
  }),
);

vi.mock("vue-router", async () => {
  const actual =
    await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
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
    id: "a-1",
    name: "Default analyzer",
    description: "SBOM and vulnerabilities",
    created_on: "2025-01-10T10:00:00Z",
    steps: [[{ name: "js-sbom" }], [{ name: "vuln-finder" }]],
  },
  {
    id: "a-2",
    name: "Licences only",
    description: "Checks licences",
    created_on: "2025-02-10T10:00:00Z",
    steps: [[{ name: "license-finder" }]],
  },
];

let wrapper: VueWrapper | undefined;

async function render(): Promise<void> {
  wrapper = mount(AnalyzersList, {
    props: { orgId: "org-1" },
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

describe("AnalyzersList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orgInfo.current = { id: "org-1", role: MemberRole.ADMIN };
    getAnalyzers.mockResolvedValue({ data: sample });
    deleteAnalyzer.mockResolvedValue({});
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  it("lists each analyzer with its stage count", async () => {
    await render();

    const text = document.querySelector("table")?.textContent ?? "";
    expect(text).toContain("Default analyzer");
    expect(text).toContain("2 stages");
    expect(text).toContain("Licences only");
    expect(text).toContain("1 stage");
  });

  it("offers a New analyzer link", async () => {
    await render();

    expect(button("New analyzer")).toBeDefined();
  });

  it("shows an empty state when there are no analyzers", async () => {
    getAnalyzers.mockResolvedValue({ data: [] });
    await render();

    expect(document.body.textContent).toContain("No analyzers yet");
    expect(button("Create an analyzer")).toBeDefined();
  });

  it("says the analyzers could not be loaded and offers a retry", async () => {
    getAnalyzers.mockRejectedValueOnce(new Error("boom"));
    await render();

    expect(document.body.textContent).toContain(
      "The analyzers could not be loaded.",
    );

    button("Try again")?.click();
    await flushPromises();

    expect(document.querySelector("table")?.textContent).toContain(
      "Licences only",
    );
  });

  it("deletes an analyzer after confirmation", async () => {
    await render();

    button("Delete Licences only")?.click();
    await flushPromises();
    expect(document.body.textContent).toContain("Delete Licences only?");

    button("Delete analyzer")?.click();
    await flushPromises();

    expect(deleteAnalyzer).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-1", analyzer_id: "a-2" }),
    );
    expect(successToast).toHaveBeenCalledWith("Deleted Licences only");
  });

  it("tells the user when a delete fails", async () => {
    deleteAnalyzer.mockRejectedValueOnce(new Error("boom"));
    await render();

    button("Delete Licences only")?.click();
    await flushPromises();
    button("Delete analyzer")?.click();
    await flushPromises();

    expect(errorToast).toHaveBeenCalledWith("Failed to delete Licences only");
  });

  it("sends members who are not admins back to the overview", async () => {
    orgInfo.current = { id: "org-1", role: MemberRole.USER };
    await render();

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ name: "orgs" }),
    );
  });
});
