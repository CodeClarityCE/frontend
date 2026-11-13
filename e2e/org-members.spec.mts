import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { OrgMembersPage } from "./pages/org-members.page.mjs";

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

  test("removing a member asks first in a dialog that keeps focus", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoMembers();

    // Nobody can remove themselves.
    await expect(
      members.row("John Doe").getByRole("button", { name: /Remove/ }),
    ).toHaveCount(0);

    await members
      .row("Bob Keller")
      .getByRole("button", { name: "Remove Bob Keller" })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Remove Bob Keller from the organisation?",
    });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(members.deleted).toEqual([]);

    await members
      .row("Bob Keller")
      .getByRole("button", { name: "Remove Bob Keller" })
      .click();
    await dialog.getByRole("button", { name: "Remove member" }).click();

    await expect(dialog).toHaveCount(0);
    await expect(members.rows()).toHaveCount(2);
    await expect(members.row("Bob Keller")).toHaveCount(0);
    expect(members.deleted).toEqual(["/api/org/org-123/members/u-bob"]);
  });

  test("a member's audit logs open filtered to them", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoMembers();

    await members
      .row("Alice Martin")
      .getByRole("link", { name: "Audit logs of Alice Martin" })
      .click();

    await expect(page).toHaveURL(
      /\/orgs\/manage\/logs\/org-123\/?\?search=alice(@|%40)example\.com$/,
    );
    await expect(members.heading).toHaveText("Audit logs");
    await expect(members.rows()).toHaveCount(1);
    await expect(members.rows()).toContainText("Removed eve@example.com");
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
});

test.describe("Organisation audit logs", () => {
  test("lists every entry, newest first, with severity in words", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoLogs();

    await expect(members.heading).toHaveText("Audit logs");
    await expect(members.rows()).toHaveCount(3);
    await expect(members.rows().first()).toContainText("Project create");
    await expect(members.rows().first()).toContainText("Low");
    await expect(members.row("Removed eve@example.com")).toContainText("High");
    await expect(members.row("Updated Default analyzer")).toContainText(
      "Medium",
    );
    await expect(members.row("Updated Default analyzer")).toContainText(
      "No longer a member",
    );
  });

  test("entries for one member can be widened to everyone", async ({
    page,
  }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoLogs("alice@example.com");

    await expect(members.rows()).toHaveCount(1);
    await page.getByRole("link", { name: "Show everyone" }).click();

    await expect(members.rows()).toHaveCount(3);
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

  test("revoking asks first, resending sends again", async ({ page }) => {
    const members = new OrgMembersPage(page);
    await members.signIn();
    await members.gotoInvites();

    await members
      .row("dave@example.com")
      .getByRole("button", {
        name: "Resend the invitation to dave@example.com",
      })
      .click();
    await expect
      .poll(() => members.resent)
      .toEqual(["/api/org/org-123/invitations/inv-2/resend"]);

    await members
      .row("carol@example.com")
      .getByRole("button", {
        name: "Revoke the invitation to carol@example.com",
      })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Revoke the invitation to carol@example.com?",
    });
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }
    await dialog.getByRole("button", { name: "Revoke invitation" }).click();

    await expect(dialog).toHaveCount(0);
    await expect(members.rows()).toHaveCount(1);
    expect(members.deleted).toEqual(["/api/org/org-123/invitations/inv-1"]);
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
  test("Tab reaches the filter, sort buttons and row actions with visible focus", async ({
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

    const remove = members
      .row("Bob Keller")
      .getByRole("button", { name: "Remove Bob Keller" });
    await remove.focus();
    await expectVisibleFocus(remove);
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("dialog", {
        name: "Remove Bob Keller from the organisation?",
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(remove).toBeFocused();
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
