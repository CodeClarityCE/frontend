import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectMainSnapshot } from "./helpers/aria-snapshot.mjs";
import { expectPageSweep } from "./helpers/page-sweep.mjs";
import { describeOnAPhone } from "./helpers/phone.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { expectTheme } from "./helpers/theme.mjs";
import { AuthPage } from "./pages/auth.page.mjs";

test.describe("Authentication E2E Tests", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test.describe("Login Page", () => {
    test("should display login form", async () => {
      await authPage.goto();
      await authPage.expectFormVisible();
    });

    test("should have correct page title", async ({ page }) => {
      await authPage.goto();
      await expect(
        page.getByRole("heading", { name: /sign in/i }),
      ).toBeVisible();
    });

    test("should show validation errors for empty form submission", async () => {
      await authPage.goto();
      await authPage.expectFormVisible();

      // Click submit without filling form
      await authPage.loginButton.click();

      // Should show validation messages (vee-validate)
      await authPage.expectValidationMessage();
    });

    test("should show validation error for invalid email", async ({ page }) => {
      await authPage.goto();

      await authPage.emailInput.fill("invalid-email");
      await authPage.emailInput.blur();

      // Wait for validation message
      await expect(page.getByText("Enter a valid email address")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should accept valid form inputs", async () => {
      await authPage.goto();

      await authPage.emailInput.fill("test@example.com");
      await authPage.passwordInput.fill("ValidPassword123!");

      // Form should be submittable (button not disabled)
      await expect(authPage.loginButton).toBeEnabled();
    });
  });

  test.describe("Failed sign in", () => {
    const rejectWith = (page: Page, error_code: string) =>
      page.route("**/api/auth/authenticate", (route) =>
        route.fulfill({
          status: 400,
          json: {
            status_code: 400,
            status: "failure",
            error_code,
            error_message: "Rejected",
          },
        }),
      );

    test("a double click on Sign in sends one request", async ({ page }) => {
      let sent = 0;
      await page.route("**/api/auth/authenticate", (route) => {
        sent++;
        return route.fulfill({
          status: 400,
          json: {
            status_code: 400,
            status: "failure",
            error_code: "WrongCredentials",
            error_message: "Rejected",
          },
        });
      });
      await authPage.goto();
      await authPage.emailInput.fill("john.doe@codeclarity.io");
      await authPage.passwordInput.fill("WrongPassword123!");
      await authPage.loginButton.dblclick();

      await expect(page.getByRole("alert")).toBeVisible();
      expect(sent).toBe(1);
    });

    test("keeps the email and says the credentials are wrong", async ({
      page,
    }) => {
      await rejectWith(page, "WrongCredentials");
      await authPage.goto();
      await authPage.login("john.doe@codeclarity.io", "WrongPassword123!");
      await expect(authPage.authError).toContainText(
        "The email or password is incorrect",
      );
      await expect(authPage.emailInput).toHaveValue("john.doe@codeclarity.io");
    });

    test("does not point at social buttons that are not shown", async ({
      page,
    }) => {
      await rejectWith(page, "CannotPerformActionOnSocialAccount");
      await authPage.goto();
      await authPage.login("john.doe@codeclarity.io", "WrongPassword123!");
      await expect(authPage.authError).toContainText(
        "This account signs in with GitHub or GitLab",
      );
      await expect(authPage.authError).not.toContainText(/button/i);
    });

    test("sends a short existing password to the server", async ({ page }) => {
      await rejectWith(page, "WrongCredentials");
      await authPage.goto();
      const request = page.waitForRequest("**/api/auth/authenticate");
      await authPage.login("john.doe@codeclarity.io", "short");
      expect((await request).postDataJSON()).toEqual({
        email: "john.doe@codeclarity.io",
        password: "short",
      });
    });

    test("explains empty and malformed fields in plain words", async ({
      page,
    }) => {
      await authPage.goto();
      await authPage.loginButton.click();
      await expect(page.getByText("Enter your email")).toBeVisible();
      await expect(page.getByText("Enter your password")).toBeVisible();
      await authPage.emailInput.fill("not-an-email");
      await authPage.loginButton.click();
      await expect(page.getByText("Enter a valid email address")).toBeVisible();
      await expect(page.getByText(/Required|Invalid email/)).toHaveCount(0);
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("should support tab navigation through form fields", async ({
      page,
    }) => {
      await authPage.goto();

      // Focus on email input
      await authPage.emailInput.focus();
      await expectVisibleFocus(authPage.emailInput);

      // Tab to password
      await page.keyboard.press("Tab");
      await expectVisibleFocus(authPage.passwordInput);

      // Tab to submit button
      await page.keyboard.press("Tab");
      await expectVisibleFocus(authPage.loginButton);
    });

    test("should allow Enter key in password field", async () => {
      await authPage.goto();

      await authPage.emailInput.fill("test@example.com");
      await authPage.passwordInput.fill("ValidPassword123!");

      // Verify Enter key is accepted (doesn't throw)
      await authPage.passwordInput.press("Enter");

      // Form should respond (either submit or show loading/error)
      // Just verify page didn't crash
      await expect(authPage.emailInput).toBeVisible();
    });
  });

  test.describe("Identity and navigation", () => {
    test("shows the CodeClarity logo with alternative text", async ({
      page,
    }) => {
      await authPage.goto();
      await expect(
        page.getByRole("img", { name: "CodeClarity" }).first(),
      ).toBeVisible();
    });

    test("links to password reset", async ({ page }) => {
      await authPage.goto();
      await authPage.forgotPasswordLink.click();
      await expect(page).toHaveURL(/\/password_reset_request$/);
    });

    test("links to sign up", async ({ page }) => {
      await authPage.goto();
      await authPage.signupLink.click();
      await expect(page).toHaveURL(/\/signup$/);
    });

    test("keyboard reaches every control in order with a visible focus", async ({
      page,
    }) => {
      await authPage.goto();
      await authPage.emailInput.focus();
      for (const control of [
        authPage.passwordInput,
        authPage.loginButton,
        authPage.forgotPasswordLink,
        authPage.signupLink,
      ]) {
        await page.keyboard.press("Tab");
        await expectVisibleFocus(control);
      }
    });
  });

  test.describe("Accessibility and visuals", () => {
    test("has no WCAG 2.2 AA violations", async ({ page }) => {
      await authPage.goto();
      await authPage.expectFormVisible();
      await expectNoAxeViolations(page);
    });

    test("matches the approved screenshots", async ({ page }) => {
      await authPage.goto();
      await authPage.expectFormVisible();
      await expectPageSweep(page);
      await expectMainSnapshot(page, "login");
      await expectScreenshots(page, "login");
    });

    test("matches the dark screenshots", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await authPage.goto();
      await authPage.expectFormVisible();
      await expectTheme(page, "dark");
      await expectPageSweep(page);
      await expectScreenshots(page, "login-dark");
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await authPage.goto();

      await authPage.expectFormVisible();
    });

    test("should display correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await authPage.goto();

      await authPage.expectFormVisible();
    });
  });
});

