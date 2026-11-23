import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

import { expectMainSnapshot } from "../helpers/aria-snapshot.mjs";

import { DEPENDENCY } from "./npm-project.mjs";
import {
  analyse,
  LOADED,
  logIn,
  openResults,
  unique,
  uploadProject,
  vulnerabilityCards,
} from "./stack.mjs";

// Golden journeys 2 to 4 on one uploaded npm project: analyse it, browse and export its
// results, then track its remediation in a ticket. The knowledge dump fixture gives
// ms@0.7.1 one advisory, GHSA-w9mr-4mfr-499f (CVE-2017-20162), fixed in ms 2.0.0.

const ADVISORY = /CVE-2017-20162|GHSA-w9mr-4mfr-499f/;

test.describe.serial("an uploaded npm project", () => {
  // A new name each run, so a rerun on the same stack finds its own project.
  const name = unique("journey");

  test("is analysed and its results open", async ({ page }) => {
    await test.step("log in as the dev account", async () => {
      await logIn(page);
    });

    await test.step("import the project by upload", async () => {
      await uploadProject(page, name);
    });

    await test.step("run the Default Analyzer", async () => {
      await analyse(page, name);
    });

    await test.step("the SBOM lists the dependency", async () => {
      await page.getByRole("tab", { name: "SBOM" }).click(LOADED);
      await expect(
        page
          .getByRole("main")
          .getByText(DEPENDENCY.name, { exact: true })
          .first(),
      ).toBeVisible(LOADED);
      await expectMainSnapshot(page, "sbom", LOADED);
    });

    await test.step("the vulnerabilities list its advisory", async () => {
      await expect(await vulnerabilityCards(page)).toHaveCount(1, LOADED);
      await expectMainSnapshot(page, "vulnerabilities", LOADED);
    });

    await test.step("the vulnerability's details open", async () => {
      await page
        .getByRole("list", { name: "Vulnerabilities" })
        .getByRole("article")
        .getByRole("link", { name: ADVISORY })
        .first()
        .click();
      await expect(page).toHaveURL(/\/results\/vulnerabilities_details\?/);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible(
        LOADED,
      );
      await expectMainSnapshot(page, "vulnerability-details", LOADED);
    });
  });

  test("has its vulnerabilities, SBOM and licences browsed and exported", async ({
    page,
  }) => {
    await logIn(page);
    await openResults(page, name);

    await test.step("the licences list the dependency's licence", async () => {
      await page.getByRole("tab", { name: "Licenses" }).click(LOADED);
      await expect(
        page
          .getByRole("table", { name: "Licenses" })
          .getByRole("row", { name: /MIT/ }),
      ).toBeVisible(LOADED);
    });

    await test.step("the SBOM exports as CycloneDX with the licence", async () => {
      await page.getByRole("tab", { name: "SBOM" }).click(LOADED);
      await expect(
        page
          .getByRole("main")
          .getByText(DEPENDENCY.name, { exact: true })
          .first(),
      ).toBeVisible(LOADED);
      await page.getByRole("button", { name: "Export SBOM" }).click();
      const download = page.waitForEvent("download", LOADED);
      await page.getByRole("menuitem", { name: /CycloneDX/ }).click();
      const bom = JSON.parse(
        await readFile(await (await download).path(), "utf8"),
      ) as { bomFormat: string; components: unknown[] };
      expect(bom.bomFormat).toBe("CycloneDX");
      expect(bom.components).toContainEqual(
        expect.objectContaining({
          name: DEPENDENCY.name,
          version: DEPENDENCY.version,
          licenses: [{ expression: "MIT" }],
        }),
      );
    });

    await test.step("the vulnerabilities export as CSV", async () => {
      await expect(await vulnerabilityCards(page)).toHaveCount(1, LOADED);
      await page
        .getByRole("button", { name: "Export source verdicts" })
        .click();
      const download = page.waitForEvent("download", LOADED);
      await page.getByRole("menuitem", { name: /CSV/ }).click();
      const csv = await readFile(await (await download).path(), "utf8");
      const rows = csv.trim().split("\n").slice(1);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row).toMatch(ADVISORY);
        expect(row).toContain(DEPENDENCY.name);
      }
    });
  });

  test("has its remediation tracked in a ticket to the end", async ({
    page,
  }) => {
    await logIn(page);

    await test.step("the dashboard's fix-next list leads to the advisory", async () => {
      await page.goto("/");
      await page
        .getByRole("list", { name: "Remediations to fix next" })
        .getByRole("link", { name: /\bms\b/ })
        .first()
        .click(LOADED);
      await expect(page).toHaveURL(/\/vulnerabilities\//, LOADED);
    });

    const named = page.getByRole("button", { name: new RegExp(name) });
    const project = page
      .getByRole("region", { name: "Affected projects" })
      .getByRole("listitem")
      .filter({ has: named });

    await test.step("a ticket is created from the project's remediation", async () => {
      await project
        .getByRole("button", { name: new RegExp(name) })
        .click(LOADED);
      const remediation = project
        .getByRole("list", { name: "Remediations" })
        .getByRole("listitem")
        .filter({ hasText: /Upgrade\s+ms\s+0\.7\.1\s+to\s+2\.0\.0/ });
      await remediation.getByRole("button", { name: "Create ticket" }).click();
      await expect(
        remediation.getByRole("status").filter({ hasText: "Ticket created" }),
      ).toBeVisible(LOADED);
      await remediation.getByRole("link", { name: "View ticket" }).click();
      await expect(page).toHaveURL(/\/tickets\//, LOADED);
    });

    await test.step("the ticket names the package, its fix and the project", async () => {
      const main = page.getByRole("main");
      await expect(main).toContainText(DEPENDENCY.name, LOADED);
      await expect(main).toContainText("2.0.0");
      await expect(main).toContainText(name);
    });

    await test.step("the ticket is worked on, then resolved", async () => {
      const actions = page.getByRole("complementary", {
        name: "Ticket details",
      });
      await actions
        .getByRole("button", { name: "Start progress" })
        .click(LOADED);
      await actions
        .getByRole("button", { name: "Mark resolved" })
        .click(LOADED);
      await expect(
        actions.getByRole("button", { name: "Close ticket" }),
      ).toBeVisible(LOADED);
    });

    await test.step("the tickets list shows it resolved", async () => {
      await page.goto("/tickets");
      await expect(
        page.getByRole("table").getByRole("row").filter({ hasText: name }),
      ).toContainText("Resolved", LOADED);
    });
  });
});
