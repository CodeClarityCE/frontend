import { render, type RenderResult } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { Component } from "vue";

import AnalyzerCreate from "@/codeclarity_components/organizations/analyzers/AnalyzerCreate.vue";
import AnalyzerEdit from "@/codeclarity_components/organizations/analyzers/AnalyzerEdit.vue";
import AnalyzersList from "@/codeclarity_components/organizations/analyzers/AnalyzersList.vue";
import ManageAuditLogs from "@/codeclarity_components/organizations/audit_logs/ManageAuditLogs.vue";
import IntegrationCreate from "@/codeclarity_components/organizations/integrations/IntegrationCreate.vue";
import IntegrationEdit from "@/codeclarity_components/organizations/integrations/IntegrationEdit.vue";
import IntegrationsList from "@/codeclarity_components/organizations/integrations/IntegrationsList.vue";
import ManageInvites from "@/codeclarity_components/organizations/invites/ManageInvites.vue";
import ManageMembers from "@/codeclarity_components/organizations/members/ManageMembers.vue";
import {
  isOrgAdmin,
  MemberRole,
} from "@/codeclarity_components/organizations/organization.entity";
import ManageTokens from "@/codeclarity_components/organizations/tokens/ManageTokens.vue";

import { createTestApp, org, type TestApp } from "../../../tests/real-app";

describe("isOrgAdmin", () => {
  it("is true for an owner or an admin only", () => {
    expect(isOrgAdmin(MemberRole.OWNER)).toBe(true);
    expect(isOrgAdmin(MemberRole.ADMIN)).toBe(true);
    expect(isOrgAdmin(MemberRole.MODERATOR)).toBe(false);
    expect(isOrgAdmin(MemberRole.USER)).toBe(false);
    expect(isOrgAdmin(undefined)).toBe(false);
    expect(isOrgAdmin(null)).toBe(false);
  });
});

// Each admin-only page with the org route a member would open it at.
const adminPages: [string, Component, string][] = [
  ["analyzer create", AnalyzerCreate, "add/analyzers"],
  ["analyzer edit", AnalyzerEdit, "edit/analyzers"],
  ["analyzers list", AnalyzersList, "manage/analyzers"],
  ["integration create", IntegrationCreate, "add/integrations"],
  ["integration edit", IntegrationEdit, "edit/integrations"],
  ["integrations list", IntegrationsList, "manage/integrations"],
  ["API tokens", ManageTokens, "manage/tokens"],
  ["audit log", ManageAuditLogs, "manage/audit-logs"],
];

async function openAs(
  role: MemberRole,
  page: Component,
  path: string,
): Promise<TestApp & { view: RenderResult }> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}`, { data: { ...org, role } });
  await app.visit("/projects");
  await app.router.push(`/orgs/${path}/${org.id}`);
  const view = render(page, { props: { orgId: org.id }, global: app.global });
  return { ...app, view };
}

async function expectSentToOverviewAndBackSkips(app: TestApp): Promise<void> {
  await vi.waitFor(() =>
    expect(app.router.currentRoute.value.params).toMatchObject({
      action: "manage",
      page: "main",
      orgId: org.id,
    }),
  );
  app.router.back();
  await vi.waitFor(() =>
    expect(app.router.currentRoute.value.path).toBe("/projects"),
  );
}

describe.each(adminPages)("the %s page", (_name, page, path) => {
  it("sends a member to the org overview, and Back skips the page", async () => {
    const app = await openAs(MemberRole.USER, page, path);
    await expectSentToOverviewAndBackSkips(app);
  });
});

// Pages a moderator or above may open.
const moderatorPages: [string, Component, string][] = [
  ["members", ManageMembers, "manage/members"],
  ["invites", ManageInvites, "manage/invites"],
];

describe.each(moderatorPages)("the %s page", (_name, page, path) => {
  it("sends a member to the org overview, and Back skips the page", async () => {
    const app = await openAs(MemberRole.USER, page, path);
    await expectSentToOverviewAndBackSkips(app);
  });

  it("keeps a moderator on the page", async () => {
    const app = await openAs(MemberRole.MODERATOR, page, path);
    // The invite button shows once the org's role has loaded.
    await app.view.findByText(/Invite a member/);
    await flushPromises();
    expect(app.router.currentRoute.value.path).toBe(`/orgs/${path}/${org.id}`);
  });
});
