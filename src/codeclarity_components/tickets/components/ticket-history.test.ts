import { describe, expect, it } from "vitest";

import { type TicketEvent, TicketEventType } from "../tickets.entity";

import { eventActor, eventLabel } from "./ticket-history";

function event(
  event_type: TicketEventType,
  event_data: Record<string, unknown> = {},
  performed_by_name?: string,
): TicketEvent {
  return {
    id: "e-1",
    event_type,
    event_data,
    created_on: new Date("2026-11-17T09:00:00Z"),
    ...(performed_by_name ? { performed_by_name } : {}),
  };
}

describe("eventLabel", () => {
  it("has a distinct label for every event type", () => {
    const labels = Object.values(TicketEventType).map((type) =>
      eventLabel(event(type)),
    );

    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it.each([
    [TicketEventType.RESOLVED, {}, "Resolved the ticket"],
    [TicketEventType.REOPENED, {}, "Reopened the ticket"],
    [
      TicketEventType.DUE_DATE_CHANGED,
      { new_due_date: "2026-12-01T12:00:00Z" },
      "Set the due date to Dec 1, 2026",
    ],
    [TicketEventType.DUE_DATE_CHANGED, {}, "Removed the due date"],
    [
      TicketEventType.SYNCED_FROM_EXTERNAL,
      {
        external_provider: "CLICKUP",
        old_status: "OPEN",
        new_status: "RESOLVED",
      },
      "Took the status from ClickUp from Open to Resolved",
    ],
    [
      TicketEventType.UNLINKED_EXTERNAL,
      { external_provider: "CLICKUP" },
      "Unlinked the ticket from ClickUp",
    ],
    [
      TicketEventType.STATUS_CHANGED,
      { old_status: "OPEN", new_status: "IN_PROGRESS" },
      "Changed the status from Open to In Progress",
    ],
    [
      TicketEventType.ASSIGNED,
      { assigned_to_name: "Jane Doe" },
      "Assigned the ticket to Jane Doe",
    ],
  ])("labels %s with %j as %s", (type, data, label) => {
    expect(eventLabel(event(type, data))).toBe(label);
  });
});

describe("eventActor", () => {
  it("names the person, or the automation or sync", () => {
    expect(eventActor(event(TicketEventType.REOPENED, {}, "Jane Doe"))).toBe(
      "Jane Doe",
    );
    expect(
      eventActor(event(TicketEventType.RESOLVED, { source: "automation" })),
    ).toBe("Automation");
    expect(
      eventActor(
        event(TicketEventType.SYNCED_FROM_EXTERNAL, { source: "sync" }),
      ),
    ).toBe("Sync");
  });
});
