import { type Locator, type Page, type Route } from "@playwright/test";

import { experiment } from "./experiments.page.mjs";
import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";
const BASE = `**/api/org/${ORG}/experiments/exp-1`;

type RunStatus = "pending" | "done" | "failed" | "skipped";

/** One Experiment run as the API returns it. */
export function run(
  rank: number,
  status: RunStatus,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: `run-${rank}`,
    status,
    error: null,
    attempts: status === "pending" ? 0 : 1,
    branch: "main",
    commit_hash:
      status === "skipped" ? null : `${rank}abcdef0123456789abcdef0123456789`,
    committed_at: null,
    grid_index: 0,
    grid_date: null,
    shared_from_run_id: null,
    submitted_on: null,
    ended_on: null,
    analysis_id: status === "done" ? `an-${rank}` : null,
    project_id: status === "done" ? `p-${rank}` : null,
    entry: {
      id: `e-${rank}`,
      rank,
      full_name: `acme/repo-${rank + 1}`,
      git_url: `https://github.com/acme/repo-${rank + 1}`,
      stars: 5000 - rank * 10,
    },
    ...overrides,
  };
}

export const sampleRuns = [
  run(0, "done"),
  run(1, "failed", {
    attempts: 3,
    error: "missing result: vuln-finder",
  }),
  run(2, "skipped", { error: "repository not found" }),
  run(3, "done", { grid_date: "2026-09-01T00:00:00Z" }),
];

function lag(n: number, median: number, before = 0): object {
  return {
    n,
    median,
    p25: median - 12,
    p75: median + 20,
    min: median - 30,
    max: median + 60,
    before_disclosure: before,
  };
}

function days(n: number, median: number): object {
  return {
    n,
    median,
    p25: median - 10,
    p75: median + 15,
    min: median - 20,
    max: median + 40,
  };
}

function step(time: number, survival: number): object {
  return {
    time,
    survival,
    lower: Math.max(0, survival - 0.1),
    upper: Math.min(1, survival + 0.1),
    at_risk: 10,
    events: 1,
    censored: 0,
  };
}

function coverageRow(
  grid_date: string | null,
  failed: number,
  skipped: number,
): object {
  return {
    grid_date,
    runs: 100,
    done: 100 - failed - skipped,
    empty: 2,
    failed,
    skipped,
    pending: 0,
    mixed_knowledge: false,
  };
}

const scalars = {
  n_projects: 100,
  n_affected: 62,
  affected_share: 0.62,
  instances: 418,
  distinct_vuln_packages: 57,
  load_median: 2,
  load_mean: 4.2,
  load_max: 31,
  high_critical_share: 0.41,
  top10_pkg_share: 0.55,
  top10_proj_share: 0.38,
  gini_pkg: 0.71,
  gini_proj: 0.64,
  pkgs_clear_50: 6,
  pkgs_clear_80: 19,
  pkgs_clear_90: 31,
};

