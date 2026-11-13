import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { ShellPage } from "./pages/shell.page.mjs";

const notifications = [
  {
    id: "n-1",
    title: "Vulnerabilities in web-frontend",
    description: "The latest analysis found 5 vulnerabilities.",
    type: "warning",
    content_type: "vuln_summary",
    content: {
      project_name: "web-frontend",
      max_severity: "CRITICAL",
      severity_counts: { CRITICAL: 2, HIGH: 3 },
      total: 5,
    },
  },
  {
    id: "n-2",
    title: "vue can be updated",
    description: "A newer minor version of vue is out.",
    type: "info",
    content_type: "package_update",
    content: {
      package_name: "vue",
      project_name: "web-frontend",
      current_version: "3.4.0",
      new_version: "3.5.0",
      dependency_type: "production",
    },
  },
  {
    id: "n-3",
    title: "vitest can be updated",
    description: "A newer minor version of vitest is out.",
    type: "info",
    content_type: "package_update",
    content: {
      package_name: "vitest",
      current_version: "3.0.0",
      new_version: "3.1.0",
      dependency_type: "development",
    },
  },
];

test.describe("Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    const shell = new ShellPage(page);
    await shell.signIn();
    await page.route(/\/api\/notifications(\?|$)/, (route) =>
      route.fulfill({
        json: {
          data: notifications,
          page: 0,
          entry_count: 3,
          entries_per_page: 100,
          total_entries: 3,
          total_pages: 1,
          matching_count: 3,
          filter_count: {},
          status: "success",
        },
      }),
    );
    await shell.goto();
    await page.getByRole("button", { name: "Notifications" }).click();
  });

  test("shows vulnerability counts with severity in words", async ({
    page,
  }) => {
    const dialog = page.getByRole("dialog", { name: "Notifications" });
    const summary = dialog
      .getByRole("listitem")
      .filter({ hasText: "Vulnerabilities in web-frontend" });

    await expect(summary).toContainText("Highest severity Critical");
    await expect(summary).toContainText("Critical 2");
    await expect(summary).toContainText("High 3");

    // Let the dialog finish fading in before checking contrast.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "notifications-dialog");
  });

  test("filters notifications by type", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Notifications" });
    await expect(dialog.getByRole("listitem")).toHaveCount(3);

    await dialog
      .getByRole("combobox", { name: "Filter notifications" })
      .click();
    await page.getByRole("option", { name: "Production (1)" }).click();

    await expect(dialog.getByRole("listitem")).toHaveCount(1);
    await expect(dialog.getByRole("listitem")).toContainText(
      "vue can be updated",
    );
  });
});
