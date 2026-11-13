import { expect, test } from "@playwright/test";

import user from "./fixtures/user.json" with { type: "json" };
import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { seedAuthStore } from "./helpers/auth-store.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";

test.describe("Not found page", () => {
  test("an unknown address lands on the owl's not found page", async ({
    page,
  }) => {
    await page.goto("/this/does/not/exist");
    await expect(page).toHaveURL(/\/404$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /page not found/i }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: /owl/i })).toBeVisible();
  });

  test("offers a way back and a way home by keyboard", async ({ page }) => {
    await page.goto("/login");
    await page.goto("/404");
    const back = page.getByRole("button", { name: "Go back" });
    const home = page.getByRole("link", { name: "Go to the dashboard" });
    await back.focus();
    await expectVisibleFocus(back);
    await page.keyboard.press("Tab");
    await expectVisibleFocus(home);
    await back.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/404");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await page.goto("/404");
    await expect(page.getByRole("img", { name: /owl/i })).toBeVisible();
    await expectScreenshots(page, "not-found");
  });
});

for (const doc of [
  { path: "/terms", heading: /terms of service/i, name: "terms" },
  {
    path: "/privacy",
    heading: /gestion des données personnelles/i,
    name: "privacy",
  },
]) {
  test.describe(`Document page ${doc.path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(doc.path);
      await expect(
        page.getByRole("heading", { level: 1, name: doc.heading }),
      ).toBeVisible();
    });

    test("shows the CodeClarity logo and a way back", async ({ page }) => {
      await expect(
        page.getByRole("img", { name: "CodeClarity" }).first(),
      ).toBeVisible();
      const back = page.getByRole("button", { name: "Go back" });
      await back.focus();
      await expectVisibleFocus(back);
    });

    test("has no WCAG 2.2 AA violations", async ({ page }) => {
      await expectNoAxeViolations(page);
    });

    test("matches the approved screenshots", async ({ page }) => {
      await expectScreenshots(page, doc.name);
    });
  });
}

test.describe("Help page", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStore(page, { authenticated: true });
    await page.route("**/api/**", (route) => {
      if (route.request().url().endsWith("/auth/user")) {
        return route.fulfill({ json: { data: user } });
      }
      return route.fulfill({
        json: {
          data: [],
          page: 0,
          entry_count: 0,
          entries_per_page: 0,
          total_entries: 0,
          total_pages: 0,
          matching_count: 0,
          filter_count: {},
        },
      });
    });
    await page.goto("/help");
    await expect(
      page.getByRole("heading", { level: 1, name: /help/i }),
    ).toBeVisible();
  });

  test("answers a question when it is opened by keyboard", async ({ page }) => {
    const question = page.getByRole("button", {
      name: "Does SCA find non-disclosed vulnerabilities?",
    });
    await question.focus();
    await expectVisibleFocus(question);
    await expect(question).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByText(/SCA is a process that relies on the disclosure/),
    ).toBeVisible();
  });

  test("has no WCAG 2.2 AA violations in the page content", async ({
    page,
  }) => {
    await expectNoAxeViolations(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await expectScreenshots(page, "help");
  });
});