/** Results of a finished Experiment with a three-date grid. */
export const sampleResults = {
  coverage: {
    runs: 400,
    attempted: 400,
    done: 390,
    failed: 6,
    skipped: 4,
    pending: 0,
    failure_reasons: { "missing result: vuln-finder": 6 },
    skip_reasons: { "repository not found": 4 },
  },
  grid_coverage: [
    coverageRow("2026-08-01", 3, 2),
    coverageRow("2026-09-01", 2, 1),
    coverageRow(null, 1, 1),
  ],
  headline: {
    ...scalars,
    sev_counts: { CRITICAL: 21, HIGH: 150, MEDIUM: 160, LOW: 70, NONE: 17 },
    top_packages: [
      ["lodash", 18],
      ["minimist", 11],
      ["semver", 9],
    ],
    high_critical_share_of_classed: 0.43,
  },
  sweep: [
    { ...scalars, subset: "all" },
    { ...scalars, subset: "non_withdrawn", instances: 402 },
  ],
  epss: {
    nonnull_share: 0.88,
    median: 0.0042,
    p90: 0.12,
    over_10pct: 44,
    over_50pct: 9,
    missing_non_cve: 31,
    missing_cve: 19,
  },
  match_flags: { exact: 380, range: 38 },
  winning_source_head: { osv: 300, nvd: 118 },
  rqc: { spearman_rho: 0.21, p: 0.034, n: 98, excluded_zero_dep_projects: 2 },
  rqd: [
    { package_manager: "npm", projects: 70, med_deps: 640, med_vulns: 3 },
    { package_manager: "yarn", projects: 30, med_deps: 820, med_vulns: 4 },
  ],
  exposures: {
    exposures: 520,
    open: 180,
    fixed: 340,
    introductions: 120,
    present_at_first_observation: 400,
    fix_precision: { commit: 200, snapshot: 140 },
    introduction_precision: { commit: 70, snapshot: 50 },
  },
  fix_lag: {
    fixes: 340,
    snapshot_precision_share: 0.41,
    overall: lag(300, 46, 12),
    by_severity: [
      { key: "CRITICAL", ...lag(20, 21) },
      { key: "HIGH", ...lag(120, 40, 4) },
      { key: "MEDIUM", ...lag(110, 58, 6) },
      { key: "LOW", ...lag(50, 90, 2) },
    ],
    by_kind: [
      { key: "upgraded", ...lag(220, 41, 8) },
      { key: "removed_transitive", ...lag(80, 66, 4) },
    ],
    points: [
      {
        severity: "CRITICAL",
        kind: "upgraded",
        lag_days: 12,
        precision: "commit",
      },
      { severity: "HIGH", kind: "upgraded", lag_days: 35, precision: "commit" },
      {
        severity: "HIGH",
        kind: "removed_transitive",
        lag_days: 52,
        precision: "snapshot",
      },
      {
        severity: "MEDIUM",
        kind: "upgraded",
        lag_days: -8,
        precision: "commit",
      },
      {
        severity: "MEDIUM",
        kind: "upgraded",
        lag_days: 70,
        precision: "commit",
      },
      {
        severity: "LOW",
        kind: "removed_transitive",
        lag_days: 120,
        precision: "snapshot",
      },
    ],
  },
  probes: {
    fixes: { found: 200, ambiguous: 12, not_found: 100, not_probed: 28 },
    introductions: { found: 70, ambiguous: 4, not_found: 40, not_probed: 6 },
    not_found_reasons: { "history rewritten": 80, "lockfile missing": 60 },
    budget: { analysis_budget: null, analyses_submitted: 1840, spent: false },
  },
  residence: {
    introductions: 120,
    snapshot_precision_share: 0.42,
    present_at_first_observation: 400,
    undated: 3,
    overall: days(80, 210),
    by_severity: [
      { key: "HIGH", ...days(40, 180) },
      { key: "MEDIUM", ...days(40, 240) },
    ],
    points: [
      { severity: "HIGH", residence_days: 150, precision: "commit" },
      { severity: "HIGH", residence_days: 220, precision: "commit" },
      { severity: "MEDIUM", residence_days: 260, precision: "snapshot" },
    ],
    after_disclosure: days(37, 64),
    after_disclosure_by_severity: [
      { key: "HIGH", ...days(20, 50) },
      { key: "MEDIUM", ...days(17, 80) },
    ],
  },
  exposure_survival: {
    censored_at: "2026-10-01",
    snapshot_precision_share: 0.41,
    overall: {
      key: "all",
      n: 520,
      fixed: 340,
      censored: 180,
      median_days: 64,
      curve: [step(10, 0.9), step(30, 0.72), step(64, 0.5), step(120, 0.34)],
    },
    by_severity: [
      {
        key: "HIGH",
        n: 200,
        fixed: 150,
        censored: 50,
        median_days: 40,
        curve: [step(10, 0.85), step(40, 0.5), step(90, 0.25)],
      },
    ],
  },
  upstream_leverage: {
    packages_to_clear: [
      {
        grid_date: "2026-08-01",
        projects: 95,
        instances: 380,
        distinct_packages: 50,
        pkgs_clear_50: 5,
        pkgs_clear_80: 17,
      },
      {
        grid_date: "2026-09-01",
        projects: 97,
        instances: 400,
        distinct_packages: 54,
        pkgs_clear_50: 6,
        pkgs_clear_80: 18,
      },
      {
        grid_date: null,
        projects: 98,
        instances: 418,
        distinct_packages: 57,
        pkgs_clear_50: 6,
        pkgs_clear_80: 19,
      },
    ],
    fix_kinds: [
      {
        interval_from: "2026-08-01",
        interval_to: "2026-09-01",
        fixes: 160,
        upgraded: 110,
        removed_direct: 10,
        removed_transitive: 35,
        unknown: 5,
        removed_transitive_share: 0.23,
        snapshot_precision_share: 0.4,
      },
      {
        interval_from: "2026-09-01",
        interval_to: null,
        fixes: 180,
        upgraded: 110,
        removed_direct: 15,
        removed_transitive: 45,
        unknown: 10,
        removed_transitive_share: 0.26,
        snapshot_precision_share: 0.42,
      },
    ],
    overall: {
      fixes: 340,
      upgraded: 220,
      removed_direct: 25,
      removed_transitive: 80,
      unknown: 15,
      removed_transitive_share: 0.25,
      snapshot_precision_share: 0.41,
    },
  },
  load_over_time: [
    {
      grid_date: "2026-08-01",
      as_of_date: "2026-08-01",
      projects: 95,
      hindsight: 380,
      as_of: 300,
      undated: 4,
    },
    {
      grid_date: "2026-09-01",
      as_of_date: "2026-09-01",
      projects: 97,
      hindsight: 400,
      as_of: 350,
      undated: 3,
    },
    {
      grid_date: null,
      as_of_date: "2026-10-06",
      projects: 98,
      hindsight: 418,
      as_of: 410,
      undated: 2,
    },
  ],
  bootstrap_intervals: null,
  provenance: {
    api_version: "v1.4.0",
    analyzer_steps: [
      [
        { name: "js-sbom", version: "v1" },
        { name: "vuln-finder", version: "v1" },
      ],
    ],
    knowledge_start: {
      knowledge_sources: { nvd: "2026-10-05", osv: "2026-10-05" },
      epss_rows: 250000,
    },
    knowledge_end: {
      knowledge_sources: { nvd: "2026-10-05", osv: "2026-10-05" },
      epss_rows: 250000,
    },
    knowledge_changed: false,
    created_by: "John Doe",
    created_on: "2026-10-05T09:00:00Z",
    started_on: "2026-10-05T09:01:00Z",
    ended_on: "2026-10-06T09:00:00Z",
  },
};

