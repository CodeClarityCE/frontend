import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

/** An analyzer as the API returns it (GET /org/:org/analyzers/:id). */
export function analyzer(
  id: string,
  name: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    name,
    description: `${name} for JavaScript projects`,
    created_on: "2026-10-01T09:00:00Z",
    steps: [
      [
        {
          name: "js-sbom",
          version: "1.0.0",
          config: {},
        },
      ],
      [
        {
          name: "vuln-finder",
          version: "1.0.0",
          config: {},
        },
      ],
    ],
    supported_languages: ["javascript"],
    language_config: { javascript: { plugins: ["js-sbom", "vuln-finder"] } },
    logo: "js",
    ...overrides,
  };
}

export const sampleAnalyzers = [
  analyzer("an-1", "Default analyzer"),
  analyzer("an-2", "License audit", {
    created_on: "2026-11-02T09:00:00Z",
    steps: [
      [
        {
          name: "js-sbom",
          version: "1.0.0",
          config: {},
        },
      ],
    ],
  }),
];

// Dependencies as the plugins declare them: any SBOM producer will do.
export const samplePlugins = [
  {
    name: "js-sbom",
    description: "Builds the SBOM of a JavaScript project",
    version: "1.0.0",
    depends_on: [],
    config: {},
  },
  {
    name: "php-sbom",
    description: "Builds the SBOM of a PHP project",
    version: "1.0.0",
    depends_on: [],
    config: {},
  },
  {
    name: "vuln-finder",
    description: "Finds known vulnerabilities in the SBOM",
    version: "1.0.0",
    depends_on: ["js-sbom", "php-sbom"],
    config: {},
  },
  {
    name: "license-finder",
    description: "Finds licenses in the SBOM",
    version: "1.0.0",
    depends_on: ["js-sbom", "php-sbom"],
    config: {},
  },
  {
    name: "js-patching",
    description: "Suggests upgrades that fix the vulnerabilities",
    version: "1.0.0",
    depends_on: ["js-sbom", "php-sbom", "vuln-finder"],
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
    options: {
      analyzers?: unknown[];
      failList?: boolean;
      plugins?: unknown[];
      templates?: unknown[];
    } = {},
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
        const body = request.postDataJSON() as Record<string, unknown>;
        this.updated.push(body);
        analyzers = analyzers.map((a) => (a.id === id ? { ...a, ...body } : a));
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
      route.fulfill({ json: paginated(options.plugins ?? samplePlugins) }),
    );
    await this.page.route("**/api/analyzer-templates", (route: Route) =>
      route.fulfill({ json: { data: options.templates ?? sampleTemplates } }),
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

  /** The workflow canvas on the create and edit pages. */
  canvas(): Locator {
    return this.page.locator(".vue-flow");
  }

  /** The plugin nodes drawn on the workflow canvas. */
  workflowNodes(): Locator {
    return this.canvas().locator(".vue-flow__node");
  }

  /** The plugin node with this name on the canvas. */
  workflowNode(name: string): Locator {
    return this.workflowNodes().filter({ hasText: name });
  }

  /** The menu a right-click on the canvas opens. */
  addPluginMenu(): Locator {
    return this.page.getByRole("menu", { name: "Add plugin" });
  }

  /** Right-clicks an empty corner of the canvas to open the add-plugin menu. */
  async openAddPluginMenu(): Promise<void> {
    await this.canvas()
      .locator(".vue-flow__pane")
      .click({ button: "right", position: { x: 5, y: 5 } });
    await this.addPluginMenu().waitFor();
  }

  async addPlugin(name: string): Promise<void> {
    await this.openAddPluginMenu();
    await this.addPluginMenu()
      .getByRole("menuitem", { name: new RegExp(`^${name}\\b`) })
      .click();
  }

  /** A right-click on a node removes it from the workflow. */
  async removePlugin(name: string): Promise<void> {
    const count = await this.workflowNodes().count();
    await this.workflowNode(name).click({ button: "right" });
    await this.page.waitForFunction(
      (n) => document.querySelectorAll(".vue-flow__node").length === n,
      count - 1,
    );
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
