import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TicketDueDate from "./TicketDueDate.vue";

// The real v-model helper, so the shadcn input binds its value.
vi.unmock("@vueuse/core");

const { updateTicket } = vi.hoisted(() => ({ updateTicket: vi.fn() }));

vi.mock("../tickets.repository", () => ({
  TicketsRepository: class {
    updateTicket = updateTicket;
  },
}));
vi.mock("@/utils/toasts", () => ({
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

const mountDueDate = (dueDate?: string) =>
  mount(TicketDueDate, { props: { ticketId: "t-1", dueDate } });

describe("TicketDueDate", () => {
  beforeEach(() => {
    updateTicket.mockReset();
    updateTicket.mockResolvedValue({});
  });

  it("shows the ticket's due date as a day", () => {
    const due = new Date(2027, 0, 15, 23, 59, 59).toISOString();
    const wrapper = mountDueDate(due);
    expect(
      wrapper.get<HTMLInputElement>("input#ticket-due-date").element.value,
    ).toBe("2027-01-15");
  });

  it("saves a new due date at the end of the chosen day", async () => {
    const wrapper = mountDueDate();

    await wrapper.get("input#ticket-due-date").setValue("2027-03-01");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(updateTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "test-org-id",
        ticketId: "t-1",
        data: { due_date: new Date(2027, 2, 1, 23, 59, 59).toISOString() },
      }),
    );
    expect(wrapper.emitted("updated")).toHaveLength(1);
  });

  it("clears the due date", async () => {
    const wrapper = mountDueDate(new Date(2027, 0, 15).toISOString());

    await wrapper.get("button[aria-label='Clear due date']").trigger("click");
    await flushPromises();

    expect(updateTicket).toHaveBeenCalledWith(
      expect.objectContaining({ data: { due_date: null } }),
    );
    expect(wrapper.emitted("updated")).toHaveLength(1);
  });
});
