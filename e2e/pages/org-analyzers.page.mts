import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

/** An analyzer as the API returns it. */
export function analyzer(
  id: string,
  name: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    name,
    description: `${name} workflow for JavaScript projects`,
    created_on: "2026-10-01T09:00:00Z",
    created_by: { id: "u-1", handle: "john", first_name: "John" },
    steps: [
      [
        {
          name: "js-sbom",
          version: "1.0.0",
          config: {},
          persistant_config: {},
        },
      ],
      [
        {
          name: "vuln-finder",
          version: "1.0.0",
          config: {},
          persistant_config: {},
        },
      ],
    ],
    organization_id: ORG,
    ...overrides,
  };
}

export const sampleAnalyzers = [
  analyzer("an-1", "Default analyzer"),
  analyzer("an-2", "Licence audit", {
    created_on: "2026-11-02T09:00:00Z",
    steps: [
      [
        {
          name: "js-sbom",
          version: "1.0.0",
          config: {},
          persistant_config: {},
        },
      ],
    ],
  }),
];

export const samplePlugins = [
  {
    name: "js-sbom",
    description: "Builds the SBOM of a JavaScript project",
    version: "1.0.0",
    depends_on: [],
    config: {},
  },
  {
    name: "vuln-finder",
    description: "Finds known vulnerabilities in the SBOM",
    version: "1.0.0",
    depends_on: ["js-sbom"],
    config: {},
  },
  {
    name: "license-finder",
    description: "Finds licences in the SBOM",
    version: "1.0.0",
    depends_on: ["js-sbom"],
    config: {},
  },
];

export const sampleTemplates = [
  {
    name: "JavaScript security",
    description: "SBOM and vulnerability scan for JavaScript projects",
    supported_languages: ["javascript"],
    language_config: { javascript: { plugins: ["js-sbom", "vuln-finder"] } },
    logo: "js",
    steps: [[{ name: "js-sbom" }], [{ name: "vuln-finder" }]],
  },
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

/** The organisation Analyzers list, creation and edit pages, with their API mocked. */
export class OrgAnalyzersPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly table: Locator;
  readonly deleted: string[] = [];
  readonly created: unknown[] = [];
  readonly updated: unknown[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.table = page.getByRole("table");
  }

  /** Signs in and answers the analyzer, plugin and template endpoints. */
  async signIn(
    options: { analyzers?: unknown[]; failList?: boolean } = {},
  ): Promise<void> {
    await this.shell.signIn();
    let analyzers = [...(options.analyzers ?? sampleAnalyzers)] as Record<
      string,
      unknown
    >[];

    await this.page.route(`**/api/org/${ORG}/analyzers**`, (route: Route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const id = path.split("/analyzers/")[1];
      if (request.method() === "DELETE" && id) {
        this.deleted.push(id);
        analyzers = analyzers.filter((a) => a.id !== id);
        return route.fulfill({
          json: { status_code: 200, status: "success" },
        });
      }
      if (request.method() === "PUT" && id) {
        this.updated.push(request.postDataJSON());
        return route.fulfill({
          json: { status_code: 200, status: "success" },
        });
      }
      if (request.method() === "POST") {
        this.created.push(request.postDataJSON());
        return route.fulfill({ json: { id: "an-new" } });
      }
      if (id) {
        return route.fulfill({
          json: { data: analyzers.find((a) => a.id === id) },
        });
      }
      if (options.failList) {
        return route.fulfill({ status: 500, json: { status: "failure" } });
      }
      return route.fulfill({ json: paginated(analyzers) });
    });
    await this.page.route("**/api/plugin", (route: Route) =>
      route.fulfill({ json: paginated(samplePlugins) }),
    );
    await this.page.route("**/api/analyzer-templates", (route: Route) =>
      route.fulfill({ json: { data: sampleTemplates } }),
    );
  }

  async gotoList(): Promise<void> {
    await this.shell.goto(`/orgs/manage/analyzers/${ORG}`);
  }

  async gotoCreate(): Promise<void> {
    await this.shell.goto(`/orgs/add/analyzers/${ORG}`);
  }

  async gotoEdit(id: string): Promise<void> {
    await this.shell.goto(`/orgs/edit/analyzers/${ORG}?analyzerId=${id}`);
  }

  /** The table's body rows, without the header row. */
  rows(): Locator {
    return this.table.locator("tbody tr");
  }

  row(name: string): Locator {
    return this.rows().filter({ hasText: name });
  }

  dialog(): Locator {
    return this.page.getByRole("alertdialog").or(this.page.getByRole("dialog"));
  }
}
