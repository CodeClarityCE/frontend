import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import {
  createTestApp,
  org,
  type TestApp,
  withToaster,
} from "../../../../tests/real-app";

import TicketDueDate from "./TicketDueDate.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const ticketPath = `/org/${org.id}/tickets/t-1`;

// The ticket page's due date field next to the app's toaster.
async function openDueDate(dueDate?: string): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("PATCH", ticketPath, { status_code: 200, status: "success" });
  await app.visit("/tickets/t-1");
  render(withToaster(TicketDueDate, { ticketId: "t-1", dueDate }), {
    global: app.global,
  });
  return app;
}

// The body of the last ticket update the page sent.
const saved = (app: TestApp): unknown =>
  app.http.requests.findLast((r) => r.method === "PATCH")?.body;

describe("TicketDueDate", () => {
  it("shows the ticket's due date as a day", async () => {
    await openDueDate(new Date(2027, 0, 15, 23, 59, 59).toISOString());

    expect(screen.getByLabelText<HTMLInputElement>("Due date").value).toBe(
      "2027-01-15",
    );
  });

  it("saves a new due date at the end of the chosen day", async () => {
    const app = await openDueDate();
    const typist = userEvent.setup();

    await typist.type(screen.getByLabelText("Due date"), "2027-03-01");
    await typist.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Due date saved")).toBeInTheDocument();
    expect(saved(app)).toEqual({
      due_date: new Date(2027, 2, 1, 23, 59, 59).toISOString(),
    });
  });

  it("clears the due date", async () => {
    const app = await openDueDate(new Date(2027, 0, 15).toISOString());

    await userEvent.click(
      screen.getByRole("button", { name: "Clear due date" }),
    );

    expect(await screen.findByText("Due date cleared")).toBeInTheDocument();
    expect(saved(app)).toEqual({ due_date: null });
  });

  it("says so when the due date can't be saved", async () => {
    const app = await openDueDate(new Date(2027, 0, 15).toISOString());
    app.http.on("PATCH", ticketPath, { error_code: "InternalError" }, 500);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("The due date could not be saved"),
    ).toBeInTheDocument();
  });
});
