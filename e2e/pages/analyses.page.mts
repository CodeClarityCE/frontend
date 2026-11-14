import { type Locator, type Page, type Request } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";
export const PROJECT_ID = "proj-1";

function paginated(data: unknown[]): Record<string, unknown> {
  return {
    data,
    page: 0,
    entry_count: data.length,
    entries_per_page: 0,
    total_entries: data.length,
    total_pages: 1,
    matching_count: data.length,
    filter_count: {},
    status: "success",
  };
}

const project = {
  id: PROJECT_ID,
  name: "example/web-frontend",
  description: "The web app",
  integration_id: "int-1",
  type: "GITHUB",
  url: "https://github.com/example/web-frontend",
  analyses: [],
  upload_id: "up-1",
  added_on: "2025-01-05T10:00:00Z",
  organization_id: ORG,
};

function analyzer(
  id: string,
  name: string,
  description: string,
): Record<string, unknown> {
  return {
    id,
    name,
    description,
    created_on: "2025-01-01T00:00:00Z",
    organization_id: ORG,
    steps: [
      [
        {
          name: "js-sbom",
          version: "1.0.0",
          config: { branch: { name: "branch", required: true } },
          persistant_config: {},
        },
      ],
      [
        {
          name: "vuln-finder",
          version: "1.0.0",
          config: { vulnerabilityPolicy: { name: "vulnerabilityPolicy" } },
          persistant_config: {},
        },
        {
          name: "license-finder",
          version: "1.0.0",
          config: { licensePolicy: { name: "licensePolicy" } },
          persistant_config: {},
        },
      ],
    ],
  };
}

export const sampleAnalyzers = [
  analyzer("an-js", "JS", "SBOM, vulnerabilities and licenses for npm"),
  analyzer("an-php", "PHP", "SBOM, vulnerabilities and licenses for Composer"),
];

const vulnerabilityPolicies = [
  {
    id: "vp-1",
    name: "Ignore disputed",
    description: "CVEs the team disputed",
    policy_type: "BLACKLIST",
    default: false,
    created_on: "2025-01-01T00:00:00Z",
    content: ["CVE-2024-0001", "CVE-2024-0002"],
  },
];

const licensePolicies = [
  {
    id: "lp-1",
    name: "No copyleft",
    description: "Strong copyleft is not allowed",
    policy_type: "BLACKLIST",
    default: true,
    created_on: "2025-01-01T00:00:00Z",
    content: ["GPL-3.0", "AGPL-3.0"],
  },
];

/** The new Analysis page, with its API mocked. */
export class AnalysesPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly submit: Locator;
  /** The body of each analysis POST, in order. */
  readonly created: unknown[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.submit = page.getByRole("button", { name: "Start Analysis" });
  }

  /**
   * Signs in and answers the project, analyzer and policy endpoints.
   * `hold` keeps the analyzer list pending until the returned function runs.
   */
  async signIn(
    options: {
      analyzers?: unknown[];
      policies?: boolean;
      createError?: Record<string, unknown>;
      hold?: boolean;
    } = {},
  ): Promise<() => void> {
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const analyzers = options.analyzers ?? sampleAnalyzers;
    const withPolicies = options.policies ?? true;

    await this.page.route(`**/api/org/${ORG}/analyzers**`, async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/analyzers")) {
        if (options.hold) await held;
        return route.fulfill({ json: paginated(analyzers) });
      }
      const id = path.split("/").pop();
      const found = analyzers.find(
        (a) => (a as { id: string }).id === id,
      ) as unknown;
      return route.fulfill({ json: { data: found } });
    });
    await this.page.route(
      `**/api/org/${ORG}/policies/vulnerability_policy**`,
      (route) =>
        route.fulfill({
          json: paginated(withPolicies ? vulnerabilityPolicies : []),
        }),
    );
    await this.page.route(
      `**/api/org/${ORG}/policies/license_policy**`,
      (route) =>
        route.fulfill({ json: paginated(withPolicies ? licensePolicies : []) }),
    );
    await this.page.route(
      `**/api/org/${ORG}/projects/${PROJECT_ID}**`,
      (route) => {
        const request: Request = route.request();
        if (request.method() === "POST") {
          this.created.push(request.postDataJSON());
          if (options.createError) {
            return route.fulfill({ status: 400, json: options.createError });
          }
          return route.fulfill({ json: { id: "an-new" } });
        }
        return route.fulfill({ json: { data: project } });
      },
    );
    return release;
  }

  async goto(): Promise<void> {
    await this.shell.goto(`/analyses/add?id=${PROJECT_ID}`);
  }

  analyzer(name: string): Locator {
    return this.page.getByRole("radio", { name });
  }
}
