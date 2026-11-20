import { type Locator, type Page, type Route } from "@playwright/test";

import { dataset } from "./datasets.page.mjs";
import { experiment } from "./experiments.page.mjs";
import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

/** A Published results version as the API lists it. */
export function published(
  metricVersion: number,
  publishedOn: string,
  by: string | null = "John Doe",
): Record<string, unknown> {
  return {
    metric_version: metricVersion,
    published_on: publishedOn,
    package_checksum: null,
    published_by_name: by,
  };
}

export const sampleDatasets = [dataset("ds-1", "Top npm packages")];

export const sampleExperiments = [
  experiment("exp-2", "Residence time 2026", "RUNNING", {
    created_on: "2026-11-02T09:00:00Z",
  }),
  experiment("exp-4", "Upstream leverage", "PENDING", {
    created_on: "2026-11-03T09:00:00Z",
    run_count: 200,
    run_counts: { pending: 200, done: 0, failed: 0, skipped: 0 },
  }),
  experiment("exp-5", "License drift", "COMPLETED", {
    created_on: "2026-10-30T09:00:00Z",
    ended_on: "2026-11-01T09:00:00Z",
  }),
  experiment("exp-1", "Fix lag study", "COMPLETED"),
  experiment("exp-3", "Broken cohort", "FAILED", {
    created_on: "2026-09-15T09:00:00Z",
    ended_on: "2026-09-16T09:00:00Z",
  }),
];

/** Published results versions per Experiment, newest first as the API sends them. */
export const samplePublished: Record<string, unknown[]> = {
  "exp-1": [
    published(2, "2026-10-20T10:00:00Z"),
    published(1, "2026-10-07T10:00:00Z", null),
  ],
  "exp-5": [published(1, "2026-11-02T10:00:00Z", "Jane Roe")],
};

const metaData = {
  id: ORG,
  created_on: "2024-01-01T00:00:00Z",
  projects: [{ id: "proj-1", name: "web-frontend" }],
  integrations: [],
};

// The organization vulnerability list, worst first, as the API pages it.
const vulnerabilities = {
  data: [
    {
      vulnerability_id: "CVE-2026-0001",
      severity_class: "CRITICAL",
      severity_score: 9.8,
      project_count: 2,
      instance_count: 2,
      uncorroborated_count: 0,
    },
    {
      vulnerability_id: "CVE-2026-0002",
      severity_class: "HIGH",
      severity_score: 7.5,
      project_count: 3,
      instance_count: 5,
      uncorroborated_count: 0,
    },
    {
      vulnerability_id: "CVE-2026-0003",
      severity_class: "MEDIUM",
      severity_score: 5.3,
      project_count: 1,
      instance_count: 9,
      uncorroborated_count: 0,
    },
    {
      vulnerability_id: "CVE-2026-0004",
      severity_class: "LOW",
      severity_score: 2.1,
      project_count: 1,
      instance_count: 4,
      uncorroborated_count: 0,
    },
  ],
  page: 0,
  entry_count: 4,
  entries_per_page: 50,
  total_entries: 4,
  total_pages: 1,
  matching_count: 4,
  filter_count: {},
  severity_counts: { CRITICAL: 2, HIGH: 5, MEDIUM: 9, LOW: 4, NONE: 0 },
  hidden_counts: { contradicted: 0, retired_all: 0, excluded_by_policy: 0 },
};

/** One week of the trend as the API sends it, starting on Monday `start` (UTC). */
export function week(
  start: string,
  open: [number, number, number, number, number],
  introduced = 0,
  fixed = 0,
  projects = 3,
  score = 80,
): Record<string, unknown> {
  const from = new Date(`${start}T00:00:00.000Z`);
  return {
    start: from.toISOString(),
    end: new Date(from.getTime() + 7 * 86_400_000).toISOString(),
    open: {
      CRITICAL: open[0],
      HIGH: open[1],
      MEDIUM: open[2],
      LOW: open[3],
      NONE: open[4],
    },
    introduced,
    fixed,
    project_count: projects,
    security_score: score,
  };
}

const trendWeeks = [
  week("2026-10-12", [3, 6, 10, 4, 0], 23, 0, 3, 70),
  week("2026-10-19", [2, 6, 9, 4, 0], 0, 2),
  week("2026-10-26", [2, 6, 9, 4, 0], 1, 1),
  week("2026-11-02", [2, 5, 9, 4, 0], 0, 1),
];

const licenseDist = { MIT: 40, "Apache-2.0": 12, ISC: 5 };

