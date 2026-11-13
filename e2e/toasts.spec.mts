import { expect, type Page, test } from "@playwright/test";

import user from "./fixtures/user.json" with { type: "json" };

const org = {
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

const emptyPage = {
  data: [],
  page: 0,
  entry_count: 0,
  entries_per_page: 0,
  total_entries: 0,
  total_pages: 0,
  matching_count: 0,
  filter_count: {},
};

// Signs the user in and answers every API call, failing the Datasets list.
async function signInWithFailingDatasets(page: Page): Promise<void> {
  const expiry = new Date(Date.now() + 86_400_000).toISOString();
  await page.addInitScript((e) => {
    localStorage.setItem(
      "authStore",
      JSON.stringify({
        initialized: true,
        authenticated: true,
        token: "t",
        tokenExpiry: e,
        refreshToken: "t",
        refreshTokenExpiry: e,
      }),
    );
  }, expiry);
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/auth/user")) {
      return route.fulfill({
        json: {
          data: { ...user, default_org: { id: org.id, name: org.name } },
        },
      });
    }
    if (/\/org\/org-123$/.test(url)) {
      return route.fulfill({ json: { data: org } });
    }
    if (/\/org\/org-123\/datasets/.test(url)) {
      return route.fulfill({
        status: 500,
        json: { status_code: 500, message: "Internal Server Error" },
      });
    }
    return route.fulfill({ json: emptyPage });
  });
}

test.describe("Toasts", () => {
  test("a failed API request shows an error toast", async ({ page }) => {
    await signInWithFailingDatasets(page);

    await page.goto("/datasets");

    const notifications = page.getByRole("region", { name: /Notifications/ });
    await expect(
      notifications.getByText(
        "Request failed to be processed. Please reload the page and try again.",
      ),
    ).toBeVisible();
  });
});
