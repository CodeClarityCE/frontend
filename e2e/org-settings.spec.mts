import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  membership,
  ORG,
  organization,
  OrgSettingsPage,
} from "./pages/org-settings.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Organisations list", () => {
  test("lists each organisation with the user's role and opens one", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoList();

    await expect(orgs.heading).toHaveText("Organisations");
    await expect(orgs.rows()).toHaveCount(3);
    await expect(orgs.rows().first()).toContainText("Test Organization");
    await expect(orgs.rows().first()).toContainText("Owner");
    await expect(orgs.rows().nth(1)).toContainText("Member");
    await expect(orgs.rows().nth(2)).toContainText("Personal");

    await orgs.table.getByRole("link", { name: "Test Organization" }).click();

    await expect(page).toHaveURL(new RegExp(`/orgs/manage/main/${ORG}/?$`));
  });

  test("the filter narrows the rows and says when nothing matches", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoList();

    await orgs.filter.fill("research");

    await expect(orgs.rows()).toHaveCount(1);
    await expect(orgs.rows()).toContainText("Research Lab");

    await orgs.filter.fill("nothing like this");

    await expect(orgs.rows()).toHaveText(["No organisations match."]);
  });

  test("only an owner can delete, and nobody can leave a personal one", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoList();

    const owned = orgs.rows().nth(0);
    const joined = orgs.rows().nth(1);
    const personal = orgs.rows().nth(2);
    await expect(owned.getByRole("button", { name: /^Delete/ })).toBeVisible();
    await expect(joined.getByRole("button", { name: /^Leave/ })).toBeVisible();
    await expect(joined.getByRole("button", { name: /^Delete/ })).toHaveCount(
      0,
    );
    await expect(personal.getByRole("button")).toHaveCount(0);
  });

  test("deleting asks first, keeps focus in the dialog and then deletes", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoList();

    const trigger = page.getByRole("button", {
      name: "Delete Test Organization",
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Delete Test Organization?",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("cannot be undone");

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(orgs.writes).toEqual([]);

    await trigger.click();
    await dialog.getByRole("button", { name: "Delete organisation" }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("Deleted Test Organization")).toBeVisible();
    expect(orgs.writes).toEqual([`DELETE /org/${ORG}`]);
  });

  test("an organisation with none sees the owl and Create an organisation", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({ memberships: [] });
    await orgs.gotoList();

    await expect(
      page.getByRole("heading", { name: "No organisations yet" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Create an organisation" }).click();

    await expect(page).toHaveURL(/\/orgs\/add\/?$/);
  });

  test("a failed load says so and can be retried", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({ failList: true });
    await orgs.gotoList();

    await expect(
      page.getByText("The organisations could not be loaded."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("Tab reaches the actions, filter and rows with visible focus", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoList();
    await expect(orgs.rows()).toHaveCount(3);

    const newOrg = page.getByRole("link", { name: "New organisation" });
    await newOrg.focus();
    await expectVisibleFocus(newOrg);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(orgs.filter);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(orgs.table.getByRole("button", { name: "Name" }));

    const link = orgs.table.getByRole("link", { name: "Test Organization" });
    await link.focus();
    await expectVisibleFocus(link);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("button", { name: "Leave Test Organization" }),
    );
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoList();
    await expect(orgs.rows()).toHaveCount(3);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "orgs-list");
  });
});

test.describe("Create an organisation", () => {
  test("shows errors on the fields before sending anything", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoCreate();

    await expect(orgs.heading).toHaveText("New organisation");
    await page.getByRole("button", { name: "Create organisation" }).click();

    const name = page.getByRole("textbox", { name: "Name" });
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("A name is required")).toBeVisible();
    await expect(page.getByText("A description is required")).toBeVisible();
    await expect(name).toHaveAccessibleDescription(/A name is required/);

    await name.fill("x");
    await page.getByRole("button", { name: "Create organisation" }).click();
    await expect(page.getByText("At least 2 characters").first()).toBeVisible();
    expect(orgs.created).toEqual([]);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "orgs-create-errors");
  });

  test("creates it and opens its overview", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoCreate();

    await page.getByRole("textbox", { name: "Name" }).fill("Research Lab");
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Ecosystem studies");
    await page.getByRole("button", { name: "Create organisation" }).click();

    await expect(page).toHaveURL(/\/orgs\/manage\/main\/org-new\/?$/);
    expect(orgs.created).toEqual([
      expect.objectContaining({
        name: "Research Lab",
        description: "Ecosystem studies",
      }),
    ]);
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoCreate();
    await expect(orgs.heading).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "orgs-create");
  });
});

