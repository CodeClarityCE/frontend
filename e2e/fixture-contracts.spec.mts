import { expect, type Page, test } from "@playwright/test";

import analysis from "./contracts/analysis.json" with { type: "json" };
import authUser from "./contracts/auth-user.json" with { type: "json" };
import licensePolicy from "./contracts/license-policy.json" with { type: "json" };
import licensePolicyList from "./contracts/license-policy-list.json" with { type: "json" };
import members from "./contracts/members.json" with { type: "json" };
import organizationList from "./contracts/organization-list.json" with { type: "json" };
import projectTickets from "./contracts/project-tickets.json" with { type: "json" };
import ticketDetail from "./contracts/ticket-detail.json" with { type: "json" };
import { shapeDiff } from "./helpers/shape.mjs";
import { AnalysesPage } from "./pages/analyses.page.mjs";
import { OrgMembersPage } from "./pages/org-members.page.mjs";
import { OrgPoliciesPage } from "./pages/org-policies.page.mjs";
import { OrgSettingsPage } from "./pages/org-settings.page.mjs";
import {
  ANALYSIS,
  PROJECT,
  ResultsStatusPage,
} from "./pages/results-status.page.mjs";
import { ShellPage } from "./pages/shell.page.mjs";
import { ticket, TicketsPage } from "./pages/tickets.page.mjs";
import { VulnerabilitiesPage } from "./pages/vulnerabilities.page.mjs";

// Proves the shape check reports drift, on inline values only.
test.describe("Shape check", () => {
  test("passes when the fixture has the captured shape", () => {
    expect(
      shapeDiff(
        { data: [{ id: "a", tags: [], owner: { name: "n" } }], total: 1 },
        { data: [{ id: "b", tags: ["x"], owner: { name: "m" } }], total: 9 },
      ),
    ).toEqual([]);
  });

  test("reports a key the API does not return", () => {
    expect(shapeDiff({ id: "a", role: 0 }, { id: "b" })).toEqual([
      "$.role: fixture has it, the API does not return it",
    ]);
  });

  test("reports a key the API returns that the fixture lacks", () => {
    expect(shapeDiff({ id: "a" }, { id: "b", user: { id: "u" } })).toEqual([
      "$.user: the API returns it, the fixture lacks it",
    ]);
  });

  test("reports a different type", () => {
    expect(shapeDiff({ role: "admin" }, { role: 0 })).toEqual([
      "$.role: fixture is string, the API returns number",
    ]);
  });

  test("checks every fixture array item against the API items", () => {
    expect(
      shapeDiff(
        { data: [{ id: "a" }, { id: "b", name: "x" }] },
        { data: [{ id: "c" }] },
      ),
    ).toEqual(["$.data[1].name: fixture has it, the API does not return it"]);
  });

  test("reports a value where the API returned null, and the reverse", () => {
    expect(
      shapeDiff({ avatar: "a.png", ttl: null }, { avatar: null, ttl: "t" }),
    ).toEqual([
      "$.avatar: fixture is string, the API returns null",
      "$.ttl: fixture is null, the API returns string",
    ]);
  });

  test("passes when both are null", () => {
    expect(shapeDiff({ avatar: null }, { avatar: null })).toEqual([]);
  });

  test("reports fixture items the API returned none of", () => {
    expect(shapeDiff({ links: [{ url: "u" }] }, { links: [] })).toEqual([
      "$.links: the API returned an empty array, so its items are unchecked",
    ]);
  });

  test("checks only the type of a record's value", () => {
    const rules = { records: ["$.config"] };
    expect(
      shapeDiff({ config: {} }, { config: { branch: "x" } }, rules),
    ).toEqual([]);
    expect(shapeDiff({ config: [] }, { config: {} }, rules)).toEqual([
      "$.config: fixture is array, the API returns object",
    ]);
  });

  test("accepts null or no items only at the paths a contract lists", () => {
    const allowed = { nullable: ["$.data[].avatar", "$.data[].links"] };
    expect(
      shapeDiff(
        { data: [{ avatar: null, links: [{ url: "u" }] }] },
        { data: [{ avatar: "a.png", links: [] }] },
        allowed,
      ),
    ).toEqual([]);
    expect(
      shapeDiff(
        { data: [{ avatar: 1, links: [] }] },
        { data: [{ avatar: "a.png", links: [] }] },
        allowed,
      ),
    ).toEqual(["$.data[0].avatar: fixture is number, the API returns string"]);
  });
});

