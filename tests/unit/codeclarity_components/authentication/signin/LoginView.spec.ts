import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import LoginView from "@/codeclarity_components/authentication/signin/LoginView.vue";

import { createTestApp } from "../../../../real-app";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

// Opens the login page at this address, as a signed-out visitor.
async function openLogin(path = "/login"): Promise<void> {
  const app = createTestApp();
  await app.visit(path);
  render(LoginView, { global: app.global });
}

describe("LoginView.vue", () => {
  describe("Notices", () => {
    it("shows no notice without one in the URL", async () => {
      await openLogin();

      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("confirms a password reset", async () => {
      await openLogin("/login?notice=password_reset");

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Your password was changed. Sign in with your new password.",
      );
    });

    it("explains an incomplete reset link", async () => {
      await openLogin("/login?notice=reset_link_invalid");

      expect(screen.getByRole("alert")).toHaveTextContent(
        "This password reset link is incomplete.",
      );
    });

    it("ignores a notice it does not know", async () => {
      await openLogin("/login?notice=<b>hello</b>");

      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("shows the logo, the heading and the sign-in form", async () => {
    await openLogin();

    // One logo per theme.
    expect(screen.getAllByRole("img", { name: "CodeClarity" })).not.toEqual([]);
    expect(
      screen.getByRole("heading", { name: "Sign in to CodeClarity" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Welcome back. Please enter your credentials."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("links to the signup page, the terms and the privacy policy", async () => {
    await openLogin();

    expect(
      screen.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("link", { name: "Terms of service" }),
    ).toHaveAttribute("href", "/terms");
    expect(
      screen.getByRole("link", { name: "Privacy policy" }),
    ).toHaveAttribute("href", "/privacy");
  });
});
