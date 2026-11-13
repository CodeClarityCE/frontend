import { type Locator, type Page, type Route } from "@playwright/test";

import { dataset } from "./datasets.page.mjs";
import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

type Status = "PENDING" | "RUNNING" | "COMPLETED" | "CANCELLED" | "FAILED";

/** An Experiment as the API returns it, with readable defaults. */
export function experiment(
  id: string,
  name: string,
  status: Status = "COMPLETED",
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const finished =
    status === "COMPLETED" ? 400 : status === "RUNNING" ? 120 : 0;
  return {
    id,
    name,
    status,
    retries: 2,
    grid_interval: "month",
    grid_count: 24,
    grid_dates: [],
    analysis_budget: null,
    error: status === "FAILED" ? "Dataset entries could not be read" : null,
    dataset_id: "ds-1",
    dataset_name: "Top npm packages",
    analyzer_id: "an-1",
    analyzer_name: "JavaScript analyzer",
    analyzer_steps: null,
    created_by_name: "John Doe",
    created_on: "2026-10-05T09:00:00Z",
    started_on: status === "PENDING" ? null : "2026-10-05T09:01:00Z",
    ended_on: status === "COMPLETED" ? "2026-10-06T09:00:00Z" : null,
    run_count: 400,
    run_counts: {
      pending: 400 - finished,
      done: Math.max(0, finished - 10),
      failed: Math.min(finished, 6),
      skipped: Math.min(Math.max(0, finished - 6), 4),
    },
    ...overrides,
  };
}

/** An analyzer; the default one runs the plugins an Experiment needs. */
export function analyzer(
  id: string,
  name: string,
  plugins: string[] = ["js-sbom", "vuln-finder"],
): Record<string, unknown> {
  return {
    id,
    name,
    description: `${name} description`,
    created_on: "2026-01-01T00:00:00Z",
    organization_id: ORG,
    steps: [
      plugins.map((plugin) => ({
        name: plugin,
        version: "v1",
        config: {},
        persistant_config: {},
      })),
    ],
  };
}

export const sampleExperiments = [
  experiment("exp-1", "Fix lag study"),
  experiment("exp-2", "Residence time 2026", "RUNNING", {
    created_on: "2026-11-02T09:00:00Z",
  }),
  experiment("exp-3", "Broken cohort", "FAILED", {
    dataset_name: "Frameworks 2026",
    created_on: "2026-09-15T09:00:00Z",
  }),
];

export const sampleDatasets = [
  dataset("ds-1", "Top npm packages"),
  dataset("ds-2", "Frameworks 2026", "BUILDING"),
];

export const sampleAnalyzers = [
  analyzer("an-1", "JavaScript analyzer"),
  analyzer("an-2", "Licences only", ["license-finder"]),
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

/** The Experiments list and creation pages, with their API mocked. */
export class ExperimentsPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly table: Locator;
  readonly filter: Locator;
  /** Bodies of the create requests sent so far */
  readonly created: unknown[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.table = page.getByRole("table");
    this.filter = page.getByRole("searchbox");
  }

  /**
   * Signs in and answers the Experiment, Dataset and analyzer endpoints.
   * `hold` keeps the list request pending until the returned function is called.
   */
  async signIn(
    options: {
      experiments?: unknown[];
      datasets?: unknown[];
      analyzers?: unknown[];
      hold?: boolean;
    } = {},
  ): Promise<() => void> {
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });

    await this.page.route(`**/api/org/${ORG}/experiments**`, async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path.endsWith("/estimate")) {
        return fulfil(route, { data: { probes_per_entry_interval: 0.5 } });
      }
      if (request.method() === "POST") {
        this.created.push(request.postDataJSON());
        return fulfil(route, { id: "exp-new" });
      }
      if (path.endsWith("/experiments")) {
        if (options.hold) await held;
        return fulfil(
          route,
          paginated(options.experiments ?? sampleExperiments),
        );
      }
      return route.fallback();
    });
    await this.page.route(`**/api/org/${ORG}/datasets**`, (route) =>
      fulfil(route, paginated(options.datasets ?? sampleDatasets)),
    );
    await this.page.route(`**/api/org/${ORG}/analyzers**`, (route) =>
      fulfil(route, paginated(options.analyzers ?? sampleAnalyzers)),
    );
    return release;
  }

  async gotoList(): Promise<void> {
    await this.shell.goto("/experiments");
  }

  async gotoCreate(query = ""): Promise<void> {
    await this.shell.goto(`/experiments/add${query}`);
  }

  /** The table's body rows, without the header row. */
  rows(): Locator {
    return this.table.locator("tbody tr");
  }

  columnHeader(name: string): Locator {
    return this.table.getByRole("columnheader", { name });
  }

  sortButton(name: string): Locator {
    return this.columnHeader(name).getByRole("button");
  }

  pagination(): Locator {
    return this.page.getByRole("navigation", { name: "Pagination" });
  }

  /** A select of the creation form, by its label. */
  select(name: string): Locator {
    return this.page.getByRole("combobox", { name });
  }

  /** Opens a select and picks an option by its text. */
  async choose(select: string, option: string | RegExp): Promise<void> {
    await this.select(select).click();
    await this.page.getByRole("option", { name: option }).click();
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
