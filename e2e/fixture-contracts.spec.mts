import { expect, type Page, test } from "@playwright/test";

import analysis from "./contracts/analysis.json" with { type: "json" };
import licensePolicy from "./contracts/license-policy.json" with { type: "json" };
import members from "./contracts/members.json" with { type: "json" };
import organizationList from "./contracts/organization-list.json" with { type: "json" };
import { shapeDiff } from "./helpers/shape.mjs";
import { OrgMembersPage } from "./pages/org-members.page.mjs";
import { OrgPoliciesPage } from "./pages/org-policies.page.mjs";
import {
  ANALYSIS,
  PROJECT,
  ResultsStatusPage,
} from "./pages/results-status.page.mjs";
import { ShellPage } from "./pages/shell.page.mjs";

// Proves the shape check reports drift, on inline values only.
test.describe("Shape check", () => {
  test("passes when the fixture has the captured shape", () => {
    expect(
      shapeDiff(
        { data: [{ id: "a", tags: ["x"], owner: { name: "n" } }], total: 1 },
        { data: [{ id: "b", tags: [], owner: { name: "m" } }], total: 9 },
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

  test("treats null as matching any type", () => {
    expect(
      shapeDiff({ avatar: "a.png", ttl: null }, { avatar: null, ttl: "t" }),
    ).toEqual([]);
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
    name: "organization list",
    capture: organizationList,
    path: "/api/org?page=0&entries_per_page=50",
    signIn: (page: Page) => new ShellPage(page).signIn(),
    drift: "#130",
  },
  {
    name: "members list",
    capture: members,
    path: "/api/org/org-123/members?page=0&entries_per_page=50",
    signIn: (page: Page) => new OrgMembersPage(page).signIn(),
    drift: "#130",
  },
  {
    name: "single license policy",
    capture: licensePolicy,
    path: "/api/org/org-123/policies/license_policy/lp-1",
    signIn: (page: Page) => new OrgPoliciesPage(page).signIn(),
    drift: "#131",
  },
  {
    name: "single analysis",
    capture: analysis,
    path: `/api/org/org-123/projects/${PROJECT}/analyses/${ANALYSIS}`,
    signIn: (page: Page) => new ResultsStatusPage(page).signIn(),
    drift: undefined,
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
      expect(shapeDiff(fixture, contract.capture.response)).toEqual([]);
    });
  }
});
