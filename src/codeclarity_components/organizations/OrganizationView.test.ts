import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { createTestApp, org } from "../../../tests/real-app";

import OrganizationView from "./OrganizationView.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

// Opens an /orgs URL and renders the view with the route's params, as the router does.
async function open(path: string): Promise<void> {
  const app = createTestApp({ signedIn: true });
  await app.visit(path);
  render(OrganizationView, {
    props: app.router.currentRoute.value.params,
    global: app.global,
  });
}

const pageTitles = (): string[] =>
  screen
    .queryAllByRole("heading", { level: 1 })
    .map((h) => h.textContent?.trim() ?? "");

describe("OrganizationView", () => {
  it.each([
    ["/orgs/list", "Organisations"],
    ["/orgs/add", "New organisation"],
    [`/orgs/manage/main/${org.id}`, "Organisation overview"],
    [`/orgs/manage/members/${org.id}`, "Members"],
    [`/orgs/manage/invites/${org.id}`, "Invitations"],
    [`/orgs/manage/logs/${org.id}`, "Audit logs"],
    [`/orgs/manage/analyzers/${org.id}`, "Analyzers"],
    [`/orgs/manage/policies/${org.id}`, "Policies"],
    [`/orgs/manage/policy/${org.id}`, "Policies"],
  ])("%s shows only the %s page", async (path, title) => {
    await open(path);

    await screen.findByRole("heading", { level: 1, name: title });
    expect(pageTitles()).toEqual([title]);
  });

  it("shows the connected services on the integrations page", async () => {
    await open(`/orgs/manage/integrations/${org.id}`);

    expect(
      await screen.findByRole("heading", { name: "Connected services" }),
    ).toBeInTheDocument();
  });

  it("opens the invites page with its invite dialog for the add action", async () => {
    await open(`/orgs/add/invites/${org.id}`);

    expect(
      await screen.findByRole("dialog", { name: "Invite a member" }),
    ).toBeInTheDocument();
  });

  it.each([
    "/orgs",
    "/orgs/nothing",
    `/orgs/manage/overview/${org.id}`,
    `/orgs/edit/members/${org.id}`,
    `/orgs/add/logs/${org.id}`,
    `/orgs/remove/analyzers/${org.id}`,
    "/orgs/manage/members",
  ])("%s shows not found", async (path) => {
    await open(path);

    await screen.findByRole("heading", { level: 1, name: "Page not found" });
    expect(pageTitles()).toEqual(["Page not found"]);
  });
});