const ciaImpact = [
  { cia: "Confidentiality", impact: 0.6 },
  { cia: "Confidentiality", impact: 0.4 },
  { cia: "Integrity", impact: 0.3 },
  { cia: "Availability", impact: 0.8 },
];

const ticketStats = {
  total_open: 4,
  total_in_progress: 2,
  total_resolved_this_week: 1,
  total_closed: 3,
  by_priority: { critical: 1, high: 2, medium: 1, low: 0 },
  by_project: [],
  recent_tickets: [
    {
      id: "t-1",
      title: "CVE-2026-0001: lodash prototype pollution",
      status: "OPEN",
      priority: "CRITICAL",
      type: "VULNERABILITY",
      created_on: "2026-11-01T09:00:00Z",
      project_id: "proj-1",
      project_name: "web-frontend",
      has_external_links: false,
    },
  ],
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

/** The Dashboard, with its API mocked. */
export class DashboardPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly research: Locator;
  readonly projects: Locator;
  /** How often each endpoint was requested, by path below the organisation */
  readonly requests = new Map<string, number>();

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.research = page.getByRole("region", { name: "Research" });
    this.projects = page.getByRole("region", { name: "Projects" });
  }

  /**
   * Signs in and answers the Dashboard's endpoints. `hold` keeps the
   * Experiments request pending until the returned function is called.
   */
  async signIn(
    options: {
      datasets?: unknown[];
      experiments?: unknown[];
      published?: Record<string, unknown[]>;
      /** False answers as an organisation with no projects */
      projects?: boolean;
      /** False answers as an organisation whose projects have no analysis */
      analyses?: boolean;
      failExperiments?: boolean;
      hold?: boolean;
      /** Paths below the organisation, e.g. "/meta_data", answered with a 500 */
      fail?: string[];
      /** Points of the trend, oldest first */
      trend?: unknown[];
      licenseDist?: Record<string, number>;
    } = {},
  ): Promise<() => void> {
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const withProjects = options.projects ?? true;
    const publishedBy = options.published ?? samplePublished;

    await this.page.route(`**/api/org/${ORG}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname.replace(
        `/api/org/${ORG}`,
        "",
      );
      this.requests.set(path, (this.requests.get(path) ?? 0) + 1);
      if (options.fail?.includes(path)) {
        return route.fulfill({ status: 500, json: { status: "failure" } });
      }
      if (path === "/datasets") {
        return fulfil(route, paginated(options.datasets ?? sampleDatasets));
      }
      if (path === "/experiments") {
        if (options.hold) await held;
        if (options.failExperiments) {
          return route.fulfill({ status: 500, json: { status: "failure" } });
        }
        return fulfil(
          route,
          paginated(options.experiments ?? sampleExperiments),
        );
      }
      const publishedMatch = /^\/experiments\/([^/]+)\/published$/.exec(path);
      if (publishedMatch) {
        return fulfil(route, { data: publishedBy[publishedMatch[1]!] ?? [] });
      }
      if (path === "/meta_data") {
        return fulfil(route, {
          data: {
            ...metaData,
            projects: withProjects ? metaData.projects : [],
          },
        });
      }
      if (path === "/integrations/vcs") return fulfil(route, paginated([]));
      if (path === "/tickets/stats")
        return fulfil(route, { data: ticketStats });
      const points = (options.trend ?? trendWeeks) as Record<string, unknown>[];
      const dashboard: Record<string, unknown> = {
        "/vulnerabilities/trend": {
          period: "week",
          points:
            withProjects && (options.analyses ?? true)
              ? points
              : points.map((p) => ({ ...p, project_count: 0 })),
        },
        "/dashboard/overall_license_dist": options.licenseDist ?? licenseDist,
        "/dashboard/overall_cia_impact": ciaImpact,
      };
      if (path in dashboard) return fulfil(route, { data: dashboard[path] });
      if (path === "/vulnerabilities") return fulfil(route, vulnerabilities);
      if (path === "/freshness") {
        return fulfil(route, { data: { threshold_days: 14, projects: [] } });
      }
      return route.fallback();
    });
    return release;
  }

  async goto(): Promise<void> {
    await this.shell.goto("/");
  }

  /** One of the Research section's lists, by its name. */
  list(name: string): Locator {
    return this.research.getByRole("list", { name });
  }

  /** A project overview chart, by what it shows. */
  chart(name: string): Locator {
    return this.projects.getByRole("group", { name });
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
