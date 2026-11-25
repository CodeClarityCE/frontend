import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

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
