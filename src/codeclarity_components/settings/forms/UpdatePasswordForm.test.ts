import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import {
  createTestApp,
  type TestApp,
  user,
  withToaster,
} from "../../../../tests/real-app";

import UpdatePasswordForm from "./UpdatePasswordForm.vue";

async function renderForm(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/settings");
  render(withToaster(UpdatePasswordForm), { global: app.global });
  return app;
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

  it("says when the current password is wrong", async () => {
    const app = await renderForm();
    app.http.on(
      "PATCH",
      `/users/${user.id}/update_password`,
      {
        status_code: 400,
        error_code: "IncorrectCurrentPassword",
        error_message: "",
      },
      400,
    );

    await userEvent.type(screen.getByLabelText("Current password"), "wrong");
    await userEvent.type(screen.getByLabelText("New password"), "abcdefghij1");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "abcdefghij1",
    );
    await submit();

    expect(
      await screen.findByText("The current password is incorrect"),
    ).toBeInTheDocument();
  });
});
