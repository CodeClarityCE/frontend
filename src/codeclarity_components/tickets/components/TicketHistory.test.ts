import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";
import type { TicketDetails } from "../tickets.entity";

import TicketHistory from "./TicketHistory.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const eventsPath = `/org/${org.id}/tickets/t-1/events`;

const ticket = { id: "t-1" } as TicketDetails;

function event(
  id: string,
  event_type: string,
  event_data: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    event_type,
    event_data,
    performed_by_name: "Jane Doe",
    created_on: "2026-11-17T09:00:00Z",
  };
}

// The ticket page's history, with the events the API answers.
async function renderHistory(
  events: unknown[] | null,
  status = 200,
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", eventsPath, { data: events }, status);
  await app.visit("/tickets/t-1");
  render(TicketHistory, { props: { ticket }, global: app.global });
  await flushPromises();
  return app;
}

describe("TicketHistory", () => {
  it("shows the events the old enum dropped, newest first", async () => {
    await renderHistory([
      event("e-5", "DUE_DATE_CHANGED", {
        new_due_date: "2026-12-01T12:00:00Z",
      }),
      event("e-4", "UNLINKED_EXTERNAL", { external_provider: "CLICKUP" }),
      event("e-3", "SYNCED_FROM_EXTERNAL", {
        external_provider: "CLICKUP",
        old_status: "OPEN",
        new_status: "RESOLVED",
      }),
      event("e-2", "REOPENED"),
      event("e-1", "RESOLVED"),
    ]);

    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items.map((t) => t?.split("Jane Doe")[0]?.trim())).toEqual([
      "Set the due date to Dec 1, 2026",
      "Unlinked the ticket from ClickUp",
      "Took the status from ClickUp from Open to Resolved",
      "Reopened the ticket",
      "Resolved the ticket",
    ]);
  });

  it("names who made each change", async () => {
    await renderHistory([event("e-1", "REOPENED")]);

    expect(screen.getByRole("listitem").textContent).toContain("Jane Doe,");
  });

  it("says when the history cannot be loaded", async () => {
    await renderHistory(null, 500);

    expect(screen.getByRole("alert").textContent).toContain(
      "The history could not be loaded.",
    );
  });
});
