import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { OrgIntegrationsPage } from "./pages/org-integrations.page.mjs";

// The organisation header (subcomponents/HeaderItem.vue) still shows a white on
// green role badge; it is migrated with the organisation pages.

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Organisation integrations list", () => {
  test("lists each integration with its status in words", async ({ page }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await integrations.gotoList();

    await expect(integrations.rows()).toHaveCount(4);
    await expect(integrations.row("github.com")).toContainText("Healthy");
    await expect(integrations.row("gitlab.example.com")).toContainText(
      "Expiring soon",
    );
    await expect(integrations.row("gitlab.com")).toContainText("Invalid");
    await expect(integrations.row("ClickUp")).toContainText("Connected");
  });

  test("deleting asks first in a dialog that keeps focus, then removes the row", async ({
    page,
  }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await integrations.gotoList();

    await page
      .getByRole("button", {
        name: "Delete the GitHub integration on github.com",
      })
      .click();

    await expect(integrations.dialog).toBeVisible();
    await expect(integrations.dialog).toContainText(
      "Delete the GitHub integration?",
    );
    const confirm = integrations.dialog.getByRole("button", {
      name: "Delete integration",
    });
    await expect(confirm).toHaveCSS("background-color", "rgb(220, 53, 69)");

    // Tabbing cycles inside the dialog.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      await expect(integrations.dialog.locator(":focus")).toHaveCount(1);
    }

    await page.keyboard.press("Escape");
    await expect(integrations.dialog).toHaveCount(0);
    expect(integrations.deleted).toEqual([]);

    await page
      .getByRole("button", {
        name: "Delete the GitHub integration on github.com",
      })
      .click();
    await confirm.click();

    await expect(integrations.dialog).toHaveCount(0);
    expect(integrations.deleted).toEqual([
      "/api/org/org-123/integrations/gh-1",
    ]);
    await expect(integrations.rows()).toHaveCount(3);
    await expect(integrations.row("github.com")).toHaveCount(0);
  });

  test("while loading, a skeleton stands in for the table", async ({
    page,
  }) => {
    const integrations = new OrgIntegrationsPage(page);
    const release = await integrations.signIn({ hold: true });
    await integrations.gotoList();

    await expect(
      page.getByRole("status", { name: "Loading Integrations" }),
    ).toBeVisible();

    release();

    await expect(integrations.rows()).toHaveCount(4);
  });
});

test.describe("Adding a token based integration", () => {
  test("GitHub: an empty or malformed token is flagged on its field", async ({
    page,
  }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await integrations.gotoAdd("GITHUB");
    const token = page.getByLabel("GitHub classic token");

    await expect(token).not.toHaveAttribute("aria-invalid", "true");
    await page.getByRole("button", { name: "Connect GitHub" }).click();

    await expect(token).toHaveAttribute("aria-invalid", "true");
    await expect(token).toHaveAccessibleDescription(
      /Enter a GitHub classic token/,
    );

    await token.fill("not-a-token");

    await expect(token).toHaveAccessibleDescription(/starts with ghp_/);
  });

  test("GitHub: a valid token is sent and leads back to the list", async ({
    page,
  }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    const sent = page.waitForRequest("**/integrations/github/add");
    await integrations.gotoAdd("GITHUB");

    await page.getByLabel("GitHub classic token").fill(`ghp_${"a".repeat(36)}`);
    await page.getByRole("button", { name: "Connect GitHub" }).click();

    await expect(page).toHaveURL(/\/orgs\/manage\/integrations\/org-123/);
    expect((await sent).postDataJSON()).toMatchObject({
      token: `ghp_${"a".repeat(36)}`,
    });
  });

  test("GitLab: a self-hosted instance needs a valid URL", async ({ page }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await integrations.gotoAdd("GITLAB");

    await page
      .getByLabel("GitLab personal access token")
      .fill(`glpat-${"b".repeat(20)}`);
    await page.getByRole("radio", { name: "Self-hosted" }).click();
    const url = page.getByLabel("Instance URL");
    await url.fill("gitlab.example");
    await page.getByRole("button", { name: "Connect GitLab" }).click();

    await expect(url).toHaveAttribute("aria-invalid", "true");
    await expect(url).toHaveAccessibleDescription(/Enter a full URL/);
  });
});

test.describe("Managing an integration", () => {
  test("shows the health in words and deletes after confirmation", async ({
    page,
  }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await integrations.gotoManage("GITLAB", "gl-1");

    await expect(
      page.getByRole("heading", { name: "GitLab integration" }),
    ).toBeVisible();
    await expect(
      page.getByText("Expiring soon", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("The token expires soon")).toBeVisible();

    await page.getByRole("button", { name: "Delete integration" }).click();
    await integrations.dialog
      .getByRole("button", { name: "Delete integration" })
      .click();

    await expect(page).toHaveURL(/\/orgs\/manage\/integrations\/org-123/);
    expect(integrations.deleted).toEqual([
      "/api/org/org-123/integrations/gl-1",
    ]);
  });
});

test.describe("Integrations accessibility and looks", () => {
  test("the list passes axe (WCAG 2.2 AA)", async ({ page }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await integrations.gotoList();
    await expect(integrations.rows()).toHaveCount(4);

    await expectNoAxeViolations(page);
  });

  test("the add and manage pages pass axe (WCAG 2.2 AA)", async ({ page }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await integrations.gotoAdd("GITLAB");
    await page.getByRole("button", { name: "Connect GitLab" }).click();
    await expect(
      page.getByLabel("GitLab personal access token"),
    ).toHaveAttribute("aria-invalid", "true");
    await expectNoAxeViolations(page);

    await integrations.gotoManage("GITHUB", "gh-1");
    await expect(page.getByText("Healthy", { exact: true })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("Tab reaches the row actions and add buttons with visible focus", async ({
    page,
  }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn({ ticketing: [] });
    await integrations.gotoList();
    await expect(integrations.rows()).toHaveCount(3);

    const manage = integrations
      .rows()
      .first()
      .getByRole("link", { name: /Manage/ });
    await manage.focus();
    await expectVisibleFocus(manage);

    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("button", {
        name: "Delete the GitHub integration on github.com",
      }),
    );

    const addClickUp = page.getByRole("link", { name: "Add ClickUp" });
    await addClickUp.focus();
    await expectVisibleFocus(addClickUp);
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/provider=CLICKUP/);
    await expect(
      page.getByRole("heading", { name: "Connect ClickUp" }),
    ).toBeVisible();
  });

  test("screenshots of the list, the GitHub form and the detail page", async ({
    page,
  }) => {
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await integrations.gotoList();
    await expect(integrations.rows()).toHaveCount(4);
    await expectScreenshots(page, "org-integrations");

    await integrations.gotoAdd("GITHUB");
    await page.getByRole("button", { name: "Connect GitHub" }).click();
    await expectScreenshots(page, "org-integrations-add-github");

    await integrations.gotoManage("GITLAB", "gl-1");
    await expect(page.getByText("The token expires soon")).toBeVisible();
    await expectScreenshots(page, "org-integrations-manage");
  });
});
