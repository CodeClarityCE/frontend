import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { OrgPoliciesPage } from "./pages/org-policies.page.mjs";

// The organisation header (HeaderItem) still shows a white-on-green badge.

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Organisation policies list", () => {
  test("lists the license policies with their type in words", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoList();

    await expect(policies.heading).toHaveText("Policies");
    const rows = policies.rows("License policies");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("Permissive only");
    await expect(rows.first()).toContainText("Default");
    await expect(rows.first()).toContainText("Allow list");
    await expect(rows.nth(1)).toContainText("Block list");
  });

  test("the vulnerability tab lists the vulnerability policies", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoList();

    await policies.tab("Vulnerability policies").click();

    const rows = policies.rows("Vulnerability policies");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("False positives");
    await expect(rows.nth(1)).toContainText("Test fixtures only");
  });

  test("an organisation with no license policies sees the owl and a first step", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn({ licensePolicies: [] });
    await policies.gotoList();

    await expect(
      page.getByRole("heading", { name: "No license policies yet" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Create a license policy" }).click();

    await expect(page).toHaveURL(/\/orgs\/add\/policy\/org-123\/?$/);
  });

  test("deleting a vulnerability policy asks first, in red, and keeps focus in the dialog", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoList();
    await policies.tab("Vulnerability policies").click();

    await page
      .getByRole("button", { name: "Delete Test fixtures only" })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Delete Test fixtures only?",
    });
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole("button", { name: "Delete policy" });
    const background = await confirm.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const [r, g, b] = background.match(/\d+/g)!.map(Number);
    expect(r).toBeGreaterThan(150);
    expect(g).toBeLessThan(100);
    expect(b).toBeLessThan(100);

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-policies-delete");

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(policies.writes).toEqual([]);

    await page
      .getByRole("button", { name: "Delete Test fixtures only" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete policy" })
      .click();

    await expect(policies.rows("Vulnerability policies")).toHaveCount(1);
    expect(policies.writes).toEqual([
      "DELETE /org/org-123/policies/vulnerability_policy/vp-2",
    ]);
  });

  test("Tab reaches the tabs, actions, filter, sort buttons and row actions with visible focus", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoList();
    const table = policies.table("License policies");
    await expect(policies.rows("License policies")).toHaveCount(2);

    const licenseTab = policies.tab("License policies");
    await licenseTab.focus();
    await expectVisibleFocus(licenseTab);
    for (const target of [
      page.getByRole("tabpanel"),
      page.getByRole("link", { name: "New license policy" }),
      page.getByRole("searchbox", { name: "Filter license policies" }),
      table.getByRole("button", { name: "Name" }),
      table.getByRole("button", { name: "Type" }),
      table.getByRole("button", { name: "Licenses" }),
      table.getByRole("button", { name: "Created by" }),
      table.getByRole("button", { name: "Created", exact: true }),
      table.getByRole("button", { name: "Edit Permissive only" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      /\/orgs\/edit\/policy\/org-123\/?\?policyId=lp-1$/,
    );
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoList();
    await expect(policies.rows("License policies")).toHaveCount(2);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-policies-license");

    await policies.tab("Vulnerability policies").click();
    await expect(policies.rows("Vulnerability policies")).toHaveCount(2);
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-policies-vulnerability");
  });
});

test.describe("License policy form", () => {
  test("submitting an empty form explains each missing field", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoCreateLicense();
    await expect(policies.heading).toHaveText("New license policy");

    await page.getByRole("button", { name: "Create policy" }).click();

    const name = page.getByRole("textbox", { name: "Name" });
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription(/A name is required/);
    await expect(page.getByText("Pick a policy type")).toBeVisible();
    await expect(page.getByText("Pick at least one license")).toBeVisible();
    expect(policies.writes).toEqual([]);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-policies-create-errors");
  });

  test("creates an allow list from the picked licenses", async ({ page }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoCreateLicense();

    await page.getByRole("textbox", { name: "Name" }).fill("Permissive only");
    await page.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: /Allow list/ }).click();
    await page.getByRole("searchbox", { name: "Filter licenses" }).fill("MIT");
    await page.getByRole("checkbox", { name: "Include MIT" }).click();
    await expect(page.getByText("1 license picked")).toBeVisible();

    const posted = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().endsWith("/policies/license_policy"),
    );
    await page.getByRole("button", { name: "Create policy" }).click();

    expect((await posted).postDataJSON()).toMatchObject({
      name: "Permissive only",
      type: "WHITELIST",
      licenses: ["MIT"],
      default: false,
    });
    await expect(page).toHaveURL(/\/orgs\/manage\/policies\/org-123\/?$/);
  });

  test("editing loads the saved policy into the form", async ({ page }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoEditLicense("lp-1");

    await expect(policies.heading).toHaveText("Edit license policy");
    await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Permissive only",
    );
    await expect(page.getByText("2 licenses picked")).toBeVisible();
  });

  test("Tab moves through the form in order with visible focus", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoCreateLicense();
    await expect(
      page.getByRole("checkbox", { name: "Include MIT" }),
    ).toBeVisible();

    const back = page
      .locator("#main-content")
      .getByRole("link", { name: "Policies", exact: true });
    await back.focus();
    await expectVisibleFocus(back);
    for (const target of [
      page.getByRole("textbox", { name: "Name" }),
      page.getByRole("textbox", { name: "Description (optional)" }),
      page.getByRole("combobox", { name: "Type" }),
      page.getByRole("checkbox", { name: "Make this the default policy" }),
      page.getByRole("searchbox", { name: "Filter licenses" }),
      page.getByRole("button", { name: "Identifier" }),
      page.getByRole("button", { name: "Name" }),
      page.getByRole("checkbox", { name: "Include MIT" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoCreateLicense();
    await expect(
      page.getByRole("checkbox", { name: "Include MIT" }),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-policies-create");
  });
});

test.describe("Vulnerability policy form", () => {
  test("submitting an empty form explains each missing field", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.gotoCreateVulnerability();
    await expect(policies.heading).toHaveText("New vulnerability policy");

    await page.getByRole("button", { name: "Create policy" }).click();

    await expect(page.getByRole("textbox", { name: "Name" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(
      page.getByText("Pick at least one vulnerability"),
    ).toBeVisible();
    expect(policies.writes).toEqual([]);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-policies-vulnerability-create-errors");
  });
});
