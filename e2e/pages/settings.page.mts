import { type Locator, type Page, type Request } from "@playwright/test";

import user from "../fixtures/user.json" with { type: "json" };
import { ShellPage } from "./shell.page.mjs";

export const USER_ID = user.id;

/** A business error as the API returns it. */
export function businessError(code: string): Record<string, unknown> {
  return { status: "error", error_code: code, error_message: code };
}

/** The account settings page, with its user endpoints mocked. */
export class SettingsPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  /** Bodies of the PATCH and DELETE requests sent to the user endpoints. */
  readonly sent: { method: string; path: string; body: unknown }[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
  }

  /**
   * Signs in and answers the user endpoints. `fail` maps an endpoint
   * suffix (`update_personal`, `update_password`, `delete`) to an error body.
   */
  async signIn(
    options: { fail?: Record<string, Record<string, unknown>> } = {},
  ): Promise<void> {
    await this.shell.signIn();
    await this.page.route(`**/api/users/${USER_ID}**`, (route) => {
      const request: Request = route.request();
      const method = request.method();
      if (method === "GET") return route.fallback();
      const path = new URL(request.url()).pathname;
      this.sent.push({ method, path, body: request.postDataJSON() });
      const key =
        method === "DELETE" ? "delete" : (path.split("/").pop() ?? "");
      const failure = options.fail?.[key];
      if (failure) return route.fulfill({ status: 400, json: failure });
      return route.fulfill({ json: { status_code: 200, status: "success" } });
    });
  }

  async goto(): Promise<void> {
    await this.shell.goto("/settings/account");
    await this.heading.waitFor();
  }

  section(name: string): Locator {
    return this.page.getByRole("region", { name });
  }
}

const INVITE_ORG = "org-999";

/** The organisation an invitation points at, as the API returns it. */
export const invitedOrg = {
  id: INVITE_ORG,
  name: "Open Source Lab",
  description: "Research on package ecosystems",
  color_scheme: "1",
  created_on: "2025-01-01T00:00:00Z",
  created_by: {
    id: "u-owner",
    first_name: "Ada",
    last_name: "Lovelace",
    handle: "ada",
    email: "ada@example.com",
    role: 0,
    joined_on: "2025-01-01T00:00:00Z",
  },
  invite_created_by: {
    id: "u-inviter",
    first_name: "Grace",
    last_name: "Hopper",
    handle: "grace",
    email: "grace@example.com",
    role: 1,
    joined_on: "2025-01-01T00:00:00Z",
  },
  invite_created_on: "2026-11-10T09:00:00Z",
  number_of_members: 4,
  role: 2,
};

/** The page an organisation invitation email links to. */
export class OrgJoinPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  joinRequests = 0;

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 });
  }

  /** Signs in and answers the invitation endpoints, or fails them with an error body. */
  async signIn(
    options: {
      info?: Record<string, unknown>;
      infoError?: Record<string, unknown>;
      joinError?: Record<string, unknown>;
    } = {},
  ): Promise<void> {
    await this.shell.signIn();
    await this.page.route(
      `**/api/org/${INVITE_ORG}/org_info_invitee**`,
      (route) =>
        options.infoError
          ? route.fulfill({ status: 400, json: options.infoError })
          : route.fulfill({ json: { data: options.info ?? invitedOrg } }),
    );
    await this.page.route(`**/api/org/${INVITE_ORG}/join`, (route) => {
      this.joinRequests++;
      return options.joinError
        ? route.fulfill({ status: 400, json: options.joinError })
        : route.fulfill({ json: { status_code: 200, status: "success" } });
    });
  }

  async goto(): Promise<void> {
    await this.shell.goto(
      `/email_action/join_org?token=tok&useremail=hash&orgId=${INVITE_ORG}`,
    );
  }
}
