import { waitFor } from "@testing-library/vue";
import { createPinia, type Pinia, setActivePinia } from "pinia";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import {
  createTestApp,
  type FakeRequest,
  org,
  type TestApp,
} from "../../../tests/real-app";

// What an API from before rotation answers: no new refresh token.
const refreshed = {
  data: {
    token: "new-access-token",
    token_expiry: "2099-01-01T00:00:00.000Z",
  },
};

// What a rotating API answers.
const rotated = {
  data: {
    token: "new-access-token",
    token_expiry: "2099-01-01T00:00:00.000Z",
    refresh_token: "rotated-refresh-token",
    refresh_token_expiry: "2099-02-01T00:00:00.000Z",
  },
};

// An unsigned access token shaped like the API's, for the given user.
function accessTokenOf(userId: string): string {
  const part = (value: object): string =>
    btoa(JSON.stringify(value)).replace(/=+$/, "");
  return `${part({ alg: "ES512", typ: "at+jwt" })}.${part({ sub: userId, userId })}.sig`;
}

// An exclusive Web Locks stand-in: each request runs after the previous one under that name.
function installFakeLocks(): string[] {
  const tails = new Map<string, Promise<unknown>>();
  const requested: string[] = [];
  const locks = {
    request(
      name: string,
      _options: LockOptions,
      work: () => Promise<unknown>,
    ): Promise<unknown> {
      requested.push(name);
      const run = (tails.get(name) ?? Promise.resolve()).then(work);
      tails.set(
        name,
        run.catch(() => undefined),
      );
      return run;
    },
  };
  Object.defineProperty(navigator, "locks", {
    value: locks,
    configurable: true,
  });
  return requested;
}

interface Tab {
  pinia: Pinia;
  auth: ReturnType<typeof useAuthStore>;
  session: typeof import("./session");
}

// Another browser tab: its own copy of the app's modules and Pinia, sharing storage, fetch and locks.
async function openTab(): Promise<Tab> {
  vi.resetModules();
  const pinia = createPinia();
  setActivePinia(pinia);
  const stores = await import("@/stores/auth");
  const session = await import("./session");
  stores.loadAuthStoreFromLocalStorage();
  return { pinia, auth: stores.useAuthStore(), session };
}

// Saves a signed-in session whose access token has just expired, as a tab would have.
function saveExpiredSession(): void {
  localStorage.setItem(
    "authStore",
    JSON.stringify({
      initialized: true,
      token: "access-token",
      tokenExpiry: new Date(Date.now() - 1000).toISOString(),
      refreshToken: "refresh-token",
      refreshTokenExpiry: "2099-01-01T00:00:00.000Z",
      authenticated: true,
    }),
  );
}

// An authenticated request as components send it, with the store's token.
function loadOrg(): Promise<unknown> {
  return new OrgRepository().get({
    bearerToken: useAuthStore().getToken ?? "",
    orgId: org.id,
    handleBusinessErrors: true,
    handleHTTPErrors: true,
  });
}

// A signed-in app on the projects page whose access token has just expired.
async function expiredSession(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  useAuthStore().setTokenExpiry(new Date(Date.now() - 1000));
  app.http.requests.length = 0;
  return app;
}

function sent(app: TestApp, method: string, path: string): FakeRequest[] {
  return app.http.requests.filter(
    (r) => r.method === method && r.path === path,
  );
}

// No request but a refresh or sign-out may carry the refresh token anywhere.
function expectRefreshTokenOnlyInRefreshBody(app: TestApp): void {
  for (const request of app.http.requests) {
    expect(request.headers.get("Authorization") ?? "").not.toContain(
      "refresh-token",
    );
    if (request.path !== "/auth/refresh" && request.path !== "/auth/sign_out") {
      expect(JSON.stringify(request.body ?? null)).not.toContain(
        "refresh-token",
      );
    }
  }
}

