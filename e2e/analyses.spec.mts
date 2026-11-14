import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { AnalysesPage } from "./pages/analyses.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test("unknown analysis routes need a sign-in or show the 404", async ({
  page,
}) => {
  await page.goto("/projects/test-project/analyses");

  await expect(page).toHaveURL(/\/(login|404)/);
});

test.describe("New Analysis", () => {
  test("shows the project and every analyzer to choose from", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();

    await expect(analyses.heading).toHaveText("New Analysis");
    await expect(page.getByText("example/web-frontend")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View repository" }),
    ).toHaveAttribute("href", "https://github.com/example/web-frontend");
    await expect(page.getByRole("radio")).toHaveCount(2);
    await expect(analyses.analyzer("JavaScript Analyzer")).toBeVisible();
    await expect(analyses.analyzer("PHP")).toBeVisible();
    await expect(page.getByLabel("Branch")).toHaveCount(0);
  });

  test("choosing an analyzer shows its repository, policy and schedule settings", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();

    await expect(page.getByLabel("Branch")).toHaveValue("main");
    await expect(page.getByLabel("Commit")).toHaveValue("");
    const vulnerability = page.getByRole("radiogroup", {
      name: "Vulnerability policy",
    });
    await expect(vulnerability.getByRole("radio")).toHaveCount(2);
    await expect(
      vulnerability.getByRole("radio", { name: /No policy/ }),
    ).toBeChecked();
    // The organisation's default license policy starts selected.
    await expect(
      page
        .getByRole("radiogroup", { name: "License policy" })
        .getByRole("radio", { name: /No copyleft/ }),
    ).toBeChecked();
    await expect(page.getByRole("combobox", { name: "Runs" })).toContainText(
      "Once",
    );
  });

  test("shows each field's error next to it after a submit", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();
    await expect(page.getByRole("radio")).toHaveCount(2);

    await analyses.submit.click();

    await expect(
      page.getByRole("radiogroup", { name: "Analyzer" }),
    ).toHaveAccessibleDescription("Choose an analyzer");
    expect(analyses.created).toHaveLength(0);

    await analyses.analyzer("JavaScript Analyzer").click();
    await page.getByLabel("Branch").fill("");
    await analyses.submit.click();

    await expect(page.getByLabel("Branch")).toHaveAccessibleDescription(
      "A branch is required",
    );
    await expect(page.getByLabel("Branch")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(analyses.created).toHaveLength(0);
  });

  test("a weekly analysis with policies is created and opens the projects", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();
    await page.getByLabel("Branch").fill("develop");
    await page
      .getByRole("radiogroup", { name: "Vulnerability policy" })
      .getByRole("radio", { name: /Ignore disputed/ })
      .click();
    await page.getByRole("combobox", { name: "Runs" }).click();
    await page.getByRole("option", { name: "Weekly" }).click();
    await page.getByLabel("First run date").fill("2030-05-06");
    await page.getByLabel("First run time").fill("09:30");
    await expect(
      page.getByText("Runs weekly from May 6, 2030, 9:30 AM."),
    ).toBeVisible();
    await analyses.submit.click();

    await expect(page).toHaveURL(/\/projects$/);
    expect(analyses.created).toHaveLength(1);
    const body = analyses.created[0] as Record<string, unknown>;
    expect(body).toMatchObject({
      analyzer_id: "an-js",
      branch: "develop",
      schedule_type: "weekly",
      is_active: true,
      config: {
        "js-sbom": {
          project: "org-123/projects/proj-1/develop",
          branch: "develop",
        },
        "vuln-finder": { vulnerabilityPolicy: ["vp-1"] },
        "license-finder": { licensePolicy: ["GPL-3.0", "AGPL-3.0"] },
      },
    });
    expect(new Date(body.next_scheduled_run as string).getTime()).toBe(
      new Date("2030-05-06T09:30").getTime(),
    );
  });

  test("a refused analysis says why and stays on the page", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({
      createError: {
        status_code: 400,
        status: "failure",
        error_code: "AlreadyExists",
        error_message: "Already exists",
      },
    });
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();
    await page.getByRole("combobox", { name: "Runs" }).click();
    await page.getByRole("option", { name: "Daily" }).click();
    await analyses.submit.click();

    await expect(page.getByRole("alert")).toContainText(
      "Only one scheduled analysis per project",
    );
    await expect(page).toHaveURL(/\/analyses\/add/);
  });

  test("an organisation with no analyzers is pointed to creating one", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({ analyzers: [] });
    await analyses.goto();

    await expect(page.getByText("No analyzers yet")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create an analyzer" }),
    ).toBeVisible();
    await expect(analyses.submit).toHaveCount(0);
  });

  test("while loading, a skeleton stands in for the analyzers", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    const release = await analyses.signIn({ hold: true });
    await analyses.goto();

    await expect(
      page.getByRole("status", { name: "Loading the analyzers" }),
    ).toBeVisible();

    release();

    await expect(page.getByRole("radio")).toHaveCount(2);
  });

  test("Tab moves through the form in order with visible focus", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();
    await analyses.analyzer("JavaScript Analyzer").click();
    await expect(page.getByLabel("Branch")).toBeVisible();

    await page
      .getByRole("link", { name: "Projects", exact: true })
      .last()
      .focus();
    for (const target of [
      page.getByRole("link", { name: "View repository" }),
      analyses.analyzer("JavaScript Analyzer"),
      page.getByRole("link", { name: "Create an analyzer" }),
      page.getByLabel("Branch"),
      page.getByLabel("Commit"),
      page
        .getByRole("radiogroup", { name: "Vulnerability policy" })
        .getByRole("radio", { name: /No policy/ }),
      page
        .getByRole("radiogroup", { name: "License policy" })
        .getByRole("radio", { name: /No copyleft/ }),
      page.getByRole("combobox", { name: "Runs" }),
      analyses.submit,
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }

    // Arrow keys move within a radio group and Space picks the analyzer.
    await analyses.analyzer("JavaScript Analyzer").focus();
    await page.keyboard.press("ArrowDown");
    await expectVisibleFocus(analyses.analyzer("PHP"));
    await page.keyboard.press("Space");
    await expect(analyses.analyzer("PHP")).toBeChecked();
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();
    await expect(page.getByRole("radio")).toHaveCount(2);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "analysis-create");

    await page.setViewportSize({ width: 1280, height: 1024 });
    await analyses.analyzer("JavaScript Analyzer").click();
    await page.getByRole("combobox", { name: "Runs" }).click();
    await page.getByRole("option", { name: "Weekly" }).click();
    await page.getByLabel("First run date").fill("2030-05-06");
    await page.getByLabel("First run time").fill("09:30");
    await page.getByLabel("Branch").fill("");
    await analyses.submit.click();
    await expect(page.getByText("A branch is required")).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "analysis-create-configured");
  });

  test("with no analyzers passes axe and matches the screenshots", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({ analyzers: [] });
    await analyses.goto();
    await expect(page.getByText("No analyzers yet")).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "analysis-create-empty");
  });
});
