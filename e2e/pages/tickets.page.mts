import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "WONT_FIX";
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/** A list row: the fields tests read are typed, the rest stay open. */
type Ticket = Record<string, unknown> & {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
};

/** A ticket as the list endpoint returns it, with readable defaults. */
export function ticket(
  id: string,
  title: string,
  status: Status = "OPEN",
  priority: Priority = "MEDIUM",
  overrides: Record<string, unknown> = {},
): Ticket {
  return {
    id,
    title,
    status,
    priority,
    type: "VULNERABILITY",
    vulnerability_id: `CVE-2026-${id.replace(/\D/g, "").padStart(4, "0")}`,
    affected_package: "lodash",
    severity_score: 7.5,
    severity_class: "HIGH",
    created_on: "2026-10-01T09:00:00Z",
    updated_on: "2026-10-01T09:00:00Z",
    project_id: "proj-1",
    project_name: "web-frontend",
    has_external_links: false,
    external_status: null,
    ...overrides,
  };
}

export const sampleTickets: [Ticket, ...Ticket[]] = [
  ticket("t-1", "CVE-2026-0001: lodash prototype pollution", "OPEN", "HIGH"),
  ticket("t-2", "CVE-2026-0002: axios SSRF", "IN_PROGRESS", "CRITICAL", {
    affected_package: "axios",
    project_name: "api-gateway",
    assigned_to_name: "Jane Roe",
    created_on: "2026-10-05T09:00:00Z",
  }),
  ticket("t-3", "Upgrade express to 5", "RESOLVED", "LOW", {
    type: "UPGRADE",
    vulnerability_id: undefined,
    affected_package: "express",
    created_on: "2026-09-20T09:00:00Z",
  }),
];

/** The detail of the first sample ticket. */
const sampleDetail = {
  ...sampleTickets[0],
  description: "Prototype pollution in lodash before 4.17.21.",
  affected_version: "4.17.15",
  recommended_version: "4.17.21",
  remediation_notes: "Upgrade lodash to 4.17.21",
  resolved_on: null,
  due_date: null,
  created_by_id: "u-1",
  created_by_name: "John Doe",
  external_links: [],
  occurrence_count: 3,
  active_occurrence_count: 2,
};

// One installed version of a vulnerability the remediation resolves.
function remediationInstance(
  id: string,
  vulnerabilityId: string,
  installed: string,
  fixed: string | null,
  severity: [string, number],
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const repo = "https://github.com/nodeca/js-yaml";
  return {
    id,
    analysis_id: "a-1",
    vulnerability_id: vulnerabilityId,
    analysis_vulnerability_id: vulnerabilityId,
    package: "js-yaml",
    ecosystem: "npm",
    installed_version: installed,
    workspace: ".",
    prod: false,
    severity_class: severity[0],
    severity_score: severity[1],
    fixed_version: fixed,
    top_level_dependencies: [
      {
        name: "grunt",
        version: "1.5.3",
        dev: true,
        path: [
          { name: "grunt", version: "1.5.3" },
          { name: "js-yaml", version: installed },
        ],
      },
      {
        name: "lockfile-lint",
        version: "4.14.1",
        dev: true,
        path: [
          { name: "lockfile-lint", version: "4.14.1" },
          { name: "lockfile-lint-api", version: "5.9.2" },
          { name: "@yarnpkg/parsers", version: "3.0.3" },
          { name: "js-yaml", version: installed },
        ],
      },
    ],
    is_active: true,
    detected_on: "2026-10-01T09:00:00Z",
    resolved_on: null,
    diff_links: {
      fix_commits: [
        {
          url: `${repo}/commit/24f13e7a3e6b5c9d8f0a1b2c3d4e5f60718293a4`,
          sha: "24f13e7a3e6b5c9d8f0a1b2c3d4e5f60718293a4",
        },
      ],
      compare: fixed
        ? {
            url: `${repo}/compare/v${installed}...v${fixed}`,
            host: "github",
            repository: repo,
            from_tag: `v${installed}`,
            to_tag: `v${fixed}`,
            guessed: true,
          }
        : null,
      registry_diff: fixed
        ? {
            tool: "npm",
            command: `npm diff --diff=js-yaml@${installed} --diff=js-yaml@${fixed}`,
          }
        : null,
    },
    ...extra,
  };
}

/** A remediation ticket resolving several vulnerabilities in two installed versions. */
export const remediationDetail = {
  ...sampleDetail,
  id: "t-9",
  title: "Force js-yaml to 4.3.2",
  vulnerability_id: "CVE-2026-59869",
  affected_package: "js-yaml",
  description: "The external issue body, shown as structured fields instead.",
  remediation_notes: undefined,
  occurrence_count: 6,
  active_occurrence_count: 5,
  remediation: {
    kind: "force_version",
    workspace: ".",
    package: "js-yaml",
    installed_versions: ["3.14.1", "4.1.0"],
    target_version: "4.3.2",
    potentially_breaking: true,
    package_manager: "npm",
    command: "npm pkg set 'overrides[js-yaml]=4.3.2' && npm install",
    manifest_edit: null,
  },
  instances: [
    remediationInstance("i-1", "CVE-2026-59869", "3.14.1", "3.15.0", [
      "HIGH",
      7.5,
    ]),
    remediationInstance("i-2", "CVE-2026-59869", "4.1.0", "4.3.0", [
      "HIGH",
      7.5,
    ]),
    remediationInstance("i-3", "GHSA-5p4m-2wfm-xmqj", "3.14.1", "3.15.1", [
      "HIGH",
      7.5,
    ]),
    remediationInstance(
      "i-4",
      "CVE-2025-64718",
      "4.1.0",
      "4.1.1",
      ["MEDIUM", 5.3],
      {
        is_active: false,
        resolved_on: "2026-10-10T09:00:00Z",
      },
    ),
    remediationInstance("i-5", "CVE-2026-53550", "3.14.1", null, [
      "MEDIUM",
      5.3,
    ]),
  ],
};

