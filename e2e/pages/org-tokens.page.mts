import { type Locator, type Page } from "@playwright/test";

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";

/** Pages see this as now, so expiry dates and screenshots stay stable. */
export const NOW = new Date("2026-11-13T12:00:00Z");

/** A placeholder secret in the shape the API issues. */
export const SECRET = `ccot_${"x".repeat(43)}`;

/** The token the create endpoint returns, with its secret. */
export function createdToken(
  body: { name: string; scope: string; expires_on: string },
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    status_code: 201,
    status: "success",
    data: {
      id: "tok-1",
      name: body.name,
      scope: body.scope,
      created_on: NOW.toISOString(),
      expires_on: body.expires_on,
      secret: SECRET,
      ...overrides,
    },
  };
}

/** The organisation tokens page, with its API mocked. */
export class OrgTokensPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  /** Bodies of token create requests, in order. */
  readonly created: { name: string; scope: string; expires_on: string }[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 }).last();
  }

  /** Signs in and answers the token create endpoint; `fail` answers it with a 500. */
  async signIn(options: { fail?: boolean } = {}): Promise<void> {
    await this.page.clock.install({ time: NOW });
    await this.shell.signIn();
    await this.page.route(`**/api/org/${ORG}/tokens`, (route) => {
      const body = route.request().postDataJSON() as {
        name: string;
        scope: string;
        expires_on: string;
      };
      this.created.push(body);
      if (options.fail) {
        return route.fulfill({
          status: 500,
          json: { status_code: 500, status: "failure", error_code: "x" },
        });
      }
      return route.fulfill({ status: 201, json: createdToken(body) });
    });
  }

  async goto(): Promise<void> {
    await this.shell.goto(`/orgs/manage/tokens/${ORG}`);
  }

  get name(): Locator {
    return this.page.getByLabel("Name");
  }

  get scope(): Locator {
    return this.page.getByLabel("Scope");
  }

  get expiry(): Locator {
    return this.page.getByLabel("Expires after");
  }

  get createButton(): Locator {
    return this.page.getByRole("button", { name: "Create token" });
  }

  /** The panel that shows a new token's secret. */
  get secretPanel(): Locator {
    return this.page.getByRole("region", { name: "New token" });
  }
}
