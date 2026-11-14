import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, onMounted } from "vue";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";
import router from "@/router";
import { successToast } from "@/utils/toasts";

import IntegrationsList from "./IntegrationsList.vue";

const { getVCS, deleteVcs, getTicketing, deleteTicketing, orgInfo } =
  vi.hoisted(() => ({
    getVCS: vi.fn(),
    deleteVcs: vi.fn(),
    getTicketing: vi.fn(),
    deleteTicketing: vi.fn(),
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
  "@/codeclarity_components/organizations/integrations/IntegrationsRepository",
  () => ({
    IntegrationsRepository: class {
      getVCS = getVCS;
      deleteIntegration = deleteVcs;
    },
  }),
);

vi.mock("@/codeclarity_components/tickets/tickets.repository", () => ({
  TicketsRepository: class {
    getIntegrations = getTicketing;
    deleteIntegration = deleteTicketing;
  },
}));

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

const github = {
  id: "vcs-1",
  added_on: "2025-01-10T10:00:00Z",
  added_by: "u-1",
  service_domain: "github.com",
  integration_type: "VCS",
  integration_provider: "GITHUB",
  invalid: false,
};

const gitlab = {
  ...github,
  id: "vcs-2",
  service_domain: "gitlab.example.com",
  integration_provider: "GITLAB",
  invalid: true,
};

let wrapper: VueWrapper | undefined;

async function render(): Promise<void> {
  wrapper = mount(IntegrationsList, {
    props: { orgId: "org-1" },
    attachTo: document.body,
  });
  await flushPromises();
}

function button(name: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>("button, a")].find(
    (el) =>
      el.getAttribute("aria-label") === name ||
      el.textContent?.replace(/\s+/g, " ").trim() === name,
  );
}

function tile(label: string): string {
  const item = [...document.querySelectorAll("li")].find((li) =>
    li.textContent?.includes(label),
  );
  return item?.textContent ?? "";
}

describe("IntegrationsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orgInfo.current = { id: "org-1", role: MemberRole.ADMIN };
    getVCS.mockResolvedValue({ data: [github, gitlab] });
    getTicketing.mockResolvedValue({ data: [] });
    deleteVcs.mockResolvedValue({});
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  it("lists each connected service with its health", async () => {
    await render();

    const text = document.querySelector("table")?.textContent ?? "";
    expect(text).toContain("GitHub");
    expect(text).toContain("github.com");
    expect(text).toContain("Healthy");
    expect(text).toContain("GitLab");
    expect(text).toContain("Invalid");
  });

  it("counts healthy and invalid integrations", async () => {
    await render();

    expect(tile("Healthy")).toContain("1");
    expect(tile("Invalid or expired")).toContain("1");
    expect(tile("Total")).toContain("2");
  });

  it("offers to add only the services that are not connected", async () => {
    await render();

    expect(button("Add ClickUp")).toBeDefined();
    expect(button("Add GitHub")).toBeUndefined();
  });

  it("says when the version control integrations fail and retries", async () => {
    getVCS.mockRejectedValueOnce(new Error("boom"));
    await render();

    expect(document.body.textContent).toContain(
      "The version control integrations failed to load.",
    );

    button("Try again")?.click();
    await flushPromises();

    expect(document.querySelector("table")?.textContent).toContain("GitLab");
  });

  it("deletes an integration after confirmation", async () => {
    await render();

    button("Delete the GitLab integration on gitlab.example.com")?.click();
    await flushPromises();

    const confirm = [
      ...document.querySelectorAll<HTMLElement>('[role="dialog"] button'),
    ].find((el) => el.textContent?.includes("Delete"));
    confirm?.click();
    await flushPromises();

    expect(deleteVcs).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-1", integrationId: "vcs-2" }),
    );
    expect(successToast).toHaveBeenCalledWith("Deleted the GitLab integration");
  });

  it("sends members who are not admins away", async () => {
    orgInfo.current = { id: "org-1", role: MemberRole.USER };
    await render();

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ name: "orgs" }),
    );
  });
});
