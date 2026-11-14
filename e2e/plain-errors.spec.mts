import { expect, type Page, test } from "@playwright/test";

import { OrgMembersPage } from "./pages/org-members.page.mjs";
import { OrgPoliciesPage } from "./pages/org-policies.page.mjs";
import { OrgSettingsPage } from "./pages/org-settings.page.mjs";
import { ProjectsPage } from "./pages/projects.page.mjs";

// A failed action shows one message a user can act on: no error codes, no
// raw server reasons, and no toast repeating an inline error.

const ORG = "org-123";

// Records the text of every toast shown, so short-lived ones are not missed.
async function recordToasts(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __toasts: string[] }).__toasts = seen;
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (
            node instanceof HTMLElement &&
            node.matches("[data-sonner-toast]")
          )
            seen.push(node.textContent ?? "");
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
  return () =>
    page.evaluate(() => (window as unknown as { __toasts: string[] }).__toasts);
}

function businessError(status: number, code: string, message: string) {
  return {
    status,
    json: {
      status_code: status,
      status: "failure",
      error_code: code,
      error_message: message,
    },
  };
}

test.describe("One plain error per failure", () => {
  test("a policy list that fails to load says so once, in plain words", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await page.route(
      `**/api/org/${ORG}/policies/vulnerability_policy**`,
      (route) =>
        route.fulfill(
          businessError(403, "NotAuthorized", "Not authorized to do this."),
        ),
    );
    await policies.gotoList();
    await policies.tab("Vulnerability policies").click();

    await expect(
      page.getByText("The vulnerability policies could not be loaded."),
    ).toBeVisible();
    await expect(page.getByText(/Not authorized to do this/)).toHaveCount(0);
    expect(await shown()).toEqual([]);
  });

  test("a failed policy delete shows one plain toast", async ({ page }) => {
    const shown = await recordToasts(page);
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await page.route(
      `**/api/org/${ORG}/policies/vulnerability_policy/vp-2`,
      (route) =>
        route.request().method() === "DELETE"
          ? route.fulfill(
              businessError(500, "InternalError", "The server crashed hard."),
            )
          : route.fallback(),
    );
    await policies.gotoList();
    await policies.tab("Vulnerability policies").click();

    await page
      .getByRole("button", { name: "Delete Test fixtures only" })
      .click();
    await page
      .getByRole("dialog", { name: "Delete Test fixtures only?" })
      .getByRole("button", { name: "Delete policy" })
      .click();

    await expect.poll(shown).toContain("The policy could not be deleted");
    expect(await shown()).toEqual(["The policy could not be deleted"]);
  });

  test("inviting an address with no account explains that an account is needed", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const members = new OrgMembersPage(page);
    await members.signIn();
    await page.route(`**/api/org/${ORG}/create_invite`, (route) =>
      route.fulfill(
        businessError(
          400,
          "UserDoesNotExist",
          "The referenced user does not exists.",
        ),
      ),
    );
    await members.gotoInvites();

    await page.getByRole("button", { name: "Invite a member" }).click();
    const dialog = page.getByRole("dialog", { name: "Invite a member" });
    await expect(dialog).toContainText("already have a CodeClarity account");

    await dialog.getByLabel("Email").fill("nobody@example.com");
    await dialog.getByRole("button", { name: "Send invitation" }).click();

    await expect(dialog.getByLabel("Email")).toHaveAccessibleDescription(
      /No CodeClarity account uses nobody@example.com\. They need to sign up before you can invite them\./,
    );
    await expect(dialog).toBeVisible();
    expect(await shown()).toEqual([]);
  });

  test("the organisation create form enforces the server's length limits", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoCreate();

    const name = page.getByRole("textbox", { name: "Name" });
    const description = page.getByRole("textbox", { name: "Description" });
    const create = page.getByRole("button", { name: "Create organisation" });
    await name.fill("n".repeat(51));
    await description.fill("d".repeat(251));
    await create.click();

    await expect(name).toHaveAccessibleDescription(/At most 50 characters/);
    await expect(description).toHaveAccessibleDescription(
      /At most 250 characters/,
    );
    // Waits for the refused submit to finish before typing valid values.
    await expect(create).toBeEnabled();
    expect(orgs.created).toEqual([]);

    await name.fill("n".repeat(50));
    await description.fill("d".repeat(250));
    await create.click();
    await expect.poll(() => orgs.created.length).toBe(1);
  });

  test("a rejected create shows a plain message without the server's reason", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({
      failWrite: { status: 400, error_code: "ValidationFailed" },
    });
    await orgs.gotoCreate();

    await page.getByRole("textbox", { name: "Name" }).fill("Research Lab");
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Ecosystem studies");
    await page.getByRole("button", { name: "Create organisation" }).click();

    await expect.poll(shown).not.toEqual([]);
    expect(await shown()).toEqual(["The organisation could not be created"]);
  });

  test("a missing terms checkbox on signup is reported next to it", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const registered: unknown[] = [];
    await page.route("**/api/auth/register", (route) => {
      registered.push(route.request().postDataJSON());
      return route.fulfill({ json: { status: "success" } });
    });
    await page.goto("/signup");
    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByLabel("First name").fill("Jane");
    await page.getByLabel("Last name").fill("Doe");
    await page.getByLabel("Handle").fill("janedoe");
    await page.getByLabel("Password", { exact: true }).fill("ThisIs4Str0ng!");
    await page.getByLabel("Confirm password").fill("ThisIs4Str0ng!");
    await page.getByRole("button", { name: "Create account" }).click();

    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).toHaveAttribute("aria-invalid", "true");
    await expect(checkbox).toHaveAccessibleDescription(
      /You must accept our terms and conditions to continue/,
    );
    expect(await shown()).toEqual([]);
    expect(registered).toEqual([]);
  });

  test("a rejected upload file is cleared from the input", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();
    await page.getByRole("button", { name: /Upload an archive/ }).click();

    const input = page.getByLabel("Archive", { exact: true });
    await input.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("x"),
    });

    await expect(page.getByRole("alert")).toContainText(
      "Invalid file type. Please upload a ZIP or TAR.GZ archive.",
    );
    await expect(input).toHaveValue("");
  });

  test("a failed archive upload says so once, without the server's reply", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await page.route(`**/api/org/${ORG}/file/**`, (route) =>
      route.fulfill(
        businessError(500, "InternalError", "Disk quota blew up badly."),
      ),
    );
    await projects.gotoCreate();
    await page.getByRole("button", { name: /Upload an archive/ }).click();

    await page.getByLabel("Name").fill("Shop");
    await page.getByLabel("Archive", { exact: true }).setInputFiles({
      name: "shop.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("PK"),
    });
    await page
      .getByRole("button", { name: "Create project and upload" })
      .click();

    await expect(page.getByRole("alert")).toHaveText(
      "The project was created, but the archive could not be uploaded.",
    );
    await expect(page.getByText(/Disk quota|Upload failed/)).toHaveCount(0);
    expect(await shown()).toEqual([]);
  });
});
