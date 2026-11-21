import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import {
  createTestApp,
  type TestApp,
  withToaster,
} from "../../../../tests/real-app";

import OrgActionDialog from "./OrgActionDialog.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const ok = { status_code: 200, status: "success" };

// The dialog, open, next to the app's toaster.
function openDialog(action: "leave" | "delete"): TestApp {
  const app = createTestApp({ signedIn: true });
  render(
    withToaster(OrgActionDialog, {
      action,
      orgId: "org-1",
      orgName: "Acme",
      open: true,
    }),
    { global: app.global },
  );
  return app;
}

describe("OrgActionDialog", () => {
  it("lists everything an organisation delete removes", async () => {
    openDialog("delete");

    const text = (await screen.findByRole("alertdialog")).textContent ?? "";
    for (const item of [
      "projects",
      "analyses",
      "tickets",
      "analyzers",
      "invitations",
      "audit log",
    ]) {
      expect(text).toContain(item);
    }
    expect(text).toContain(
      "Integrations and policies also used by another organisation are kept there.",
    );
    expect(text).toContain("Tasks already created in ClickUp are kept.");
    expect(text).toContain("This cannot be undone.");
  });

  it("deletes the organisation when confirmed", async () => {
    const app = openDialog("delete");
    app.http.on("DELETE", "/org/org-1", ok);

    await userEvent.click(
      await screen.findByRole("button", { name: "Delete organisation" }),
    );

    expect(await screen.findByText("Deleted Acme")).toBeInTheDocument();
    expect(
      app.http.requests.some(
        (r) => r.method === "DELETE" && r.path === "/org/org-1",
      ),
    ).toBe(true);
  });

  it("tells the last owner to delete instead of leaving", async () => {
    const app = openDialog("leave");
    app.http.on(
      "POST",
      "/org/org-1/leave_org",
      {
        status_code: 400,
        status: "failure",
        error_code: "CannotLeaveAsLastOwner",
        error_message: "Last owner",
      },
      400,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Leave organisation" }),
    );

    expect(
      await screen.findByText(
        "You are the last owner, so you cannot leave. Delete the organisation instead.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
