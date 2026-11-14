import { expect, type Locator, type Page, type Route } from "@playwright/test";

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

function step(name: string): Record<string, unknown> {
  return {
    Name: name,
    Version: "1",
    Status: "success",
    config: {},
    persistant_config: {},
  };
}

const analysis = {
  id: ANALYSIS,
  created_on: "2025-01-06T10:00:00Z",
  analyzer: { id: "an-x", name: "Default analyzer" },
  status: "completed",
  branch: "main",
  steps: [
    [step("js-sbom")],
    [step("license-finder"), step("js-patching"), step("codeql")],
  ],
};

/** One dependency as the SBOM list endpoint returns it. */
export function dependency(
  name: string,
  version: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    name,
    version,
    newest_release: version,
    key: `${name}@${version}`,
    purl: `pkg:npm/${name}@${version}`,
    is_direct: false,
    is_direct_count: 0,
    is_transitive: true,
    is_transitive_count: 1,
    prod: true,
    dev: false,
    deprecated: false,
    deprecated_message: "",
    outdated: false,
    licenses: [{ id: "MIT" }],
    release: "2024-05-01T00:00:00Z",
    ...overrides,
  };
}

export const sampleDependencies = [
  dependency("express", "4.18.2", {
    newest_release: "5.0.1",
    is_direct: true,
    is_direct_count: 1,
    outdated: true,
  }),
  dependency("lodash", "4.17.20", {
    newest_release: "4.17.21",
    is_direct: true,
    is_direct_count: 1,
    outdated: true,
  }),
  dependency("request", "2.88.2", {
    deprecated: true,
    deprecated_message: "request has been deprecated",
  }),
  dependency("vitest", "3.2.0", {
    is_direct: true,
    is_direct_count: 1,
    prod: false,
    dev: true,
  }),
  dependency("ms", "2.1.3"),
];

const sbomStats = {
  number_of_dependencies: 5,
  number_of_direct_dependencies: 3,
  number_of_transitive_dependencies: 2,
  number_of_both_direct_transitive_dependencies: 0,
  number_of_deprecated_dependencies: 1,
  number_of_unlicensed_dependencies: 0,
  number_of_outdated_dependencies: 2,
  number_of_dev_dependencies: 1,
  number_of_non_dev_dependencies: 4,
};

const vulnStats = { number_of_issues: 3, number_of_vulnerabilities: 3 };

export const sampleLicenses = [
  {
    id: "MIT",
    licenseId: "MIT",
    name: "MIT License",
    description: "A short and simple permissive license.",
    license_category: "permissive",
    license_compliance_violation: false,
    unable_to_infer: false,
    deps_using_license: ["express@4.18.2", "lodash@4.17.20", "ms@2.1.3"],
    license_properties: {
      permissions: ["commercial-use", "modifications"],
      conditions: ["include-copyright"],
      limitations: ["liability", "warranty"],
      usage: "",
    },
    references: ["https://opensource.org/licenses/MIT"],
    _key: "MIT",
  },
  {
    id: "GPL-3.0",
    licenseId: "GPL-3.0",
    name: "GNU General Public License v3.0",
    description: "A strong copyleft license.",
    license_category: "copyleft",
    license_compliance_violation: true,
    unable_to_infer: false,
    deps_using_license: ["request@2.88.2"],
    license_properties: {
      permissions: ["commercial-use"],
      conditions: ["disclose-source", "same-license"],
      limitations: ["liability"],
      usage: "",
    },
    references: [],
    _key: "GPL-3.0",
  },
  {
    id: "Custom",
    licenseId: "Custom",
    name: "",
    description: "",
    license_category: "",
    license_compliance_violation: false,
    unable_to_infer: true,
    deps_using_license: ["vitest@3.2.0"],
    license_properties: null,
    references: [],
    _key: "Custom",
  },
];

function toPatch(dep: string, version: string, vuln: string, path: string[]) {
  return {
    DependencyName: dep,
    DependencyVersion: version,
    Path: path,
    Vulnerability: {
      VulnerabilityId: vuln,
      Severity: { Severity: 7.5, Impact: 5.9, Exploitability: 3.9 },
    },
  };
}

const semver = (major: number, minor: number, patch: number) => ({
  Major: major,
  Minor: minor,
  Patch: patch,
  PreReleaseTag: "",
  MetaData: "",
});

