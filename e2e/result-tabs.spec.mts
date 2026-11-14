import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { dependency, ResultTabsPage } from "./pages/result-tabs.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("SBOM results", () => {
  test("shows the dependency numbers, chart and table", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto();

    const numbers = page.getByRole("list", { name: "Dependency numbers" });
    await expect(numbers.getByRole("listitem").nth(0)).toHaveText(
      /Dependencies\s*5/,
    );
    await expect(numbers.getByRole("listitem").nth(1)).toHaveText(
      /Direct dependencies\s*3/,
    );
    await expect(numbers.getByRole("listitem").nth(3)).toHaveText(
      /Security issues\s*3/,
    );
    await expect(tabs.rows("Dependencies")).toHaveCount(5);
    await expect(
      tabs.rows("Dependencies").filter({ hasText: "request" }),
    ).toContainText("Deprecated");
    await expect(
      tabs.rows("Dependencies").filter({ hasText: "express" }),
    ).toContainText("Major update");

    await page.getByText("Show table").click();
    await expect(
      page.getByRole("row", { name: "Direct 3", exact: true }),
    ).toBeVisible();
  });

  test("search and sort work on every dependency", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto();
    await expect(tabs.rows("Dependencies")).toHaveCount(5);

    await page
      .getByRole("searchbox", { name: "Search dependencies" })
      .fill("lod");
    await expect(tabs.rows("Dependencies")).toHaveCount(1);
    await page.getByRole("searchbox", { name: "Search dependencies" }).fill("");

    await tabs.sortButton("Dependencies", "Package").click();
    await expect(tabs.rows("Dependencies").first()).toContainText("vitest");
  });

  test("a package links to its details", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto();

    await page.getByRole("link", { name: "lodash" }).click();
    await expect(page).toHaveURL(
      /\/results\/sbom_details\?.*package_id=lodash(@|%40)4\.17\.20/,
    );
  });

  test("the update dialog traps focus and closes with Escape", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto();
    const open = page.getByRole("button", {
      name: "Update 2 direct dependencies",
    });

    await open.click();
    const dialog = page.getByRole("dialog", {
      name: "Update direct dependencies",
    });
    await expect(dialog).toContainText("4.18.2 to 5.0.1");
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }
    await expectNoAxeViolations(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  });

  test("Tab reaches the actions, search and table with visible focus", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn({ realClock: true });
    await tabs.goto();
    await expect(tabs.rows("Dependencies")).toHaveCount(5);

    const update = page.getByRole("button", {
      name: "Update 2 direct dependencies",
    });
    await update.focus();
    await expectVisibleFocus(update);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(page.getByRole("button", { name: "Export SBOM" }));
    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("searchbox", { name: "Search dependencies" }),
    );
    await page.keyboard.press("Tab");
    await expectVisibleFocus(tabs.sortButton("Dependencies", "Package"));

    await page.getByRole("button", { name: "Export SBOM" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: /CSV/ })).toBeFocused();
    await page.keyboard.press("Escape");
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto();
    await expect(tabs.rows("Dependencies")).toHaveCount(5);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "sbom");
  });

  test("loading and empty states pass axe", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    const release = await tabs.signIn({ dependencies: [], hold: true });
    await tabs.goto();
    await expect(
      page.getByRole("status", { name: "Loading the SBOM" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);

    release();
    await expect(page.getByText("No dependencies found")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "sbom-empty");
  });

  test("many dependencies page through the table", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn({
      dependencies: Array.from({ length: 130 }, (_, i) =>
        dependency(`pkg-${String(i).padStart(3, "0")}`, "1.0.0"),
      ),
    });
    await tabs.goto();

    await expect(tabs.rows("Dependencies")).toHaveCount(20);
    await expect(page.getByText("Showing 1 to 20 of 130")).toBeVisible();
  });
});

test.describe("SBOM dependency details", () => {
  test("shows the package, its health and its vulnerabilities", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.gotoDetails();

    await expect(tabs.heading).toContainText("lodash");
    await expect(
      page.getByRole("link", { name: /npm \(opens in a new tab\)/ }),
    ).toHaveAttribute("href", "https://www.npmjs.com/package/lodash/v/4.17.20");
    const numbers = page.getByRole("list", { name: "Dependency numbers" });
    await expect(numbers.getByRole("listitem").nth(0)).toHaveText(
      /Security score\s*D/,
    );
    await expect(numbers.getByRole("listitem").nth(1)).toHaveText(
      /Vulnerabilities\s*2\s*1 critical or high/,
    );
    await expect(page.getByText("2 issues")).toBeVisible();
    await expect(page.getByText("High", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "CVE-2021-23337" }).click();
    await expect(page).toHaveURL(
      /\/results\/vulnerabilities_details\?.*finding_id=CVE-2021-23337/,
    );
  });

  test("Tab moves from Back to the package links with visible focus", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.gotoDetails();
    await expect(tabs.heading).toContainText("lodash");

    const back = page.getByRole("button", { name: "Back to results" });
    await back.focus();
    await expectVisibleFocus(back);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("link", { name: /npm \(opens in a new tab\)/ }),
    );
  });

  test("while loading, a skeleton stands in for the page", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    const release = await tabs.signIn({ hold: true });
    await tabs.gotoDetails();

    await expect(
      page.getByRole("status", { name: "Loading the dependency" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);

    release();
    await expect(tabs.heading).toContainText("lodash");
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.gotoDetails();
    await expect(tabs.heading).toContainText("lodash");
    await expect(
      page.getByRole("group", { name: /Dependency graph of lodash/ }),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "sbom-details");
  });
});

