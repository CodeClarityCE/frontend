import { test, expect, type Page } from "@playwright/test";
import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { seedAuthStore } from "./helpers/auth-store.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
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
      await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 });
    });

    test("should show validation error for short password", async ({
      page,
    }) => {
      await authPage.goto();

      await authPage.passwordInput.fill("short");
      await authPage.passwordInput.blur();

      // Password validation requires at least 10 characters
      await expect(page.getByText(/at least|too short|minimum/i)).toBeVisible({
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

  test.describe("Login Flow", () => {
    test("should display error message on failed login", async ({ page }) => {
      await authPage.goto();

      // Mock failed auth response
      await page.route("**/api/v1/auth/login", (route) =>
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error_code: "WrongCredentials",
            message: "Wrong credentials",
          }),
        }),
      );

      await authPage.login("wrong@example.com", "WrongPassword123!");

      // Should show error message (either in alert or text)
      await expect(page.getByText(/wrong|invalid|error/i).first()).toBeVisible({
        timeout: 5000,
      });
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

    test("should allow Enter key in password field", async ({ page }) => {
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

    test("links to password recovery", async ({ page }) => {
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
      await expectScreenshots(page, "login");
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

  test("shows validation messages when submitted empty", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByText("Required").first()).toBeVisible();
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/signup");
    await expect(field(page, "Email")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await page.goto("/signup");
    await expect(field(page, "Email")).toBeVisible();
    await expectScreenshots(page, "signup");
  });
});

test.describe("Social account setup", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStore(page);
    await page.goto("/signup?provider=GITHUB");
  });

  test("names the provider and asks for the missing details", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /finish setting up your account/i }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: "GitHub" })).toBeVisible();
    await expect(page.getByLabel("First name")).toBeVisible();
    await expect(page.getByLabel("Handle")).toBeVisible();
  });

  test("requires the terms to be accepted", async ({ page }) => {
    await page.getByRole("button", { name: "Complete account setup" }).click();
    await expect(
      page.getByText("You must accept our terms and conditions to continue"),
    ).toBeVisible();
  });

  test("keyboard reaches every control with a visible focus", async ({
    page,
  }) => {
    await page.getByLabel("First name").focus();
    for (const control of [
      page.getByLabel("Last name"),
      page.getByLabel("Handle"),
      page.getByRole("checkbox"),
      page.getByRole("link", { name: "Terms of service" }).first(),
      page.getByRole("link", { name: "Privacy policy" }).first(),
      page.getByRole("button", { name: "Complete account setup" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(control);
    }
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await expect(page.getByLabel("First name")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("matches the approved screenshots", async ({ page }) => {
    await expect(page.getByLabel("First name")).toBeVisible();
    await expectScreenshots(page, "social-setup");
  });
});

test.describe("OAuth callback", () => {
  const callback = "/auth/github/callback?state=s1&code=c1";

  test("returns to sign in when the state does not match", async ({ page }) => {
    await seedAuthStore(page, { socialAuthState: "other" });
    await page.goto(callback);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows progress while signing in", async ({ page }) => {
    await seedAuthStore(page, { socialAuthState: "s1" });
    await page.route("**/api/auth/github/finalize", () => {
      // Never answers, so the page stays in progress.
    });
    await page.goto(callback);
    await expect(
      page.getByRole("status").getByText(/signing you in with github/i),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test.describe("when the provider rejects the sign in", () => {
    test.beforeEach(async ({ page }) => {
      await seedAuthStore(page, { socialAuthState: "s1" });
      await page.route("**/api/auth/github/finalize", (route) =>
        route.fulfill({
          status: 400,
          json: {
            error_code: "FailedToAuthenticateSocialAccount",
            error_message: "Failed",
          },
        }),
      );
      await page.goto(callback);
    });

    test("explains the failure and offers a way back", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /github sign in failed/i }),
      ).toBeVisible();
      await expect(
        page.getByText("FailedToAuthenticateSocialAccount"),
      ).toBeVisible();
      const back = page.getByRole("button", { name: "Back to sign in" });
      await back.focus();
      await expectVisibleFocus(back);
      await back.click();
      await expect(page).toHaveURL(/\/login$/);
    });

    test("has no WCAG 2.2 AA violations", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Back to sign in" }),
      ).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test("matches the approved screenshots", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Back to sign in" }),
      ).toBeVisible();
      await expectScreenshots(page, "oauth-callback-error");
    });
  });
});
