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
  user,
} from "../../../tests/real-app";

// What the API answers a refresh: the times only, the tokens are in its Set-Cookie headers.
const refreshed = {
  data: {
    token_expiry: "2099-01-01T00:00:00.000Z",
    refresh_token_expiry: "2099-02-01T00:00:00.000Z",
  },
};

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
      userId: user.id,
      tokenExpiry: new Date(Date.now() - 1000).toISOString(),
      refreshTokenExpiry: "2099-01-01T00:00:00.000Z",
      authenticated: true,
    }),
  );
}

// An authenticated request as components send it.
function loadOrg(): Promise<unknown> {
  return new OrgRepository().get({
    orgId: org.id,
    handleBusinessErrors: true,
    handleHTTPErrors: true,
  });
}

// A signed-in app on the projects page whose access token has just expired.
async function expiredSession(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  useAuthStore().adoptSession({
    tokenExpiry: new Date(Date.now() - 1000),
    refreshTokenExpiry: new Date("2099-01-01T00:00:00.000Z"),
  });
  app.http.requests.length = 0;
  return app;
}

function sent(app: TestApp, method: string, path: string): FakeRequest[] {
  return app.http.requests.filter(
    (r) => r.method === method && r.path === path,
  );
}

// Every request goes out with the cookies and the CSRF header, never with a token of its own.
function expectCookieRequests(app: TestApp): void {
  for (const request of app.http.requests) {
    expect(request.credentials).toBe("same-origin");
    expect(request.headers.get("X-CodeClarity-CSRF")).toBe("1");
    expect(request.headers.get("Authorization")).toBeNull();
  }
}

// What a script on the page could read: nothing that looks like a token.
function expectNoTokenInStorage(): void {
  const saved = JSON.parse(localStorage.getItem("authStore") ?? "{}") as Record<
    string,
    unknown
  >;
  expect(Object.keys(saved)).not.toContain("token");
  expect(Object.keys(saved)).not.toContain("refreshToken");
  expect(JSON.stringify(saved)).not.toMatch(/eyJ|refresh-token/);
  expect(sessionStorage.length).toBe(0);
}

