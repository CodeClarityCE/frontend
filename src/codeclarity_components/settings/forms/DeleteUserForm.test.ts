import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

import DeleteUserForm from "./DeleteUserForm.vue";

// Opens the delete dialog of a signed-in user.
async function openDialog(): Promise<HTMLElement> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/settings");
  render(DeleteUserForm, { global: app.global });
  await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
  return screen.findByRole("dialog");
}

describe("DeleteUserForm validation", () => {
  it("asks for the password when the form is sent empty", async () => {
    const dialog = await openDialog();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete my account" }),
    );

    expect(
      await within(dialog).findByText("Enter your password"),
    ).toBeInTheDocument();
  });
});
