import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

type Status = "READY" | "BUILDING" | "FAILED";

/** A Dataset as the API returns it, with readable defaults. */
export function dataset(
  id: string,
  name: string,
  status: Status = "READY",
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const ready = status === "READY";
  return {
    id,
    name,
    status,
    params: {
      languages: ["JavaScript", "TypeScript"],
      pages: 3,
      min_stars: 1000,
      limit: 100,
      lockfiles: ["package-lock.json", "yarn.lock"],
    },
    stats: ready
      ? {
          search_results: 600,
          candidates: 540,
          probed: 180,
          selected: 100,
          rejected: {
            repo_gone: 2,
            duplicate_canonical: 1,
            fork_or_archived: 12,
            no_branch: 0,
            no_package_json: 40,
            no_lockfile: 25,
          },
        }
      : null,
    error: status === "FAILED" ? "Bad credentials" : null,
    entry_count: ready ? 100 : 0,
    integration_id: "gh-1",
    created_by_name: "John Doe",
    created_on: "2026-10-01T09:00:00Z",
    built_on: ready ? "2026-10-01T09:20:00Z" : null,
    ...overrides,
  };
}

/** A Dataset entry at a zero-based star rank. */
export function entry(
  rank: number,
  name: string,
  stars: number,
): Record<string, unknown> {
  const [owner, repo] = name.split("/");
  return {
    id: `e-${rank}`,
    rank,
    full_name: name,
    owner,
    repo,
    git_url: `https://github.com/${name}`,
    default_branch: "main",
    stars,
    language: rank % 2 === 0 ? "TypeScript" : "JavaScript",
    lockfiles: rank % 3 === 0 ? ["pnpm-lock.yaml"] : ["package-lock.json"],
  };
}

export const sampleDatasets = [
  dataset("ds-1", "Top npm packages"),
  dataset("ds-2", "Frameworks 2026", "BUILDING", {
    created_on: "2026-11-02T09:00:00Z",
  }),
  dataset("ds-3", "Archived cohort", "FAILED", {
    created_on: "2026-09-15T09:00:00Z",
  }),
];

export const sampleEntries = [
  entry(0, "facebook/react", 230000),
  entry(1, "vuejs/core", 48000),
  entry(2, "vercel/next.js", 128000),
  entry(3, "sveltejs/svelte", 80000),
  entry(4, "expressjs/express", 65000),
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

/** The Datasets list, creation and detail pages, with their API mocked. */
export class DatasetsPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly table: Locator;
  readonly filter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.table = page.getByRole("table");
    this.filter = page.getByRole("searchbox");
  }

  /**
   * Signs in and answers the Dataset endpoints. `hold` keeps the list or
   * detail request pending until the returned function is called.
   */
  async signIn(
    options: {
      datasets?: unknown[];
      detail?: Record<string, unknown>;
      entries?: unknown[];
      integrations?: unknown[];
      hold?: boolean;
    } = {},
  ): Promise<() => void> {
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const wait = async (): Promise<void> => {
      if (options.hold) await held;
    };

    await this.page.route(`**/api/org/${ORG}/datasets**`, async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/datasets")) {
        await wait();
        return fulfil(route, paginated(options.datasets ?? sampleDatasets));
      }
      if (path.endsWith("/entries")) {
        return fulfil(route, paginated(options.entries ?? sampleEntries));
      }
      await wait();
      return fulfil(route, { data: options.detail ?? sampleDatasets[0] });
    });
    await this.page.route(
      `**/api/org/${ORG}/integrations/vcs**`,
      (route: Route) =>
        fulfil(
          route,
          paginated(
            options.integrations ?? [
              {
                id: "gh-1",
                added_on: "2026-01-01T00:00:00Z",
                added_by: "John Doe",
                service_domain: "github.com",
                integration_type: "VCS",
                integration_provider: "GITHUB",
                invalid: false,
              },
            ],
          ),
        ),
    );
    return release;
  }

  async gotoList(): Promise<void> {
    await this.shell.goto("/datasets");
  }

  async gotoCreate(): Promise<void> {
    await this.shell.goto("/datasets/add");
  }

  async gotoDetail(id = "ds-1"): Promise<void> {
    await this.shell.goto(`/datasets/detail?id=${id}`);
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
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