describe("web sign-in session", () => {
  let app: TestApp | undefined;
  const track = (tested: TestApp): void => {
    app = tested;
  };

  afterEach(() => {
    if (app) expectCookieRequests(app);
    app = undefined;
  });

  it("sends requests with the session cookies and the CSRF header", async () => {
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");

    await loadOrg();

    expect(sent(app, "GET", `/org/${org.id}`)).not.toHaveLength(0);
    expectNoTokenInStorage();
  });

  it("refreshes an expired access token once, then sends the request", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", refreshed);

    await loadOrg();

    const refreshes = sent(app, "POST", "/auth/refresh");
    expect(refreshes).toHaveLength(1);
    expect(refreshes[0]?.body).toEqual({});
    expect(app.http.requests.map((r) => r.path)).toEqual([
      "/auth/refresh",
      `/org/${org.id}`,
    ]);
    expect(useAuthStore().getTokenExpiry).toEqual(
      new Date(refreshed.data.token_expiry),
    );
    expect(useAuthStore().getRefreshTokenExpiry).toEqual(
      new Date(refreshed.data.refresh_token_expiry),
    );
    expectNoTokenInStorage();
  });

  it("refreshes a token that is about to expire", async () => {
    const app = await expiredSession();
    track(app);
    useAuthStore().adoptSession({
      tokenExpiry: new Date(Date.now() + 5000),
      refreshTokenExpiry: new Date("2099-01-01T00:00:00.000Z"),
    });
    app.http.on("POST", "/auth/refresh", refreshed);

    await loadOrg();

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
  });

  it("does not refresh a fresh access token", async () => {
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");

    await loadOrg();

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(0);
  });

  it("shares one refresh between requests sent at once", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", refreshed);

    await Promise.all([loadOrg(), loadOrg(), loadOrg()]);

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
    expect(sent(app, "GET", `/org/${org.id}`)).toHaveLength(3);
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
    expect(useAuthStore().getTokenExpiry).toBeUndefined();
    expect(useUserStore().getUser).toBeUndefined();
    expect(sent(app, "GET", `/org/${org.id}`)).toHaveLength(0);
    await waitFor(() => {
      expect(app.router.currentRoute.value.name).toBe("login");
    });
  });

  it("signs out without a request when the sign-in's 7 days are over", async () => {
    const app = await expiredSession();
    track(app);
    useAuthStore().adoptSession({
      tokenExpiry: new Date(Date.now() - 1000),
      refreshTokenExpiry: new Date(Date.now() - 1000),
    });

    await expect(loadOrg()).rejects.toThrow();

    expect(app.http.requests).toEqual([]);
    expect(useAuthStore().getAuthenticated).toBe(false);
  });

  it("keeps the session when the refresh gets no answer", async () => {
    const app = await expiredSession();
    track(app);
    app.http.fail("POST", "/auth/refresh");

    await expect(loadOrg()).rejects.toThrow(TypeError);

    expect(sent(app, "GET", `/org/${org.id}`)).toHaveLength(0);
    expect(useAuthStore().getAuthenticated).toBe(true);
    expect(app.router.currentRoute.value.path).toBe("/projects");
  });

  it("keeps the session when the API is down during the refresh", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", {}, 502);

    await expect(loadOrg()).rejects.toThrow(TypeError);

    expect(useAuthStore().getAuthenticated).toBe(true);
  });

  it("refreshes an expired token before a navigation loads the page", async () => {
    const app = await expiredSession();
    track(app);
    useUserStore().$reset();
    app.http.on("POST", "/auth/refresh", refreshed);

    await app.visit("/projects");

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
    const paths = app.http.requests.map((r) => r.path);
    expect(paths.indexOf("/auth/refresh")).toBeLessThan(
      paths.indexOf("/auth/user"),
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

  it("refreshes again once the refreshed access token expires", async () => {
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", refreshed);
    await loadOrg();
    await loadOrg();
    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);

    useAuthStore().adoptSession({
      tokenExpiry: new Date(Date.now() - 1000),
      refreshTokenExpiry: new Date("2099-02-01T00:00:00.000Z"),
    });
    await loadOrg();

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(2);
  });

  it("shares one refresh within a tab when the browser has no Web Locks", async () => {
    expect("locks" in navigator).toBe(false);
    const app = await expiredSession();
    track(app);
    app.http.on("POST", "/auth/refresh", refreshed);

    await Promise.all([loadOrg(), loadOrg()]);

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
  });

  it("takes the times another tab saved after refreshing the shared cookies", async () => {
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");
    const saved = JSON.parse(localStorage.getItem("authStore") ?? "{}") as {
      userId: string;
    };
    const newer = JSON.stringify({
      ...saved,
      tokenExpiry: "2099-01-01T00:00:00.000Z",
      refreshTokenExpiry: "2099-02-01T00:00:00.000Z",
    });

    localStorage.setItem("authStore", newer);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "authStore", newValue: newer }),
    );

    expect(useAuthStore().getTokenExpiry).toEqual(
      new Date("2099-01-01T00:00:00.000Z"),
    );
  });

  it("signs out when another tab signs out, without a request", async () => {
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");
    const saved = localStorage.getItem("authStore");
    app.http.requests.length = 0;

    // What a browser delivers here when the other tab's sign-out clears the saved session.
    localStorage.removeItem("authStore");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "authStore",
        oldValue: saved,
        newValue: null,
      }),
    );

    await waitFor(() => {
      expect(app.router.currentRoute.value.name).toBe("login");
    });
    expect(useAuthStore().getAuthenticated).toBe(false);
    expect(useUserStore().getUser).toBeUndefined();
    expect(app.http.requests).toEqual([]);
  });

  it("stays signed in when another tab signs a different user out", async () => {
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");
    const otherUser = JSON.stringify({
      authenticated: true,
      userId: "user-y",
    });

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "authStore",
        oldValue: otherUser,
        newValue: null,
      }),
    );

    expect(useAuthStore().getAuthenticated).toBe(true);
  });

  it("starts over when another tab signs a different user in, since the cookies are shared", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    const app = createTestApp({ signedIn: true });
    track(app);
    await app.visit("/projects");
    const saved = JSON.parse(localStorage.getItem("authStore") ?? "{}") as {
      userId: string;
    };
    const otherUser = JSON.stringify({ ...saved, userId: "user-y" });

    localStorage.setItem("authStore", otherUser);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "authStore", newValue: otherUser }),
    );

    expect(reload).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("web sign-in session across tabs", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "locks");
  });

  it("makes one refresh for two tabs refreshing at once, and both get the new times", async () => {
    const app = createTestApp();
    app.http.on("POST", "/auth/refresh", refreshed);
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
      expect(tab.auth.getTokenExpiry).toEqual(
        new Date(refreshed.data.token_expiry),
      );
    }
  });

  it("refreshes again in the second tab once the first tab's refreshed token expires too", async () => {
    const app = createTestApp();
    app.http.on("POST", "/auth/refresh", {
      data: {
        ...refreshed.data,
        token_expiry: new Date(Date.now() + 1000).toISOString(),
      },
    });
    installFakeLocks();
    saveExpiredSession();
    const first = await openTab();
    const second = await openTab();

    setActivePinia(first.pinia);
    await first.session.ensureFreshAccessToken();
    app.http.on("POST", "/auth/refresh", refreshed);
    setActivePinia(second.pinia);
    await second.session.ensureFreshAccessToken();

    expect(
      app.http.requests.filter((r) => r.path === "/auth/refresh"),
    ).toHaveLength(2);
    expect(second.auth.getTokenExpiry).toEqual(
      new Date(refreshed.data.token_expiry),
    );
  });
});
