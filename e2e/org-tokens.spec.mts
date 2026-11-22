import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/a11y.mjs";
import { expectMainSnapshot } from "./helpers/aria-snapshot.mjs";
import { expectPageSweep } from "./helpers/page-sweep.mjs";
import { describeOnAPhone } from "./helpers/phone.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { NOW, OrgTokensPage, SECRET } from "./pages/org-tokens.page.mjs";

const DAY = 86_400_000;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Organisation tokens", () => {
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
});
