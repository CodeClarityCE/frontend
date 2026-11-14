import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";
export const PROJECT = "proj-1";
export const ANALYSIS = "an-1";

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

const analysis = {
  id: ANALYSIS,
  created_on: "2025-01-06T10:00:00Z",
  analyzer: { id: "an-x", name: "Default analyzer" },
  status: "completed",
  branch: "main",
  steps: [
    [
      {
        Name: "vuln-finder",
        Version: "1",
        Status: "success",
        config: {},
        persistant_config: {},
      },
      {
        Name: "js-sbom",
        Version: "1",
        Status: "success",
        config: {},
        persistant_config: {},
      },
    ],
  ],
};

type Level = "critical" | "high" | "medium" | "low";
const SCORES: Record<Level, number> = {
  critical: 9.8,
  high: 7.5,
  medium: 5.3,
  low: 2.1,
};

/** A vulnerability finding as the list endpoint returns it. */
export function finding(
  id: string,
  level: Level,
  dependency: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    Id: `f-${id}`,
    Vulnerability: id,
    Sources: ["NVD"],
    Description: `A ${level} flaw in ${dependency} lets an attacker run code.`,
    WinningSource: "NVD",
    Severity: {
      Severity: SCORES[level],
      SeverityType: "CVSS_V31",
      Vector: "",
      Impact: 5.9,
      Exploitability: 3.9,
      ConfidentialityImpact: "HIGH",
      IntegrityImpact: level === "low" ? "NONE" : "LOW",
      AvailabilityImpact: "NONE",
    },
    Weaknesses: [
      {
        WeaknessId: "CWE-79",
        WeaknessName: "Cross-site Scripting",
        WeaknessDescription: "",
        WeaknessExtendedDescription: "",
        OWASPTop10Id: "1347",
        OWASPTop10Name: "Injection",
      },
    ],
    Affected: [
      {
        Affected: {},
        AffectedDependencyName: dependency,
        AffectedVersion: "1.0.0",
        AffectedDependency: dependency,
        AffectedDependencyFilePath: "package.json",
        AffectedDependencyImportPaths: [],
        PatchType: level === "low" ? "NONE" : "FULL",
      },
    ],
    Conflict: { ConflictWinner: "", ConflictFlag: "NO_CONFLICT" },
    VLAI: [],
    EPSS: { Score: 0.02, Percentile: 0.4 },
    is_blacklisted: false,
    ...overrides,
  };
}

export const sampleFindings = [
  finding("CVE-2024-0001", "critical", "lodash", {
    EPSS: { Score: 0.42, Percentile: 0.97 },
  }),
  finding("CVE-2024-0002", "high", "express", {
    Conflict: {
      ConflictWinner: "OSV",
      ConflictFlag: "MATCH_POSSIBLE_INCORRECT",
    },
  }),
  finding("CVE-2024-0003", "medium", "axios"),
  finding("CVE-2024-0004", "low", "minimist"),
];

const stats = {
  number_of_issues: 4,
  number_of_vulnerabilities: 4,
  number_of_vulnerable_dependencies: 4,
  number_of_direct_vulnerabilities: 2,
  number_of_transitive_vulnerabilities: 2,
  mean_severity: 6.2,
  max_severity: 9.8,
  number_of_critical: 1,
  number_of_high: 1,
  number_of_medium: 1,
  number_of_low: 1,
  number_of_none: 0,
  number_of_owasp_top_10_2021_a1: 0,
  number_of_owasp_top_10_2021_a2: 0,
  number_of_owasp_top_10_2021_a3: 4,
  number_of_owasp_top_10_2021_a4: 0,
  number_of_owasp_top_10_2021_a5: 0,
  number_of_owasp_top_10_2021_a6: 0,
  number_of_owasp_top_10_2021_a7: 0,
  number_of_owasp_top_10_2021_a8: 0,
  number_of_owasp_top_10_2021_a9: 0,
  number_of_owasp_top_10_2021_a10: 0,
  mean_confidentiality_impact: 8.1,
  mean_integrity_impact: 3.3,
  mean_availability_impact: 0,
  number_of_vulnerabilities_diff: 1,
  number_of_vulnerable_dependencies_diff: 0,
};

const cvss31 = {
  base_score: 9.8,
  exploitability_score: 3.9,
  impact_score: 5.9,
  attack_vector: "NETWORK",
  attack_complexity: "LOW",
  privileges_required: "NONE",
  user_interaction: "NONE",
  scope: "UNCHANGED",
  confidentiality_impact: "HIGH",
  integrity_impact: "HIGH",
  availability_impact: "HIGH",
};