test.describe("Sign up", () => {
  const field = (page: Page, name: string, opts?: { exact?: boolean }) =>
    page.getByLabel(name, opts);

  test("asks for the account details under a clear heading", async ({
    page,
  }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: /create your codeclarity account/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "CodeClarity" }).first(),
    ).toBeVisible();
  });

  test("links back to sign in", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("the logo leads to the login page", async ({ page }) => {
    await page.goto("/signup");
    await page
      .getByRole("banner")
      .getByRole("link", { name: "CodeClarity" })
      .click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("keyboard reaches every control in order with a visible focus", async ({
    page,
  }) => {
    await page.goto("/signup");
    await field(page, "Email").focus();
    for (const control of [
      field(page, "First name"),
      field(page, "Last name"),
      field(page, "Handle"),
      field(page, "Password", { exact: true }),
      field(page, "Confirm password"),
      page.getByRole("checkbox"),
      page.getByRole("link", { name: "Terms of service" }).first(),
      page.getByRole("link", { name: "Privacy policy" }).first(),
      page.getByRole("button", { name: "Create account" }),
      page.getByRole("link", { name: "Sign in" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(control);
    }
  });

  test("keeps every entry except the passwords after a failed sign up", async ({
    page,
  }) => {
    await page.route("**/api/auth/register", (route) =>
      route.fulfill({
        status: 409,
        json: {
          status_code: 409,
          status: "failure",
          error_code: "EmailAlreadyExists",
          error_message: "Exists",
        },
      }),
    );
    await page.goto("/signup");
    await field(page, "Email").fill("jane@example.com");
    await field(page, "First name").fill("Jane");
    await field(page, "Last name").fill("Doe");
    await field(page, "Handle").fill("janedoe");
    await field(page, "Password", { exact: true }).fill("ThisIs4Str0ng!");
    await field(page, "Confirm password").fill("ThisIs4Str0ng!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.locator('div[role="alert"]')).toContainText(
      "An account with this email already exists",
    );
    await expect(field(page, "Email")).toHaveValue("jane@example.com");
    await expect(field(page, "First name")).toHaveValue("Jane");
    await expect(field(page, "Last name")).toHaveValue("Doe");
    await expect(field(page, "Handle")).toHaveValue("janedoe");
    await expect(page.getByRole("checkbox")).toBeChecked();
  });

  test("a double click on Create account sends one request", async ({
    page,
  }) => {
    let sent = 0;
    await page.route("**/api/auth/register", (route) => {
      sent++;
      return route.fulfill({
        status: 409,
        json: {
          status_code: 409,
          status: "failure",
          error_code: "EmailAlreadyExists",
          error_message: "Exists",
        },
      });
    });
    await page.goto("/signup");
    await field(page, "Email").fill("jane@example.com");
    await field(page, "First name").fill("Jane");
    await field(page, "Last name").fill("Doe");
    await field(page, "Handle").fill("janedoe");
    await field(page, "Password", { exact: true }).fill("ThisIs4Str0ng!");
    await field(page, "Confirm password").fill("ThisIs4Str0ng!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).dblclick();

    await expect(page.locator('div[role="alert"]')).toContainText(
      "An account with this email already exists",
    );
    expect(sent).toBe(1);
  });

  test("explains each field in plain words", async ({ page }) => {
    await page.goto("/signup");
    await field(page, "Email").fill("jane");
    await field(page, "First name").fill("J");
    await field(page, "Handle").fill("jd");
    await field(page, "Password", { exact: true }).fill("short");
    await field(page, "Confirm password").fill("other");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("At least 2 characters").first()).toBeVisible();
    await expect(page.getByText("At least 5 characters")).toBeVisible();
    await expect(page.getByText("At least 10 characters")).toBeVisible();
    await expect(page.getByText("The passwords do not match")).toBeVisible();
    await expect(page.getByText(/String must contain/)).toHaveCount(0);
  });

  test("shows validation messages when submitted empty", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByText("Enter your email")).toBeVisible();
    await expect(page.getByText("Required")).toHaveCount(0);
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/signup");
    await expect(field(page, "Email")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await page.goto("/signup");
    await expect(field(page, "Email")).toBeVisible();
    await expectPageSweep(page);
    await expectMainSnapshot(page, "signup");
    await expectScreenshots(page, "signup");
  });
});

describeOnAPhone("On a phone", () => {
  test("the sign up page does not scroll sideways", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    await expectPageSweep(page);
    await expectScreenshots(page, "sign-up-page");
  });
});