describe("session token", () => {
  let app: TestApp | undefined;
  const track = (tested: TestApp): void => {
    app = tested;
  };

  // No test may send the refresh token anywhere but the refresh body.
  afterEach(() => {
    if (app) expectRefreshTokenOnlyInRefreshBody(app);
    app = undefined;
  });

  it("sends the access token as the bearer, never the refresh token", async () => {
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");

    await loadOrg();

    const [request] = sent(app, "GET", `/org/${org.id}`).slice(-1);
    expect(request?.headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("refreshes an expired access token once, then sends the new one", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", refreshed);

    await loadOrg();

    const refreshes = sent(app, "POST", "/auth/refresh");
    expect(refreshes).toHaveLength(1);
    expect(refreshes[0]?.body).toEqual({ refresh_token: "refresh-token" });
    expect(refreshes[0]?.headers.get("Authorization")).toBeNull();
    const [request] = sent(app, "GET", `/org/${org.id}`);
    expect(request?.headers.get("Authorization")).toBe(
      "Bearer new-access-token",
    );
    expect(useAuthStore().getToken).toBe("new-access-token");
  });

  it("refreshes a token that is about to expire", async () => {
    const app = await expiredSession();
    track(app);
    useAuthStore().setTokenExpiry(new Date(Date.now() + 5000));
    app.http.on("POST", "/auth/refresh", refreshed);

    await loadOrg();

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
  });

  it("shares one refresh between requests sent at once", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", refreshed);

    await Promise.all([loadOrg(), loadOrg(), loadOrg()]);

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
    const requests = sent(app, "GET", `/org/${org.id}`);
    expect(requests).toHaveLength(3);
    for (const request of requests) {
      expect(request.headers.get("Authorization")).toBe(
        "Bearer new-access-token",
      );
    }
  });

  it("signs the user out when the API refuses the refresh", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on(
      "POST",
      "/auth/refresh",
      { error_code: "NotAuthenticated", error_message: "expired" },
      401,
    );

    await expect(loadOrg()).rejects.toThrow();

    expect(useAuthStore().getAuthenticated).toBe(false);
    expect(useAuthStore().getToken).toBeUndefined();
    expect(useUserStore().getUser).toBeUndefined();
    expect(sent(app, "GET", `/org/${org.id}`)).toHaveLength(0);
    await waitFor(() => {
      expect(app.router.currentRoute.value.name).toBe("login");
    });
  });

  it("keeps the session when the refresh gets no answer", async () => {
    const app = await expiredSession();
    track(app);
    app.http.fail("POST", "/auth/refresh");

    await expect(loadOrg()).rejects.toThrow(TypeError);

    expect(sent(app, "GET", `/org/${org.id}`)).toHaveLength(0);
    expect(useAuthStore().getAuthenticated).toBe(true);
    expect(useAuthStore().getRefreshToken).toBe("refresh-token");
    expect(app.router.currentRoute.value.path).toBe("/projects");
  });

  it("keeps the session when the API is down during the refresh", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", {}, 502);

    await expect(loadOrg()).rejects.toThrow(TypeError);

    expect(useAuthStore().getAuthenticated).toBe(true);
    expect(useAuthStore().getRefreshToken).toBe("refresh-token");
  });

  it("sends the new token for a request signed with the token a refresh replaced", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", refreshed);
    await loadOrg();

    await new OrgRepository().get({
      bearerToken: "access-token",
      orgId: org.id,
    });

    const requests = sent(app, "GET", `/org/${org.id}`);
    expect(requests.at(-1)?.headers.get("Authorization")).toBe(
      "Bearer new-access-token",
    );
    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
  });

  it("refreshes an expired token before a navigation loads the page", async () => {
    const app = await expiredSession();
    track(app);
    useUserStore().$reset();
    app.http.on("POST", "/auth/refresh", refreshed);

    await app.visit("/projects");

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
    const [identity] = sent(app, "GET", "/auth/user");
    expect(identity?.headers.get("Authorization")).toBe(
      "Bearer new-access-token",
    );
    expect(app.router.currentRoute.value.path).toBe("/projects");
  });

  it("keeps the session and stays put when a navigation's refresh gets no answer", async () => {
    const app = await expiredSession();
    track(app);
    app.http.fail("POST", "/auth/refresh");

    await app.visit("/projects");

    expect(useAuthStore().getAuthenticated).toBe(true);
    expect(app.router.currentRoute.value.path).toBe("/projects");
  });

  it("stores the refresh token each refresh returns and sends it on the next one", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", rotated);
    await loadOrg();

    expect(useAuthStore().getRefreshToken).toBe("rotated-refresh-token");
    expect(useAuthStore().getRefreshTokenExpiry).toEqual(
      new Date("2099-02-01T00:00:00.000Z"),
    );
    expect(localStorage.getItem("authStore")).toContain(
      "rotated-refresh-token",
    );

    useAuthStore().setTokenExpiry(new Date(Date.now() - 1000));
    app.http.on("POST", "/auth/refresh", {
      data: { ...rotated.data, refresh_token: "third-refresh-token" },
    });
    await loadOrg();

    const refreshes = sent(app, "POST", "/auth/refresh");
    expect(refreshes.map((r) => r.body)).toEqual([
      { refresh_token: "refresh-token" },
      { refresh_token: "rotated-refresh-token" },
    ]);
    expect(useAuthStore().getRefreshToken).toBe("third-refresh-token");
  });

  it("keeps the refresh token when the API answers without a new one", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", refreshed);

    await loadOrg();

    expect(useAuthStore().getToken).toBe("new-access-token");
    expect(useAuthStore().getRefreshToken).toBe("refresh-token");
  });

  it("shares one refresh within a tab when the browser has no Web Locks", async () => {
    expect("locks" in navigator).toBe(false);
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", rotated);

    await Promise.all([loadOrg(), loadOrg()]);

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
    expect(useAuthStore().getRefreshToken).toBe("rotated-refresh-token");
  });

  it("uses the tokens another tab saved when it says so", async () => {
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");
    const saved = JSON.parse(localStorage.getItem("authStore") ?? "{}") as {
      token: string;
    };
    const newer = JSON.stringify({
      ...saved,
      token: "other-tab-access-token",
      tokenExpiry: "2099-01-01T00:00:00.000Z",
      refreshToken: "other-tab-refresh-token",
      refreshTokenExpiry: "2099-02-01T00:00:00.000Z",
    });

    localStorage.setItem("authStore", newer);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "authStore", newValue: newer }),
    );

    expect(useAuthStore().getToken).toBe("other-tab-access-token");
    expect(useAuthStore().getRefreshToken).toBe("other-tab-refresh-token");
    // A request signed with the old token goes out with the new one.
    await new OrgRepository().get({
      bearerToken: saved.token,
      orgId: org.id,
    });
    expect(
      sent(app, "GET", `/org/${org.id}`).at(-1)?.headers.get("Authorization"),
    ).toBe("Bearer other-tab-access-token");
  });

  it("ignores the tokens of another user signed in from another tab", async () => {
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");
    useAuthStore().setToken(accessTokenOf("user-x"));
    const saved = JSON.parse(localStorage.getItem("authStore") ?? "{}") as {
      token: string;
    };
    const otherUser = JSON.stringify({
      ...saved,
      token: accessTokenOf("user-y"),
      refreshToken: "user-y-refresh-token",
    });

    localStorage.setItem("authStore", otherUser);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "authStore", newValue: otherUser }),
    );

    expect(useAuthStore().getToken).toBe(accessTokenOf("user-x"));
    expect(useAuthStore().getRefreshToken).toBe("refresh-token");
  });
});