const sampleVulnerability = {
  vulnerability_info: {
    vulnerability_id: "CVE-2026-0001",
    description: "Prototype pollution",
    version_info: { affected_version: "4.17.15" },
    published: "2026-01-01",
    last_modified: "2026-01-02",
    sources: [],
    aliases: [],
  },
  severities: {
    cvss_31: {
      base_score: 7.5,
      exploitability_score: 3.9,
      impact_score: 3.6,
      attack_vector: "NETWORK",
      attack_complexity: "LOW",
      privileges_required: "NONE",
      user_interaction: "NONE",
      scope: "UNCHANGED",
      confidentiality_impact: "NONE",
      integrity_impact: "HIGH",
      availability_impact: "NONE",
    },
  },
  owasp_top_10: null,
  weaknesses: [
    { id: "CWE-1321", name: "Prototype Pollution", description: "" },
  ],
  patch: { fix_available: true, recommended_version: "4.17.21" },
  common_consequences: {},
  references: [{ url: "https://example.com/advisory", tags: [] }],
  location: ["package-lock.json"],
  other: { package_manager: "NPM", epss_score: 0.12, epss_percentile: 0.9 },
};

function paginated(
  all: unknown[],
  page = 0,
  size = 100,
): Record<string, unknown> {
  const data = all.slice(page * size, (page + 1) * size);
  return {
    data,
    page,
    entry_count: data.length,
    entries_per_page: size,
    total_entries: all.length,
    total_pages: Math.max(1, Math.ceil(all.length / size)),
    matching_count: all.length,
    filter_count: {},
    status_code: 200,
    status: "success",
  };
}

/** The Tickets page, with its API mocked. */
export class TicketsPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly table: Locator;
  readonly filter: Locator;
  /** Status changes the page sent, as request bodies. */
  readonly updates: unknown[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.table = page.getByRole("table");
    this.filter = page.getByRole("searchbox");
  }

  /**
   * Signs in and answers the ticket endpoints. `hold` keeps the list request
   * pending until the returned function is called.
   */
  async signIn(
    options: {
      tickets?: unknown[];
      integrations?: unknown[];
      hold?: boolean;
      // Page size the mocked API serves, to test fetching every page.
      pageSize?: number;
      fail?: boolean;
      // The ticket endpoint answers 404.
      missing?: boolean;
      // Fields that replace the sample detail's and vulnerability's.
      detail?: Record<string, unknown>;
      vulnerability?: Record<string, unknown>;
    } = {},
  ): Promise<() => void> {
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });

    await this.page.route(`**/api/org/${ORG}/tickets**`, async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path.endsWith("/tickets")) {
        if (options.hold) await held;
        if (options.fail) {
          return route.fulfill({ status: 500, json: { status: "failure" } });
        }
        const page = Number(new URL(request.url()).searchParams.get("page"));
        return fulfil(
          route,
          paginated(options.tickets ?? sampleTickets, page, options.pageSize),
        );
      }
      if (path.endsWith("/tickets/integrations")) {
        return fulfil(route, { data: options.integrations ?? [] });
      }
      if (path.endsWith("/events")) {
        return fulfil(route, { data: [] });
      }
      if (options.missing && request.method() === "GET") {
        return route.fulfill({ status: 404, json: { status: "failure" } });
      }
      if (path.endsWith("/vulnerability")) {
        return fulfil(route, {
          data: { ...sampleVulnerability, ...options.vulnerability },
        });
      }
      if (request.method() === "PATCH") {
        this.updates.push(request.postDataJSON());
        return fulfil(route, { status_code: 200, status: "success" });
      }
      return fulfil(route, {
        status_code: 200,
        status: "success",
        data: { ...sampleDetail, ...options.detail },
      });
    });
    return release;
  }

  async goto(path = "/tickets"): Promise<void> {
    await this.shell.goto(path);
  }

  /** The table's body rows, without the header row. */
  rows(): Locator {
    return this.table
      .getByRole("row")
      .filter({ has: this.page.getByRole("cell") });
  }

  columnHeader(name: string): Locator {
    return this.table.getByRole("columnheader", { name });
  }

  sortButton(name: string): Locator {
    return this.columnHeader(name).getByRole("button");
  }

  /** The ticket page's content. */
  detail(): Locator {
    return this.page.getByRole("main");
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
