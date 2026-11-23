import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectMainSnapshot } from "./helpers/aria-snapshot.mjs";
import { expectPageSweep } from "./helpers/page-sweep.mjs";
import { describeOnAPhone } from "./helpers/phone.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";

// The body the API sends for a request that returns no data.
const okBody = { status_code: 200, status: "success" };

test.describe("Password reset request", () => {
  test("sends the reset request and says to check the email", async ({
    page,
  }) => {
    const bodies: unknown[] = [];
    await page.route("**/api/auth/request_password_reset", (route) => {
      bodies.push(route.request().postDataJSON());
      return route.fulfill({ json: okBody });
    });
    await page.goto("/password_reset_request");

    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
    await expect(page.getByText(/valid for 30 minutes/)).toBeVisible();
    expect(bodies).toEqual([{ email: "jane@example.com" }]);
    await expectNoAxeViolations(page);
    await expectPageSweep(page);
  });

  test("is reached from the sign in page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(page).toHaveURL(/\/password_reset_request$/);
    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/password_reset_request");
    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
    await expectPageSweep(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await page.goto("/password_reset_request");
    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
    await expectPageSweep(page);
    await expectMainSnapshot(page, "password-reset-request");
    await expectScreenshots(page, "password-reset-request");
  });

  describeOnAPhone("On a phone", () => {
    test("the request form fits without scrolling sideways", async ({
      page,
    }) => {
      await page.goto("/password_reset_request");
      await expect(
        page.getByRole("heading", { name: "Reset your password" }),
      ).toBeVisible();
      await expectPageSweep(page);
      await expectScreenshots(page, "password-reset-request");
    });
  });
});

test.describe("Password reset from the emailed link", () => {
  const resetUrl = "/email_action/reset_password?token=t1&userid=u1";

  test("sets the new password and sends the user to sign in", async ({
    page,
  }) => {
    const bodies: unknown[] = [];
    await page.route("**/api/auth/password_reset", (route) => {
      bodies.push(route.request().postDataJSON());
      return route.fulfill({ json: okBody });
    });
    await page.goto(resetUrl);

    await page.getByLabel("New password", { exact: true }).fill("NewPass4567!");
    await page.getByLabel("Confirm new password").fill("NewPass4567!");
    await page.getByRole("button", { name: "Update password" }).click();

    await expect(page).toHaveURL(/\/login\?notice=password_reset$/);
    await expect(
      page.getByText(
        "Your password was changed. Sign in with your new password.",
      ),
    ).toBeVisible();
    expect(bodies).toEqual([
      {
        new_password: "NewPass4567!",
        new_password_confirmation: "NewPass4567!",
        token: "t1",
        user_id_hash: "u1",
      },
    ]);
    await expectNoAxeViolations(page);
    await expectPageSweep(page);
  });

  test("offers a new link when this one expired", async ({ page }) => {
    await page.route("**/api/auth/password_reset", (route) =>
      route.fulfill({
        status: 400,
        json: {
          error_code: "PasswordResetTokenInvalidOrExpired",
          error_message: "Expired",
        },
      }),
    );
    await page.goto(resetUrl);

    await page.getByLabel("New password", { exact: true }).fill("NewPass4567!");
    await page.getByLabel("Confirm new password").fill("NewPass4567!");
    await page.getByRole("button", { name: "Update password" }).click();

    await expect(
      page.getByRole("heading", { name: "Reset link expired" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Request a new password reset" })
      .click();
    await expect(page).toHaveURL(/\/password_reset_request$/);
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto(resetUrl);
    await expect(
      page.getByRole("heading", { name: "Choose a new password" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
    await expectPageSweep(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await page.goto(resetUrl);
    await expect(
      page.getByRole("heading", { name: "Choose a new password" }),
    ).toBeVisible();
    await expectPageSweep(page);
    await expectMainSnapshot(page, "password-reset-form");
    await expectScreenshots(page, "password-reset-form");
  });

  describeOnAPhone("On a phone", () => {
    test("the new password form fits without scrolling sideways", async ({
      page,
    }) => {
      await page.goto(resetUrl);
      await expect(
        page.getByRole("heading", { name: "Choose a new password" }),
      ).toBeVisible();
      await expectPageSweep(page);
      await expectScreenshots(page, "password-reset-form");
    });
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
    await expectPageSweep(page);
    await expectMainSnapshot(page, "registration-confirmed");
    await expectScreenshots(page, "registration-confirmed");
    const signIn = page.getByRole("link", { name: "Go to sign in" });
    await signIn.focus();
    await expectVisibleFocus(signIn);
    await signIn.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("sends the token and user id hash under the names the API validates", async ({
    page,
  }) => {
    await answerConfirmation(page, true);
    const request = page.waitForRequest("**/api/users/confirm_registration");
    await page.goto(confirmUrl);
    expect((await request).postDataJSON()).toEqual({
      token: "t1",
      user_id_hash: "u1",
    });
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
    await expectPageSweep(page);
  });

  test("an unknown email link opens the registration confirmation", async ({
    page,
  }) => {
    await answerConfirmation(page, true);
    await page.goto("/email_action/unknown_page?token=t1&userid=u1");
    await expect(
      page.getByRole("heading", { name: /registration confirmed/i }),
    ).toBeVisible();
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
    await expectPageSweep(page);
  });

  describeOnAPhone("On a phone", () => {
    test("the confirmation fits without scrolling sideways", async ({
      page,
    }) => {
      await pauseClock(page);
      await answerConfirmation(page, true);
      await page.goto(confirmUrl);
      await expect(
        page.getByRole("heading", { name: /registration confirmed/i }),
      ).toBeVisible();
      await expectPageSweep(page);
      await expectScreenshots(page, "registration-confirmed");
    });
  });
});
