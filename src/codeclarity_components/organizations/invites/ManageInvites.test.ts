import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";

import {
  createTestApp,
  org,
  type TestApp,
  user,
  withToaster,
} from "../../../../tests/real-app";

import ManageInvites from "./ManageInvites.vue";

const invitesPath = `/org/${org.id}/invitations`;
const ok = { status_code: 200, status: "success" };

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
  organization_id: org.id,
  user_email: "new@example.com",
  ttl: "2026-12-01T10:00:00Z",
};

const page = (data: unknown[]) => ({
  data,
  entry_count: data.length,
  page: 0,
  entries_per_page: 10,
  total_entries: data.length,
  total_pages: 1,
  matching_count: data.length,
  filter_count: {},
  status: "success",
});

const failure = (error_code: string) => ({
  status_code: 400,
  status: "failure",
  error_code,
  error_message: error_code,
});

// Opens the invitations page as a member with this role in the org.
async function openInvites(
  options: {
    role?: MemberRole;
    personal?: boolean;
    invitations?: unknown[];
  } = {},
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}`, {
    data: {
      ...org,
      role: options.role ?? MemberRole.OWNER,
      personal: options.personal ?? false,
    },
  });
  app.http.on("GET", invitesPath, page(options.invitations ?? [invitation]));
  await app.visit(`/orgs/manage/invites/${org.id}`);
  render(withToaster(ManageInvites, { orgId: org.id }), { global: app.global });
  await screen.findByText("new@example.com");
  return app;
}

const revokeLabel = "Revoke the invitation to new@example.com";
const resendLabel = "Resend the invitation to new@example.com";

async function revoke(): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: revokeLabel }));
  await userEvent.click(
    await screen.findByRole("button", { name: "Revoke invitation" }),
  );
}

describe("ManageInvites", () => {
  it("offers an owner Revoke on a pending invitation", async () => {
    await openInvites();

    expect(screen.getByRole("button", { name: revokeLabel })).toBeVisible();
  });

  it("offers an admin no Revoke, even on their own invitation", async () => {
    await openInvites({
      role: MemberRole.ADMIN,
      invitations: [
        {
          ...invitation,
          created_by: { ...invitation.created_by, id: user.id },
        },
      ],
    });

    expect(
      screen.queryByRole("button", { name: revokeLabel }),
    ).not.toBeInTheDocument();
  });

  it("offers no Revoke in a personal organisation", async () => {
    await openInvites({ personal: true });

    expect(
      screen.queryByRole("button", { name: revokeLabel }),
    ).not.toBeInTheDocument();
  });

  it("revokes after confirming and reloads the list", async () => {
    const app = await openInvites();
    app.http.on("DELETE", `${invitesPath}/inv-1`, ok);

    app.http.on("GET", invitesPath, page([]));
    await revoke();

    expect(await screen.findByText("No open invitations")).toBeInTheDocument();
    expect(
      app.http.requests.some(
        (r) => r.method === "DELETE" && r.path === `${invitesPath}/inv-1`,
      ),
    ).toBe(true);
  });

  it("says plainly when the API refuses the revoke", async () => {
    const app = await openInvites();
    app.http.on(
      "DELETE",
      `${invitesPath}/inv-1`,
      failure("NotAuthorized"),
      403,
    );

    await revoke();

    expect(
      await screen.findByText("Your role does not allow this"),
    ).toBeInTheDocument();
  });

  it("offers an owner Resend", async () => {
    await openInvites();

    expect(screen.getByRole("button", { name: resendLabel })).toBeVisible();
  });

  it("offers an admin no Resend", async () => {
    await openInvites({ role: MemberRole.ADMIN });

    expect(
      screen.queryByRole("button", { name: resendLabel }),
    ).not.toBeInTheDocument();
  });

  it("resends the invitation, says the email went out and reloads the list", async () => {
    const app = await openInvites();
    app.http.on("POST", `${invitesPath}/inv-1/resend`, ok);

    await userEvent.click(screen.getByRole("button", { name: resendLabel }));

    expect(
      await screen.findByText("Invitation emailed again to new@example.com"),
    ).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(
        app.http.requests.filter(
          (r) => r.method === "GET" && r.path === invitesPath,
        ),
      ).toHaveLength(2),
    );
  });

  it("says when the invitation email could not be sent", async () => {
    const app = await openInvites();
    app.http.on(
      "POST",
      `${invitesPath}/inv-1/resend`,
      failure("FailedToSendOrganizationInviteEmail"),
      500,
    );

    await userEvent.click(screen.getByRole("button", { name: resendLabel }));

    expect(
      await screen.findByText(
        "The invitation email could not be sent. Try again later.",
      ),
    ).toBeInTheDocument();
  });
});
