import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TicketDetails } from "../tickets.entity";

import TicketHistory from "./TicketHistory.vue";

const { getTicketEvents } = vi.hoisted(() => ({
  getTicketEvents: vi.fn(),
}));

vi.mock("../tickets.repository", () => ({
  TicketsRepository: class {
    getTicketEvents = getTicketEvents;
  },
}));

// storeToRefs is mocked to pass the store through, so defaultOrg is a ref here.
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ defaultOrg: { value: { id: "org-1" } } }),
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "test-token" }),
}));

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
    created_on: new Date("2026-11-17T09:00:00Z"),
  };
}

async function renderHistory(): Promise<void> {
  render(TicketHistory, { props: { ticket } });
  await flushPromises();
}

describe("TicketHistory", () => {
  beforeEach(() => {
    getTicketEvents.mockReset();
  });

  it("shows the events the old enum dropped, newest first", async () => {
    getTicketEvents.mockResolvedValue({
      data: [
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
      ],
    });

    await renderHistory();

    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items.map((t) => t?.split("Jane Doe")[0]?.trim())).toEqual([
      "Set the due date to Dec 1, 2026",
      "Unlinked the ticket from ClickUp",
      "Took the status from ClickUp from Open to Resolved",
      "Reopened the ticket",
      "Resolved the ticket",
    ]);
    expect(getTicketEvents).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-1", ticketId: "t-1" }),
    );
  });

  it("names who made each change", async () => {
    getTicketEvents.mockResolvedValue({ data: [event("e-1", "REOPENED")] });

    await renderHistory();

    expect(screen.getByRole("listitem").textContent).toContain("Jane Doe,");
  });

  it("says when the history cannot be loaded", async () => {
    getTicketEvents.mockRejectedValue(new Error("down"));

    await renderHistory();

    expect(screen.getByRole("alert").textContent).toContain(
      "The history could not be loaded.",
    );
  });
});