const patches = {
  patches: {
    "express@4.18.2": {
      TopLevelVulnerable: false,
      IsPatchable: "FULL",
      Unpatchable: [],
      Patchable: [
        toPatch("qs", "6.10.3", "CVE-2022-24999", ["express", "qs"]),
        toPatch("cookie", "0.5.0", "CVE-2024-47764", ["express", "cookie"]),
      ],
      Introduced: [],
      Patches: { "qs@6.10.3": semver(6, 11, 0) },
      Update: semver(4, 21, 2),
    },
    "request@2.88.2": {
      TopLevelVulnerable: true,
      IsPatchable: "NONE",
      Unpatchable: [
        toPatch("request", "2.88.2", "CVE-2023-28155", ["request"]),
      ],
      Patchable: [],
      Introduced: [],
      Patches: {},
      Update: semver(0, 0, 0),
    },
  },
  dev_patches: {
    "vitest@3.2.0": {
      TopLevelVulnerable: false,
      IsPatchable: "PARTIAL",
      Unpatchable: [
        toPatch("esbuild", "0.21.5", "GHSA-67mh-4wv8-2f99", [
          "vitest",
          "vite",
          "esbuild",
        ]),
      ],
      Patchable: [
        toPatch("vite", "5.4.0", "CVE-2025-30208", ["vitest", "vite"]),
      ],
      Introduced: [],
      Patches: {},
      Update: semver(3, 2, 4),
    },
  },
};

const patchingStats = {
  before_patch_number_of_issues: 4,
  after_patch_number_of_issues: 2,
  before_patch_number_of_vulnerabilities: 4,
  after_patch_number_of_vulnerabilities: 2,
  before_patch_number_of_vulnerable_dependencies: 3,
  after_patch_number_of_vulnerable_dependencies: 2,
  before_patch_number_of_critical: 1,
  after_patch_number_of_critical: 0,
  before_patch_number_of_high: 2,
  after_patch_number_of_high: 1,
  before_patch_number_of_medium: 1,
  after_patch_number_of_medium: 1,
  before_patch_number_of_low: 0,
  after_patch_number_of_low: 0,
  before_patch_number_of_none: 0,
  after_patch_number_of_none: 0,
  before_patch_overall_confidentiality_impact: 6.2,
  after_patch_overall_confidentiality_impact: 3.1,
  before_patch_overall_integrity_impact: 4.0,
  after_patch_overall_integrity_impact: 2.0,
  before_patch_overall_availability_impact: 1.5,
  after_patch_overall_availability_impact: 0.5,
};

const manifest = {
  patched_manifest_raw: { name: "web-frontend" },
  patched_manifest: {
    name: "web-frontend",
    version: "1.0.0",
    description: "",
    dependencies: {
      express: {
        vulnerable: true,
        patch_type: "FULL",
        original_constraint: "^4.18.2",
        upgrade_to: "^4.21.2",
        upgrade_to_installed_ver: false,
      },
      request: {
        vulnerable: true,
        patch_type: "NONE",
        original_constraint: "^2.88.2",
        upgrade_to: "",
        upgrade_to_installed_ver: false,
      },
      ms: {
        vulnerable: false,
        patch_type: "NONE",
        original_constraint: "^2.1.3",
        upgrade_to: "",
        upgrade_to_installed_ver: false,
      },
    },
  },
  other_info: { package_manager: "NPM", relative_package_file: "package.json" },
};

export const sampleCodeql = [
  {
    ruleId: "js/sql-injection",
    ruleIndex: 0,
    message: { text: "This query depends on a user-provided value." },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: "src/db.js", uriBaseId: "", index: 0 },
          region: { startLine: 12, endLine: 12, startColumn: 5, endColumn: 40 },
        },
      },
    ],
  },
  {
    ruleId: "js/xss",
    ruleIndex: 1,
    message: { text: "Cross-site scripting from a URL parameter." },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: "src/view.js", uriBaseId: "", index: 1 },
          region: { startLine: 40, endLine: 42, startColumn: 1, endColumn: 9 },
        },
      },
    ],
  },
];

export const sampleDetails = {
  name: "lodash",
  version: "4.17.20",
  latest_version: "4.17.21",
  dependencies: {},
  dev_dependencies: {},
  transitive: false,
  source: { Type: "git", Url: "git+https://github.com/lodash/lodash.git" },
  package_manager: "NPM",
  license: "MIT",
  engines: { node: ">=4" },
  release_date: "2020-08-13T00:00:00Z",
  lastest_release_date: "2021-02-20T00:00:00Z",
  vulnerabilities: ["CVE-2021-23337", "CVE-2020-28500"],
  severity_dist: { critical: 0, high: 1, medium: 1, low: 0, none: 0 },
};

const graph = [
  { id: "web-frontend@1.0.0", childrenIds: ["lodash@4.17.20"], prod: true },
  {
    id: "lodash@4.17.20",
    parentIds: ["web-frontend@1.0.0"],
    prod: true,
    dev: false,
  },
];

