import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  member,
  OrgMembersPage,
  sampleMembers,
} from "./pages/org-members.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Organisation members", () => {
  test("lists each member with their role in words", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoMembers();

    await expect(members.heading).toHaveText("Members");
    await expect(members.rows()).toHaveCount(3);
    await expect(members.row("Alice Martin")).toContainText("Admin");
    await expect(members.row("Alice Martin")).toContainText(
      "alice@example.com",
    );
    await expect(members.row("Bob Keller")).toContainText("User");
    await expect(members.row("John Doe")).toContainText("Owner");
  });

  test("the filter narrows the rows and sorting by role puts owners first", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoMembers();

    await members.filter.fill("admin");
    await expect(members.rows()).toHaveCount(1);
    await expect(members.rows()).toContainText("Alice Martin");

    await members.filter.fill("");
    await members.sortButton("Role").click();
    await expect(members.columnHeader("Role")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(members.rows().locator("td:first-child")).toHaveText([
      /John Doe/,
      /Alice Martin/,
      /Bob Keller/,
    ]);
  });

  test("an owner removes a member after confirming", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoMembers();
    await expect(members.rows()).toHaveCount(3);

    await expect(
      page.getByRole("button", { name: "Remove John Doe" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Remove Bob Keller" }).click();
    await page
      .getByRole("dialog", { name: /Remove Bob Keller/ })
      .getByRole("button", { name: "Remove member" })
      .click();

    await expect(members.rows()).toHaveCount(2);
    expect(members.deleted).toEqual([`/api/org/org-123/members/u-bob`]);
  });

  test("an admin cannot remove the owner", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn({ org: { role: 1 } });
    await members.gotoMembers();
    await expect(members.rows()).toHaveCount(3);

    await expect(
      page.getByRole("button", { name: "Remove Bob Keller" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Remove John Doe" }),
    ).toHaveCount(0);
  });

  test("a failed load says so and offers to try again", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn({ fail: true });
    await members.gotoMembers();

    await expect(
      page.getByText("The members could not be loaded."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("a personal organisation lists its one member", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn({
      org: { name: "JohnDoe's Org", personal: true },
      members: [sampleMembers[0]],
    });
    await members.gotoMembers();

    await expect(members.rows()).toHaveCount(1);
    await expect(members.row("John Doe")).toContainText("Owner");
    await expect(members.row("John Doe")).toContainText("(you)");
  });

  test("a response the page cannot read shows the error, not an empty list", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    const broken = member("u-eve", "Eve", "Stone", 3);
    delete broken.user.first_name;
    await members.signIn({ members: [sampleMembers[0], broken] });
    await members.gotoMembers();

    await expect(
      page.getByText("The members could not be loaded."),
    ).toBeVisible();
    await expect(page.getByText("No members match.")).toHaveCount(0);
  });
});

test.describe("Organisation audit logs", () => {
  test("lists the entries the API returns", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoLogs();

    await expect(members.heading).toHaveText("Audit logs");
    await expect(members.rows()).toHaveCount(3);
    await expect(members.row("Removed eve@example.com")).toContainText(
      "alice@example.com",
    );
    await expect(members.row("Updated Default analyzer")).toContainText(
      "No longer a member",
    );
  });

  test("searching asks the API for matching entries", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoLogs();
    await expect(members.rows()).toHaveCount(3);

    const searched = page.waitForRequest(
      (r) =>
        r.url().includes("/audit_logs") &&
        new URL(r.url()).searchParams.get("search_key") === "eve",
    );
    await members.filter.fill("eve");
    await searched;
  });

  test("with no entries the page says so", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn({ logs: [] });
    await members.gotoLogs();

    await expect(page.getByText("No audit log entries yet.")).toBeVisible();
  });

  test("a moderator is sent back to the overview", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn({ org: { role: 2 } });
    await members.gotoLogs();

    await expect(page).toHaveURL(/\/orgs\/manage\/main\/org-123\/?$/);
  });
});

