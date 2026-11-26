import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

import SignupForm from "./SignupForm.vue";

function renderForm(): void {
  const app = createTestApp();
  render(SignupForm, { global: app.global });
}

const submit = (): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: "Create account" }));

// Fills every field with a valid value.
async function fillValid(): Promise<void> {
  await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
  await userEvent.type(screen.getByLabelText("First name"), "Jane");
  await userEvent.type(screen.getByLabelText("Last name"), "Doe");
  await userEvent.type(screen.getByLabelText("Handle"), "janedoe");
  await userEvent.type(screen.getByLabelText("Password"), "abcdefghij1");
  await userEvent.type(
    screen.getByLabelText("Confirm password"),
    "abcdefghij1",
  );
  await userEvent.click(screen.getByRole("checkbox"));
}

describe("SignupForm validation", () => {
  it("names every missing field when the form is sent empty", async () => {
    renderForm();

    await submit();

    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("At least 2 characters")).toHaveLength(2);
    });
    expect(screen.getByText("At least 5 characters")).toBeInTheDocument();
    expect(screen.getByText("At least 10 characters")).toBeInTheDocument();
    expect(screen.getByText("Confirm your password")).toBeInTheDocument();
    expect(
      screen.getByText("You must accept our terms and conditions to continue"),
    ).toBeInTheDocument();
  });

  it("trims names and handles before checking their length", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "   ");
    await userEvent.type(screen.getByLabelText("First name"), "  a  ");
    await userEvent.type(screen.getByLabelText("Handle"), " abc  ");
    await submit();

    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("At least 2 characters")).toHaveLength(2);
    });
    expect(screen.getByText("At least 5 characters")).toBeInTheDocument();
  });

  it("says an invalid email is invalid", async () => {
    renderForm();
    await fillValid();

    await userEvent.clear(screen.getByLabelText("Email"));
    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await submit();

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();
  });

  it("says when the passwords do not match", async () => {
    renderForm();
    await fillValid();

    await userEvent.type(screen.getByLabelText("Confirm password"), "2");
    await submit();

    expect(
      await screen.findByText("The passwords do not match"),
    ).toBeInTheDocument();
  });
});
