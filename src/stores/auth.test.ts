import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";

import UserAuthForm from "@/codeclarity_components/authentication/signin/UserAuthForm.vue";
import UserMenu from "@/codeclarity_components/shell/UserMenu.vue";
import { SidebarProvider } from "@/shadcn/ui/sidebar";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import { createTestApp, org, type TestApp, user } from "../../tests/real-app";

const tokens = {
  token: "access-token",
  token_expiry: "2099-01-01T00:00:00.000Z",
  refresh_token: "refresh-token",
  refresh_token_expiry: "2099-01-01T00:00:00.000Z",
};

// Fills in and submits the real sign-in form.
async function signInWithForm(
  app: TestApp,
): Promise<ReturnType<typeof render>> {
  const form = render(UserAuthForm, { global: app.global });
  const typist = userEvent.setup();
  await typist.type(screen.getByLabelText("Email"), user.email);
  await typist.type(screen.getByLabelText("Password"), "secret");
  await typist.click(screen.getByRole("button", { name: "Sign in" }));
  return form;
}

describe("auth store", () => {
  it("sends a signed-out visitor from a protected page to sign in", async () => {
    const app = createTestApp();

    await app.visit("/projects");

    expect(app.router.currentRoute.value.name).toBe("login");
    expect(app.router.currentRoute.value.query.redirect).toBe("/projects");
  });

  it("signs in through the form and opens the page the visitor asked for", async () => {
    const app = createTestApp();
    app.http.on("POST", "/auth/authenticate", { data: tokens });
    app.http.on("GET", "/auth/user", { data: user });
    app.http.on("GET", `/org/${org.id}`, { data: org });
    await app.visit("/login?redirect=/projects");

    await signInWithForm(app);

    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe("/projects");
    });
    expect(useAuthStore().getAuthenticated).toBe(true);
    expect(useUserStore().getUser?.email).toBe(user.email);
    expect(app.http.requests[0]?.body).toEqual({
      email: "john.doe@codeclarity.io",
      password: "secret",
    });
  });

  it("keeps the visitor signed in after a reload and fetches their identity again", async () => {
    const first = createTestApp();
    first.http.on("POST", "/auth/authenticate", { data: tokens });
    first.http.on("GET", "/auth/user", { data: user });
    first.http.on("GET", `/org/${org.id}`, { data: org });
    await first.visit("/login");
    const form = await signInWithForm(first);
    await waitFor(() => {
      expect(first.router.currentRoute.value.path).toBe("/");
    });
    form.unmount();

    const reloaded = createTestApp();
    reloaded.http.on("GET", "/auth/user", { data: user });
    reloaded.http.on("GET", `/org/${org.id}`, { data: org });
    await reloaded.visit("/projects");

    expect(reloaded.router.currentRoute.value.path).toBe("/projects");
    expect(useAuthStore().getAuthenticated).toBe(true);
    expect(useUserStore().getUser?.email).toBe(user.email);
    expect(useUserStore().getDefaultOrg?.name).toBe(org.name);
  });

  it("signs out from the account menu and forgets the saved session", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    const shell = render(
      defineComponent(() => () => h(SidebarProvider, () => h(UserMenu))),
      { global: app.global },
    );

    const typist = userEvent.setup();
    await typist.click(
      screen.getByRole("button", { name: /open the account menu/ }),
    );
    await typist.click(
      await screen.findByRole("menuitem", { name: "Log out" }),
    );

    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe("/login");
    });
    expect(useAuthStore().getAuthenticated).toBe(false);
    expect(useUserStore().getUser).toBeUndefined();

    shell.unmount();
    const reloaded = createTestApp();
    await reloaded.visit("/projects");
    expect(reloaded.router.currentRoute.value.name).toBe("login");
  });

  it("starts signed out when the saved session is corrupt", async () => {
    localStorage.setItem("authStore", "{not json");
    const app = createTestApp();

    await app.visit("/projects");

    expect(app.router.currentRoute.value.name).toBe("login");
    expect(useAuthStore().getAuthenticated).toBe(false);
  });

  it("signs the visitor out when their identity can no longer be fetched", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", "/auth/user", { status_code: 500 }, 500);

    await app.visit("/projects");

    expect(app.router.currentRoute.value.name).toBe("login");
    expect(useAuthStore().getAuthenticated).toBe(false);
    expect(useUserStore().getUser).toBeUndefined();
  });
});