test.describe("Organisation overview", () => {
  test("shows the organisation, its settings pages and one page title", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoOverview();

    await expect(orgs.heading).toHaveCount(1);
    await expect(orgs.heading).toHaveText("Organisation overview");
    const card = page.getByRole("region", { name: "Organisation" });
    await expect(card).toContainText("Test Organization");
    await expect(card).toContainText("Owner");
    await expect(card).toContainText("@johndoe");

    const main = page.locator("#main-content");
    for (const name of [
      "Members",
      "Invites",
      "Integrations",
      "Analyzers",
      "Policies",
      "Audit logs",
    ]) {
      await expect(
        main.getByRole("link", { name: new RegExp(`^${name}`) }),
      ).toBeVisible();
    }
  });

  test("a member sees only the pages they can use, and no delete", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({
      org: organization(ORG, "Test Organization", { role: 3 }),
    });
    await orgs.gotoOverview();

    const main = page.locator("#main-content");
    await expect(main.getByRole("link", { name: /^Policies/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /^Members/ })).toHaveCount(0);
    await expect(main.getByRole("link", { name: /^Integrations/ })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Leave organisation" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete organisation" }),
    ).toHaveCount(0);
    await expect(orgs.subLink("Members")).toHaveCount(0);
  });

  test("leaving asks first, then goes back to the list", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoOverview();

    const trigger = page.getByRole("button", { name: "Leave organisation" });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Leave Test Organization?",
    });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);

    await dialog.getByRole("button", { name: "Leave organisation" }).click();

    await expect(page).toHaveURL(/\/orgs\/list\/?$/);
    expect(orgs.writes).toEqual([`POST /org/${ORG}/leave_org`]);
  });

  test("the last owner cannot leave and is told why", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({
      failWrite: { status: 400, error_code: "CannotLeaveAsLastOwner" },
    });
    await orgs.gotoOverview();

    await page.getByRole("button", { name: "Leave organisation" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Leave organisation" })
      .click();

    await expect(page.getByText(/You are the last owner/)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/orgs/manage/main/${ORG}/?$`));
  });

  test("the auto-resolve switch saves the setting", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    const patch = page.waitForRequest(
      (r) => r.method() === "PATCH" && r.url().endsWith(`/org/${ORG}/settings`),
    );
    await orgs.gotoOverview();

    const toggle = page.getByRole("switch", {
      name: "Resolve tickets automatically",
    });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();

    expect((await patch).postDataJSON()).toEqual({
      auto_resolve_tickets: true,
    });
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  test("Tab reaches the settings links and actions with visible focus", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoOverview();

    const main = page.locator("#main-content");
    const members = main.getByRole("link", { name: /^Members/ });
    await members.focus();
    await expectVisibleFocus(members);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(main.getByRole("link", { name: /^Invites/ }));

    const toggle = page.getByRole("switch");
    await toggle.focus();
    await expectVisibleFocus(toggle);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("button", { name: "Leave organisation" }),
    );
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoOverview();
    await expect(orgs.heading).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-overview");

    await page.getByRole("button", { name: "Delete organisation" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // Measure contrast once the dialog has finished fading in.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    await expectNoAxeViolations(page);
  });
});

test.describe("Organisation settings in the sidebar", () => {
  test("lists the organisation pages and marks the current one", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoOverview();

    await expect(orgs.orgNav.getByRole("link")).toHaveText([
      "Overview",
      "Members",
      "Invites",
      "Integrations",
      "Analyzers",
      "Policies",
      "Audit logs",
    ]);
    await expect(orgs.subLink("Overview")).toHaveAttribute(
      "aria-current",
      "page",
    );

    await orgs.subLink("Policies").click();

    await expect(page).toHaveURL(new RegExp(`/orgs/manage/policies/${ORG}/?$`));
    await expect(orgs.subLink("Policies")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(orgs.subLink("Overview")).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("Tab moves through the sub-items with visible focus", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoOverview();

    await orgs.shell.link("Organisation settings").focus();
    await page.keyboard.press("Tab");
    await expectVisibleFocus(orgs.subLink("Overview"));
    await page.keyboard.press("Tab");
    await expectVisibleFocus(orgs.subLink("Members"));
  });

  test("the sub-items are hidden outside the organisation settings", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.shell.goto("/datasets");

    await expect(orgs.shell.link("Organisation settings")).toBeVisible();
    await expect(orgs.orgNav).toHaveCount(0);
  });

  test("a personal organisation has no Members or Invites", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({
      org: organization(ORG, "Personal space", { personal: true }),
      memberships: [membership(organization(ORG, "Personal space"))],
    });
    await orgs.gotoOverview();

    await expect(orgs.orgNav.getByRole("link")).toHaveText([
      "Overview",
      "Integrations",
      "Analyzers",
      "Policies",
      "Audit logs",
    ]);
  });
});