test.describe("Organisation invitations", () => {
  test("lists open invitations with the role, inviter and expiry", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoInvites();

    await expect(members.heading).toHaveText("Invitations");
    await expect(members.rows()).toHaveCount(2);
    await expect(members.row("carol@example.com")).toContainText("User");
    await expect(members.row("carol@example.com")).toContainText("John Doe");
    await expect(members.row("carol@example.com")).toContainText("in 5 days");
    await expect(members.row("dave@example.com")).toContainText("Moderator");
  });

  test("the invite form checks the email before sending", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoInvites();

    await page.getByRole("button", { name: "Invite a member" }).click();
    const dialog = page.getByRole("dialog", { name: "Invite a member" });
    const email = dialog.getByLabel("Email");

    await dialog.getByRole("button", { name: "Send invitation" }).click();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAccessibleDescription(/An email is required/);

    await email.fill("not an email");
    await dialog.getByRole("button", { name: "Send invitation" }).click();
    await expect(email).toHaveAccessibleDescription(/a valid email/);
    expect(members.invited).toEqual([]);

    await email.fill("erin@example.com");
    await dialog.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option", { name: "Admin" }).click();
    await dialog.getByRole("button", { name: "Send invitation" }).click();

    await expect(dialog).toHaveCount(0);
    expect(members.invited).toEqual([
      { user_email: "erin@example.com", role: 1 },
    ]);
    await expect(members.row("erin@example.com")).toBeVisible();
  });

  test("the invite link from the members page opens the form", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoMembers();

    await page.getByRole("link", { name: "Invite a member" }).click();

    await expect(
      page.getByRole("dialog", { name: "Invite a member" }),
    ).toBeVisible();
  });

  test("an owner revokes an invitation after confirming", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoInvites();
    await expect(members.rows()).toHaveCount(2);

    await page
      .getByRole("button", {
        name: "Revoke the invitation to carol@example.com",
      })
      .click();
    await page
      .getByRole("dialog", { name: /carol@example.com/ })
      .getByRole("button", { name: "Revoke invitation" })
      .click();

    await expect(members.rows()).toHaveCount(1);
    expect(members.deleted).toEqual([`/api/org/org-123/invitations/inv-1`]);
  });

  test("an owner resends an invitation and is told the email went out", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoInvites();
    await expect(members.rows()).toHaveCount(2);

    await page
      .getByRole("button", {
        name: "Resend the invitation to carol@example.com",
      })
      .click();

    await expect(
      page.getByText("Invitation emailed again to carol@example.com"),
    ).toBeVisible();
    expect(members.resent).toEqual([
      "/api/org/org-123/invitations/inv-1/resend",
    ]);
  });

  test("an admin is offered no resend or revoke", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn({ org: { role: 1 } });
    await members.gotoInvites();
    await expect(members.rows()).toHaveCount(2);

    await expect(
      page.getByRole("button", { name: /^(Resend|Revoke) the invitation/ }),
    ).toHaveCount(0);
  });

  test("with no open invitations the page says so", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn({ invitations: [] });
    await members.gotoInvites();

    await expect(
      page.getByRole("heading", { name: "No open invitations" }),
    ).toBeVisible();
    await expect(members.table).toHaveCount(0);
  });
});

test.describe("Organisation members, invitations and logs: keyboard, axe and screenshots", () => {
  test("Tab reaches the filter and sort buttons with visible focus", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoMembers();
    await expect(members.rows()).toHaveCount(3);

    await members.filter.focus();
    await expectVisibleFocus(members.filter);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(members.sortButton("Member"));
  });

  for (const view of ["members", "invites", "logs"] as const) {
    test(`the ${view} page passes axe and matches its screenshots`, async ({
      page,
    }) => {
      const members = new OrgMembersPage(page);
      await members.signIn();
      if (view === "members") await members.gotoMembers();
      if (view === "invites") await members.gotoInvites();
      if (view === "logs") await members.gotoLogs();
      await expect(members.rows().first()).toBeVisible();

      await expectNoAxeViolations(page);
      await expectScreenshots(page, `org-${view}`);
    });
  }

  test("the invite dialog passes axe", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoInvites("add");
    const dialog = page.getByRole("dialog", { name: "Invite a member" });
    await dialog.getByRole("button", { name: "Send invitation" }).click();
    await expect(dialog.getByText("An email is required")).toBeVisible();
    // Let the opening fade finish so contrast is measured on the final colours.
    await page.waitForTimeout(400);

    await expectNoAxeViolations(page);
  });
});
