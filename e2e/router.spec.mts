import { expect, test } from "@playwright/test";

import user from "./fixtures/user.json" with { type: "json" };
import { seedAuthStore } from "./helpers/auth-store.mjs";
import { AuthPage } from "./pages/auth.page.mjs";
import { ShellPage } from "./pages/shell.page.mjs";

const defaultOrg = {
  id: "org-123",
  name: "Test Organization",
  color_scheme: "1",
  description: "Test org",
  role: 0,
  personal: false,
  created_on: "2024-01-01T00:00:00Z",
  number_of_members: 1,
  organizationMemberships: [],
  joined_on: "2024-01-01T00:00:00Z",
};

test.describe("Signed in on public and callback pages", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
  });

  for (const path of [
    "/terms",
    "/privacy",
    "/404",
    "/tickets/integrations/clickup/callback",
  ]) {
    test(`the shell names the user and organisation on ${path}`, async ({
      page,
    }) => {
      await shell.goto(path);
      await expect(
        page.getByRole("button", { name: /switch organisation/ }),
      ).toContainText("Test Organization");
      await expect(
        page.getByRole("button", { name: /account menu/ }),
      ).toContainText("John Doe");
    });
  }

  for (const path of [
    "/email_action/confirm_registration?token=t&userid=u",
    "/password_reset_request",
    "/email_action/reset_password?token=t&userid=u",
  ]) {
    test(`${path} shows the logged-out layout without the app shell`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("img", { name: "CodeClarity" }).first(),
      ).toBeVisible();
      await expect(shell.nav).toHaveCount(0);
    });
  }
});

test.describe("Public pages with a trailing slash", () => {
  for (const { path, heading } of [
    { path: "/login/", heading: /sign in/i },
    { path: "/signup/", heading: /create your codeclarity account/i },
    { path: "/signup/github", heading: /create your codeclarity account/i },
    { path: "/signup/gitlab/", heading: /create your codeclarity account/i },
    { path: "/password_reset_request/", heading: /./ },
    { path: "/terms/", heading: /terms of service/i },
    { path: "/privacy/", heading: /gestion des données personnelles/i },
    { path: "/404/", heading: /page not found/i },
  ]) {
    test(`${path} opens without signing in`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(path);
    });
  }
});

test.describe("Deep links through login", () => {
  // The account menu checked at the end sits in the desktop sidebar.
  test.use({ viewport: { width: 1280, height: 1024 } });

  test("lands on the requested page after signing in", async ({ page }) => {
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/authenticate")) {
        const expiry = new Date(Date.now() + 86_400_000).toISOString();
        return route.fulfill({
          json: {
            data: {
              token: "t",
              token_expiry: expiry,
              refresh_token: "t",
              refresh_token_expiry: expiry,
            },
          },
        });
      }
      if (path.endsWith("/auth/user")) {
        return route.fulfill({ json: { data: user } });
      }
      if (path.endsWith("/org/org-123")) {
        return route.fulfill({ json: { data: defaultOrg } });
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

    await page.goto("/settings/account?tab=1");
    await expect(page).toHaveURL(/\/login\?redirect=/);

    const auth = new AuthPage(page);
    await auth.loginWithValidCredentials();

    await expect(page).toHaveURL(/\/settings\/account\?tab=1$/);
    await expect(
      page.getByRole("button", { name: /account menu/ }),
    ).toContainText("John Doe");
  });

  test("ignores a redirect to another site", async ({ page }) => {
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/authenticate")) {
        const expiry = new Date(Date.now() + 86_400_000).toISOString();
        return route.fulfill({
          json: {
            data: {
              token: "t",
              token_expiry: expiry,
              refresh_token: "t",
              refresh_token_expiry: expiry,
            },
          },
        });
      }
      if (path.endsWith("/auth/user")) {
        return route.fulfill({ json: { data: user } });
      }
      if (path.endsWith("/org/org-123")) {
        return route.fulfill({ json: { data: defaultOrg } });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto("/login?redirect=//example.com/x");
    await new AuthPage(page).loginWithValidCredentials();

    await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
  });
});

test.describe("Messages on the login page", () => {
  test("a reset link without a token explains what happened", async ({
    page,
  }) => {
    await page.goto("/email_action/reset_password");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toContainText(
      /password reset link is incomplete/i,
    );
  });
});

test.describe("Unactivated accounts", () => {
  test("a returning unactivated user is told to confirm the registration", async ({
    page,
  }) => {
    await seedAuthStore(page, { authenticated: true });
    await page.route("**/api/**", (route) =>
      route.fulfill({
        status: 400,
        json: { error_code: "AccountNotActivated", error_message: "No" },
      }),
    );
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toContainText(
      /account is not activated yet/i,
    );
  });

  test("signing in to an unactivated account explains the state", async ({
    page,
  }) => {
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/authenticate")) {
        const expiry = new Date(Date.now() + 86_400_000).toISOString();
        return route.fulfill({
          json: {
            data: {
              token: "t",
              token_expiry: expiry,
              refresh_token: "t",
              refresh_token_expiry: expiry,
            },
          },
        });
      }
      return route.fulfill({
        status: 400,
        json: { error_code: "AccountNotActivated", error_message: "No" },
      });
    });
    await page.goto("/login");
    await new AuthPage(page).loginWithValidCredentials();
    await expect(page).toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/trial/);
    await expect(page.getByRole("alert").first()).toContainText(
      /account is not activated yet/i,
    );
  });
});

test.describe("Document titles", () => {
  for (const { path, title } of [
    { path: "/login", title: "Sign in | CodeClarity" },
    { path: "/signup", title: "Sign up | CodeClarity" },
    { path: "/password_reset_request", title: "Reset password | CodeClarity" },
    { path: "/terms", title: "Terms of service | CodeClarity" },
    { path: "/privacy", title: "Privacy policy | CodeClarity" },
    { path: "/404", title: "Page not found | CodeClarity" },
  ]) {
    test(`signed out, ${path} is titled "${title}"`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    });
  }

  for (const { path, title } of [
    { path: "/", title: "Dashboard | CodeClarity" },
    { path: "/projects", title: "Projects | CodeClarity" },
    { path: "/projects/add", title: "Add a Project | CodeClarity" },
    { path: "/datasets", title: "Datasets | CodeClarity" },
    { path: "/experiments/add", title: "New Experiment | CodeClarity" },
    { path: "/tickets", title: "Tickets | CodeClarity" },
    { path: "/settings/account", title: "Account settings | CodeClarity" },
    { path: "/orgs/list", title: "Organisations | CodeClarity" },
    {
      path: "/orgs/manage/members/org-123",
      title: "Members | CodeClarity",
    },
    {
      path: "/orgs/manage/policies/org-123",
      title: "Policies | CodeClarity",
    },
  ]) {
    test(`signed in, ${path} is titled "${title}"`, async ({ page }) => {
      const shell = new ShellPage(page);
      await shell.signIn();
      await shell.goto(path);
      await expect(page).toHaveTitle(title);
    });
  }

  test("the title follows client-side navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    const shell = new ShellPage(page);
    await shell.signIn();
    await shell.goto("/datasets");
    await expect(page).toHaveTitle("Datasets | CodeClarity");
    await shell.link("Projects").click();
    await expect(page).toHaveTitle("Projects | CodeClarity");
  });
});
