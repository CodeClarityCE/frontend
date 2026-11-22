import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import {
  createTestApp,
  type TestApp,
  user,
  withToaster,
} from "../../../../tests/real-app";

import OrganizationJoin from "./OrganizationJoin.vue";

const JOIN_PATH =
  "/email_action/join_org?token=tok&useremail=digest&orgId=org-1";
const infoPath = "/org/org-1/org_info_invitee";
const joinPath = "/org/org-1/join";

const orgInfo = {
  id: "org-1",
  name: "Inviting Org",
  description: "Builds things",
  color_scheme: "1",
  created_on: "2026-01-01T00:00:00Z",
  invite_created_on: "2026-11-01T00:00:00Z",
  role: MemberRole.ADMIN,
  number_of_members: 2,
};

const apiError = (error_code: string) => ({
  status_code: 400,
  status: "failure",
  error_code,
  error_message: error_code,
});

// Opens the invitation link signed in; info answers the invitation lookup.
async function openInvitation(
  info: { body: unknown; status?: number } = { body: { data: orgInfo } },
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", infoPath, info.body, info.status);
  await app.visit(JOIN_PATH);
  render(withToaster(OrganizationJoin), { global: app.global });
  return app;
}

const button = (name: string) => screen.queryByRole("button", { name });

const wrongAccount = `sent to a different account than the one you are signed in with (${user.email})`;

describe("OrganizationJoin", () => {
  beforeEach(() => {
    // The page reads the invitation from the address bar.
    window.history.replaceState({}, "", JOIN_PATH);
  });

  describe("when loading the invitation fails", () => {
    it("tells a user on the wrong account to switch, with no retry", async () => {
      await openInvitation({ body: apiError("NotAuthorized"), status: 403 });

      expect(
        await screen.findByText(wrongAccount, { exact: false }),
      ).toBeInTheDocument();
      expect(button("Sign out and switch account")).toBeInTheDocument();
      expect(button("Go back")).toBeInTheDocument();
      expect(button("Try again")).not.toBeInTheDocument();
    });

    it.each(["InvitationInvalidOrExpired", "EntityNotFound"])(
      "says the invitation is gone on %s, with no retry",
      async (code) => {
        await openInvitation({ body: apiError(code), status: 404 });

        expect(
          await screen.findByText(
            "This invitation does not exist or has expired.",
          ),
        ).toBeInTheDocument();
        expect(button("Try again")).not.toBeInTheDocument();
        expect(button("Sign out and switch account")).not.toBeInTheDocument();
      },
    );

    it("offers a retry on any other error", async () => {
      await openInvitation({ body: apiError("InternalError"), status: 500 });

      expect(
        await screen.findByText(
          "Something went wrong while loading the invitation.",
        ),
      ).toBeInTheDocument();
      expect(button("Try again")).toBeInTheDocument();
    });
  });

  describe("when joining", () => {
    async function join(answer: unknown, status = 200): Promise<TestApp> {
      const app = await openInvitation();
      app.http.on("POST", joinPath, answer, status);
      await userEvent.click(
        await screen.findByRole("button", { name: "Join organisation" }),
      );
      return app;
    }

    it("joins with the invitation token and opens the organisation", async () => {
      const app = await join({ status_code: 200, status: "success" });

      expect(
        await screen.findByText("You joined Inviting Org"),
      ).toBeInTheDocument();
      expect(app.router.currentRoute.value.params).toMatchObject({
        action: "manage",
        page: "main",
        orgId: "org-1",
      });
      expect(app.http.requests.find((r) => r.path === joinPath)?.body).toEqual({
        token: "tok",
        email_digest: "digest",
      });
    });

    it("tells a user on the wrong account to switch, with no retry", async () => {
      await join(apiError("NotAuthorized"), 403);

      expect(
        await screen.findByText(wrongAccount, { exact: false }),
      ).toBeInTheDocument();
      expect(button("Sign out and switch account")).toBeInTheDocument();
      expect(button("Try again")).not.toBeInTheDocument();
    });

    it.each(["InvitationInvalidOrExpired", "EntityNotFound"])(
      "says the invitation is gone on %s, with no retry",
      async (code) => {
        await join(apiError(code), 404);

        expect(
          await screen.findByText(
            "This invitation does not exist or has expired.",
          ),
        ).toBeInTheDocument();
        expect(button("Try again")).not.toBeInTheDocument();
      },
    );

    it("offers a retry on any other error", async () => {
      await join(apiError("InternalError"), 500);

      expect(
        await screen.findByText(
          "Something went wrong while joining the organisation.",
        ),
      ).toBeInTheDocument();
      expect(button("Try again")).toBeInTheDocument();
    });
  });

  it("signs out and goes to login with a redirect back to this invitation", async () => {
    const app = await openInvitation({
      body: apiError("NotAuthorized"),
      status: 403,
    });

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Sign out and switch account",
      }),
    );

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.name).toBe("login"),
    );
    expect(app.router.currentRoute.value.query.redirect).toBe(JOIN_PATH);
    expect(useAuthStore().getAuthenticated).toBe(false);
    expect(useUserStore().getUser).toBeUndefined();
  });
});
