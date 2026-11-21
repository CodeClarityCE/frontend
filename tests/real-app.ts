// Real Pinia, real stores and the app's router on memory history; only fetch is faked.
// The test file must opt out of the global mocks first, see tests/TESTING_CONVENTIONS.md.
import { createPinia, type Pinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { type Component, defineComponent, h } from "vue";
import type { Router } from "vue-router";

import router from "@/router";
import { Toaster } from "@/shadcn/ui/sonner";
import { loadAuthStoreFromLocalStorage, useAuthStore } from "@/stores/auth";

import user from "../e2e/fixtures/user.json";

// The signed-in user's default org as GET /org/:id returns it (same as the e2e shell mock).
export const org = {
  id: user.default_org.id,
  name: "Test Organization",
  color_scheme: "1",
  description: "Test org",
  role: 0,
  personal: false,
  created_on: "2024-01-01T00:00:00Z",
  number_of_members: 1,
  organizationMemberships: [],
  joined_on: "2024-01-01T00:00:00Z",
};

export { user };

export interface FakeRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Headers;
  body: unknown;
}

export interface FakeHttp {
  // Answers every later METHOD request to the API path (no /api prefix) with this body.
  on(method: string, path: string, body: unknown, status?: number): void;
  // Every request the app sent, oldest first.
  requests: FakeRequest[];
}

export interface TestApp {
  pinia: Pinia;
  router: Router;
  http: FakeHttp;
  // Opens the path as a page load does, running the navigation guard even on the current path.
  visit(path: string): Promise<void>;
  // Pass as mount(Component, { global: app.global }).
  global: { plugins: [Pinia, Router] };
}

export interface TestAppOptions {
  // Starts signed in as the e2e fixture user, with that user's default org answered.
  signedIn?: boolean;
}

const API_PREFIX = `/${import.meta.env.VITE_API_URL}`;

// Fakes fetch; an unexpected request gets a 404 and is still recorded.
function fakeHttp(): FakeHttp {
  const answers = new Map<string, { body: unknown; status: number }>();
  const requests: FakeRequest[] = [];
  vi.stubGlobal(
    "fetch",
    async (input: string | URL, init: RequestInit = {}): Promise<Response> => {
      const url = new URL(String(input));
      const path = url.pathname.replace(API_PREFIX, "");
      const method = (init.method ?? "GET").toUpperCase();
      const body =
        typeof init.body === "string"
          ? (JSON.parse(init.body) as unknown)
          : undefined;
      requests.push({
        method,
        path,
        query: url.searchParams,
        headers: new Headers(init.headers),
        body,
      });
      const answer = answers.get(`${method} ${path}`);
      if (!answer) return new Response(null, { status: 404 });
      return new Response(JSON.stringify(answer.body), {
        status: answer.status,
        headers: { "Content-Type": "application/json" },
      });
    },
  );
  return {
    on(method, path, body, status = 200) {
      answers.set(`${method.toUpperCase()} ${path}`, { body, status });
    },
    requests,
  };
}

// Builds a fresh app state for one test; call it again to simulate a page reload.
export function createTestApp(options: TestAppOptions = {}): TestApp {
  const pinia = createPinia();
  setActivePinia(pinia);
  const http = fakeHttp();
  if (options.signedIn) signIn(http);

  async function visit(path: string): Promise<void> {
    const { query, hash } = router.resolve(path);
    await router.replace({
      path: router.resolve(path).path,
      query,
      hash,
      force: true,
    });
  }
  return { pinia, router, http, visit, global: { plugins: [pinia, router] } };
}

// Signs in through the real store actions and answers the identity requests a page load sends.
function signIn(http: FakeHttp): void {
  loadAuthStoreFromLocalStorage();
  const auth = useAuthStore();
  const expiry = new Date(Date.now() + 3_600_000);
  auth.setToken("access-token");
  auth.setTokenExpiry(expiry);
  auth.setRefreshToken("refresh-token");
  auth.setRefreshTokenExpiry(expiry);
  auth.setAuthenticated(true);
  http.on("GET", "/auth/user", { data: user });
  http.on("GET", `/org/${org.id}`, { data: org });
}

// The component next to the app's toaster, so its toast messages render as text.
export function withToaster(
  component: Component,
  props: Record<string, unknown> = {},
): Component {
  return defineComponent(() => () => [h(component, props), h(Toaster)]);
}