test.describe("License results", () => {
  test("lists each license with a status label", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("Licenses");

    const rows = tabs.rows("Licenses");
    await expect(rows).toHaveCount(3);
    await expect(rows.filter({ hasText: "MIT" })).toContainText("Compliant");
    await expect(rows.filter({ hasText: "GPL" })).toContainText("Violation");
    await expect(rows.filter({ hasText: "Custom" })).toContainText(
      "Needs review",
    );
    const numbers = page.getByRole("list", { name: "License numbers" });
    await expect(numbers.getByRole("listitem").nth(4)).toHaveText(
      /Policy violations\s*1/,
    );
  });

  test("the license dialog traps focus and closes with Escape", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("Licenses");
    const open = page.getByRole("button", { name: "Details of MIT License" });

    await open.focus();
    await expectVisibleFocus(open);
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "MIT License" });
    await expect(dialog).toContainText("Permissions");
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }
    await expectNoAxeViolations(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  });

  test("passes axe while loading and matches the screenshots", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    const release = await tabs.signIn({ hold: true });
    await tabs.goto("Licenses");
    await expectNoAxeViolations(page);

    release();
    await expect(tabs.rows("Licenses")).toHaveCount(3);
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "licenses");
  });
});

test.describe("Patch results", () => {
  test("shows the patch summary and a status per dependency", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("Patches");

    const numbers = page.getByRole("list", { name: "Patch numbers" });
    await expect(numbers.getByRole("listitem").nth(0)).toHaveText(
      /Issues after patching\s*2\s*4 before patching/,
    );
    const rows = tabs.rows("Patches");
    await expect(rows).toHaveCount(3);
    await expect(rows.filter({ hasText: "express" })).toContainText(
      "Full patch",
    );
    await expect(rows.filter({ hasText: "request" })).toContainText("No patch");
    await expect(rows.filter({ hasText: "vitest" })).toContainText(
      "Partial patch",
    );
    await expect(
      page.getByRole("heading", { name: "Patched manifest" }),
    ).toBeVisible();

    await page.getByText("Show table").click();
    await expect(
      page.getByRole("row", { name: "Critical 1 0", exact: true }),
    ).toBeVisible();
  });

  test("the patch dialog traps focus and closes with Escape", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("Patches");
    const open = page.getByRole("button", {
      name: "Details of vitest@3.2.0",
    });

    await open.click();
    const dialog = page.getByRole("dialog", { name: "vitest@3.2.0" });
    await expect(dialog).toContainText("Not fixed (1)");
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await expectNoAxeViolations(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  });

  test("Tab reaches the copy buttons with visible focus", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("Patches");

    const copy = page.getByRole("button", {
      name: "Copy the patched manifest",
    });
    await copy.focus();
    await expectVisibleFocus(copy);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("button", { name: "Copy the command" }),
    );
  });

  test("passes axe while loading and matches the screenshots", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    const release = await tabs.signIn({ hold: true });
    await tabs.goto("Patches");
    await expectNoAxeViolations(page);

    release();
    await expect(tabs.rows("Patches")).toHaveCount(3);
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "patches");
  });
});

test.describe("CodeQL results", () => {
  test("lists each finding with its file and lines", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("CodeQL");

    const rows = tabs.rows("CodeQL findings");
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: "js/xss" })).toContainText("40 to 42");
    await expect(page.getByText("CodeQL result created")).toBeVisible();
  });

  test("Tab reaches the search and sort with visible focus", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("CodeQL");
    await expect(tabs.rows("CodeQL findings")).toHaveCount(2);

    const search = page.getByRole("searchbox", { name: "Search findings" });
    await search.focus();
    await expectVisibleFocus(search);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(tabs.sortButton("CodeQL findings", "Rule"));
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("CodeQL");
    await expect(tabs.rows("CodeQL findings")).toHaveCount(2);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "codeql");
  });

  test("no findings shows a success message that passes axe", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn({ codeql: [] });
    await tabs.goto("CodeQL");

    await expect(page.getByText("No findings")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "codeql-empty");
  });
});
