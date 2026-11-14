import { expect, type Page, test } from "@playwright/test";

import { OrgAnalyzersPage } from "./pages/org-analyzers.page.mjs";
import { OrgPoliciesPage } from "./pages/org-policies.page.mjs";
import {
  ORG,
  organization,
  OrgSettingsPage,
} from "./pages/org-settings.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

const notFound = (page: Page) =>
  page.getByRole("heading", { level: 1, name: /not found/ });

/** A failure the API sends for a route it does not know, raw path included. */
function rawPathFailure(path: string): Record<string, unknown> {
  return {
    status: 404,
    json: {
      status_code: 404,
      status: "failure",
      error_code: "InternalError",
      error_message: `Cannot GET ${path}`,
    },
  };
}

async function expectNoRawToast(page: Page): Promise<void> {
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /Cannot GET|ErrorCode|\/org\// }),
  ).toHaveCount(0);
}

test.describe("Organisation URLs that match no page", () => {
  for (const path of [
    "/orgs",
    "/orgs/nothing",
    `/orgs/manage/nothing/${ORG}`,
    `/orgs/edit/members/${ORG}`,
    `/orgs/remove/analyzers/${ORG}`,
    `/orgs/list/main/${ORG}`,
  ]) {
    test(`${path} shows a not-found state`, async ({ page }) => {
      const orgs = new OrgSettingsPage(page);
      await orgs.signIn();
      await orgs.shell.goto(path);

      await expect(notFound(page)).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: /Back to the organisation|Organisations/,
        }),
      ).toBeVisible();
    });
  }

  test("an unknown integration provider shows a not-found state", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.shell.goto(`/orgs/add/integrations/${ORG}?provider=BITBUCKET`);
    await expect(notFound(page)).toHaveText("Integration not found");

    await orgs.shell.goto(`/orgs/edit/integrations/${ORG}`);
    await expect(notFound(page)).toHaveText("Integration not found");
    await expect(page).toHaveURL(new RegExp(`/orgs/edit/integrations/${ORG}`));
  });
});

test.describe("Pages a role cannot use", () => {
  const member = organization(ORG, "Test Organization", { role: 3 });

  for (const path of [
    `/orgs/manage/integrations/${ORG}`,
    `/orgs/add/integrations/${ORG}?provider=GITHUB`,
    `/orgs/edit/integrations/${ORG}?provider=GITHUB&integrationId=gh-1`,
    `/orgs/manage/logs/${ORG}`,
    `/orgs/add/policy/${ORG}`,
  ]) {
    test(`a member opening ${path} lands on the overview`, async ({ page }) => {
      const orgs = new OrgSettingsPage(page);
      await orgs.signIn({ org: member });
      await orgs.shell.goto(path);

      await expect(page).toHaveURL(new RegExp(`/orgs/manage/main/${ORG}/?$`));
      await expect(orgs.heading).toHaveText("Organisation overview");
    });
  }

  test("a member sees no links to audit logs, integrations or analyzers", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({ org: member });
    await orgs.gotoOverview();

    await expect(orgs.orgNav.getByRole("link")).toHaveText([
      "Overview",
      "Policies",
    ]);
    const main = page.locator("#main-content");
    await expect(main.getByRole("link", { name: /^Policies/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /^Audit logs/ })).toHaveCount(
      0,
    );
  });

  test("a member sees the policies without New or Edit", async ({ page }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await page.route(`**/api/org/${ORG}`, (route) =>
      route.fulfill({ json: { data: member } }),
    );
    await policies.gotoList();

    await expect(policies.rows("License policies")).not.toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /New license policy/ }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Edit / })).toHaveCount(0);

    await policies.tab("Vulnerability policies").click();
    await expect(policies.rows("Vulnerability policies")).not.toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /New vulnerability policy/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^(Edit|Delete) / }),
    ).toHaveCount(0);
  });

  test("the command palette offers Create an analyzer to admins only", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({ org: member });
    await orgs.shell.goto("/datasets");
    await orgs.shell.page.keyboard.press("Control+k");
    await expect(orgs.shell.palette).toBeVisible();
    await expect(
      orgs.shell.palette.getByText("Create a Dataset"),
    ).toBeVisible();
    await expect(
      orgs.shell.palette.getByText("Create an analyzer"),
    ).toHaveCount(0);
  });
});

test.describe("Sidebar while viewing another organisation", () => {
  test("its links refer to the organisation being viewed", async ({ page }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await page.route("**/api/org/org-456", (route) =>
      route.fulfill({
        json: { data: organization("org-456", "Research Lab", { role: 3 }) },
      }),
    );
    await orgs.shell.goto("/orgs/manage/main/org-456");
    await expect(
      page.getByRole("region", { name: "Organisation" }),
    ).toContainText("Research Lab");

    await expect(orgs.shell.link("Organisation settings")).toHaveAttribute(
      "href",
      /\/orgs\/manage\/main\/org-456\/?$/,
    );
    await expect(orgs.orgNav.getByRole("link")).toHaveText([
      "Overview",
      "Policies",
    ]);
    await expect(orgs.subLink("Policies")).toHaveAttribute(
      "href",
      /\/orgs\/manage\/policies\/org-456\/?$/,
    );
  });
});

test.describe("Edit forms whose record failed to load", () => {
  test("the analyzer form is disabled and no toast shows a raw path", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await page.route(`**/api/org/${ORG}/analyzers/an-x`, (route) =>
      route.fulfill(rawPathFailure(`/org/${ORG}/analyzers/an-x`)),
    );
    await analyzers.gotoEdit("an-x");

    await expect(
      page.getByText("The analyzer could not be loaded"),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeDisabled();
    await expect(page.getByLabel("Description")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeDisabled();
    await expectNoRawToast(page);
  });

  test("the vulnerability policy form is disabled and no toast shows a raw path", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await page.route(
      `**/api/org/${ORG}/policies/vulnerability_policy/vp-x`,
      (route) =>
        route.fulfill(
          rawPathFailure(`/org/${ORG}/policies/vulnerability_policy/vp-x`),
        ),
    );
    await policies.shell.goto(
      `/orgs/edit/vulnerability-policy/${ORG}?policyId=vp-x`,
    );

    await expect(
      page.getByText("The vulnerability policy could not be loaded."),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Save policy" }),
    ).toBeDisabled();
    await expectNoRawToast(page);
  });

  test("a vulnerability policy edit link without an id says it could not be loaded", async ({
    page,
  }) => {
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await policies.shell.goto(`/orgs/edit/vulnerability-policy/${ORG}`);

    await expect(
      page.getByText("The vulnerability policy could not be loaded."),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeDisabled();
  });
});
