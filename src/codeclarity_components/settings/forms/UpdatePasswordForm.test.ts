import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { useAuthStore } from "@/stores/auth";

import { createTestApp, user, withToaster } from "../../../../tests/real-app";

import UpdatePasswordForm from "./UpdatePasswordForm.vue";

async function renderForm(): Promise<void> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/settings");
  render(UpdatePasswordForm, { global: app.global });
}

const submit = (): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: "Change password" }));

describe("UpdatePasswordForm validation", () => {
  it("names every missing field when the form is sent empty", async () => {
    await renderForm();

    await submit();

    expect(
      await screen.findByText("Enter your current password"),
    ).toBeInTheDocument();
    expect(screen.getByText("At least 10 characters")).toBeInTheDocument();
    expect(screen.getByText("Confirm the new password")).toBeInTheDocument();
  });

  it("says a short new password is too short", async () => {
    await renderForm();

    await userEvent.type(screen.getByLabelText("Current password"), "old");
    await userEvent.type(screen.getByLabelText("New password"), "short");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "short",
    );
    await submit();

    expect(
      await screen.findByText("At least 10 characters"),
    ).toBeInTheDocument();
  });

  it("says when the new passwords do not match", async () => {
    await renderForm();

    await userEvent.type(screen.getByLabelText("Current password"), "old");
    await userEvent.type(screen.getByLabelText("New password"), "abcdefghij1");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "abcdefghij2",
    );
    await submit();

    expect(
      await screen.findByText("The passwords do not match"),
    ).toBeInTheDocument();
  });
});

describe("UpdatePasswordForm sign-in", () => {
  async function changePassword(answer: unknown): Promise<void> {
    const app = createTestApp({ signedIn: true });
    app.http.on("PATCH", `/users/${user.id}/update_password`, answer);
    await app.visit("/settings");
    render(withToaster(UpdatePasswordForm), { global: app.global });

    await userEvent.type(screen.getByLabelText("Current password"), "old");
    await userEvent.type(screen.getByLabelText("New password"), "abcdefghij1");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "abcdefghij1",
    );
    await submit();
    await screen.findByText("Your password was changed");
  }

  it("keeps this tab signed in with the fresh sign-in the API returns", async () => {
    await changePassword({
      data: {
        token: "fresh-access-token",
        token_expiry: "2099-01-01T00:00:00.000Z",
        refresh_token: "fresh-refresh-token",
        refresh_token_expiry: "2099-02-01T00:00:00.000Z",
      },
    });

    expect(useAuthStore().getToken).toBe("fresh-access-token");
    expect(useAuthStore().getRefreshToken).toBe("fresh-refresh-token");
    expect(useAuthStore().getRefreshTokenExpiry).toEqual(
      new Date("2099-02-01T00:00:00.000Z"),
    );
  });

  it("keeps the current tokens when the API returns no sign-in", async () => {
    await changePassword({ status_code: 200, status: "success" });

    expect(useAuthStore().getToken).toBe("access-token");
    expect(useAuthStore().getRefreshToken).toBe("refresh-token");
  });
});