export const sampleCatalog = {
  metrics: [
    {
      id: "load_over_time",
      label: "Load over time",
      chart_forms: [{ id: "line", label: "Line" }],
      group_by: [],
      filters: [
        {
          id: "view",
          label: "View",
          options: [
            { id: "hindsight", label: "Hindsight" },
            { id: "as_of", label: "As-of" },
          ],
        },
      ],
    },
  ],
};

export const sampleFigureData = {
  x_title: "Grid date",
  y_title: "Vulnerability instances",
  labels: ["2026-08-01", "2026-09-01", "HEAD"],
  series: [
    { key: "hindsight", label: "Hindsight", values: [380, 400, 418] },
    { key: "as_of", label: "As-of", values: [300, 350, 410] },
  ],
};

export const samplePublishedVersion = {
  metric_version: 2,
  published_on: "2026-10-07T10:00:00Z",
  published_by_name: "John Doe",
  package_checksum:
    "9f2c1e0b7a6d5c4b3a29180f7e6d5c4b3a29180f7e6d5c4b3a29180f7e6d5c4b",
};

interface DetailOptions {
  experiment?: Record<string, unknown>;
  runs?: unknown[];
  results?: unknown;
  published?: unknown[];
  currentMetricVersion?: number;
  figures?: unknown[];
  /** Keeps the results request pending */
  holdResults?: boolean;
}

/** The Experiment detail page (progress, results, Figures), with its API mocked. */
export class ExperimentDetailPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly progress: Locator;
  readonly runsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.progress = page.getByRole("region", { name: "Progress" });
    this.runsTable = page.getByRole("table", { name: "Experiment runs" });
  }

  /** Signs in and answers every endpoint the detail page calls. */
  async signIn(options: DetailOptions = {}): Promise<void> {
    await this.shell.signIn();
    const exp = options.experiment ?? experiment("exp-1", "Fix lag study");
    const runs = options.runs ?? sampleRuns;
    const results = options.results ?? sampleResults;

    await this.page.route(`${BASE}**`, async (route) => {
      const path = new URL(route.request().url()).pathname.replace(
        /.*\/experiments\/exp-1/,
        "",
      );
      if (path === "") return fulfil(route, { data: exp });
      if (path === "/runs") {
        return fulfil(route, {
          data: runs,
          page: 0,
          entry_count: runs.length,
          entries_per_page: 100,
          total_entries: runs.length,
          total_pages: 1,
          matching_count: runs.length,
          filter_count: {},
          status: "success",
        });
      }
      if (path === "/results" || /^\/published\/\d+$/.test(path)) {
        if (options.holdResults) return; // never answered
        return fulfil(route, { data: results });
      }
      if (path === "/results/progress") {
        return fulfil(route, { data: { done: 120, total: 400 } });
      }
      if (path === "/published") {
        return fulfil(route, { data: options.published ?? [] });
      }
      if (path === "/metric-version") {
        return fulfil(route, {
          data: { metric_version: options.currentMetricVersion ?? 2 },
        });
      }
      if (path === "/figure-catalog") {
        return fulfil(route, { data: sampleCatalog });
      }
      if (path === "/figures") {
        return fulfil(route, { data: options.figures ?? [] });
      }
      if (path === "/figure-data") {
        return fulfil(route, { data: sampleFigureData });
      }
      return route.fallback();
    });
  }

  async goto(): Promise<void> {
    await this.shell.goto("/experiments/detail?id=exp-1");
  }

  tab(name: "Results" | "Figures"): Locator {
    return this.page.getByRole("tab", { name });
  }

  /** The runs table's body rows. */
  runRows(): Locator {
    return this.runsTable.locator("tbody tr");
  }

  /** A results section, by its heading. */
  section(name: string): Locator {
    return this.page.getByRole("region", { name });
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