describe("session token across tabs", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "locks");
  });

  it("makes one refresh for two tabs refreshing at once, and both get the new tokens", async () => {
    const app = createTestApp();
    app.http.on("POST", "/auth/refresh", rotated);
    const locks = installFakeLocks();
    saveExpiredSession();
    const first = await openTab();
    const second = await openTab();

    setActivePinia(first.pinia);
    const firstDone = first.session.ensureFreshAccessToken();
    setActivePinia(second.pinia);
    const secondDone = second.session.ensureFreshAccessToken();

    expect(await firstDone).toBe("refreshed");
    expect(await secondDone).toBe("refreshed");
    expect(
      app.http.requests.filter((r) => r.path === "/auth/refresh"),
    ).toHaveLength(1);
    expect(locks).toHaveLength(2);
    expect(new Set(locks).size).toBe(1);
    for (const tab of [first, second]) {
      expect(tab.auth.getToken).toBe("new-access-token");
      expect(tab.auth.getRefreshToken).toBe("rotated-refresh-token");
    }
  });

  it("refreshes with the token the other tab rotated when its access token expires too", async () => {
    const app = createTestApp();
    app.http.on("POST", "/auth/refresh", {
      data: {
        ...rotated.data,
        token_expiry: new Date(Date.now() + 1000).toISOString(),
      },
    });
    installFakeLocks();
    saveExpiredSession();
    const first = await openTab();
    const second = await openTab();

    setActivePinia(first.pinia);
    await first.session.ensureFreshAccessToken();
    app.http.on("POST", "/auth/refresh", {
      data: { ...rotated.data, refresh_token: "third-refresh-token" },
    });
    setActivePinia(second.pinia);
    await second.session.ensureFreshAccessToken();

    const bodies = app.http.requests
      .filter((r) => r.path === "/auth/refresh")
      .map((r) => r.body);
    expect(bodies).toEqual([
      { refresh_token: "refresh-token" },
      { refresh_token: "rotated-refresh-token" },
    ]);
    expect(second.auth.getRefreshToken).toBe("third-refresh-token");
  });
});
