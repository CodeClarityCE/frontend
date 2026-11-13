import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  businessError,
  invitedOrg,
  OrgJoinPage,
} from "./pages/settings.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Organisation invitation", () => {
  test("shows who invited the user, with which role, and joins", async ({
    page,
  }) => {
    const join = new OrgJoinPage(page);
    await join.signIn();
    await join.goto();

    await expect(join.heading).toHaveText("Join Open Source Lab?");
    await expect(
      page.getByText("Grace Hopper (grace@example.com)"),
    ).toBeVisible();
    await expect(
      page.getByText("Ada Lovelace (ada@example.com)"),
    ).toBeVisible();
    await expect(page.getByText("Moderator", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Join organisation" }).click();

    await expect(page.getByText("You joined Open Source Lab")).toBeVisible();
    await expect(page).toHaveURL(/\/orgs\/manage\/main\/org-999/);
    expect(join.joinRequests).toBe(1);
  });

  test("a deleted inviter is named as such", async ({ page }) => {
    const join = new OrgJoinPage(page);
    await join.signIn({
      info: { ...invitedOrg, invite_created_by: undefined },
    });
    await join.goto();

    await expect(page.getByText("Deleted user", { exact: true })).toBeVisible();
  });

  test("an expired invitation says so and offers no retry", async ({
    page,
  }) => {
    const join = new OrgJoinPage(page);
    await join.signIn({ infoError: businessError("EntityNotFound") });
    await join.goto();

    await expect(
      page.getByText("This invitation does not exist or has expired."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: "Go back" })).toBeVisible();
  });

  test("a failed join explains it and can be retried", async ({ page }) => {
    const join = new OrgJoinPage(page);
    await join.signIn({ joinError: businessError("InternalError") });
    await join.goto();

    await page.getByRole("button", { name: "Join organisation" }).click();

    await expect(
      page.getByText("You could not join the organisation"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect.poll(() => join.joinRequests).toBe(2);
  });

  test("the questions open with the keyboard", async ({ page }) => {
    const join = new OrgJoinPage(page);
    await join.signIn();
    await join.goto();
    const question = page.getByRole("button", {
      name: "What can each role do?",
    });

    await page.getByRole("button", { name: "Cancel" }).focus();
    await page.keyboard.press("Tab");
    await expectVisibleFocus(
      page.getByRole("button", {
        name: "What happens when I join an organisation?",
      }),
    );
    await question.focus();
    await page.keyboard.press("Enter");

    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByText("Moderators also manage invites"),
    ).toBeVisible();
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const join = new OrgJoinPage(page);
    await join.signIn();
    await join.goto();
    await expect(join.heading).toHaveText("Join Open Source Lab?");

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-join");
  });

  test("the error state passes axe and matches the screenshots", async ({
    page,
  }) => {
    const join = new OrgJoinPage(page);
    await join.signIn({ infoError: businessError("EntityNotFound") });
    await join.goto();
    await expect(
      page.getByText("This invitation does not exist or has expired."),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "org-join-expired");
  });
});
