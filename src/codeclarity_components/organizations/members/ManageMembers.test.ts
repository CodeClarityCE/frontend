import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, onMounted } from "vue";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";
import router from "@/router";

import ManageMembers from "./ManageMembers.vue";

const { getOrgMembers, revokeMembership, orgInfo } = vi.hoisted(() => ({
  getOrgMembers: vi.fn(),
  revokeMembership: vi.fn(),
  orgInfo: { current: {} },
}));

vi.mock("@/router", () => ({ default: { back: vi.fn(), push: vi.fn() } }));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getAuthenticated: true, getToken: "test-token" }),
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getUser: { id: "u-me" } }),
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
  BusinessLogicError: class BusinessLogicError extends Error {
    error_code: string;
    constructor(error_code: string) {
      super(error_code);
      this.error_code = error_code;
    }
  },
}));

vi.mock(
  "@/codeclarity_components/organizations/organization.repository",
  () => ({
    OrgRepository: class {
      getOrgMembers = getOrgMembers;
      revokeMembership = revokeMembership;
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
    useRoute: () => ({ params: { orgId: "org-1" } }),
    RouterLink: defineComponent({
      props: { to: { type: Object, required: true } },
      setup(_, { slots, attrs }) {
        return () => h("a", { ...attrs, href: "#" }, slots.default?.());
      },
    }),
  };
});

function member(
  id: string,
  first: string,
  role: MemberRole,
  extra: object = {},
): object {
  return {
    id,
    first_name: first,
    last_name: "Doe",
    handle: first.toLowerCase(),
    email: `${first.toLowerCase()}@example.com`,
    role,
    joined_on: "2025-01-10T10:00:00Z",
    ...extra,
  };
}

const sample = [
  member("u-me", "Jane", MemberRole.ADMIN),
  member("u-2", "Bob", MemberRole.USER),
  member("u-3", "Olga", MemberRole.OWNER),
];

function page(data: object[], totalPages = 1): object {
  return { data, total_pages: totalPages };
}

let wrapper: VueWrapper | undefined;

async function render(props: object = { orgId: "org-1" }): Promise<VueWrapper> {
  wrapper = mount(ManageMembers, { props, attachTo: document.body });
  await flushPromises();
  return wrapper;
}

function button(name: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>("button, a")].find(
    (el) =>
      el.getAttribute("aria-label") === name || el.textContent?.trim() === name,
  );
}

describe("ManageMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orgInfo.current = {
      id: "org-1",
      role: MemberRole.ADMIN,
      personal: false,
    };
    getOrgMembers.mockResolvedValue(page(sample));
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  it("shows the Members heading", async () => {
    await render();

    expect(document.querySelector("h1")?.textContent).toContain("Members");
  });

  it("shows the organisation header above the list", async () => {
    await render();

    expect(document.body.textContent).toContain("Organisation header");
  });

  it("shows a loading status until the members arrive", async () => {
    getOrgMembers.mockReturnValue(new Promise(() => {}));
    wrapper = mount(ManageMembers, {
      props: { orgId: "org-1" },
      attachTo: document.body,
    });
    await flushPromises();

    expect(
      document.querySelector('[role="status"][aria-label="Loading Members"]'),
    ).not.toBeNull();
  });

  it("lists every member with the role in words", async () => {
    await render();

    const text = document.querySelector("table")?.textContent ?? "";
    expect(text).toContain("Jane Doe");
    expect(text).toContain("(you)");
    expect(text).toContain("Bob Doe");
    expect(text).toContain("User");
    expect(text).toContain("Owner");
  });

  it("says the members could not be loaded and offers a retry", async () => {
    getOrgMembers.mockRejectedValueOnce(new Error("boom"));
    await render();

    expect(document.body.textContent).toContain(
      "The members could not be loaded.",
    );

    button("Try again")?.click();
    await flushPromises();

    expect(document.querySelector("table")?.textContent).toContain("Bob Doe");
  });

  it("offers invitations to admins", async () => {
    await render();

    expect(button("Invite a member")).toBeDefined();
    expect(button("Open invitations")).toBeDefined();
  });

  it("hides invitations in a personal organisation", async () => {
    orgInfo.current = { ...orgInfo.current, personal: true };
    await render();

    expect(button("Invite a member")).toBeUndefined();
  });

  it("loads the members once it is shown", async () => {
    await render();

    expect(getOrgMembers).toHaveBeenCalledTimes(1);
    expect(getOrgMembers).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-1", bearerToken: "test-token" }),
    );
  });

  it("loads every page of members so sorting covers them all", async () => {
    getOrgMembers
      .mockResolvedValueOnce(page(sample.slice(0, 2), 2))
      .mockResolvedValueOnce(page(sample.slice(2), 2));
    await render();

    expect(getOrgMembers).toHaveBeenCalledTimes(2);
    expect(document.querySelector("table")?.textContent).toContain("Olga Doe");
  });

  it("sorting by Role puts owners first", async () => {
    await render();

    const header = [...document.querySelectorAll("th")].find((th) =>
      th.textContent?.includes("Role"),
    );
    header?.querySelector("button")?.click();
    await flushPromises();

    const firstRow = document.querySelector("tbody tr")?.textContent ?? "";
    expect(firstRow).toContain("Olga Doe");
  });

  it("filtering narrows the rows and says when nothing matches", async () => {
    const view = await render();

    await view.find('input[type="search"]').setValue("bob");
    expect(document.querySelectorAll("tbody tr")).toHaveLength(1);

    await view.find('input[type="search"]').setValue("nobody here");
    expect(document.querySelector("tbody")?.textContent).toContain(
      "No members match.",
    );
  });

  it("sends users without admin rights back to the organisation overview", async () => {
    orgInfo.current = { ...orgInfo.current, role: MemberRole.USER };
    await render();

    expect(router.push).toHaveBeenCalledWith({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: "org-1" },
    });
  });

  it("goes back when no organisation is given", async () => {
    await render({ orgId: "" });

    expect(router.back).toHaveBeenCalled();
  });

  it("offers Remove for lower roles but never for yourself", async () => {
    await render();

    expect(button("Remove Bob Doe")).toBeDefined();
    expect(button("Remove Jane Doe")).toBeUndefined();
    expect(button("Remove Olga Doe")).toBeUndefined();
  });

  it("removes a member after confirming and reloads the list", async () => {
    revokeMembership.mockResolvedValue(undefined);
    await render();

    button("Remove Bob Doe")?.click();
    await flushPromises();
    expect(document.body.textContent).toContain(
      "Remove Bob Doe from the organisation?",
    );

    getOrgMembers.mockResolvedValue(page([sample[0]!, sample[2]!]));
    button("Remove member")?.click();
    await flushPromises();

    expect(revokeMembership).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-1", userId: "u-2" }),
    );
    expect(document.querySelector("table")?.textContent).not.toContain(
      "Bob Doe",
    );
  });
});
