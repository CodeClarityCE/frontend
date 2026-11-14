import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

export const ORG = "org-123";

/** An organisation as the API returns it, with readable defaults. */
export function organization(
  id: string,
  name: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    name,
    color_scheme: "1",
    description: `${name} description`,
    role: 0,
    personal: false,
    created_on: "2024-01-01T00:00:00Z",
    joined_on: "2024-01-15T00:00:00Z",
    number_of_members: 3,
    organizationMemberships: [],
    created_by: { id: "u-1", handle: "johndoe", first_name: "John" },
    ...overrides,
  };
}

/** A membership row of GET /org. */
export function membership(
  org: Record<string, unknown>,
): Record<string, unknown> {
  return { joined_on: org.joined_on, organization: org, role: org.role };
}

export const sampleOrg = organization(ORG, "Test Organization", {
  description: "Test org",
});

export const sampleMemberships = [
  membership(sampleOrg),
  membership(
    organization("org-456", "Research Lab", {
      role: 3,
      number_of_members: 12,
      joined_on: "2025-03-02T00:00:00Z",
    }),
  ),
  membership(
    organization("org-789", "Personal space", {
      personal: true,
      number_of_members: 1,
      joined_on: "2023-06-10T00:00:00Z",
    }),
  ),
];

function paginated(data: unknown[]): Record<string, unknown> {
  return {
    data,
    page: 0,
    entry_count: data.length,
    entries_per_page: 100,
    total_entries: data.length,
    total_pages: 1,
    matching_count: data.length,
    filter_count: {},
    status: "success",
  };
}

/** The organisations list, creation and overview pages, with their API mocked. */
export class OrgSettingsPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly table: Locator;
  readonly filter: Locator;
  readonly orgNav: Locator;
  /** Requests the page sent that change data, as "METHOD path". */
  readonly writes: string[] = [];
  /** Bodies of the organisations created. */
  readonly created: unknown[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.table = page.getByRole("table", { name: "Organisations" });
    this.filter = page.getByRole("searchbox", {
      name: "Filter organisations",
    });
    this.orgNav = this.shell.nav.locator("[data-sidebar=menu-badge]");
  }

  /** Signs in and answers the organisation endpoints. */
  async signIn(
    options: {
      memberships?: unknown[];
      org?: Record<string, unknown>;
      failList?: boolean;
      failWrite?: { status: number; error_code: string };
    } = {},
  ): Promise<void> {
    await this.shell.signIn();
    const org = options.org ?? sampleOrg;

    await this.page.route(
      (url) => /^\/api\/org(\/[^/]+(\/leave_org)?)?$/.test(url.pathname),
      async (route: Route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname.replace(/^\/api/, "");
        const method = request.method();
        if (method !== "GET") {
          this.writes.push(`${method} ${path}`);
          if (method === "POST" && path === "/org") {
            this.created.push(request.postDataJSON());
          }
          if (options.failWrite) {
            return route.fulfill({
              status: options.failWrite.status,
              json: {
                status_code: options.failWrite.status,
                status: "failure",
                error_code: options.failWrite.error_code,
                error_message: options.failWrite.error_code,
              },
            });
          }
          return route.fulfill({
            json: { id: "org-new", status_code: 200, status: "success" },
          });
        }
        if (path === "/org") {
          if (options.failList) {
            return route.fulfill({ status: 500, json: {} });
          }
          return route.fulfill({
            json: paginated(options.memberships ?? sampleMemberships),
          });
        }
        if (path === `/org/${ORG}`)
          return route.fulfill({ json: { data: org } });
        return route.fallback();
      },
    );
  }

  async gotoList(): Promise<void> {
    await this.shell.goto("/orgs/list");
  }

  async gotoCreate(): Promise<void> {
    await this.shell.goto("/orgs/add");
  }

  async gotoOverview(): Promise<void> {
    await this.shell.goto(`/orgs/manage/main/${ORG}`);
  }

  rows(): Locator {
    return this.table.locator("tbody tr");
  }

  /** A link among the organisation settings pages in the sidebar. */
  subLink(name: string): Locator {
    return this.orgNav.getByRole("link", { name, exact: true });
  }
}
