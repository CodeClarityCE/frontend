import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, onMounted } from "vue";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";
import router from "@/router";

import ManageAuditLogs from "./ManageAuditLogs.vue";

const { getOrgAuditLogs, orgInfo, BusinessLogicError } = vi.hoisted(() => ({
  getOrgAuditLogs: vi.fn(),
  orgInfo: { current: {} },
  BusinessLogicError: class BusinessLogicError extends Error {
    error_code: string;
    constructor(error_code: string) {
      super(error_code);
      this.error_code = error_code;
    }
  },
}));

// Searches apply at once, so tests need not wait for the debounce.
vi.mock("@vueuse/core", async () => {
  const { reactive, toRef } = await import("vue");
  return {
    refDebounced: <T>(source: T): T => source,
    reactiveOmit: (obj: Record<string, unknown>, ...keys: string[]) =>
      reactive(
        Object.fromEntries(
          Object.keys(obj)
            .filter((key) => !keys.includes(key))
            .map((key) => [key, toRef(obj, key)]),
        ),
      ),
  };
});

vi.mock("@/router", () => ({ default: { back: vi.fn(), push: vi.fn() } }));

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
  BusinessLogicError,
}));

vi.mock(
  "@/codeclarity_components/organizations/organization.repository",
  () => ({
    OrgRepository: class {
      getOrgAuditLogs = getOrgAuditLogs;
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
  return { ...actual, useRoute: () => ({ params: { orgId: "org-1" } }) };
});

function entry(id: string, description: string): object {
  return {
    id,
    action_severity: 1,
    action_class: "Organization",
    action: "OrganizationMemberInvited",
    description,
    blame_on_email: "jane@example.com",
    created_on: new Date("2026-11-17T10:00:00Z"),
  };
}

function page(data: object[], total = data.length): object {
  return {
    data,
    total_entries: total,
    matching_count: total,
    total_pages: Math.ceil(total / 20),
  };
}

let wrapper: VueWrapper | undefined;

async function render(): Promise<VueWrapper> {
  wrapper = mount(ManageAuditLogs, {
    props: { orgId: "org-1" },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

function lastRequest(): Record<string, unknown> {
  return getOrgAuditLogs.mock.calls.at(-1)![0] as Record<string, unknown>;
}

describe("ManageAuditLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orgInfo.current = { id: "org-1", role: MemberRole.ADMIN, personal: false };
    getOrgAuditLogs.mockResolvedValue(
      page([entry("log-1", "The User invited bob@example.com")]),
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  it("lists the entries the API returns, newest first", async () => {
    await render();

    expect(document.querySelector("table")?.textContent).toContain(
      "The User invited bob@example.com",
    );
    expect(lastRequest()).toEqual(
      expect.objectContaining({
        orgId: "org-1",
        pagination: { page: 0, entries_per_page: 20 },
        search: { searchKey: "" },
        sort: { sortKey: "created_on", sortDirection: "DESC" },
      }),
    );
  });

  it("searches on the API", async () => {
    const view = await render();

    await view.find('input[type="search"]').setValue("bob");
    await flushPromises();

    expect(lastRequest()).toEqual(
      expect.objectContaining({ search: { searchKey: "bob" } }),
    );
  });

  it("sorts on the API", async () => {
    await render();

    const header = [...document.querySelectorAll("th")].find((th) =>
      th.textContent?.includes("Action"),
    );
    header?.querySelector("button")?.click();
    await flushPromises();

    expect(lastRequest()).toEqual(
      expect.objectContaining({
        sort: { sortKey: "action", sortDirection: "ASC" },
      }),
    );
  });

  it("pages on the API", async () => {
    getOrgAuditLogs.mockResolvedValue(page([entry("log-1", "First")], 25));
    await render();

    const next = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Next"),
    );
    next?.click();
    await flushPromises();

    expect(lastRequest()).toEqual(
      expect.objectContaining({
        pagination: { page: 1, entries_per_page: 20 },
      }),
    );
  });

  it("says plainly when there are no entries", async () => {
    getOrgAuditLogs.mockResolvedValue(page([]));
    await render();

    expect(document.body.textContent).toContain("No audit log entries yet.");
  });

  it("says plainly when the role does not allow reading them", async () => {
    getOrgAuditLogs.mockRejectedValue(new BusinessLogicError("NotAuthorized"));
    await render();

    expect(document.body.textContent).toContain(
      "You do not have permission to see this organisation's audit logs.",
    );
  });

  it("says the entries could not be loaded and offers a retry", async () => {
    getOrgAuditLogs.mockRejectedValueOnce(new Error("boom"));
    await render();

    expect(document.body.textContent).toContain(
      "The audit logs could not be loaded.",
    );
    [...document.querySelectorAll("button")]
      .find((b) => b.textContent?.trim() === "Try again")
      ?.click();
    await flushPromises();

    expect(document.querySelector("table")?.textContent).toContain(
      "The User invited bob@example.com",
    );
  });

  it("sends members below admin back to the organisation overview", async () => {
    orgInfo.current = { ...orgInfo.current, role: MemberRole.MODERATOR };
    await render();

    expect(router.push).toHaveBeenCalledWith({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: "org-1" },
    });
  });
});