function paginated(
  data: unknown[],
  page: number,
  perPage: number,
): Record<string, unknown> {
  return {
    data: data.slice(page * perPage, (page + 1) * perPage),
    page,
    entry_count: Math.min(perPage, data.length),
    entries_per_page: perPage,
    total_entries: data.length,
    total_pages: Math.max(1, Math.ceil(data.length / perPage)),
    matching_count: data.length,
    filter_count: {},
    status: "success",
  };
}

export interface ResultTabsOptions {
  dependencies?: Record<string, unknown>[];
  licenses?: Record<string, unknown>[];
  codeql?: Record<string, unknown>[];
  /** Keeps the tab's main requests pending until the returned function runs. */
  hold?: boolean;
  /** Leaves the real clock: the fixed one stops menus moving focus. */
  realClock?: boolean;
}

/** The SBOM, licence, patch and CodeQL result tabs, with their API mocked. */
export class ResultTabsPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
  }

  async signIn(options: ResultTabsOptions = {}): Promise<() => void> {
    // A fixed date keeps relative times like "6 years ago" stable.
    if (!options.realClock)
      await this.page.clock.setFixedTime(new Date("2026-06-01T12:00:00Z"));
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const wait = async (): Promise<void> => {
      if (options.hold) await held;
    };
    const deps = options.dependencies ?? sampleDependencies;

    // Logos are bundled; anything else would be a live icon request.
    await this.page.route(
      /^https:\/\/api\d*\.(iconify\.design|simplesvg\.com|unisvg\.com)\//,
      (route) => route.abort(),
    );
    await this.page.route("**/api/result?**", async (route) => {
      await wait();
      return fulfil(route, {
        data: {
          plugin: "codeql",
          created_on: "2025-01-06T10:30:00Z",
          result: {
            workspaces: { ".": { results: options.codeql ?? sampleCodeql } },
          },
        },
      });
    });
    await this.page.route(
      `**/api/org/${ORG}/projects/${PROJECT}**`,
      async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace(/^\/api/, "");
        const base = `/org/${ORG}/projects/${PROJECT}`;
        const results = `${base}/analysis/${ANALYSIS}`;
        const page = Number(url.searchParams.get("page") ?? 0);
        const perPage = Number(url.searchParams.get("entries_per_page") ?? 20);
        if (path === base) return fulfil(route, { data: project });
        if (path === `${base}/analyses/${ANALYSIS}`)
          return fulfil(route, { data: analysis });
        if (path === `${results}/sbom/workspaces`)
          return fulfil(route, {
            data: { workspaces: ["."], package_manager: "NPM" },
          });
        if (path === `${results}/sbom/stats`) {
          await wait();
          return fulfil(route, {
            data: deps.length === 0 ? { number_of_dependencies: 0 } : sbomStats,
          });
        }
        if (path === `${results}/sbom`)
          return fulfil(route, paginated(deps, page, perPage));
        if (path === `${results}/sbom/dependency`) {
          await wait();
          return fulfil(route, { data: sampleDetails });
        }
        if (path === `${results}/sbom/dependency/graph`)
          return fulfil(route, { data: graph });
        if (path === `${results}/vulnerabilities/stats`)
          return fulfil(route, { data: vulnStats });
        if (path === `${results}/licenses`) {
          await wait();
          return fulfil(
            route,
            paginated(options.licenses ?? sampleLicenses, page, perPage),
          );
        }
        if (path === `${results}/patching`) {
          await wait();
          return fulfil(route, { data: patches });
        }
        if (path === `${results}/patching/manifest`)
          return fulfil(route, { data: manifest });
        if (path === `${results}/patching/stats`)
          return fulfil(route, { data: patchingStats });
        return fulfil(route, { data: [] });
      },
    );
    return release;
  }

  async goto(tab?: "Licenses" | "Patches" | "CodeQL"): Promise<void> {
    await this.shell.goto(
      `/results?analysis_id=${ANALYSIS}&project_id=${PROJECT}`,
    );
    if (!tab) return;
    // Opened from the keyboard, as later focus checks need keyboard modality.
    await this.page.getByRole("tab", { name: tab }).focus();
    await this.page.keyboard.press("Enter");
    await expect(this.page.getByRole("tab", { name: tab })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }

  async gotoDetails(packageId = "lodash@4.17.20"): Promise<void> {
    await this.shell.goto(
      `/results/sbom_details?analysis_id=${ANALYSIS}&project_id=${PROJECT}&package_id=${encodeURIComponent(packageId)}`,
    );
  }

  table(name: string): Locator {
    return this.page.getByRole("table", { name });
  }

  /** A table's body rows, without the header row. */
  rows(name: string): Locator {
    return this.table(name).locator("tbody tr");
  }

  sortButton(table: string, column: string): Locator {
    return this.table(table)
      .getByRole("columnheader", { name: column })
      .getByRole("button");
  }
}

function fulfil(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json });
}
