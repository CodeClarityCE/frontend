import { describe, expect, it, vi } from "vitest";

import { TicketsRepository } from "./tickets.repository";

describe("TicketsRepository.getTicketEvents", () => {
  it("reads the plain event list the API returns", async () => {
    const repository = new TicketsRepository();
    vi.spyOn(
      repository as unknown as { getRequest: () => Promise<unknown> },
      "getRequest",
    ).mockResolvedValue({
      data: [
        {
          id: "e-1",
          event_type: "REOPENED",
          event_data: { source: "manual" },
          created_on: "2026-11-17T09:00:00Z",
        },
      ],
    });

    const response = await repository.getTicketEvents({
      orgId: "org-1",
      ticketId: "t-1",
    });

    expect(response.data.map((e) => e.event_type)).toEqual(["REOPENED"]);
    expect(response.data[0]?.created_on).toBeInstanceOf(Date);
  });
});
