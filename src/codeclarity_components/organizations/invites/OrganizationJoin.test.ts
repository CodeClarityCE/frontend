import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";
import router from "@/router";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import OrganizationJoin from "./OrganizationJoin.vue";

const { JOIN_PATH, getOrgInfo, joinOrg, authStore, userStore } = vi.hoisted(
  () => ({
    JOIN_PATH: "/email_action/join_org?token=tok&useremail=digest&orgId=org-1",
    getOrgInfo: vi.fn(),
    joinOrg: vi.fn(),
    authStore: {
      getAuthenticated: true,
      getToken: "test-token",
      $reset: vi.fn(),
    },
    userStore: {
      getUser: { email: "someone.else@example.com" },
      $reset: vi.fn(),
    },
  }),
);

vi.mock("@/router", () => ({
  default: {
    back: vi.fn(),
    push: vi.fn(),
    currentRoute: { value: { fullPath: JOIN_PATH } },
  },
}));

// The shared icon mock lacks this page's icons, so render the real ones.
vi.mock("@lucide/vue", async () => await vi.importActual("@lucide/vue"));

vi.mock("@/stores/auth", () => ({ useAuthStore: () => authStore }));
vi.mock("@/stores/user", () => ({ useUserStore: () => userStore }));

vi.mock("@/utils/toasts", () => ({ successToast: vi.fn() }));

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
      getOrgInfoAsInvitedMember = getOrgInfo;
      joinOrgViaInvitation = joinOrg;
    },
  }),
);

const orgInfo = {
  id: "inv-1",
  name: "Inviting Org",
  description: "",
  color_scheme: "1",
  created_on: new Date("2026-01-01"),
  invite_created_on: new Date("2026-11-01"),
  role: MemberRole.ADMIN,
  number_of_members: 2,
};

// The API answers with a business error carrying this code.
function apiError(code: string): Error {
  return new (BusinessLogicError as unknown as new (code: string) => Error)(
    code,
  );
}

// Button labels, without the text some icons render in jsdom.
function buttonLabels(wrapper: VueWrapper): string[] {
  return wrapper.findAll("button").map((b) => b.text().split("{")[0]!.trim());
}

async function mountPage(): Promise<VueWrapper> {
  const wrapper = mount(OrganizationJoin);
  await flushPromises();
  return wrapper;
}

async function clickButton(wrapper: VueWrapper, label: string): Promise<void> {
  const button = wrapper
    .findAll("button")
    .find((b) => b.text().split("{")[0]!.trim() === label);
  expect(button, `button "${label}"`).toBeDefined();
  await button!.trigger("click");
  await flushPromises();
}

describe("OrganizationJoin", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", JOIN_PATH);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("when loading the invitation fails", () => {
    it("tells a user on the wrong account to switch, with no retry", async () => {
      getOrgInfo.mockRejectedValue(apiError("NotAuthorized"));

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain(
        "sent to a different account than the one you are signed in with (someone.else@example.com)",
      );
      expect(buttonLabels(wrapper)).toContain("Sign out and switch account");
      expect(buttonLabels(wrapper)).toContain("Go back");
      expect(buttonLabels(wrapper)).not.toContain("Try again");
    });

    it.each(["InvitationInvalidOrExpired", "EntityNotFound"])(
      "says the invitation is gone on %s, with no retry",
      async (code) => {
        getOrgInfo.mockRejectedValue(apiError(code));

        const wrapper = await mountPage();

        expect(wrapper.text()).toContain(
          "This invitation does not exist or has expired.",
        );
        expect(buttonLabels(wrapper)).not.toContain("Try again");
        expect(buttonLabels(wrapper)).not.toContain(
          "Sign out and switch account",
        );
      },
    );

    it("offers a retry on any other error", async () => {
      getOrgInfo.mockRejectedValue(apiError("InternalError"));

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain(
        "Something went wrong while loading the invitation.",
      );
      expect(buttonLabels(wrapper)).toContain("Try again");
    });
  });

  describe("when joining fails", () => {
    beforeEach(() => {
      getOrgInfo.mockResolvedValue(orgInfo);
    });

    it("tells a user on the wrong account to switch, with no retry", async () => {
      joinOrg.mockRejectedValue(apiError("NotAuthorized"));
      const wrapper = await mountPage();

      await clickButton(wrapper, "Join organisation");

      expect(wrapper.text()).toContain(
        "sent to a different account than the one you are signed in with (someone.else@example.com)",
      );
      expect(buttonLabels(wrapper)).toContain("Sign out and switch account");
      expect(buttonLabels(wrapper)).not.toContain("Try again");
    });

    it.each(["InvitationInvalidOrExpired", "EntityNotFound"])(
      "says the invitation is gone on %s, with no retry",
      async (code) => {
        joinOrg.mockRejectedValue(apiError(code));
        const wrapper = await mountPage();

        await clickButton(wrapper, "Join organisation");

        expect(wrapper.text()).toContain(
          "This invitation does not exist or has expired.",
        );
        expect(buttonLabels(wrapper)).not.toContain("Try again");
      },
    );

    it("offers a retry on any other error", async () => {
      joinOrg.mockRejectedValue(apiError("InternalError"));
      const wrapper = await mountPage();

      await clickButton(wrapper, "Join organisation");

      expect(wrapper.text()).toContain(
        "Something went wrong while joining the organisation.",
      );
      expect(buttonLabels(wrapper)).toContain("Try again");
    });
  });

  it("signs out and goes to login with a redirect back to this invitation", async () => {
    getOrgInfo.mockRejectedValue(apiError("NotAuthorized"));
    const wrapper = await mountPage();

    await clickButton(wrapper, "Sign out and switch account");

    expect(authStore.$reset).toHaveBeenCalled();
    expect(userStore.$reset).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith({
      name: "login",
      query: { redirect: JOIN_PATH },
    });
  });
});
