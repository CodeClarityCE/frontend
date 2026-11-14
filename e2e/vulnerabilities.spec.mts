import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { finding, VulnerabilitiesPage } from "./pages/vulnerabilities.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

const many = Array.from({ length: 45 }, (_, i) =>
  finding(
    `CVE-2025-${String(i + 1).padStart(4, "0")}`,
    (["critical", "high", "medium", "low"] as const)[i % 4],
    `package-${i + 1}`,
  ),
);

test.describe("Vulnerability results", () => {
  test("severity is shown in words next to its colour", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoResults();

    await expect(vulns.heading).toHaveText("Results");
    await expect(vulns.cards).toHaveCount(4);
    await expect(vulns.cards.nth(0)).toContainText("Critical 9.8");
    await expect(vulns.cards.nth(1)).toContainText("High 7.5");
    await expect(vulns.cards.nth(2)).toContainText("Medium 5.3");
    await expect(vulns.cards.nth(3)).toContainText("Low 2.1");
    await expect(vulns.cards.nth(0)).toContainText("Exploit risk 42.0%");
    await expect(vulns.cards.nth(1)).toContainText("Match uncertain");

    const numbers = page.getByRole("list", { name: "Vulnerability numbers" });
    await expect(numbers.getByRole("listitem").first()).toHaveText(
      /Vulnerabilities\s*4/,
    );
    await page.getByText("Show table").click();
    await expect(
      page.getByRole("row", { name: "Critical 1", exact: true }),
    ).toBeVisible();
  });

  test("a card opens to show its exploit risk, weaknesses and impact", async ({
    page,
  }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoResults();
    const first = vulns.cards.first();
    const toggle = first.getByRole("button", { name: "Show more" });

    await toggle.click();

    await expect(
      first.getByRole("button", { name: "Show less" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(first).toContainText("EPSS 42.0%");
    await expect(first.getByRole("link", { name: /CWE-79/ })).toBeVisible();
    await expect(first).toContainText("Confidentiality: High");
    await expect(first).toContainText("A03 Injection");

    await first.getByRole("link", { name: "CVE-2024-0001" }).click();
    await expect(page).toHaveURL(
      /\/results\/vulnerabilities_details\?.*finding_id=CVE-2024-0001/,
    );
  });

  test("search asks the server for matching vulnerabilities", async ({
    page,
  }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoResults();
    await expect(vulns.cards).toHaveCount(4);

    await vulns.search.fill("axios");

    await expect(vulns.cards).toHaveCount(1);
    await expect(vulns.cards).toContainText("CVE-2024-0003");
    expect(vulns.lastQuery().get("search_key")).toBe("axios");

    await vulns.search.fill("nothing like this");
    await expect(
      page.getByText("No vulnerabilities match the search or filters."),
    ).toBeVisible();
  });

  test("a filter is sent to the server and can be removed", async ({
    page,
  }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoResults();
    await expect(vulns.cards).toHaveCount(4);

    await page.getByRole("button", { name: "Filters" }).click();
    await page
      .getByRole("menuitemcheckbox", { name: "Show policy excluded" })
      .click();
    await page.keyboard.press("Escape");

    await expect
      .poll(() => vulns.lastQuery().get("show_blacklisted"))
      .toBe("true");
    expect(vulns.lastQuery().get("active_filters")).toBe("show_blacklisted");

    await page
      .getByRole("button", {
        name: "Remove filter Policy status: Show policy excluded",
      })
      .click();
    await expect
      .poll(() => vulns.lastQuery().get("show_blacklisted"))
      .toBe("false");
  });

  test("the table sorts and pages on the server", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn({ findings: many });
    await vulns.gotoResults();
    await page.getByRole("tab", { name: "Table" }).click();

    await expect(vulns.rows()).toHaveCount(20);
    await expect(vulns.columnHeader("Severity")).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await expect(page.getByText("Showing 1 to 20 of 45")).toBeVisible();

    await vulns.sortButton("CVE").click();

    await expect(vulns.columnHeader("CVE")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(vulns.rows().first()).toContainText("CVE-2025-0001");
    expect(vulns.lastQuery().get("sort_by")).toBe("cve");
    expect(vulns.lastQuery().get("sort_direction")).toBe("ASC");

    await vulns.pagination().getByRole("button", { name: "Page 3" }).click();

    await expect(vulns.rows()).toHaveCount(5);
    await expect(vulns.rows().first()).toContainText("CVE-2025-0041");
    expect(vulns.lastQuery().get("page")).toBe("2");
    await expect(page.getByText("Showing 41 to 45 of 45")).toBeVisible();
  });

  test("the list pages on the server too", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn({ findings: many });
    await vulns.gotoResults();
    await expect(vulns.cards).toHaveCount(20);

    await vulns.pagination().getByRole("button", { name: "Next Page" }).click();

    await expect(vulns.cards.first()).toContainText("CVE-2025-");
    expect(vulns.lastQuery().get("page")).toBe("1");
    await expect(page.getByText("Showing 21 to 40 of 45")).toBeVisible();
  });

  test("while loading, skeletons stand in for the list", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    const release = await vulns.signIn({ hold: true });
    await vulns.gotoResults();

    await expect(
      page.getByRole("status", { name: "Loading vulnerabilities" }),
    ).toBeVisible();

    release();

    await expect(vulns.cards).toHaveCount(4);
  });

  test("Tab reaches search, filters, sort, view and the cards with visible focus", async ({
    page,
  }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoResults();
    await expect(vulns.cards).toHaveCount(4);

    await vulns.search.focus();
    await expectVisibleFocus(vulns.search);
    for (const target of [
      page.getByRole("button", { name: "Filters" }),
      page.getByRole("combobox", { name: "Sort by" }),
      page.getByRole("tab", { name: "List" }),
      page.getByRole("tabpanel", { name: "List" }),
      vulns.cards.first().getByRole("link", { name: "CVE-2024-0001" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }

    await page.getByRole("tab", { name: "List" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Table" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(vulns.rows()).toHaveCount(4);
    await vulns.sortButton("CVE").focus();
    await expectVisibleFocus(vulns.sortButton("CVE"));
  });

  test("the list passes axe and matches the screenshots", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoResults();
    await expect(vulns.cards).toHaveCount(4);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "vulnerabilities-list");
  });

  test("the table passes axe and matches the screenshots", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoResults();
    await page.getByRole("tab", { name: "Table" }).click();
    await expect(vulns.rows()).toHaveCount(4);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "vulnerabilities-table");
  });

  test("the empty and loading states pass axe", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    const release = await vulns.signIn({ findings: [], hold: true });
    await vulns.gotoResults();
    await expect(
      page.getByRole("status", { name: "Loading vulnerabilities" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);

    release();
    await expect(page.getByText("No vulnerabilities found.")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "vulnerabilities-empty");
  });
});

test.describe("Vulnerability details", () => {
  test("shows the severity in words, the CVSS metrics and the dependency", async ({
    page,
  }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoDetails();

    await expect(vulns.heading).toContainText("CVE-2024-0001");
    await expect(vulns.heading.locator("..")).toContainText("Critical 9.8");
    await expect(
      page.getByText("Prototype Pollution in", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Attack Vector: Network" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /npm \(opens in a new tab\)/ }),
    ).toHaveAttribute("href", "https://www.npmjs.com/package/lodash");

    await page.getByRole("button", { name: "Attack Vector: Network" }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "CVSS 3.1: Attack Vector",
    );
  });

  test("the versions dialog traps focus and closes with Escape", async ({
    page,
  }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoDetails();
    const open = page.getByRole("button", { name: "Compare versions" });

    await open.click();
    const dialog = page.getByRole("dialog", { name: "Dependency versions" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("4.17.20 (installed)");
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }
    await expectNoAxeViolations(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  });

  test("Tab moves from Back to the page actions with visible focus", async ({
    page,
  }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoDetails();
    await expect(vulns.heading).toContainText("CVE-2024-0001");

    const back = page.getByRole("button", { name: "Back to results" });
    await back.focus();
    await expectVisibleFocus(back);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("button", { name: "Add to Policy" }),
    );
    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("button", { name: "Compare versions" }),
    );
  });

  test("while loading, a skeleton stands in for the page", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    const release = await vulns.signIn({ hold: true });
    await vulns.gotoDetails();

    await expect(
      page.getByRole("status", { name: "Loading the vulnerability" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);

    release();
    await expect(vulns.heading).toContainText("CVE-2024-0001");
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoDetails();
    await expect(vulns.heading).toContainText("CVE-2024-0001");

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "vulnerability-details");
  });
});