/** Fetches a path from a blank page, so the page object's mocks answer it. */
async function served(page: Page, path: string): Promise<unknown> {
  await page.route("http://contract.test/", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );
  await page.goto("http://contract.test/");
  return page.evaluate(async (p) => (await fetch(p)).json(), path);
}

// Each fixture a page object serves must have the shape of a response captured
// from the real API. Recapture with `node e2e/contracts/capture.mts`.
const contracts = [
  {
    name: "signed-in user",
    capture: authUser,
    path: "/api/auth/user",
    signIn: (page: Page) => new ShellPage(page).signIn(),
  },
  {
    name: "organization list",
    capture: organizationList,
    path: "/api/org?page=0&entries_per_page=50",
    signIn: (page: Page) => new ShellPage(page).signIn(),
  },
  {
    name: "organization list (organisations page)",
    capture: organizationList,
    path: "/api/org?page=0&entries_per_page=100",
    signIn: (page: Page) => new OrgSettingsPage(page).signIn(),
  },
  {
    name: "members list",
    capture: members,
    path: "/api/org/org-123/members?page=0&entries_per_page=50",
    signIn: (page: Page) => new OrgMembersPage(page).signIn(),
  },
  {
    name: "single license policy",
    capture: licensePolicy,
    path: "/api/org/org-123/policies/license_policy/lp-1",
    signIn: (page: Page) => new OrgPoliciesPage(page).signIn(),
  },
  {
    name: "ticket detail",
    capture: ticketDetail,
    path: "/api/org/org-123/tickets/t-1",
    signIn: (page: Page) => new TicketsPage(page).signIn(),
    // Set only for some tickets. No dev ticket has external links (they need
    // a ClickUp sync), so their items stay unchecked.
    rules: {
      nullable: [
        "$.data.external_status",
        "$.data.recommended_version",
        "$.data.resolved_on",
      ],
    },
  },
  {
    name: "project tickets",
    capture: projectTickets,
    path: "/api/org/org-123/projects/proj-1/tickets?page=0&entries_per_page=100",
    signIn: (page: Page) =>
      new VulnerabilitiesPage(page).signIn({
        tickets: [ticket("t-9", "CVE-2024-0002: express")],
      }),
  },
  {
    name: "license policy list",
    capture: licensePolicyList,
    path: "/api/org/org-123/policies/license_policy?page=0&entries_per_page=100",
    signIn: async (page: Page) => {
      await new AnalysesPage(page).signIn();
    },
  },
  {
    name: "single analysis",
    capture: analysis,
    path: `/api/org/org-123/projects/${PROJECT}/analyses/${ANALYSIS}`,
    signIn: (page: Page) => new ResultsStatusPage(page).signIn(),
    drift: undefined,
    // A step has no result until it ends, and its config is the plugin's own.
    rules: {
      nullable: ["$.data.steps[][].Result"],
      records: ["$.data.steps[][].Config"],
    },
  },
];

test.describe("Fixture contracts", () => {
  for (const contract of contracts) {
    test(`${contract.name} fixture matches ${contract.capture.endpoint}`, async ({
      page,
    }) => {
      // Known drift: remove this line once the linked ticket aligns the fixture.
      test.fail(
        !!contract.drift,
        `Fixture drift, fixed by CodeClarityCE/codeclarity-dev${contract.drift}`,
      );
      await contract.signIn(page);
      const fixture = await served(page, contract.path);
      expect(
        shapeDiff(fixture, contract.capture.response, contract.rules),
      ).toEqual([]);
    });
  }
});
