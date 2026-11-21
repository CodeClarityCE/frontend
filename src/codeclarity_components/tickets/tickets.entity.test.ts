import { describe, expect, it, vi } from "vitest";

import { Entity } from "@/utils/api/BaseEntity";

import { TicketEvent } from "./tickets.entity";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

// Every value of the API's TicketEventType (api ticket-event.entity.ts).
const API_EVENT_TYPES = [
  "CREATED",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "ASSIGNED",
  "UNASSIGNED",
  "SYNCED_EXTERNAL",
  "SYNCED_FROM_EXTERNAL",
  "UNLINKED_EXTERNAL",
  "OCCURRENCE_ADDED",
  "OCCURRENCE_RESOLVED",
  "RESOLVED",
  "REOPENED",
  "COMMENT_ADDED",
  "DUE_DATE_CHANGED",
];

describe("TicketEvent", () => {
  it("keeps an event of every type the API records", () => {
    const plain = API_EVENT_TYPES.map((event_type, i) => ({
      id: `e-${i}`,
      event_type,
      event_data: {},
      created_on: "2026-11-17T09:00:00Z",
    }));

    const events = Entity.unMarshalMany(
      plain as unknown as TicketEvent[],
      TicketEvent,
    );

    expect(events.map((e) => e.event_type)).toEqual(API_EVENT_TYPES);
  });
});
