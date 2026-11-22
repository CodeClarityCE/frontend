import { expect, type Page, test } from "@playwright/test";

import { linkFromEmail } from "./mailbox.mjs";
import { DEV_ACCOUNT, LOADED, logIn, unique } from "./stack.mjs";

// Golden journey 1: a new user signs up, confirms the email, logs in, creates an
// organisation and invites the dev account, who joins it from the invitation email.

test("a new user signs up, creates an organisation and a member joins it", async ({
  page,
  browser,
  request,
}) => {
  const id = unique("jane");
  const jane = {
    email: `${id}@example.com`,
    password: "Journey-Passw0rd!",
    handle: id.replaceAll("-", ""),
  };
  const org = `Org ${id}`;

  await test.step("sign up", async () => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill(jane.email);
    await page.getByLabel("First name").fill("Jane");
    await page.getByLabel("Last name").fill("Journey");
    await page.getByLabel("Handle").fill(jane.handle);
    await page.getByLabel("Password", { exact: true }).fill(jane.password);
    await page.getByLabel("Confirm password").fill(jane.password);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/login$/, LOADED);
  });

  await test.step("confirm the email address from the email", async () => {
    await page.goto(
      await linkFromEmail(
        request,
        jane.email,
        /confirm your registration/,
        "/email_action/confirm_registration",
      ),
    );
    await expect(
      page.getByRole("heading", { name: "Registration confirmed" }),
    ).toBeVisible(LOADED);
  });

  await test.step("log in", async () => {
    await logIn(page, jane);
  });

  await test.step("create an organisation", async () => {
    await page.goto("/orgs/add");
    await page.getByRole("textbox", { name: "Name" }).fill(org);
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Made by the golden journey");
    await page.getByRole("button", { name: "Create organisation" }).click();
    await expect(page).toHaveURL(/\/orgs\/manage\/main\//, LOADED);
    await expect(
      page.getByRole("region", { name: "Organisation" }),
    ).toContainText(org, LOADED);
  });

  await test.step("invite the dev account", async () => {
    await orgPage(page, "Invites");
    await page.getByRole("button", { name: "Invite a member" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Invite a member" });
    await dialog.getByLabel("Email").fill(DEV_ACCOUNT.email);
    await dialog.getByRole("button", { name: "Send invitation" }).click();
    await expect(dialog).toHaveCount(0, LOADED);
    await expect(
      page.getByRole("row").filter({ hasText: DEV_ACCOUNT.email }),
    ).toBeVisible(LOADED);
  });

  await test.step("the dev account joins from the invitation email", async () => {
    const link = await linkFromEmail(
      request,
      DEV_ACCOUNT.email,
      new RegExp(`Invited to join ${org}`),
      "/email_action/join_org",
    );
    const { baseURL, ignoreHTTPSErrors } = test.info().project.use;
    const member = await browser.newContext({ baseURL, ignoreHTTPSErrors });
    try {
      const memberPage = await member.newPage();
      await logIn(memberPage);
      await memberPage.goto(link);
      await memberPage
        .getByRole("button", { name: "Join organisation" })
        .click(LOADED);
      await expect(memberPage).toHaveURL(/\/orgs\/manage\/main\//, LOADED);
      await expect(
        memberPage.getByRole("region", { name: "Organisation" }),
      ).toContainText(org, LOADED);
    } finally {
      await member.close();
    }
  });

  await test.step("the organisation lists the new member", async () => {
    await orgPage(page, "Members");
    await expect(
      page.getByRole("row").filter({ hasText: DEV_ACCOUNT.name }),
    ).toBeVisible(LOADED);
  });
});

// Opens one of the organisation's settings pages from the sidebar.
async function orgPage(page: Page, name: string): Promise<void> {
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name, exact: true })
    .click(LOADED);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible(LOADED);
}