/** The details endpoint's answer for one finding. */
export const sampleDetails = {
  vulnerability_info: {
    vulnerability_id: "CVE-2024-0001",
    description:
      "Prototype pollution in lodash lets an attacker change object defaults.",
    version_info: {
      affected_versions_string: "< 4.17.21",
      affected_versions_source: "NVD",
      patched_versions_string: ">= 4.17.21",
      versions: [
        { version: "4.17.20", status: "affected", release: "2020-08-13" },
        { version: "4.17.21", status: "not_affected", release: "2021-02-20" },
      ],
    },
    published: "2024-01-10T00:00:00Z",
    last_modified: "2024-02-01T00:00:00Z",
    sources: [
      {
        name: "NVD",
        vuln_url: "https://nvd.nist.gov/vuln/detail/CVE-2024-0001",
      },
      { name: "OSV", vuln_url: "https://osv.dev/vulnerability/CVE-2024-0001" },
    ],
    aliases: ["GHSA-aaaa-bbbb-cccc"],
  },
  dependency_info: {
    name: "lodash",
    published: "2020-08-13T00:00:00Z",
    description: "Lodash modular utilities.",
    keywords: ["util", "functional"],
    version: "4.17.20",
    package_manager_links: [],
    github_link: "github.com/lodash/lodash",
    homepage: "https://lodash.com",
  },
  severities: { cvss_31: cvss31, cvss_3: null, cvss_2: null },
  owasp_top_10: {
    name: "A03: Injection",
    description: "Untrusted data is sent to an interpreter.",
  },
  weaknesses: [
    {
      id: "CWE-1321",
      name: "Prototype Pollution",
      description: "The product does not control changes to object prototypes.",
    },
  ],
  patch: {},
  common_consequences: {
    "CWE-1321": [
      {
        scope: ["Integrity"],
        impact: ["Modify application data"],
        description: "",
      },
    ],
  },
  references: [
    { url: "https://github.com/lodash/lodash/pull/5085", tags: ["Patch"] },
    { url: "https://nvd.nist.gov/vuln/detail/CVE-2024-0001", tags: [] },
  ],
  location: [],
  other: { package_manager: "NPM" },
};

function paginated(
  data: unknown[],
  page: number,
  perPage: number,
  total: number,
): Record<string, unknown> {
  return {
    data,
    page,
    entry_count: data.length,
    entries_per_page: perPage,
    total_entries: total,
    total_pages: Math.max(1, Math.ceil(total / perPage)),
    matching_count: total,
    filter_count: {},
    status: "success",
  };
}

function sortFindings(
  list: Record<string, unknown>[],
  key: string,
  direction: string,
): Record<string, unknown>[] {
  const value = (f: Record<string, unknown>): string | number =>
    key === "cve"
      ? String(f.Vulnerability)
      : ((f.Severity as { Severity: number }).Severity ?? 0);
  const sorted = [...list].sort((a, b) =>
    value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0,
  );
  return direction === "DESC" ? sorted.reverse() : sorted;
}

/** The vulnerability results tab and details page, with their API mocked. */
export class VulnerabilitiesPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly table: Locator;
  readonly search: Locator;
  readonly cards: Locator;
  /** The query string of every vulnerability list request, in order. */
  readonly listRequests: URLSearchParams[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.table = page.getByRole("table", { name: "Vulnerabilities" });
    this.search = page.getByRole("searchbox", {
      name: "Search vulnerabilities",
    });
    this.cards = page.getByTestId("vulnerability-card");
  }

  /**
   * Signs in and answers the results endpoints. `hold` keeps the list and
   * details requests pending until the returned function is called.
   */
  async signIn(
    options: {
      findings?: Record<string, unknown>[];
      details?: Record<string, unknown>;
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
    const all = options.findings ?? sampleFindings;

    // Logos are bundled; anything else would be a live icon request.
    await this.page.route(
      /^https:\/\/api\d*\.(iconify\.design|simplesvg\.com|unisvg\.com)\//,
      (route) => route.abort(),
    );
    await this.page.route("**/api/knowledge/status", (route) =>
      fulfil(route, { data: { sources: [] } }),
    );
    await this.page.route(
      `**/api/org/${ORG}/projects/${PROJECT}**`,
      async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace(/^\/api/, "");
        const base = `/org/${ORG}/projects/${PROJECT}`;
        const results = `${base}/analysis/${ANALYSIS}`;
        if (path === base) return fulfil(route, { data: project });
        if (path === `${base}/analyses/${ANALYSIS}`)
          return fulfil(route, { data: analysis });
        if (path === `${results}/sbom/workspaces`)
          return fulfil(route, {
            data: { workspaces: ["."], package_manager: "NPM" },
          });
        if (path === `${results}/vulnerabilities/stats`)
          return fulfil(route, { data: stats });
        if (path === `${results}/vulnerabilities/malicious-packages`)
          return fulfil(route, { data: [] });
        if (path === `${results}/vulnerabilities/knowledge-snapshot`)
          return fulfil(route, { data: null });
        if (path.startsWith(`${results}/vulnerabilities/vulnerability/`)) {
          await wait();
          return fulfil(route, { data: options.details ?? sampleDetails });
        }
        if (path === `${results}/vulnerabilities`) {
          this.listRequests.push(url.searchParams);
          await wait();
          const page = Number(url.searchParams.get("page") ?? 0);
          const perPage = Number(
            url.searchParams.get("entries_per_page") ?? 20,
          );
          const search = url.searchParams.get("search_key") ?? "";
          const matching = sortFindings(
            all.filter((f) =>
              JSON.stringify(f).toLowerCase().includes(search.toLowerCase()),
            ),
            url.searchParams.get("sort_by") ?? "severity",
            url.searchParams.get("sort_direction") ?? "DESC",
          );
          return fulfil(
            route,
            paginated(
              matching.slice(page * perPage, (page + 1) * perPage),
              page,
              perPage,
              matching.length,
            ),
          );
        }
        return fulfil(route, { data: [] });
      },
    );
    return release;
  }

  async gotoResults(): Promise<void> {
    await this.shell.goto(
      `/results?analysis_id=${ANALYSIS}&project_id=${PROJECT}`,
    );
  }

  async gotoDetails(id = "CVE-2024-0001"): Promise<void> {
    await this.shell.goto(
      `/results/vulnerabilities_details?analysis_id=${ANALYSIS}&project_id=${PROJECT}&finding_id=${id}`,
    );
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

  /** The query of the latest list request. */
  lastQuery(): URLSearchParams {
    return (
      this.listRequests[this.listRequests.length - 1] ?? new URLSearchParams()
    );
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
