import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import PasswordResetRequestForm from "@/codeclarity_components/authentication/password_reset/PasswordResetRequestForm.vue";

import { createTestApp, type TestApp } from "../../../../real-app";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

async function openRequestPage(): Promise<TestApp> {
  const app = createTestApp();
  app.http.on("POST", "/auth/request_password_reset", {
    status_code: 200,
    status: "success",
  });
  await app.visit("/password_reset_request");
  render(PasswordResetRequestForm, { global: app.global });
  return app;
}

async function submitEmail(email: string): Promise<void> {
  const typist = userEvent.setup();
  await typist.type(screen.getByLabelText("Email"), email);
  await typist.click(screen.getByRole("button", { name: "Send reset link" }));
}

const resetRequests = (app: TestApp) =>
  app.http.requests.filter((r) => r.path === "/auth/request_password_reset");

describe("PasswordResetRequestForm", () => {
  it("asks for the account email", async () => {
    await openRequestPage();

    expect(
      screen.getByRole("heading", { name: "Reset your password" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to sign in" }),
    ).toHaveAttribute("href", "/login");
  });

  it("sends the reset request and confirms it", async () => {
    const app = await openRequestPage();

    await submitEmail("john.doe@codeclarity.io");

    expect(
      await screen.findByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(resetRequests(app).map((r) => r.body)).toEqual([
      { email: "john.doe@codeclarity.io" },
    ]);
    expect(
      screen.getByText("30 minutes", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).toBeNull();
  });

  it("does not send an invalid email", async () => {
    const app = await openRequestPage();

    await submitEmail("not-an-email");

    expect(
      await screen.findByText("Please enter a valid email", { exact: false }),
    ).toBeInTheDocument();
    expect(resetRequests(app)).toEqual([]);
  });

  it("shows an error when the request fails", async () => {
    const app = await openRequestPage();
    app.http.on(
      "POST",
      "/auth/request_password_reset",
      {
        status_code: 500,
        status: "failure",
        error_code: "InternalError",
        error_message: "",
      },
      500,
    );

    await submitEmail("john.doe@codeclarity.io");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An error occurred during the processing of the request.",
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
