import { render } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";

import { takeClickUpOAuthToken } from "./clickup-oauth-handoff";
import ClickUpConfigModal from "./ClickUpConfigModal.vue";
import ClickUpOAuthCallback from "./ClickUpOAuthCallback.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const ACCESS_TOKEN = "clickup-access-token-123";
const callbackPath = `/org/${org.id}/tickets/integrations/clickup/oauth/callback`;
const workspacesPath = `/org/${org.id}/tickets/integrations/CLICKUP/workspaces`;

// The shared setup stubs sessionStorage as a no-op, so use a real in-memory one.
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => items.delete(key),
    setItem: (key, value) => items.set(key, String(value)),
  };
}

function storedValues(): string[] {
  const values: string[] = [];
  for (const storage of [localStorage, sessionStorage]) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null) values.push(storage.getItem(key) ?? "");
    }
  }
  return values;
}

// ClickUp sends the browser back to the callback page with a code.
async function openCallback(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("POST", callbackPath, { data: { access_token: ACCESS_TOKEN } });
  app.http.on("GET", workspacesPath, { data: [] });
  await app.visit("/tickets/integrations/clickup/callback?code=auth-code");
  render(ClickUpOAuthCallback, { global: app.global });
  await flushPromises();
  return app;
}

describe("ClickUpOAuthCallback", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", memoryStorage());
    takeClickUpOAuthToken();
    sessionStorage.setItem("clickup_oauth_org_id", org.id);
  });

  it("keeps the token out of browser storage and still sends it to the API", async () => {
    const app = await openCallback();
    render(ClickUpConfigModal, { global: app.global });
    await flushPromises();

    const exchange = app.http.requests.find((r) => r.path === callbackPath);
    expect(exchange?.body).toMatchObject({ code: "auth-code" });
    const workspaces = app.http.requests.find((r) => r.path === workspacesPath);
    expect(workspaces?.headers.get("x-integration-access-token")).toBe(
      ACCESS_TOKEN,
    );
    expect(storedValues().join(" ")).not.toContain(ACCESS_TOKEN);
  });

  it("hands the token to the setup dialog in memory, once", async () => {
    await openCallback();

    expect(takeClickUpOAuthToken()).toBe(ACCESS_TOKEN);
    expect(takeClickUpOAuthToken()).toBeNull();
  });

  it("goes back to the tickets page to finish the setup", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      const app = await openCallback();

      await vi.advanceTimersByTimeAsync(1500);

      expect(app.router.currentRoute.value.path).toBe("/tickets");
      expect(app.router.currentRoute.value.query.clickup_oauth).toBe("success");
    } finally {
      vi.useRealTimers();
    }
  });

  it("says so when ClickUp's code can't be exchanged", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on("POST", callbackPath, {}, 500);
    await app.visit("/tickets/integrations/clickup/callback?code=auth-code");
    const { findByText } = render(ClickUpOAuthCallback, {
      global: app.global,
    });

    expect(
      await findByText("Failed to connect to ClickUp. Please try again."),
    ).toBeInTheDocument();
  });
});
