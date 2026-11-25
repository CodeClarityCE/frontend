import { waitFor } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import {
  createTestApp,
  type FakeRequest,
  org,
  type TestApp,
} from "../../../tests/real-app";

const refreshed = {
  data: {
    token: "new-access-token",
    token_expiry: "2099-01-01T00:00:00.000Z",
  },
};

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

// No request but the refresh call may carry the refresh token anywhere.
function expectRefreshTokenOnlyInRefreshBody(app: TestApp): void {
  for (const request of app.http.requests) {
    expect(request.headers.get("Authorization") ?? "").not.toContain(
      "refresh-token",
    );
    if (request.path !== "/auth/refresh") {
      expect(JSON.stringify(request.body ?? null)).not.toContain(
        "refresh-token",
      );
    }
  }
}

describe("session token", () => {
  it("sends the access token as the bearer, never the refresh token", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");

    await loadOrg();

    const [request] = sent(app, "GET", `/org/${org.id}`).slice(-1);
    expect(request?.headers.get("Authorization")).toBe("Bearer access-token");
    expectRefreshTokenOnlyInRefreshBody(app);
  });

  it("refreshes an expired access token once, then sends the new one", async () => {
    const app = await expiredSession();
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
    expectRefreshTokenOnlyInRefreshBody(app);
  });

  it("refreshes a token that is about to expire", async () => {
    const app = await expiredSession();
    useAuthStore().setTokenExpiry(new Date(Date.now() + 5000));
    app.http.on("POST", "/auth/refresh", refreshed);

    await loadOrg();

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
  });

  it("shares one refresh between requests sent at once", async () => {
    const app = await expiredSession();
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
    app.http.fail("POST", "/auth/refresh");

    await loadOrg().catch(() => undefined);

    expect(useAuthStore().getAuthenticated).toBe(true);
    expect(useAuthStore().getRefreshToken).toBe("refresh-token");
    expect(app.router.currentRoute.value.path).toBe("/projects");
  });

  it("refreshes an expired token before a navigation loads the page", async () => {
    const app = await expiredSession();
    useUserStore().$reset();
    app.http.on("POST", "/auth/refresh", refreshed);

    await app.visit("/projects");

    expect(sent(app, "POST", "/auth/refresh")).toHaveLength(1);
    const [identity] = sent(app, "GET", "/auth/user");
    expect(identity?.headers.get("Authorization")).toBe(
      "Bearer new-access-token",
    );
    expect(app.router.currentRoute.value.path).toBe("/projects");
    expectRefreshTokenOnlyInRefreshBody(app);
  });

  it("keeps the session and stays put when a navigation's refresh gets no answer", async () => {
    const app = await expiredSession();
    app.http.fail("POST", "/auth/refresh");

    await app.visit("/projects");

    expect(useAuthStore().getAuthenticated).toBe(true);
  });
});
