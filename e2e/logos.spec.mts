import { expect, test } from "@playwright/test";
import user from "./fixtures/user.json" with { type: "json" };

// Hosts the Iconify runtime falls back to when an icon is not bundled.
const ICON_API =
  /^https:\/\/api\d*\.(iconify\.design|simplesvg\.com|unisvg\.com)\//;
const LOGO_SETS = ["simple-icons", "devicon"];

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
  status: "success",
};

test.describe("Brand and language logos", () => {
  test("render on the integrations page without asking an icon API", async ({
    page,
  }) => {
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
      return route.fulfill({ json: emptyPage });
    });

    // Record icon API calls and block them, so a logo only shows if bundled.
    const iconRequests: string[] = [];
    await page.route(ICON_API, (route) => {
      iconRequests.push(route.request().url());
      return route.abort();
    });

    await page.goto("/orgs/manage/integrations/org-123");

    for (const name of ["Add GitHub", "Add GitLab", "Add ClickUp"]) {
      const card = page.getByRole("link", { name: new RegExp(name) });
      await expect(card).toBeVisible();
      // The logo is the first icon in the card; bundled icons render as SVG paths.
      await expect(card.locator("svg path").first()).toBeVisible();
    }

    const logoRequests = iconRequests.filter((url) =>
      LOGO_SETS.some((set) => new URL(url).pathname.startsWith(`/${set}`)),
    );
    expect(logoRequests).toEqual([]);
  });
});
