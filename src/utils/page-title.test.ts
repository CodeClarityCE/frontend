import { describe, expect, it } from "vitest";

import router from "@/router";

import { pageTitle } from "./page-title";

const ORG = "org-1";
// Resolves a URL as the router does before a navigation; every route here has a name.
function titleOf(path: string): string {
  const to = router.resolve(path);
  return pageTitle({ ...to, name: to.name ?? undefined });
}

describe("pageTitle for organisation pages", () => {
  it.each([
    ["/orgs/add", "New organisation"],
    ["/orgs/list", "Organisations"],
    [`/orgs/manage/main/${ORG}`, "Organisation overview"],
    [`/orgs/manage/members/${ORG}`, "Members"],
    [`/orgs/manage/invites/${ORG}`, "Invitations"],
    [`/orgs/add/invites/${ORG}`, "Invitations"],
    [`/orgs/manage/logs/${ORG}`, "Audit logs"],
    [`/orgs/manage/tokens/${ORG}`, "Organization tokens"],
    [`/orgs/manage/integrations/${ORG}`, "Integrations"],
    [`/orgs/add/integrations/${ORG}`, "Integrations"],
    [`/orgs/edit/integrations/${ORG}`, "Integrations"],
    [`/orgs/manage/analyzers/${ORG}`, "Analyzers"],
    [`/orgs/add/analyzers/${ORG}`, "New analyzer"],
    [`/orgs/edit/analyzers/${ORG}`, "Edit analyzer"],
    [`/orgs/manage/policies/${ORG}`, "Policies"],
    [`/orgs/manage/policy/${ORG}`, "Policies"],
    [`/orgs/manage/vulnerability-policy/${ORG}`, "Policies"],
    [`/orgs/add/policy/${ORG}`, "New license policy"],
    [`/orgs/edit/policy/${ORG}`, "Edit license policy"],
    [`/orgs/add/policies/${ORG}`, "New license policy"],
    [`/orgs/add/vulnerability-policy/${ORG}`, "New vulnerability policy"],
    [`/orgs/edit/vulnerability-policy/${ORG}`, "Edit vulnerability policy"],
    ["/orgs", "Organisation not found"],
    ["/orgs/manage/members", "Organisation not found"],
    [`/orgs/edit/members/${ORG}`, "Organisation not found"],
    [`/orgs/remove/analyzers/${ORG}`, "Organisation not found"],
  ])("%s is titled %s", (path, name) => {
    expect(titleOf(path)).toBe(`${name} | CodeClarity`);
  });
});
