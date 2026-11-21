import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import TicketsDashboardCard from "@/codeclarity_components/dashboard/charts/TicketsDashboardCard.vue";

import { createTestApp, org } from "../../../../real-app";

const stats = {
  total_open: 5,
  total_in_progress: 1,
  total_resolved_this_week: 2,
  total_closed: 0,
  total_overdue: 3,
  total_due_this_week: 4,
  by_priority: { critical: 0, high: 0, medium: 0, low: 0 },
  by_project: [],
  recent_tickets: [],
  avg_resolution_time_days: null,
};

describe("TicketsDashboardCard", () => {
  it("shows how many open tickets are overdue and due this week", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", `/org/${org.id}/tickets/stats`, { data: stats });
    await app.visit("/");
    const wrapper = mount(TicketsDashboardCard, {
      props: { integrationIds: [] },
      global: app.global,
    });
    await flushPromises();

    const deadlines = wrapper.get('[aria-label="Tickets by due date"]');
    const items = deadlines.findAll("li").map((li) => li.text());
    expect(items).toEqual(["Overdue3", "Due this week4"]);
  });
});
