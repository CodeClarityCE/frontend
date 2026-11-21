import type { RouteLocationRaw } from "vue-router";

/** The page of one ticket. */
export const ticketRoute = (ticketId: string): RouteLocationRaw => ({
  name: "ticket",
  params: { ticketId },
});
