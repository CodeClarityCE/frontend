import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

const DAY = 86_400_000;

/** Pages see this as now, so expiry dates and screenshots stay stable. */
export const NOW = new Date("2026-11-13T12:00:00Z");

/** A version control integration as the VCS list returns it. */
export function vcs(
  id: string,
  provider: "GITHUB" | "GITLAB",
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    added_on: "2026-01-10T09:00:00Z",
    added_by: "John Doe",
    service_domain: provider === "GITHUB" ? "github.com" : "gitlab.com",
    integration_type: "VCS",
    integration_provider: provider,
    invalid: false,
    expiry_date: new Date(NOW.getTime() + 200 * DAY).toISOString(),
    ...overrides,
  };
}

/** One integration of each health: healthy, expiring soon and invalid. */
export const sampleIntegrations = [
  vcs("gh-1", "GITHUB"),
  vcs("gl-1", "GITLAB", {
    service_domain: "gitlab.example.com",
    expiry_date: new Date(NOW.getTime() + 5 * DAY).toISOString(),
  }),
  vcs("gl-2", "GITLAB", { invalid: true }),
];

export const clickUp = {
  id: "cu-1",
  provider: "CLICKUP",
  enabled: true,
  created_on: "2026-02-01T09:00:00Z",
  has_config: true,
  workspace_name: "Security team",
  list_name: "Vulnerabilities",
  auto_sync_on_create: true,
  sync_status_changes: false,
};

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

/** The organisation integrations pages, with their API mocked. */
export class OrgIntegrationsPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly table: Locator;
  readonly dialog: Locator;
  /** Paths of the DELETE requests the page sent. */
  readonly deleted: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.table = page.getByRole("table", { name: "Integrations" });
    this.dialog = page.getByRole("dialog");
  }

  /**
   * Signs in and answers the integration endpoints. `hold` keeps the VCS list
   * pending until the returned function is called.
   */
  async signIn(
    options: {
      integrations?: unknown[];
      ticketing?: unknown[];
      hold?: boolean;
    } = {},
  ): Promise<() => void> {
    await this.page.clock.setFixedTime(NOW);
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let integrations = (options.integrations ?? sampleIntegrations) as Record<
      string,
      unknown
    >[];

    await this.page.route(`**/api/org/${ORG}/integrations**`, async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() === "DELETE") {
        this.deleted.push(path);
        const id = path.split("/").pop();
        integrations = integrations.filter(
          (i) => (i as { id: string }).id !== id,
        );
        return fulfil(route, { status_code: 200, status: "success" });
      }
      if (path.endsWith("/integrations/vcs")) {
        if (options.hold) await held;
        return fulfil(route, paginated(integrations));
      }
      if (path.endsWith("/add")) {
        return fulfil(route, { status_code: 201, status: "success" });
      }
      const id = path.split("/").pop();
      const found = integrations.find((i) => (i as { id: string }).id === id);
      const gitlab = path.includes("/gitlab/");
      return fulfil(route, {
        data: {
          ...(found ?? sampleIntegrations[0]),
          token_type: gitlab ? "PERSONAL_ACCESS_TOKEN" : "CLASSIC_TOKEN",
          service_base_url: gitlab ? "https://gitlab.example.com" : undefined,
        },
      });
    });
    await this.page.route(
      `**/api/org/${ORG}/tickets/integrations**`,
      (route: Route) => {
        if (route.request().method() === "DELETE") {
          this.deleted.push(new URL(route.request().url()).pathname);
          return fulfil(route, { status_code: 200, status: "success" });
        }
        return fulfil(route, { data: options.ticketing ?? [clickUp] });
      },
    );
    return release;
  }

  async gotoList(): Promise<void> {
    await this.shell.goto(`/orgs/manage/integrations/${ORG}`);
  }

  async gotoAdd(provider: "GITHUB" | "GITLAB" | "CLICKUP"): Promise<void> {
    await this.shell.goto(`/orgs/add/integrations/${ORG}?provider=${provider}`);
  }

  async gotoManage(provider: "GITHUB" | "GITLAB", id: string): Promise<void> {
    await this.shell.goto(
      `/orgs/edit/integrations/${ORG}?provider=${provider}&integrationId=${id}`,
    );
  }

  /** The table's body rows, without the header row. */
  rows(): Locator {
    return this.table.locator("tbody tr");
  }

  row(name: string): Locator {
    return this.rows().filter({ hasText: name });
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
