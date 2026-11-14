import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

type Status = "completed" | "failure" | "started" | "requested";

/** One analyser step as the dispatcher records it. */
function step(name: string, status: string, result: unknown = {}) {
  return {
    Name: name,
    Version: "1.0.0",
    Status: status,
    Result: result,
    Started_on: "2026-11-01T09:00:00Z",
    Ended_on: "2026-11-01T09:00:04Z",
  };
}

/** An analysis as the API returns it, with readable defaults. */
export function analysis(
  id: string,
  status: Status,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const done = status === "completed";
  const running = status === "started";
  return {
    id,
    created_on: "2026-11-01T09:00:00Z",
    analyzer: { id: "an-1", name: "Default analyzer" },
    status,
    failure_reason: status === "failure" ? "Clone failed: not found" : null,
    steps: [
      [step("js-sbom", done || running ? "success" : "requested")],
      [
        step(
          "vuln-finder",
          done ? "success" : running ? "started" : "requested",
        ),
        step("php-sbom", "skipped", { skip_reason: "No composer.lock" }),
      ],
    ],
    branch: "main",
    schedule_type: "once",
    ...overrides,
  };
}

/** A project as the API returns it, with readable defaults. */
export function project(
  id: string,
  name: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    name,
    description: "",
    integration_id: "int-gh",
    type: "GITHUB",
    url: `https://github.com/${name}`,
    analyses: [],
    upload_id: "",
    added_on: "2026-10-01T09:00:00Z",
    organization_id: ORG,
    ...overrides,
  };
}

export const sampleProjects = [
  project("p-1", "example/web-frontend", {
    added_on: "2026-10-03T09:00:00Z",
    analyses: [
      analysis("a-1", "completed", { created_on: "2026-11-02T09:00:00Z" }),
      analysis("a-2", "completed", {
        created_on: "2026-10-20T09:00:00Z",
        schedule_type: "weekly",
        next_scheduled_run: "2026-11-20T09:00:00Z",
      }),
    ],
  }),
  project("p-2", "example/api-server", {
    type: "GITLAB",
    integration_id: "int-gl",
    url: "https://gitlab.com/example/api-server",
    added_on: "2026-10-02T09:00:00Z",
    analyses: [analysis("a-3", "failure")],
  }),
  project("p-3", "Local archive", {
    type: "FILE",
    url: "",
    integration_id: "",
    added_on: "2026-10-01T09:00:00Z",
  }),
];

export const sampleIntegrations = [
  {
    id: "int-gh",
    added_on: "2026-01-01T00:00:00Z",
    added_by: "John Doe",
    service_domain: "github.com",
    integration_type: "VCS",
    integration_provider: "GITHUB",
    invalid: false,
  },
  {
    id: "int-gl",
    added_on: "2026-01-01T00:00:00Z",
    added_by: "John Doe",
    service_domain: "gitlab.com",
    integration_type: "VCS",
    integration_provider: "GITLAB",
    invalid: false,
  },
];

/** A repository a VCS integration can import. */
export function repo(
  name: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: `r-${name}`,
    url: `https://github.com/${name}`,
    default_branch: "main",
    visibility: "public",
    fully_qualified_name: name,
    description: `The ${name.split("/")[1]} repository`,
    created_at: "2025-06-01T09:00:00Z",
    imported_already: false,
    integration_id: "int-gh",
    ...overrides,
  };
}

export const sampleRepos = [
  repo("example/web-frontend", { imported_already: true }),
  repo("example/billing"),
  repo("example/docs-site", { language: "TypeScript" }),
];

export function paginated(
  data: unknown[],
  page = 0,
  totalPages = 1,
): Record<string, unknown> {
  return {
    data,
    page,
    entry_count: data.length,
    entries_per_page: 100,
    total_entries: data.length,
    total_pages: totalPages,
    matching_count: data.length,
    filter_count: {},
    status: "success",
  };
}

/** The Projects list and the Add Project page, with their API mocked. */
export class ProjectsPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly table: Locator;
  readonly filter: Locator;
  /** Every request the page sent that changes data, as "METHOD path". */
  readonly writes: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.table = page.getByRole("table").first();
    this.filter = page.getByRole("searchbox").first();
  }

  /**
   * Signs in and answers the project endpoints. `hold` keeps the projects
   * request pending until the returned function is called.
   */
  async signIn(
    options: {
      projects?: Record<string, unknown>[];
      pages?: Record<string, unknown>[][];
      integrations?: unknown[];
      repos?: Record<string, unknown>[];
      failImport?: string[];
      runs?: unknown[];
      hold?: boolean;
      failList?: boolean;
    } = {},
  ): Promise<() => void> {
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });

    await this.page.route(`**/api/org/${ORG}/projects**`, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.replace(/^\/api/, "");
      if (request.method() !== "GET") {
        this.writes.push(`${request.method()} ${path}`);
        if (request.method() === "POST") {
          const body = (request.postDataJSON() ?? {}) as { url?: string };
          if (body.url && options.failImport?.includes(body.url)) {
            return route.fulfill({
              status: 409,
              json: {
                status_code: 409,
                status: "failure",
                error_code: "AlreadyExists",
                error_message: "Already exists",
              },
            });
          }
          return route.fulfill({ json: { id: "p-new" } });
        }
        return route.fulfill({ json: { status_code: 200, status: "success" } });
      }
      if (path.endsWith("/runs")) {
        return fulfil(route, { data: options.runs ?? [] });
      }
      if (path === `/org/${ORG}/projects`) {
        if (options.hold) await held;
        if (options.failList) {
          return route.fulfill({ status: 500, json: { status: "failure" } });
        }
        if (options.pages) {
          const index = Number(url.searchParams.get("page") ?? 0);
          return fulfil(
            route,
            paginated(options.pages[index] ?? [], index, options.pages.length),
          );
        }
        return fulfil(route, paginated(options.projects ?? sampleProjects));
      }
      return fulfil(route, paginated([]));
    });

    await this.page.route("**/api/result**", (route) =>
      fulfil(route, {
        data: {
          result: { workspaces: { ".": { dependencies: { react: {} } } } },
        },
      }),
    );

    await this.page.route(
      `**/api/org/${ORG}/integrations/**`,
      (route: Route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/integrations/vcs")) {
          return fulfil(
            route,
            paginated(options.integrations ?? sampleIntegrations),
          );
        }
        if (path.endsWith("/repositories") || path.endsWith("/popular")) {
          return fulfil(route, paginated(options.repos ?? sampleRepos));
        }
        return fulfil(route, paginated([]));
      },
    );
    return release;
  }

  async gotoList(): Promise<void> {
    await this.shell.goto("/projects");
  }

  async gotoCreate(): Promise<void> {
    await this.shell.goto("/projects/add");
  }

  /** The table's body rows, without the header row. */
  rows(table: Locator = this.table): Locator {
    return table.locator("tbody tr");
  }

  row(name: string): Locator {
    return this.rows().filter({ hasText: name });
  }

  columnHeader(name: string, table: Locator = this.table): Locator {
    return table.getByRole("columnheader", { name });
  }

  sortButton(name: string, table: Locator = this.table): Locator {
    return this.columnHeader(name, table).getByRole("button");
  }

  pagination(): Locator {
    return this.page.getByRole("navigation", { name: "Pagination" });
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
