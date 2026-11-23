import { expect, type Page, test } from "@playwright/test";

import { expectPageSweep } from "./helpers/page-sweep.mjs";
import {
  BAD_KEY,
  ClickUpApi,
  GOOD_KEY,
  RAW_PROVIDER_ERROR,
} from "./pages/clickup-api.mjs";
import { OrgIntegrationsPage } from "./pages/org-integrations.page.mjs";
import { TicketsPage } from "./pages/tickets.page.mjs";

const savedClickUp = {
  auth_method: "API_KEY",
  api_key: GOOD_KEY,
  list_id: "li1",
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

/** Opens the ClickUp setup dialog from the organisation's add page. */
async function openSetup(page: Page, api: ClickUpApi): Promise<void> {
  const integrations = new OrgIntegrationsPage(page);
  await integrations.signIn({ ticketing: [] });
  await api.install(page);
  await integrations.gotoAdd("CLICKUP");
  await page.getByRole("button", { name: "Configure ClickUp" }).click();
}

function setupDialog(page: Page): ReturnType<Page["getByRole"]> {
  return page.getByRole("dialog", { name: "Connect ClickUp" });
}

async function verifyKey(page: Page, key: string): Promise<void> {
  const dialog = setupDialog(page);
  await dialog.getByLabel("ClickUp API key").fill(key);
  await dialog.getByRole("button", { name: "Verify" }).click();
}

// Opens a select from the keyboard: the page objects' fixed clock stops Reka
// selects from opening on a mouse click.
async function choose(
  page: Page,
  field: string,
  option: string,
): Promise<void> {
  await setupDialog(page)
    .getByRole("combobox", { name: field, exact: true })
    .press("Enter");
  await page.getByRole("option", { name: option }).click();
}

test.describe("ClickUp setup", () => {
  test("verifying a wrong key leaves no integration behind", async ({
    page,
  }) => {
    const api = new ClickUpApi();
    await openSetup(page, api);

    await verifyKey(page, BAD_KEY);
    await expect(setupDialog(page)).toContainText(
      "ClickUp did not accept these credentials",
    );
    await setupDialog(page).getByRole("button", { name: "Cancel" }).click();

    await new OrgIntegrationsPage(page).gotoList();
    const table = page.getByRole("table", { name: "Integrations" });
    await expect(table).toContainText("github.com");
    await expect(table).not.toContainText("ClickUp");
    expect(api.saves).toEqual([]);
  });

  test("verifying a valid key saves nothing until Connect", async ({
    page,
  }) => {
    const api = new ClickUpApi();
    await openSetup(page, api);

    await verifyKey(page, GOOD_KEY);
    await expect(setupDialog(page)).toContainText("API key valid");
    await choose(page, "Space", "Engineering");
    await choose(page, "Folder (optional)", "Backlog");
    await choose(page, "List", "Vulnerabilities");
    expect(api.saves).toEqual([]);

    await setupDialog(page)
      .getByRole("button", { name: "Connect", exact: true })
      .click();

    await expect(page).toHaveURL(/\/orgs\/manage\/integrations\/org-123/);
    expect(api.saves).toEqual([
      expect.objectContaining({
        auth_method: "API_KEY",
        api_key: GOOD_KEY,
        workspace_id: "ws1",
        space_id: "sp1",
        folder_id: "fo1",
        list_id: "li1",
      }),
    ]);
  });

  test("an error on the API key tab is gone on the OAuth tab and back", async ({
    page,
  }) => {
    await openSetup(page, new ClickUpApi());
    const dialog = setupDialog(page);

    await verifyKey(page, BAD_KEY);
    await expect(dialog.getByRole("status")).toContainText(
      "did not accept these credentials",
    );
    await expectPageSweep(page);

    await dialog.getByRole("tab", { name: "OAuth" }).click();
    await expect(dialog).not.toContainText("did not accept these credentials");
    await expectPageSweep(page);
    await dialog.getByRole("tab", { name: "API Key" }).click();
    await expect(dialog).not.toContainText("did not accept these credentials");
  });
});

test.describe("ClickUp connection test", () => {
  test("a failure is explained in plain words, not provider JSON", async ({
    page,
  }) => {
    const api = new ClickUpApi(savedClickUp);
    api.testError = RAW_PROVIDER_ERROR;
    const integrations = new OrgIntegrationsPage(page);
    await integrations.signIn();
    await api.install(page);
    await integrations.shell.goto(
      "/orgs/edit/integrations/org-123?provider=CLICKUP",
    );

    await page.getByRole("button", { name: "Test connection" }).click();

    const status = page.getByRole("status").filter({ hasText: "ClickUp" });
    await expect(status).toContainText(
      "ClickUp did not accept the connection test",
    );
    await expect(page.getByText("OAUTH_025")).toHaveCount(0);
    await expectPageSweep(page);
  });
});

test.describe("Disconnecting ClickUp from the tickets page", () => {
  async function openPanel(page: Page, api: ClickUpApi): Promise<void> {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await api.install(page);
    await tickets.goto();
    await page.getByRole("button", { name: "Integrations" }).click();
  }

  test("asks first and does nothing on cancel", async ({ page }) => {
    const api = new ClickUpApi(savedClickUp);
    await openPanel(page, api);

    await page.getByRole("button", { name: "Disconnect" }).click();
    const confirm = page.getByRole("dialog", {
      name: "Disconnect ClickUp?",
    });
    await expect(confirm).toBeVisible();
    await expectPageSweep(page);
    await confirm.getByRole("button", { name: "Cancel" }).click();

    await expect(confirm).toHaveCount(0);
    expect(api.deleted).toEqual([]);
  });

  test("reports the outcome after confirming", async ({ page }) => {
    const api = new ClickUpApi(savedClickUp);
    await openPanel(page, api);

    await page.getByRole("button", { name: "Disconnect" }).click();
    await page
      .getByRole("dialog", { name: "Disconnect ClickUp?" })
      .getByRole("button", { name: "Disconnect" })
      .click();

    await expect(page.getByText("Disconnected ClickUp")).toBeVisible();
    expect(api.deleted).toEqual(["/CLICKUP"]);
    const panel = page.getByRole("dialog", { name: "Ticket integrations" });
    const connect = panel.getByRole("button", {
      name: "Connect ClickUp",
      exact: true,
    });
    await expect(connect).toBeVisible();
    // Chromium spaces out the hidden name itself, so check the text as well.
    await expect(connect).toHaveText("Connect ClickUp");
    await expectPageSweep(page);
  });
});
