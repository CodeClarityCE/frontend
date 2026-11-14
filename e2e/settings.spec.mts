import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { businessError, SettingsPage } from "./pages/settings.page.mjs";

const PASSWORD = "ThisIs4Str0ngP4ssW0rd?";
const NEW_PASSWORD = "An0ther-Str0ng-P4ssword";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Account settings", () => {
  test("shows the account sections under one heading", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();

    await expect(settings.heading).toHaveText("Account settings");
    await expect(settings.section("Personal information")).toBeVisible();
    await expect(settings.section("Password")).toBeVisible();
    await expect(settings.section("Delete account")).toBeVisible();
  });

  test("/settings opens the same account page", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.shell.goto("/settings");

    await expect(settings.heading).toHaveText("Account settings");
  });

  test("updating the name saves it and confirms", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();
    const section = settings.section("Personal information");

    await expect(section.getByLabel("First name")).toHaveValue("John");
    await expect(section.getByLabel("Last name")).toHaveValue("Doe");

    await section.getByLabel("First name").fill("Jane");
    await section.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Your name was updated")).toBeVisible();
    expect(settings.sent).toContainEqual(
      expect.objectContaining({
        method: "PATCH",
        body: expect.objectContaining({ first_name: "Jane", last_name: "Doe" }),
      }),
    );
  });

  test("a name that is too short is flagged on its field", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();
    const section = settings.section("Personal information");

    await section.getByLabel("First name").fill("J");
    await section.getByRole("button", { name: "Save changes" }).click();

    await expect(section.getByLabel("First name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(section.getByText("At least 2 characters")).toBeVisible();
    expect(settings.sent).toHaveLength(0);
  });

  test("changing the password checks the fields first", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();
    const section = settings.section("Password");

    await section.getByRole("button", { name: "Change password" }).click();

    await expect(
      section.getByText("Enter your current password"),
    ).toBeVisible();
    await expect(section.getByLabel("Current password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await section.getByLabel("Current password").fill(PASSWORD);
    await section.getByLabel("New password", { exact: true }).fill("short");
    await section.getByLabel("Confirm new password").fill("different");
    await section.getByRole("button", { name: "Change password" }).click();

    await expect(
      section.getByText("At least 10 characters", { exact: true }),
    ).toBeVisible();
    await expect(section.getByText("The passwords do not match")).toBeVisible();
    expect(settings.sent).toHaveLength(0);
  });

  test("a valid password change is sent and confirmed", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();
    const section = settings.section("Password");

    await section.getByLabel("Current password").fill(PASSWORD);
    await section
      .getByLabel("New password", { exact: true })
      .fill(NEW_PASSWORD);
    await section.getByLabel("Confirm new password").fill(NEW_PASSWORD);
    await section.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("Your password was changed")).toBeVisible();
    await expect(section.getByLabel("Current password")).toHaveValue("");
    expect(settings.sent).toContainEqual(
      expect.objectContaining({
        method: "PATCH",
        body: {
          old_password: PASSWORD,
          password: NEW_PASSWORD,
          password_confirmation: NEW_PASSWORD,
        },
      }),
    );
  });

  test("a rejected password change says why", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.signIn({
      fail: {
        update_password: businessError("CannotPerformActionOnSocialAccount"),
      },
    });
    await settings.goto();
    const section = settings.section("Password");

    await section.getByLabel("Current password").fill(PASSWORD);
    await section
      .getByLabel("New password", { exact: true })
      .fill(NEW_PASSWORD);
    await section.getByLabel("Confirm new password").fill(NEW_PASSWORD);
    await section.getByRole("button", { name: "Change password" }).click();

    await expect(
      page.getByText(
        "Accounts that sign in with GitHub or GitLab have no password",
      ),
    ).toBeVisible();
  });

  test("deleting the account asks for the password in a dialog", async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();

    await settings
      .section("Delete account")
      .getByRole("button", { name: "Delete account" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Delete your account?" });
    await expect(dialog).toBeVisible();

    // Focus stays inside the dialog.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(
      settings.section("Delete account").getByRole("button", {
        name: "Delete account",
      }),
    ).toBeFocused();
    expect(settings.sent).toHaveLength(0);
  });

  test("confirming the deletion deletes the account and signs out", async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();

    await settings
      .section("Delete account")
      .getByRole("button", { name: "Delete account" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Delete your account?" });
    await dialog.getByRole("button", { name: "Delete my account" }).click();
    await expect(
      dialog.getByText("Enter your password", { exact: true }),
    ).toBeVisible();
    expect(settings.sent).toHaveLength(0);

    await dialog.getByLabel("Password").fill(PASSWORD);
    await dialog.getByRole("button", { name: "Delete my account" }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(settings.sent).toContainEqual(
      expect.objectContaining({
        method: "DELETE",
        body: { password: PASSWORD },
      }),
    );
  });

  test("Tab moves through the forms in order with visible focus", async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();
    const info = settings.section("Personal information");
    const password = settings.section("Password");

    await info.getByLabel("First name").focus();
    await expectVisibleFocus(info.getByLabel("First name"));
    for (const target of [
      info.getByLabel("Last name"),
      info.getByRole("button", { name: "Save changes" }),
      password.getByLabel("Current password"),
      password.getByLabel("New password", { exact: true }),
      password.getByLabel("Confirm new password"),
      password.getByRole("button", { name: "Change password" }),
      settings
        .section("Delete account")
        .getByRole("button", { name: "Delete account" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "settings-account");

    await settings
      .section("Password")
      .getByRole("button", { name: "Change password" })
      .click();
    await expect(page.getByText("Enter your current password")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "settings-account-errors");
  });

  test("the delete dialog passes axe and shows the red action", async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    await settings.signIn();
    await settings.goto();

    await settings
      .section("Delete account")
      .getByRole("button", { name: "Delete account" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Delete your account?" }),
    ).toBeVisible();
    // Let the opening fade finish so axe measures the final colours.
    await page.waitForFunction(() => document.getAnimations().length === 0);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "settings-delete-dialog");
  });
});
