import { render } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { RouterView } from "vue-router";

import { useStateStore } from "@/stores/state";

import { createTestApp } from "../../tests/real-app";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

describe("state store", () => {
  it("follows the page the signed-in user opens", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/settings/account");
    render(RouterView, { global: app.global });
    await flushPromises();

    const state = useStateStore();
    expect(state.page).toBe("settings");
    expect(state.menu).toBe("settingsAccount");

    await app.router.push("/tickets");
    await flushPromises();

    expect(state.page).toBe("tickets");
  });
});
