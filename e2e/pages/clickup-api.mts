import { type Page, type Route } from "@playwright/test";

const ORG = "org-123";

export const GOOD_KEY = "pk_good";
export const BAD_KEY = "pk_bad";

/** What the old API returned for a rejected key, raw provider body included. */
export const RAW_PROVIDER_ERROR =
  'ClickUp API error (401): {"err":"Token invalid","ECODE":"OAUTH_025"}';

const REJECTED =
  "ClickUp did not accept these credentials. Check the API key or reconnect with OAuth.";

const hierarchy: Record<string, { id: string; name: string }[]> = {
  workspaces: [{ id: "ws1", name: "Security team" }],
  "spaces/ws1": [{ id: "sp1", name: "Engineering" }],
  "folders/sp1": [{ id: "fo1", name: "Backlog" }],
  "lists/fo1": [{ id: "li1", name: "Vulnerabilities" }],
};

type Saved = Record<string, unknown>;

/**
 * Stands in for the ticket integration endpoints and keeps what was saved, so a
 * test can see whether a page left an integration behind.
 */
export class ClickUpApi {
  saved: Saved | null;
  /** Bodies of the configuration saves the page sent. */
  readonly saves: Saved[] = [];
  /** Paths of the DELETE requests the page sent. */
  readonly deleted: string[] = [];
  /** Error the connection test of the saved integration reports. */
  testError: string | null = null;

  constructor(saved: Saved | null = null) {
    this.saved = saved;
  }

  // Registered after a page object's own routes, so it answers first.
  async install(page: Page): Promise<void> {
    await page.route(`**/api/org/${ORG}/tickets/integrations**`, (route) =>
      this.answer(route),
    );
  }

  private answer(route: Route): Promise<void> {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(
      `/api/org/${ORG}/tickets/integrations`,
      "",
    );
    const method = request.method();

    if (path === "" && method === "GET") {
      return json(route, { data: this.saved ? [this.summary()] : [] });
    }
    if (path === "/clickup" && method === "POST") {
      const body = request.postDataJSON() as Saved;
      this.saves.push(body);
      this.saved = { ...this.saved, ...body };
      return json(route, { status_code: 200, status: "success" });
    }
    if (path === "/CLICKUP" && method === "DELETE") {
      this.deleted.push(path);
      this.saved = null;
      return json(route, { status_code: 200, status: "success" });
    }
    if (path === "/CLICKUP/verify") {
      const body = request.postDataJSON() as { api_key?: string };
      return json(route, { data: this.check(body.api_key) });
    }
    if (path === "/CLICKUP/test") {
      if (!this.saved) return route.fulfill({ status: 404, json: {} });
      return json(route, {
        data: this.testError
          ? { success: false, error: this.testError }
          : this.check(this.saved["api_key"] as string),
      });
    }

    const items = hierarchy[path.replace("/CLICKUP/", "")];
    if (items && method === "GET") {
      const key =
        request.headers()["x-integration-api-key"] ??
        (this.saved?.["api_key"] as string | undefined);
      if (!key) return route.fulfill({ status: 404, json: {} });
      if (key !== GOOD_KEY) return route.fulfill({ status: 400, json: {} });
      return json(route, { data: items });
    }
    return route.fulfill({ status: 404, json: {} });
  }

  private check(key: string | undefined): Record<string, unknown> {
    return key === GOOD_KEY
      ? { success: true, user_info: { id: "7", name: "Jane" } }
      : { success: false, error: REJECTED };
  }

  private summary(): Record<string, unknown> {
    return {
      id: "cu-1",
      provider: "CLICKUP",
      enabled: true,
      created_on: "2026-02-01T09:00:00Z",
      updated_on: "2026-02-01T09:00:00Z",
      has_config: true,
    };
  }
}

function json(route: Route, body: unknown): Promise<void> {
  return route.fulfill({ json: body });
}
