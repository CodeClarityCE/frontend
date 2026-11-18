import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, onMounted } from "vue";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";

import ManageInvites from "./ManageInvites.vue";

const {
  getInvitations,
  revokeInvitation,
  orgInfo,
  toasts,
  BusinessLogicError,
} = vi.hoisted(() => ({
  getInvitations: vi.fn(),
  revokeInvitation: vi.fn(),
  orgInfo: { current: {} },
  toasts: { successToast: vi.fn(), errorToast: vi.fn() },
  BusinessLogicError: class BusinessLogicError extends Error {
    error_code: string;
    constructor(error_code: string) {
      super(error_code);
      this.error_code = error_code;
    }
  },
}));

vi.mock("@/router", () => ({ default: { back: vi.fn(), push: vi.fn() } }));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getAuthenticated: true, getToken: "test-token" }),
}));

vi.mock("@/utils/toasts", () => toasts);

vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError,
}));

vi.mock("../organization.repository", () => ({
  OrgRepository: class {
    getInvitations = getInvitations;
    revokeInvitation = revokeInvitation;
  },
}));

vi.mock("./InviteMemberDialog.vue", () => ({
  default: defineComponent({ setup: () => () => h("div") }),
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
    useRoute: () => ({ params: { orgId: "org-1" } }),
    RouterLink: defineComponent({
      props: { to: { type: Object, required: true } },
      setup(_, { slots, attrs }) {
        return () => h("a", { ...attrs, href: "#" }, slots.default?.());
      },
    }),
  };
});

const invitation = {
  id: "inv-1",
  created_on: "2026-11-01T10:00:00Z",
  created_by: {
    id: "u-other",
    first_name: "Ann",
    last_name: "Lee",
    handle: "ann",
    role: MemberRole.ADMIN,
  },
  role: MemberRole.USER,
  organization_id: "org-1",
  user_email: "new@example.com",
  ttl: "2026-12-01T10:00:00Z",
};

let wrapper: VueWrapper | undefined;

async function render(): Promise<void> {
  wrapper = mount(ManageInvites, {
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

const revokeLabel = "Revoke the invitation to new@example.com";

describe("ManageInvites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orgInfo.current = { id: "org-1", role: MemberRole.OWNER, personal: false };
    getInvitations.mockResolvedValue({ data: [invitation], total_pages: 1 });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  it("offers an owner Revoke on a pending invitation", async () => {
    await render();

    expect(button(revokeLabel)).toBeDefined();
  });

  it("offers an admin no Revoke, even on their own invitation", async () => {
    orgInfo.current = { ...orgInfo.current, role: MemberRole.ADMIN };
    getInvitations.mockResolvedValue({
      data: [
        { ...invitation, created_by: { ...invitation.created_by, id: "u-me" } },
      ],
      total_pages: 1,
    });
    await render();

    expect(button(revokeLabel)).toBeUndefined();
  });

  it("offers no Revoke in a personal organisation", async () => {
    orgInfo.current = { ...orgInfo.current, personal: true };
    await render();

    expect(button(revokeLabel)).toBeUndefined();
  });

  it("revokes after confirming and reloads the list", async () => {
    revokeInvitation.mockResolvedValue(undefined);
    await render();

    button(revokeLabel)?.click();
    await flushPromises();
    getInvitations.mockResolvedValue({ data: [], total_pages: 1 });
    button("Revoke invitation")?.click();
    await flushPromises();

    expect(revokeInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-1", invitationId: "inv-1" }),
    );
    expect(document.body.textContent).toContain("No open invitations");
  });

  it("says plainly when the API refuses the revoke", async () => {
    revokeInvitation.mockRejectedValue(new BusinessLogicError("NotAuthorized"));
    await render();

    button(revokeLabel)?.click();
    await flushPromises();
    button("Revoke invitation")?.click();
    await flushPromises();

    expect(toasts.errorToast).toHaveBeenCalledWith(
      "Your role does not allow this",
    );
  });
});
