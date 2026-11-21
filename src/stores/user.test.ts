import { describe, expect, it, vi } from "vitest";

import { switchDefaultOrg } from "@/codeclarity_components/organizations/switch-org";
import { useUserStore } from "@/stores/user";

import { createTestApp, org } from "../../tests/real-app";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const lab = { ...org, id: "org-456", name: "Research Lab" };

describe("user store", () => {
  it("holds the signed-in user and their default org after a page load", async () => {
    const app = createTestApp({ signedIn: true });

    await app.visit("/projects");

    const userStore = useUserStore();
    expect(userStore.getUser?.handle).toBe("JohnDoe");
    expect(userStore.getDefaultOrg?.name).toBe("Test Organization");
  });

  it("switches the default org on the server and for the signed-in user", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    const userStore = useUserStore();
    const userId = userStore.getUser?.id ?? "";
    app.http.on("GET", `/org/${lab.id}`, { data: lab });
    app.http.on("PATCH", `/users/${userId}/update_default_org`, {
      status_code: 200,
      status: "success",
    });

    await switchDefaultOrg(lab.id);

    expect(userStore.getDefaultOrg?.name).toBe("Research Lab");
    expect(userStore.getUser?.default_org.id).toBe(lab.id);
    expect(app.http.requests.at(-1)?.body).toEqual({ default_org: lab.id });
  });

  it("keeps the default org when the user cannot open the one picked", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    app.http.on(
      "GET",
      `/org/${lab.id}`,
      { error_code: "NotAuthorized", error_message: "Not authorized" },
      403,
    );

    await expect(switchDefaultOrg(lab.id)).rejects.toThrow();

    const userStore = useUserStore();
    expect(userStore.getDefaultOrg?.name).toBe("Test Organization");
    expect(userStore.getUser?.default_org.id).toBe(org.id);
    expect(app.http.requests.map((request) => request.method)).not.toContain(
      "PATCH",
    );
  });
});
