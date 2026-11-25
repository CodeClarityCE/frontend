import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

import UserAuthForm from "./UserAuthForm.vue";

function renderForm(): void {
  const app = createTestApp();
  render(UserAuthForm, { global: app.global });
}

const submit = (): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: "Sign in" }));

describe("UserAuthForm validation", () => {
  it("asks for the email and password when the form is sent empty", async () => {
    renderForm();

    await submit();

    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
  });

  it("asks for the email when only spaces are typed", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "   ");
    await submit();

    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
  });

  it("says an invalid email is invalid", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await submit();

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();
  });
});
