import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "WONT_FIX";
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/** A ticket as the list endpoint returns it, with readable defaults. */
export function ticket(
  id: string,
  title: string,
  status: Status = "OPEN",
  priority: Priority = "MEDIUM",
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
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
    project_id: "proj-1",
    project_name: "web-frontend",
    has_external_links: false,
    ...overrides,
  };
}

export const sampleTickets = [
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
export const sampleDetail = {
  ...sampleTickets[0],
  description: "Prototype pollution in lodash before 4.17.21.",
  affected_version: "4.17.15",
  recommended_version: "4.17.21",
  remediation_notes: "Upgrade lodash to 4.17.21",
  created_by_id: "u-1",
  created_by_name: "John Doe",
  external_links: [],
  occurrence_count: 3,
  active_occurrence_count: 2,
};

export const sampleVulnerability = {
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
      if (path.endsWith("/vulnerability")) {
        return fulfil(route, { data: sampleVulnerability });
      }
      if (request.method() === "PATCH") {
        this.updates.push(request.postDataJSON());
        return fulfil(route, { status_code: 200, status: "success" });
      }
      return fulfil(route, { data: sampleDetail });
    });
    return release;
  }

  async goto(path = "/tickets"): Promise<void> {
    await this.shell.goto(path);
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

  /** The ticket detail panel. */
  detail(): Locator {
    return this.page.getByRole("dialog", { name: sampleDetail.title });
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
