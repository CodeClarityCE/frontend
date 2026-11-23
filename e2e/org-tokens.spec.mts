import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/a11y.mjs";
import { expectMainSnapshot } from "./helpers/aria-snapshot.mjs";
import { expectPageSweep } from "./helpers/page-sweep.mjs";
import { describeOnAPhone } from "./helpers/phone.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  NOW,
  OrgTokensPage,
  SECRET,
  tokenSummary,
} from "./pages/org-tokens.page.mjs";

const DAY = 86_400_000;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Organization tokens", () => {
  test("an admin creates a token and sees its secret once", async ({
    page,
  }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn();
    await tokens.goto();

    await expect(tokens.heading).toHaveText("Organization tokens");
    await expectNoAxeViolations(page);
    await expectPageSweep(page);
    await expectMainSnapshot(page, "create-form");
    await expectScreenshots(page, "create-form");

    await tokens.name.fill("ci-pipeline");
    await tokens.scope.selectOption("analyze");
    await tokens.expiry.selectOption("90");
    await tokens.createButton.click();

    await expect(tokens.secretPanel).toContainText(SECRET);
    await expect(tokens.secretPanel).toContainText(
      "Copy it now: it will not be shown again.",
    );
    expect(tokens.created).toEqual([
      { name: "ci-pipeline", scope: "analyze", expires_on: expect.any(String) },
    ]);
    // The page clock flows from NOW, so the expiry is 90 days on from about then.
    const expiresIn =
      Date.parse(tokens.created[0]!.expires_on) - NOW.getTime() - 90 * DAY;
    expect(expiresIn).toBeGreaterThanOrEqual(0);
    expect(expiresIn).toBeLessThan(60_000);
    await expectNoAxeViolations(page);
    await expectPageSweep(page);
    await expectMainSnapshot(page, "secret-shown");
    await expectScreenshots(page, "secret-shown");

    await tokens.secretPanel.getByRole("button", { name: "Done" }).click();
    await expect(tokens.secretPanel).toHaveCount(0);
    await expect(page.getByText(SECRET)).toHaveCount(0);
  });

  test("an admin sees the organization's tokens, but never their secrets", async ({
    page,
  }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn({
      tokens: [
        tokenSummary({ id: "tok-1", name: "ci-pipeline", scope: "analyze" }),
        tokenSummary({
          id: "tok-2",
          name: "old-scan",
          expires_on: "2026-11-01T00:00:00.000Z",
          created_by_email: null,
        }),
      ],
    });
    await tokens.goto();

    await expect(tokens.row("ci-pipeline")).toContainText("Analyze");
    await expect(tokens.row("ci-pipeline")).toContainText(
      "john.doe@codeclarity.io",
    );
    await expect(tokens.row("ci-pipeline")).toContainText("Dec 13, 2026");
    await expect(tokens.row("old-scan")).toContainText("Read");
    await expect(tokens.row("old-scan")).toContainText("Expired");
    await expect(tokens.row("old-scan")).toContainText("Deleted account");
    await expect(page.getByText("ccot_")).toHaveCount(0);
    await expectNoAxeViolations(page);
    await expectPageSweep(page);
    await expectMainSnapshot(page, "token-list");
    await expectScreenshots(page, "token-list");
  });

  test("a new token joins the list", async ({ page }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn();
    await tokens.goto();
    await expect(page.getByText("No tokens yet.")).toBeVisible();

    await tokens.name.fill("ci-pipeline");
    await tokens.createButton.click();

    await expect(tokens.row("ci-pipeline")).toContainText("Read");
    await expect(tokens.list).not.toContainText(SECRET);
  });

  test("an admin revokes a token after confirming", async ({ page }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn({
      tokens: [
        tokenSummary({ id: "tok-1", name: "ci-pipeline" }),
        tokenSummary({ id: "tok-2", name: "nightly-scan" }),
      ],
    });
    await tokens.goto();

    await tokens
      .row("ci-pipeline")
      .getByRole("button", { name: "Revoke" })
      .click();
    await expect(tokens.revokeDialog).toContainText("Revoke ci-pipeline?");
    await tokens.revokeDialog.getByRole("button", { name: "Cancel" }).click();
    expect(tokens.revoked).toEqual([]);

    await tokens
      .row("ci-pipeline")
      .getByRole("button", { name: "Revoke" })
      .click();
    await expectNoAxeViolations(page);
    await tokens.revokeDialog
      .getByRole("button", { name: "Revoke token" })
      .click();

    await expect(tokens.row("ci-pipeline")).toHaveCount(0);
    await expect(tokens.row("nightly-scan")).toHaveCount(1);
    expect(tokens.revoked).toEqual(["tok-1"]);
  });

  test("a failed revoke says so and keeps the token", async ({ page }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn({
      tokens: [tokenSummary({ id: "tok-1", name: "ci-pipeline" })],
      failRevoke: true,
    });
    await tokens.goto();

    await tokens
      .row("ci-pipeline")
      .getByRole("button", { name: "Revoke" })
      .click();
    await tokens.revokeDialog
      .getByRole("button", { name: "Revoke token" })
      .click();

    await expect(tokens.revokeDialog).toContainText(
      "The token could not be revoked.",
    );
    await tokens.revokeDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(tokens.row("ci-pipeline")).toHaveCount(1);
  });

  test("a list that fails to load says so", async ({ page }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn({ failList: true });
    await tokens.goto();

    await expect(
      page.getByText("The tokens could not be loaded."),
    ).toBeVisible();
    await expect(tokens.list).toHaveCount(0);
  });

  test("a token needs a name", async ({ page }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn();
    await tokens.goto();

    await tokens.createButton.click();

    await expect(page.getByRole("alert")).toHaveText("Give the token a name.");
    expect(tokens.created).toEqual([]);
  });

  test("a failed create says so and shows no secret", async ({ page }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn({ fail: true });
    await tokens.goto();

    await tokens.name.fill("ci-pipeline");
    await tokens.createButton.click();

    await expect(
      page.getByText("The token could not be created."),
    ).toBeVisible();
    await expect(tokens.secretPanel).toHaveCount(0);
  });
});

describeOnAPhone("On a phone", () => {
  test("the tokens page fits", async ({ page }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn();
    await tokens.goto();
    await expect(tokens.heading).toHaveText("Organization tokens");
    await expectPageSweep(page);
    await expectScreenshots(page, "create-form");
  });

  test("the token list fits", async ({ page }) => {
    const tokens = new OrgTokensPage(page);
    await tokens.signIn({
      tokens: [tokenSummary({ id: "tok-1", name: "ci-pipeline" })],
    });
    await tokens.goto();
    await expect(tokens.row("ci-pipeline")).toHaveCount(1);
    await expectPageSweep(page);
    await expectScreenshots(page, "token-list");
  });
});
