import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

import UpdateInfoForm from "./UpdateInfoForm.vue";

// The form with the signed-in user's names filled in.
async function renderForm(): Promise<void> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/settings");
  render(UpdateInfoForm, { global: app.global });
}

const submit = (): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: "Save changes" }));

describe("UpdateInfoForm validation", () => {
  it("asks for both names when they are cleared", async () => {
    await renderForm();

    await userEvent.clear(screen.getByLabelText("First name"));
    await userEvent.clear(screen.getByLabelText("Last name"));
    await submit();

    await waitFor(() => {
      expect(screen.getAllByText("At least 2 characters")).toHaveLength(2);
    });
  });

  it("trims a name before checking its length", async () => {
    await renderForm();

    await userEvent.clear(screen.getByLabelText("First name"));
    await userEvent.type(screen.getByLabelText("First name"), "  a  ");
    await submit();

    expect(
      await screen.findByText("At least 2 characters"),
    ).toBeInTheDocument();
  });

  it("says a long name is too long", async () => {
    await renderForm();

    await userEvent.clear(screen.getByLabelText("Last name"));
    await userEvent.type(screen.getByLabelText("Last name"), "a".repeat(26));
    await submit();

    expect(
      await screen.findByText("At most 25 characters"),
    ).toBeInTheDocument();
  });
});
