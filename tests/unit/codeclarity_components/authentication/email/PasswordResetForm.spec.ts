import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { afterEach, describe, expect, it } from "vitest";

import PasswordResetForm from "@/codeclarity_components/authentication/email/PasswordResetForm.vue";

import { createTestApp, type TestApp } from "../../../../real-app";

const ok = { status_code: 200, status: "success" };

// Opens the reset link from the email, with its query string.
async function openResetLink(search: string): Promise<TestApp> {
  const path = `/email_action/reset_password${search}`;
  window.history.replaceState({}, "", path);
  const app = createTestApp();
  app.http.on("POST", "/auth/password_reset", ok);
  await app.visit(path);
  render(PasswordResetForm, { global: app.global });
  return app;
}

async function submitPasswords(
  password: string,
  confirmation: string,
): Promise<void> {
  const typist = userEvent.setup();
  await typist.type(screen.getByLabelText("New password"), password);
  await typist.type(
    screen.getByLabelText("Confirm new password"),
    confirmation,
  );
  await typist.click(screen.getByRole("button", { name: "Update password" }));
}

const resetRequests = (app: TestApp) =>
  app.http.requests.filter((r) => r.path === "/auth/password_reset");

const failure = (error_code: string) => ({
  status_code: 400,
  status: "failure",
  error_code,
  error_message: "",
});

describe("PasswordResetForm", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("asks for the new password twice", async () => {
    await openResetLink("?token=t1&userid=u1");

    expect(
      screen.getByRole("heading", { name: "Choose a new password" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("sends the user back to sign in without a token", async () => {
    const app = await openResetLink("?userid=u1");

    await waitFor(() =>
      expect(app.router.currentRoute.value.name).toBe("login"),
    );
    expect(app.router.currentRoute.value.query.notice).toBe(
      "reset_link_invalid",
    );
  });

  it("resets the password with the link's token, then sends the user to sign in", async () => {
    const app = await openResetLink("?token=t1&userid=u1");

    await submitPasswords("ThisIs4Str0ng", "ThisIs4Str0ng");

    await waitFor(() =>
      expect(app.router.currentRoute.value.query.notice).toBe("password_reset"),
    );
    expect(app.router.currentRoute.value.name).toBe("login");
    expect(resetRequests(app).map((r) => r.body)).toEqual([
      {
        new_password: "ThisIs4Str0ng",
        new_password_confirmation: "ThisIs4Str0ng",
        token: "t1",
        user_id_hash: "u1",
      },
    ]);
  });

  it("explains passwords the server says do not match", async () => {
    const app = await openResetLink("?token=t1&userid=u1");
    app.http.on(
      "POST",
      "/auth/password_reset",
      failure("PasswordsDoNotMatch"),
      400,
    );

    await submitPasswords("ThisIs4Str0ng", "ThisIs4Str0ng");

    expect(
      await screen.findByText("Passwords do not match.", { exact: false }),
    ).toBeInTheDocument();
    expect(app.router.currentRoute.value.name).toBe("emailAction");
  });

  it("does not submit a password shorter than 10 characters", async () => {
    const app = await openResetLink("?token=t1&userid=u1");

    await submitPasswords("Short1!", "Short1!");

    expect(await screen.findByText("Too short")).toBeInTheDocument();
    expect(resetRequests(app)).toEqual([]);
  });

  it("does not submit passwords that do not match", async () => {
    const app = await openResetLink("?token=t1&userid=u1");

    await submitPasswords("ThisIs4Str0ng", "SomethingElse1");

    expect(await screen.findByText("Passwords must match")).toBeInTheDocument();
    expect(resetRequests(app)).toEqual([]);
  });

  it("offers a new reset when the link expired", async () => {
    const app = await openResetLink("?token=t1&userid=u1");
    app.http.on(
      "POST",
      "/auth/password_reset",
      failure("PasswordResetTokenInvalidOrExpired"),
      400,
    );

    await submitPasswords("ThisIs4Str0ng", "ThisIs4Str0ng");

    expect(
      await screen.findByRole("heading", { name: "Reset link expired" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("only valid for 30 minutes", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Request a new password reset" }),
    ).toHaveAttribute("href", "/password_reset_request");
  });
});
