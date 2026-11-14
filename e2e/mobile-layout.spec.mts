import { expect, type Page, test } from "@playwright/test";

import { expectScreenshots } from "./helpers/screenshots.mjs";
import { AnalysesPage } from "./pages/analyses.page.mjs";
import { DashboardPage } from "./pages/dashboard.page.mjs";
import { OrgIntegrationsPage } from "./pages/org-integrations.page.mjs";
import { OrgPoliciesPage } from "./pages/org-policies.page.mjs";
import { OrgSettingsPage } from "./pages/org-settings.page.mjs";
import { ProjectsPage } from "./pages/projects.page.mjs";
import {
  ANALYSIS,
  PROJECT,
  ResultTabsPage,
} from "./pages/result-tabs.page.mjs";
import { TicketsPage } from "./pages/tickets.page.mjs";

const PHONE = { width: 390, height: 844 };
const ORG = "org-123";

// Each page: how to answer its API calls, and its address.
const pages: {
  name: string;
  path: string;
  signIn: (page: Page) => Promise<unknown>;
}[] = [
  {
    name: "dashboard",
    path: "/",
    signIn: (page) => new DashboardPage(page).signIn(),
  },
  {
    name: "projects",
    path: "/projects",
    signIn: (page) => new ProjectsPage(page).signIn(),
  },
  {
    name: "project-import",
    path: "/projects/add",
    signIn: (page) => new ProjectsPage(page).signIn(),
  },
  {
    name: "results",
    path: `/results?analysis_id=${ANALYSIS}&project_id=${PROJECT}`,
    signIn: (page) => new ResultTabsPage(page).signIn({ vulnFinder: true }),
  },
  {
    name: "tickets",
    path: "/tickets",
    signIn: (page) => new TicketsPage(page).signIn(),
  },
  {
    name: "organisations",
    path: "/orgs/list",
    signIn: (page) => new OrgSettingsPage(page).signIn(),
  },
  {
    name: "organisation-form",
    path: "/orgs/add",
    signIn: (page) => new OrgSettingsPage(page).signIn(),
  },
  {
    name: "policies",
    path: `/orgs/manage/policies/${ORG}`,
    signIn: (page) => new OrgPoliciesPage(page).signIn(),
  },
  {
    name: "license-policy-form",
    path: `/orgs/add/policy/${ORG}`,
    signIn: (page) => new OrgPoliciesPage(page).signIn(),
  },
  {
    name: "integrations",
    path: `/orgs/manage/integrations/${ORG}`,
    signIn: (page) => new OrgIntegrationsPage(page).signIn(),
  },
  {
    name: "integration-form",
    path: `/orgs/add/integrations/${ORG}?provider=GITHUB`,
    signIn: (page) => new OrgIntegrationsPage(page).signIn(),
  },
  {
    name: "new-analysis",
    path: "/analyses/add?id=proj-1",
    signIn: (page) => new AnalysesPage(page).signIn(),
  },
  { name: "signup", path: "/signup", signIn: async () => {} },
  { name: "not-found", path: "/this/does/not/exist", signIn: async () => {} },
];

test.describe("Pages on a 390px phone", () => {
  test.use({ viewport: PHONE, hasTouch: true });

  for (const target of pages) {
    test(`${target.name} does not scroll sideways`, async ({ page }) => {
      await target.signIn(page);
      await page.goto(target.path);
      await expect(page.getByRole("heading").first()).toBeVisible();
      await page.waitForLoadState("networkidle");

      const width = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(width).toBeLessThanOrEqual(PHONE.width);

      await expectScreenshots(page, target.name, [PHONE.width]);
    });
  }
});
