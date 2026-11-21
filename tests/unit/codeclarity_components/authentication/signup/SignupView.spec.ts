import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import SignupView from "@/codeclarity_components/authentication/signup/SignupView.vue";
import { useStateStore } from "@/stores/state";

import { createTestApp } from "../../../../real-app";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

describe("SignupView.vue", () => {
  it("shows the signup form as a public page", async () => {
    const app = createTestApp();
    await app.visit("/signup");

    render(SignupView, { global: app.global });

    for (const label of [
      "Email",
      "First name",
      "Last name",
      "Handle",
      "Password",
      "Confirm password",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    // The shell hides the signed-in sidebar on public pages.
    expect(useStateStore().publicPage).toBe(true);
  });
});
