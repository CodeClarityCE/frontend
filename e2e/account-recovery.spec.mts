import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";

// The body the API sends for a request that returns no data.
const okBody = { status_code: 200, status: "success" };

test.describe("Password reset request", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/password_reset_request");
  });

  test("asks for the account email", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /reset your password/i }),
    ).toBeVisible();
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Please enter a valid email")).toBeVisible();
  });

  test("confirms the email was sent", async ({ page }) => {
    await page.route("**/api/auth/request_password_reset", (route) =>
      route.fulfill({ json: okBody }),
    );
    await page.getByLabel("Email").fill("john.doe@codeclarity.io");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(
      page.getByRole("heading", { name: /check your email/i }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "password-reset-request-sent");
    await page.getByRole("link", { name: "Back to sign in" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("keyboard reaches every control in order with a visible focus", async ({
    page,
  }) => {
    await page.getByLabel("Email").focus();
    for (const control of [
      page.getByRole("button", { name: "Send reset link" }),
      page.getByRole("link", { name: "Back to sign in" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(control);
    }
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expectScreenshots(page, "password-reset-request");
  });
});

test.describe("Password reset", () => {
  const resetUrl = "/email_action/reset_password?token=t1&userid=u1";

  test.beforeEach(async ({ page }) => {
    await page.goto(resetUrl);
  });

  test("asks for a new password twice and checks they match", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /choose a new password/i }),
    ).toBeVisible();
    await page
      .getByLabel("New password", { exact: true })
      .fill("ThisIs4Str0ngP4ss");
    await page.getByLabel("Confirm new password").fill("SomethingElse12");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Passwords must match")).toBeVisible();
  });

  test("confirms the update and links to sign in", async ({ page }) => {
    await page.route("**/api/auth/password_reset", (route) =>
      route.fulfill({ json: okBody }),
    );
    await page
      .getByLabel("New password", { exact: true })
      .fill("ThisIs4Str0ngP4ss");
    await page.getByLabel("Confirm new password").fill("ThisIs4Str0ngP4ss");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(
      page.getByRole("heading", { name: /password updated/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to sign in" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("explains an expired link and offers a new one", async ({ page }) => {
    await page.route("**/api/auth/password_reset", (route) =>
      route.fulfill({
        status: 400,
        json: {
          error_code: "PasswordResetTokenInvalidOrExpired",
          error_message: "Expired",
        },
      }),
    );
    await page
      .getByLabel("New password", { exact: true })
      .fill("ThisIs4Str0ngP4ss");
    await page.getByLabel("Confirm new password").fill("ThisIs4Str0ngP4ss");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(
      page.getByRole("heading", { name: /reset link expired/i }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "password-reset-expired");
    await page
      .getByRole("link", { name: "Request a new password reset" })
      .click();
    await expect(page).toHaveURL(/\/password_reset_request$/);
  });

  test("keyboard reaches every control in order with a visible focus", async ({
    page,
  }) => {
    await page.getByLabel("New password", { exact: true }).focus();
    for (const control of [
      page.getByLabel("Confirm new password"),
      page.getByRole("button", { name: "Update password" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(control);
    }
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await expect(
      page.getByLabel("New password", { exact: true }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await expect(
      page.getByLabel("New password", { exact: true }),
    ).toBeVisible();
    await expectScreenshots(page, "password-reset");
  });
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
