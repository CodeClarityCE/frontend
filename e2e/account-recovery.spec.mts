import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";

// The body the API sends for a request that returns no data.
const okBody = { status_code: 200, status: "success" };

// Password reset is not built on the server yet, so both pages say so plainly.
for (const entry of [
  { name: "request page", url: "/password_reset_request" },
  {
    name: "emailed link",
    url: "/email_action/reset_password?token=t1&userid=u1",
  },
]) {
  test.describe(`Password reset ${entry.name}`, () => {
    test("says the feature is unavailable and sends nothing", async ({
      page,
    }) => {
      const calls: string[] = [];
      await page.route("**/api/auth/**password_reset", (route) => {
        calls.push(route.request().url());
        return route.abort();
      });
      await page.goto(entry.url);

      await expect(
        page.getByRole("heading", { name: "Password reset is not available" }),
      ).toBeVisible();
      await expect(
        page.getByText(/ask an administrator of your organisation/i),
      ).toBeVisible();
      await expect(page.getByLabel("Email")).toHaveCount(0);
      await expect(page.getByLabel(/new password/i)).toHaveCount(0);
      expect(calls).toEqual([]);

      await page.getByRole("link", { name: "Back to sign in" }).click();
      await expect(page).toHaveURL(/\/login$/);
    });

    test("has no WCAG 2.2 AA violations", async ({ page }) => {
      await page.goto(entry.url);
      await expect(
        page.getByRole("heading", { name: "Password reset is not available" }),
      ).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });
}

test("the unavailable password reset matches the approved screenshots", async ({
  page,
}) => {
  await page.goto("/password_reset_request");
  await expect(
    page.getByRole("heading", { name: "Password reset is not available" }),
  ).toBeVisible();
  await expectScreenshots(page, "password-reset-unavailable");
});

test.describe("Registration confirmation", () => {
  const confirmUrl = "/email_action/confirm_registration?token=t1&userid=u1";

  const answerConfirmation = (page: Page, ok: boolean) =>
    page.route("**/api/users/confirm_registration", (route) =>
      route.fulfill(
        ok
          ? { json: okBody }
          : {
              status: 400,
              json: { error_code: "EntityNotFound", error_message: "Missing" },
            },
      ),
    );

  // Pauses the clock, so the redirect countdown waits for the checks.
  async function pauseClock(page: Page): Promise<void> {
    const start = new Date("2026-01-01T00:00:00Z");
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start);
  }

  test("confirms the registration and links to sign in", async ({ page }) => {
    await pauseClock(page);
    await answerConfirmation(page, true);
    await page.goto(confirmUrl);
    await expect(
      page.getByRole("heading", { name: /registration confirmed/i }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      /redirecting to sign in in 5 seconds/i,
    );
    await expectScreenshots(page, "registration-confirmed");
    const signIn = page.getByRole("link", { name: "Go to sign in" });
    await signIn.focus();
    await expectVisibleFocus(signIn);
    await signIn.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("redirects to sign in after the countdown", async ({ page }) => {
    await pauseClock(page);
    await answerConfirmation(page, true);
    await page.goto(confirmUrl);
    await expect(page.getByRole("status")).toContainText(/5 seconds/);
    await page.clock.runFor(5_000);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("has no WCAG 2.2 AA violations once confirmed", async ({ page }) => {
    await answerConfirmation(page, true);
    await page.goto(confirmUrl);
    await expect(
      page.getByRole("heading", { name: /registration confirmed/i }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("explains a failed confirmation", async ({ page }) => {
    await answerConfirmation(page, false);
    await page.goto(confirmUrl);
    await expect(
      page.getByRole("heading", {
        name: /we could not confirm your registration/i,
      }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
