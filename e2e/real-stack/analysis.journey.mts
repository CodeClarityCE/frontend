import { expect, test } from "@playwright/test";

import { expectMainSnapshot } from "../helpers/aria-snapshot.mjs";

import { DEPENDENCY, npmProjectArchive } from "./npm-project.mjs";

/*
 * One user journey against a real stack (E2E_BASE_URL), with nothing mocked:
 * the dev account uploads a tiny npm project, runs the Default Analyzer and
 * reads its SBOM, its vulnerabilities and one vulnerability's details. The
 * knowledge dump fixture gives ms@0.7.1 one advisory, GHSA-w9mr-4mfr-499f.
 */

const EMAIL = "john.doe@codeclarity.io";
const PASSWORD = "ThisIs4Str0ngP4ssW0rd?";
// Real responses take longer than mocks, and the analysis runs in the background.
const LOADED = { timeout: 30_000 };
const ANALYSED = { timeout: 4 * 60_000 };

test("an uploaded npm project is analysed and its results open", async ({
  page,
}) => {
  // A new name each run, so a rerun on the same stack finds its own project.
  const name = `journey-${Date.now()}`;

  await test.step("log in as the dev account", async () => {
    await page.goto("/login");
    await page.getByPlaceholder("Enter your email").fill(EMAIL);
    await page.getByPlaceholder("Enter your password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/\/login/, LOADED);
  });

  await test.step("import the project by upload", async () => {
    await page.goto("/projects/add");
    await page.getByRole("button", { name: /Upload an archive/ }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Archive", { exact: true }).setInputFiles({
      name: "journey-app.tar.gz",
      mimeType: "application/gzip",
      buffer: npmProjectArchive(),
    });
    await page
      .getByRole("button", { name: "Create project and upload" })
      .click();
    await expect(page).toHaveURL(/\/projects$/, LOADED);
  });

  await test.step("run the Default Analyzer", async () => {
    await page
      .getByRole("link", { name: `New analysis of ${name}` })
      .click(LOADED);
    await page.getByRole("radio", { name: /Default Analyzer/ }).click(LOADED);
    await page.getByRole("button", { name: "Start Analysis" }).click();
    await expect(page).toHaveURL(/\/projects$/, LOADED);
    // The list polls while the analysis runs and links its results once done.
    await page
      .getByRole("link", { name: `Results of ${name}` })
      .click(ANALYSED);
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
    await page.getByRole("tab", { name: "Vulnerabilities" }).click();
    const card = page.getByTestId("vulnerability-card");
    await expect(card).toHaveCount(1, LOADED);
    await expectMainSnapshot(page, "vulnerabilities", LOADED);
  });

  await test.step("the vulnerability's details open", async () => {
    await page
      .getByTestId("vulnerability-card")
      .getByRole("link", { name: /CVE-2017-20162|GHSA-w9mr-4mfr-499f/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/results\/vulnerabilities_details\?/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible(
      LOADED,
    );
    await expectMainSnapshot(page, "vulnerability-details", LOADED);
  });
});
