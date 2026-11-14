import { type Locator, type Page, type Route } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

/** A license policy as the API returns it. */
export function licensePolicy(
  id: string,
  name: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    name,
    description: `${name} for every project`,
    policy_type: "WHITELIST",
    default: false,
    created_by: "John Doe",
    created_on: "2026-10-01T09:00:00Z",
    content: ["MIT", "Apache-2.0"],
    ...overrides,
  };
}

/** A vulnerability policy as the API returns it. */
export function vulnerabilityPolicy(
  id: string,
  name: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    name,
    description: `${name} excluded from results`,
    policy_type: "BLACKLIST",
    default: false,
    created_by: "John Doe",
    created_on: "2026-10-02T09:00:00Z",
    content: ["CVE-2024-0001", "CVE-2024-0002"],
    ...overrides,
  };
}

/** An SPDX license from the knowledge base. */
export function license(id: string, name: string): Record<string, unknown> {
  return {
    id,
    licenseId: id,
    name,
    description: "",
    deps_using_license: [],
    license_category: "permissive",
    license_compliance_violation: false,
    license_properties: {
      permissions: [],
      conditions: [],
      limitations: [],
      usage: "",
    },
    references: [],
    unable_to_infer: false,
    _key: id,
  };
}

export const sampleLicensePolicies = [
  licensePolicy("lp-1", "Permissive only", { default: true }),
  licensePolicy("lp-2", "No copyleft", {
    policy_type: "BLACKLIST",
    content: ["GPL-3.0-only"],
  }),
];

export const sampleVulnerabilityPolicies = [
  vulnerabilityPolicy("vp-1", "False positives", { default: true }),
  vulnerabilityPolicy("vp-2", "Test fixtures only", {
    content: ["CVE-2023-1234"],
  }),
];

export const sampleLicenses = [
  license("MIT", "MIT License"),
  license("Apache-2.0", "Apache License 2.0"),
  license("GPL-3.0-only", "GNU General Public License v3.0 only"),
  license("BSD-3-Clause", 'BSD 3-Clause "New" or "Revised" License'),
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

/** The organisation policy pages, with their API mocked. */
export class OrgPoliciesPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  /** Requests the page sent that change data, as "METHOD path". */
  readonly writes: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
  }

  /** Signs in and answers the policy and license endpoints. */
  async signIn(
    options: {
      licensePolicies?: unknown[];
      vulnerabilityPolicies?: unknown[];
      licenses?: unknown[];
    } = {},
  ): Promise<void> {
    await this.shell.signIn();
    const licensePolicies = options.licensePolicies ?? sampleLicensePolicies;
    const vulnerabilityPolicies =
      options.vulnerabilityPolicies ?? sampleVulnerabilityPolicies;

    await this.page.route(`**/api/org/${ORG}/policies/**`, (route: Route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname.replace(/^\/api/, "");
      if (request.method() !== "GET") {
        this.writes.push(`${request.method()} ${path}`);
        return fulfil(route, { id: "new-policy", status: "success" });
      }
      const [, kind, id] =
        /\/policies\/(license_policy|vulnerability_policy)\/?(.*)$/.exec(
          path,
        ) ?? [];
      const list =
        kind === "license_policy" ? licensePolicies : vulnerabilityPolicies;
      if (id) {
        const found = (list as { id: string }[]).find((p) => p.id === id);
        return fulfil(route, { data: found });
      }
      return fulfil(route, paginated(list));
    });
    await this.page.route("**/api/knowledge/license**", (route: Route) =>
      fulfil(route, paginated(options.licenses ?? sampleLicenses)),
    );
  }

  async gotoList(): Promise<void> {
    await this.shell.goto(`/orgs/manage/policies/${ORG}`);
  }

  async gotoCreateLicense(): Promise<void> {
    await this.shell.goto(`/orgs/add/policy/${ORG}`);
  }

  async gotoEditLicense(id = "lp-1"): Promise<void> {
    await this.shell.goto(`/orgs/edit/policy/${ORG}?policyId=${id}`);
  }

  async gotoCreateVulnerability(): Promise<void> {
    await this.shell.goto(`/orgs/add/vulnerability-policy/${ORG}`);
  }

  tab(name: string): Locator {
    return this.page.getByRole("tab", { name });
  }

  table(name: string): Locator {
    return this.page.getByRole("table", { name });
  }

  rows(tableName: string): Locator {
    return this.table(tableName).locator("tbody tr");
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
