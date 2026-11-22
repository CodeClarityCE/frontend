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

/** A token as GET /org/:org/tokens lists it. */
export interface TokenSummary {
  id: string;
  name: string;
  scope: string;
  created_on: string;
  expires_on: string;
  created_by_email: string | null;
}

/** A listed token, live for 30 more days unless overridden. */
export function tokenSummary(
  overrides: Partial<TokenSummary> = {},
): TokenSummary {
  return {
    id: "tok-0",
    name: "nightly-scan",
    scope: "read",
    created_on: "2026-10-01T09:00:00.000Z",
    expires_on: "2026-12-13T12:00:00.000Z",
    created_by_email: "john.doe@codeclarity.io",
    ...overrides,
  };
}

/** The list endpoint's answer for these tokens. */
export function tokenList(tokens: TokenSummary[]): Record<string, unknown> {
  return { status_code: 200, status: "success", data: tokens };
}

interface SignInOptions {
  /** Answer token creation with a 500. */
  fail?: boolean;
  /** Tokens the organization has when the page opens. */
  tokens?: TokenSummary[];
  /** Answer the list with a 500. */
  failList?: boolean;
  /** Answer revocations with a 500. */
  failRevoke?: boolean;
}

/** The organisation tokens page, with its API mocked. */
export class OrgTokensPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  /** Bodies of token create requests, in order. */
  readonly created: { name: string; scope: string; expires_on: string }[] = [];
  /** Ids of revoked tokens, in order. */
  readonly revoked: string[] = [];
  /** The organization's tokens as the mocked API holds them. */
  tokens: TokenSummary[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 }).last();
  }

  /** Signs in and answers the token endpoints from `this.tokens`. */
  async signIn(options: SignInOptions = {}): Promise<void> {
    this.tokens = [...(options.tokens ?? [])];
    await this.page.clock.install({ time: NOW });
    await this.shell.signIn();
    const failure = {
      status: 500,
      json: { status_code: 500, status: "failure", error_code: "x" },
    };
    await this.page.route(`**/api/org/${ORG}/tokens`, (route) => {
      if (route.request().method() === "GET") {
        if (options.failList) return route.fulfill(failure);
        return route.fulfill({ status: 200, json: tokenList(this.tokens) });
      }
      const body = route.request().postDataJSON() as {
        name: string;
        scope: string;
        expires_on: string;
      };
      this.created.push(body);
      if (options.fail) return route.fulfill(failure);
      const answer = createdToken(body);
      const { secret: _secret, ...listed } = answer["data"] as Record<
        string,
        unknown
      >;
      this.tokens.unshift({
        ...(listed as Omit<TokenSummary, "created_by_email">),
        created_by_email: "john.doe@codeclarity.io",
      });
      return route.fulfill({ status: 201, json: answer });
    });
    await this.page.route(`**/api/org/${ORG}/tokens/*`, (route) => {
      const id = route.request().url().split("/").pop()!;
      this.revoked.push(id);
      if (options.failRevoke) return route.fulfill(failure);
      this.tokens = this.tokens.filter((t) => t.id !== id);
      return route.fulfill({
        status: 200,
        json: { status_code: 200, status: "success" },
      });
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

  /** The table of the organization's tokens. */
  get list(): Locator {
    return this.page.getByRole("table", { name: "Tokens" });
  }

  /** The list row of the token with this name. */
  row(name: string): Locator {
    return this.list.getByRole("row").filter({ hasText: name });
  }

  get revokeDialog(): Locator {
    return this.page.getByRole("alertdialog");
  }

  /** The panel that shows a new token's secret. */
  get secretPanel(): Locator {
    return this.page.getByRole("region", { name: "New token" });
  }
}
