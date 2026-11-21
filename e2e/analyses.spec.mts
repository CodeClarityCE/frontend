import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectMainSnapshot } from "./helpers/aria-snapshot.mjs";
import { expectPageSweep } from "./helpers/page-sweep.mjs";
import { onAPhone } from "./helpers/phone.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  AnalysesPage,
  analyzer,
  licensePolicies,
  vulnerabilityPolicies,
} from "./pages/analyses.page.mjs";

/** `count` copies of `item`, each with its own id and name. */
function many(item: Record<string, unknown>, count: number): unknown[] {
  return Array.from({ length: count }, (_, i) => ({
    ...item,
    id: `${String(item.id)}-${i + 1}`,
    name: `${String(item.name)} ${i + 1}`,
  }));
}

/** An analyzer whose CodeQL step needs a language. */
const codeqlAnalyzer = {
  ...analyzer("an-codeql", "CodeQL", "Static analysis"),
  steps: [
    [
      {
        name: "codeql",
        version: "1.0.0",
        config: {
          language: {
            name: "language",
            type: "string",
            required: true,
            description: "",
          },
        },
        persistant_config: {},
      },
    ],
  ],
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
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
    // An empty commit means the latest one, so none is sent.
    expect(body).not.toHaveProperty("commit_hash");
  });

  test("a commit is sent trimmed", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();
    await page.getByLabel("Commit").fill("  abc123  ");
    await analyses.submit.click();

    await expect(page).toHaveURL(/\/projects$/);
    expect(analyses.created[0]).toMatchObject({ commit_hash: "abc123" });
  });

  test("a first run in the past is refused", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();
    await page.getByRole("combobox", { name: "Runs" }).click();
    await page.getByRole("option", { name: "Daily" }).click();
    await page.getByLabel("First run date").fill("2020-01-06");
    await page.getByLabel("First run time").fill("09:30");
    await analyses.submit.click();

    await expect(page.getByLabel("First run date")).toHaveAccessibleDescription(
      "The first run must be in the future",
    );
    expect(analyses.created).toHaveLength(0);
  });

  test("clearing the first run date clears the schedule", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();
    await page.getByRole("combobox", { name: "Runs" }).click();
    await page.getByRole("option", { name: "Weekly" }).click();
    await page.getByLabel("First run date").fill("2030-05-06");
    await page.getByLabel("First run time").fill("09:30");
    await expect(
      page.getByText("Runs weekly from May 6, 2030, 9:30 AM."),
    ).toBeVisible();

    await page.getByLabel("First run date").fill("");

    await expect(page.getByText(/May 6, 2030/)).toHaveCount(0);
    await analyses.submit.click();
    await expect(page.getByLabel("First run date")).toHaveAccessibleDescription(
      "Choose the date and time of the first run",
    );
    expect(analyses.created).toHaveLength(0);
  });

  test("clearing the first run time clears the schedule", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();
    await page.getByRole("combobox", { name: "Runs" }).click();
    await page.getByRole("option", { name: "Weekly" }).click();
    await page.getByLabel("First run date").fill("2030-05-06");
    await page.getByLabel("First run time").fill("09:30");

    await page.getByLabel("First run time").fill("");

    await expect(page.getByText(/May 6, 2030/)).toHaveCount(0);
    await analyses.submit.click();
    expect(analyses.created).toHaveLength(0);
  });

  test("a missing required plugin option is named in the error", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({ analyzers: [codeqlAnalyzer] });
    await analyses.goto();

    await analyses.analyzer("CodeQL").click();
    await expect(
      page.getByRole("combobox", { name: "language" }),
    ).toBeVisible();
    await analyses.submit.click();

    await expect(
      page.getByRole("combobox", { name: "language" }),
    ).toHaveAccessibleDescription(/codeql needs a value for language/);
    expect(analyses.created).toHaveLength(0);

    await page.getByRole("combobox", { name: "language" }).click();
    await page.getByRole("option", { name: "Javascript" }).click();
    await analyses.submit.click();

    await expect(page).toHaveURL(/\/projects$/);
    expect(analyses.created[0]).toMatchObject({
      config: { codeql: { language: "javascript" } },
    });
  });

  test("every analyzer and policy is listed, past the first page", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({
      analyzers: many(analyzer("an", "Analyzer", "One of many"), 12),
      vulnerabilityPolicies: many(vulnerabilityPolicies[0]!, 12),
      licensePolicies: many({ ...licensePolicies[0]!, default: false }, 12),
    });
    await analyses.goto();

    await expect(page.getByRole("radio")).toHaveCount(12);
    await analyses.analyzer("Analyzer 12").click();

    // Each policy list adds a "No policy" choice.
    await expect(
      page
        .getByRole("radiogroup", { name: "Vulnerability policy" })
        .getByRole("radio"),
    ).toHaveCount(13);
    await expect(
      page
        .getByRole("radiogroup", { name: "License policy" })
        .getByRole("radio"),
    ).toHaveCount(13);
  });

  test("a project that cannot be found disables the form", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({ project: "missing" });
    await analyses.goto();

    await expect(page.getByText("Project not found")).toBeVisible();
    await expect(page.getByText("The analysis was not started")).toHaveCount(0);
    await expect(analyses.submit).toBeDisabled();
    await expect(analyses.analyzer("JavaScript Analyzer")).toBeDisabled();
  });

  test("a project that fails to load disables the form", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({ project: "error" });
    await analyses.goto();

    await expect(page.getByText("Project not found")).toBeVisible();
    await expect(page.getByText("The analysis was not started")).toHaveCount(0);
    await expect(analyses.submit).toBeDisabled();
  });

  test("a page without a project id disables the form", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto(null);

    await expect(page.getByText("Project not found")).toBeVisible();
    await expect(analyses.submit).toBeDisabled();
  });

  test("analyzers that fail to load say so, not that the start failed", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({ analyzersError: true });
    await analyses.goto();

    await expect(page.getByRole("alert")).toContainText(
      "The analyzers could not be loaded",
    );
    await expect(page.getByText("The analysis was not started")).toHaveCount(0);
    await expect(page.getByText("No analyzers yet")).toHaveCount(0);
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
    await expectPageSweep(page);
    await expectMainSnapshot(page, "analysis-create");
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
    await expectPageSweep(page);
    await expectMainSnapshot(page, "analysis-create-configured");
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
    await expectPageSweep(page);
    await expectMainSnapshot(page, "analysis-create-empty");
    await expectScreenshots(page, "analysis-create-empty");
  });
});

test.describe("On a phone", () => {
  onAPhone();

  test("New Analysis does not scroll sideways", async ({ page }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn();
    await analyses.goto();
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    await expectPageSweep(page);
  });
});
