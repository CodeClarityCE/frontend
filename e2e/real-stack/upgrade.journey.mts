import { expect, test } from "@playwright/test";

import { LOADED, logIn, openResults } from "./stack.mjs";

// Golden journey 5: after an upgrade, the user still sees what they had before it. The
// umbrella's upgrade job seeds the data on the previous release (seed.sh), upgrades, then
// runs this test with the seeded account in E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD.

const PROJECT = "upgrade-seed-app";
const TICKET = "Upgrade seed ticket";

test(
  "after an upgrade, the seeded project, analysis and ticket are still shown",
  { tag: "@upgrade" },
  async ({ page }) => {
    const email = process.env.E2E_LOGIN_EMAIL;
    const password = process.env.E2E_LOGIN_PASSWORD;
    expect(
      email && password,
      "E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD",
    ).toBeTruthy();
    await logIn(page, { email: email!, password: password! });

    await test.step("the analysis results still list the dependency under a licence", async () => {
      await openResults(page, PROJECT);
      await page.getByRole("tab", { name: "SBOM" }).click(LOADED);
      await expect(
        page.getByRole("main").getByText("ms", { exact: true }).first(),
      ).toBeVisible(LOADED);
      await expect(page.getByRole("main")).toContainText("2.1.3");
      // The licence is whatever the previous release found (it may be unknown there);
      // seed.sh checks it is unchanged, so here the dependency only has to be listed.
      await page.getByRole("tab", { name: "Licenses" }).click(LOADED);
      await expect(
        page
          .getByRole("table", { name: "Licenses" })
          .getByRole("row", { name: / 1 Details of / }),
      ).toBeVisible(LOADED);
    });

    await test.step("the ticket is still listed and opens", async () => {
      await page.goto("/tickets");
      await page
        .getByRole("table")
        .getByRole("link", { name: new RegExp(TICKET) })
        .click(LOADED);
      await expect(page).toHaveURL(/\/tickets\//, LOADED);
      await expect(page.getByRole("main")).toContainText(TICKET, LOADED);
      await expect(page.getByRole("main")).toContainText(PROJECT);
    });
  },
);
