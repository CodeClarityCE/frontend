import { type Locator, type Page } from "@playwright/test";

import user from "../fixtures/user.json" with { type: "json" };

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

const otherOrg = { ...org, id: "org-456", name: "Research Lab" };

function paginated(data: unknown[]): Record<string, unknown> {
  return {
    data,
    page: 0,
    entry_count: data.length,
    entries_per_page: 50,
    total_entries: data.length,
    total_pages: 1,
    matching_count: data.length,
    filter_count: {},
    status: "success",
  };
}

export const datasets = [
  {
    id: "ds-1",
    name: "Top npm packages",
    status: "READY",
    params: {
      languages: ["JavaScript"],
      pages: 1,
      min_stars: 100,
      limit: 50,
      lockfiles: ["package-lock.json"],
    },
    stats: null,
    error: null,
    entry_count: 50,
    integration_id: null,
    created_by_name: "John Doe",
    created_on: "2025-01-10T10:00:00Z",
    built_on: "2025-01-10T11:00:00Z",
  },
];

export const experiments = [
  {
    id: "exp-1",
    name: "Fix lag study",
    status: "COMPLETED",
    retries: 1,
    grid_interval: "month",
    grid_count: 3,
    grid_dates: ["2024-10-01", "2024-11-01", "2024-12-01"],
    analysis_budget: null,
    error: null,
    dataset_id: "ds-1",
    dataset_name: "Top npm packages",
    analyzer_id: "an-1",
    analyzer_name: "Default analyzer",
    analyzer_steps: null,
    created_by_name: "John Doe",
    created_on: "2025-01-11T10:00:00Z",
    started_on: "2025-01-11T10:05:00Z",
    ended_on: "2025-01-11T12:00:00Z",
    run_count: 4,
    run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
  },
];

export const projects = [
  {
    id: "proj-1",
    name: "web-frontend",
    description: "The web app",
    integration_id: "int-1",
    type: "GITHUB",
    url: "https://github.com/example/web-frontend",
    analyses: [],
    upload_id: "up-1",
    added_on: "2025-01-05T10:00:00Z",
    organization_id: org.id,
  },
];

/** The app shell: sidebar, organisation switcher, user menu and command palette. */
export class ShellPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly nav: Locator;
  readonly palette: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator("[data-sidebar=sidebar]");
    this.nav = page.getByRole("navigation", { name: "Main" });
    this.palette = page.getByRole("dialog", { name: "Command palette" });
  }

  link(name: string): Locator {
    return this.nav.getByRole("link", { name, exact: true });
  }

  /** Signs the user in and answers every API call with fixtures. */
  async signIn(): Promise<void> {
    const expiry = new Date(Date.now() + 86_400_000).toISOString();
    await this.page.addInitScript((e) => {
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
    await this.page.route("**/api/**", (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/api/, "");
      if (route.request().method() === "PATCH") {
        return route.fulfill({ json: { status_code: 200, status: "success" } });
      }
      if (path === "/auth/user") {
        return route.fulfill({
          json: {
            data: { ...user, default_org: { id: org.id, name: org.name } },
          },
        });
      }
      if (path === `/org/${org.id}`) {
        return route.fulfill({ json: { data: org } });
      }
      if (path === `/org/${otherOrg.id}`) {
        return route.fulfill({ json: { data: otherOrg } });
      }
      if (path === "/org") {
        return route.fulfill({
          json: paginated(
            [org, otherOrg].map((o) => ({
              joined_on: o.joined_on,
              organization: o,
              role: 0,
            })),
          ),
        });
      }
      if (path === `/org/${org.id}/datasets`) {
        return route.fulfill({ json: paginated(datasets) });
      }
      if (path === `/org/${org.id}/experiments`) {
        return route.fulfill({ json: paginated(experiments) });
      }
      if (path === `/org/${org.id}/projects`) {
        return route.fulfill({ json: paginated(projects) });
      }
      return route.fulfill({ json: paginated([]) });
    });
  }

  async goto(path = "/datasets"): Promise<void> {
    await this.page.goto(path);
    await this.nav.waitFor();
  }

  /** Hides the routed page so screenshots show only the shell. */
  async hidePageContent(): Promise<void> {
    await this.page.addStyleTag({
      content: "#main-content > * { display: none !important; }",
    });
  }
}
