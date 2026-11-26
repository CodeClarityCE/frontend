import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

import PasswordResetForm from "./PasswordResetForm.vue";

function renderForm(): void {
  const app = createTestApp();
  render(PasswordResetForm, { global: app.global });
}

const submit = (): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: "Update password" }));

describe("PasswordResetForm validation", () => {
  it("asks for both passwords when the form is sent untouched", async () => {
    renderForm();

    await submit();

    await waitFor(() => {
      expect(screen.getAllByText("Required")).toHaveLength(2);
    });
  });

  it("says a short password is too short", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("New password"), "   ");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "   ");
    await submit();

    expect(await screen.findByText("Too short")).toBeInTheDocument();
  });

  it("says when the passwords do not match", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("New password"), "abcdefghij1");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "abcdefghij2",
    );
    await submit();

    expect(await screen.findByText("Passwords must match")).toBeInTheDocument();
  });
});
