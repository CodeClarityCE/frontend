import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

import PasswordResetRequestForm from "./PasswordResetRequestForm.vue";

function renderForm(): void {
  const app = createTestApp();
  render(PasswordResetRequestForm, { global: app.global });
}

const submit = (): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

describe("PasswordResetRequestForm validation", () => {
  it("asks for the email when the form is sent untouched", async () => {
    renderForm();

    await submit();

    expect(
      await screen.findByText("Please enter your email"),
    ).toBeInTheDocument();
  });

  it("asks for the email when only spaces are typed", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "   ");
    await submit();

    expect(
      await screen.findByText("Please enter your email"),
    ).toBeInTheDocument();
  });

  it("says an invalid email is invalid", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await submit();

    expect(
      await screen.findByText("Please enter a valid email"),
    ).toBeInTheDocument();
  });
});
