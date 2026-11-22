import { type Locator, type Page, type Request } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";
export const PROJECT_ID = "proj-1";

/** One page of `all`, sized like the API: 10 by default, at most 100. */
function paginated(all: unknown[], url: string): Record<string, unknown> {
  const query = new URL(url).searchParams;
  const page = Number(query.get("page") ?? 0);
  const asked = Number(query.get("entries_per_page") ?? 0);
  const size = asked > 0 ? Math.min(asked, 100) : 10;
  const data = all.slice(page * size, (page + 1) * size);
  return {
    status_code: 200,
    status: "success",
    data,
    page,
    entry_count: data.length,
    entries_per_page: size,
    total_entries: all.length,
    total_pages: Math.ceil(all.length / size),
    matching_count: all.length,
    filter_count: {},
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

export function analyzer(
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

/** An analyzer whose CodeQL step needs a language. */
export const codeqlAnalyzer = {
  ...analyzer("an-codeql", "CodeQL", "Static analysis"),
  steps: [
    [
      {
        name: "codeql",
        version: "1.0.0",
        config: {
          language: {
            name: "language",
            type: "string",
            required: true,
            description: "",
          },
        },
        persistant_config: {},
      },
    ],
  ],
};

export const sampleAnalyzers = [
  analyzer("an-js", "JS", "SBOM, vulnerabilities and licenses for npm"),
  analyzer("an-php", "PHP", "SBOM, vulnerabilities and licenses for Composer"),
];

export const vulnerabilityPolicies = [
  {
    id: "vp-1",
    name: "Ignore disputed",
    description: "CVEs the team disputed",
    policy_type: "VULNERABILITY_POLICY",
    default: false,
    created_on: "2025-01-01T00:00:00Z",
    created_by: "",
    content: ["CVE-2024-0001", "CVE-2024-0002"],
  },
];

export const licensePolicies = [
  {
    id: "lp-1",
    name: "No copyleft",
    description: "Strong copyleft is not allowed",
    policy_type: "LICENSE_POLICY",
    default: true,
    created_on: "2025-01-01T00:00:00Z",
    created_by: "",
    content: ["GPL-3.0", "AGPL-3.0"],
  },
];

const serverError = {
  status_code: 500,
  status: "failure",
  error_code: "InternalError",
  error_message: "We encountered a problem while processing your request.",
};

const notFound = {
  status_code: 404,
  status: "failure",
  error_code: "EntityNotFound",
  error_message: "Not found",
};

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
   * `project` answers the project with a 404 ("missing") or a 500 ("error"),
   * and `analyzersError` answers the analyzer list with a 500.
   */
  async signIn(
    options: {
      analyzers?: unknown[];
      policies?: boolean;
      vulnerabilityPolicies?: unknown[];
      licensePolicies?: unknown[];
      createError?: Record<string, unknown>;
      hold?: boolean;
      project?: "missing" | "error";
      analyzersError?: boolean;
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
        if (options.analyzersError) {
          return route.fulfill({ status: 500, json: serverError });
        }
        return route.fulfill({
          json: paginated(analyzers, route.request().url()),
        });
      }
      const id = path.split("/").pop();
      const found = analyzers.find((a) => (a as { id: string }).id === id);
      return route.fulfill({ json: { data: found } });
    });
    await this.page.route(
      `**/api/org/${ORG}/policies/vulnerability_policy**`,
      (route) =>
        route.fulfill({
          json: paginated(
            withPolicies
              ? (options.vulnerabilityPolicies ?? vulnerabilityPolicies)
              : [],
            route.request().url(),
          ),
        }),
    );
    await this.page.route(
      `**/api/org/${ORG}/policies/license_policy**`,
      (route) =>
        route.fulfill({
          json: paginated(
            withPolicies ? (options.licensePolicies ?? licensePolicies) : [],
            route.request().url(),
          ),
        }),
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
        if (options.project === "missing") {
          return route.fulfill({ status: 404, json: notFound });
        }
        if (options.project === "error") {
          return route.fulfill({ status: 500, json: serverError });
        }
        return route.fulfill({ json: { data: project } });
      },
    );
    return release;
  }

  async goto(projectId: string | null = PROJECT_ID): Promise<void> {
    await this.shell.goto(
      projectId === null ? "/analyses/add" : `/analyses/add?id=${projectId}`,
    );
  }

  analyzer(name: string): Locator {
    return this.page.getByRole("radio", { name });
  }
}
