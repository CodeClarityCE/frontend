import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";
export const PROJECT = "9b0f6a4e-2c1d-4c3b-8f7a-1e2d3c4b5a69";
export const ANALYSIS = "5d6e7f80-91a2-4b3c-8d4e-5f6a7b8c9d0e";

type StepStatus = "success" | "failure" | "requested" | "started";

/** One plugin step as the dispatcher records it. */
export function step(
  name: string,
  status: StepStatus,
): Record<string, unknown> {
  return {
    Name: name,
    Config: {},
    Result: null,
    Status: status,
    Version: "v1.0.0",
    Started_on: "2026-11-01T09:00:00Z",
    Ended_on: status === "success" ? "2026-11-01T09:00:04Z" : "",
  };
}

/** A single analysis as the API returns it. */
export function analysis(
  status: string,
  steps: Record<string, unknown>[][],
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: ANALYSIS,
    created_on: "2026-11-01T09:00:00Z",
    status,
    steps,
    branch: "main",
    tag: null,
    failure_reason: null,
    schedule_type: "once",
    next_scheduled_run: null,
    is_active: true,
    last_scheduled_run: null,
    ...overrides,
  };
}

export const failedAnalysis = analysis(
  "failure",
  [[step("js-sbom", "failure")], [step("vuln-finder", "requested")]],
  { failure_reason: "Clone failed: repository not found" },
);

const project = {
  id: PROJECT,
  name: "web-frontend",
  description: "The web app",
  integration_id: "int-1",
  type: "GITHUB",
  url: "https://github.com/example/web-frontend",
  upload_id: "up-1",
  added_on: "2025-01-05T10:00:00Z",
  organization_id: ORG,
};

const sbomStats = {
  number_of_dependencies: 1,
  number_of_direct_dependencies: 1,
  number_of_transitive_dependencies: 0,
  number_of_both_direct_transitive_dependencies: 0,
  number_of_deprecated_dependencies: 0,
  number_of_unlicensed_dependencies: 0,
  number_of_outdated_dependencies: 0,
  number_of_dev_dependencies: 0,
  number_of_non_dev_dependencies: 1,
};

/** An API error answer. */
export interface Failure {
  status: number;
  error_code: string;
}

export const NOT_FOUND: Failure = { status: 404, error_code: "EntityNotFound" };
export const NOT_AUTHORIZED: Failure = {
  status: 403,
  error_code: "NotAuthorized",
};
export const SERVER_ERROR: Failure = {
  status: 500,
  error_code: "InternalError",
};

export interface ResultsStatusOptions {
  /** The analysis the API returns, or the error it answers with. */
  analysis?: Record<string, unknown> | Failure;
  /** The vulnerability list answers with this error. */
  vulnerabilities?: Failure;
  /** The dependency and finding details answer with this error. */
  details?: Failure;
}

/** The results page and its detail pages, for analyses in any state. */
export class ResultsStatusPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly tabs: Locator;
  /** The path of every results API request, in order. */
  readonly requests: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.tabs = page.getByRole("tablist", { name: "Results" });
  }

  async signIn(options: ResultsStatusOptions = {}): Promise<void> {
    await this.shell.signIn();
    await this.page.route(
      /^https:\/\/api\d*\.(iconify\.design|simplesvg\.com|unisvg\.com)\//,
      (route) => route.abort(),
    );
    await this.page.route("**/api/knowledge/status", (route) =>
      fulfil(route, { data: { sources: [] } }),
    );
    await this.page.route(`**/api/org/${ORG}/projects/**`, (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/api/, "");
      this.requests.push(path);
      const base = `/org/${ORG}/projects/${PROJECT}`;
      const results = `${base}/analysis/${ANALYSIS}`;
      if (path === base) return fulfil(route, { data: project });
      if (path !== `${base}/analyses/${ANALYSIS}` && !path.startsWith(results))
        return unknown(route, path);
      if (path === `${base}/analyses/${ANALYSIS}`) {
        const answer = options.analysis ?? failedAnalysis;
        return isFailure(answer)
          ? fail(route, answer)
          : fulfil(route, {
              status_code: 200,
              status: "success",
              data: answer,
            });
      }
      if (path === `${results}/sbom/workspaces`)
        return fulfil(route, {
          data: { workspaces: ["."], package_manager: "NPM" },
        });
      if (path === `${results}/sbom/stats`)
        return fulfil(route, { data: sbomStats });
      if (path === `${results}/sbom`) return fulfil(route, paginated([]));
      if (
        path === `${results}/sbom/dependency` ||
        path.startsWith(`${results}/vulnerabilities/vulnerability/`)
      )
        return fail(route, options.details ?? NOT_FOUND);
      if (path === `${results}/vulnerabilities` && options.vulnerabilities)
        return fail(route, options.vulnerabilities);
      if (path === `${results}/vulnerabilities`)
        return fulfil(route, paginated([]));
      return fulfil(route, { data: [] });
    });
  }

  async goto(query = `analysis_id=${ANALYSIS}&project_id=${PROJECT}`) {
    await this.shell.goto(`/results?${query}`);
  }

  async gotoDependency(query: string): Promise<void> {
    await this.shell.goto(`/results/sbom_details?${query}`);
  }

  async gotoVulnerability(query: string): Promise<void> {
    await this.shell.goto(`/results/vulnerabilities_details?${query}`);
  }

  /** Whether any request asked for a path ending with this suffix. */
  requested(suffix: string): boolean {
    return this.requests.some((path) => path.endsWith(suffix));
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Like the API today: an unknown id is refused, a malformed one is a server error.
function unknown(route: Route, path: string): Promise<void> {
  const [projectId, , analysisId] = path.split("/").slice(4);
  const ids = [projectId, analysisId].filter((id) => id !== undefined);
  return fail(
    route,
    ids.every((id) => UUID.test(id)) ? NOT_AUTHORIZED : SERVER_ERROR,
  );
}

function isFailure(value: unknown): value is Failure {
  return typeof value === "object" && value !== null && "error_code" in value;
}

function paginated(data: unknown[]): Record<string, unknown> {
  return {
    data,
    page: 0,
    entry_count: data.length,
    entries_per_page: 20,
    total_entries: data.length,
    total_pages: 1,
    matching_count: data.length,
    filter_count: {},
    status: "success",
  };
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}

function fail(route: Route, failure: Failure): Promise<void> {
  return route.fulfill({
    status: failure.status,
    json: {
      status_code: failure.status,
      status: "failure",
      error_code: failure.error_code,
      error_message: "The request failed.",
    },
  });
}
