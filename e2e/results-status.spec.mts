import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  analysis,
  ANALYSIS,
  NOT_FOUND,
  PROJECT,
  ResultsStatusPage,
  SERVER_ERROR,
  step,
} from "./pages/results-status.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

const UNKNOWN = "00000000-0000-4000-8000-000000000000";
const IDS = `analysis_id=${ANALYSIS}&project_id=${PROJECT}`;

async function expectBackTo(
  page: Page,
  name: string,
  url: RegExp,
): Promise<void> {
  await page.getByRole("link", { name }).click();
  await expect(page).toHaveURL(url);
}

test.describe("Results page for an analysis it cannot show", () => {
  for (const [label, query] of [
    ["missing", ""],
    ["unknown", `analysis_id=${UNKNOWN}&project_id=${PROJECT}`],
    ["malformed", `analysis_id=nope&project_id=${PROJECT}`],
    ["unknown project", `analysis_id=${ANALYSIS}&project_id=${UNKNOWN}`],
  ]) {
    test(`a ${label} analysis is not found, with a way back`, async ({
      page,
    }) => {
      const results = new ResultsStatusPage(page);
      await results.signIn();
      await results.goto(query);

      await expect(results.heading).toHaveText("Analysis not found");
      await expect(results.tabs).toHaveCount(0);
      await expectNoAxeViolations(page);
      if (label === "missing")
        await expectScreenshots(page, "results-not-found");
      await expectBackTo(page, "Back to projects", /\/projects$/);
    });
  }

  test("an analysis that fails to load shows an error, not not-found", async ({
    page,
  }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({ analysis: SERVER_ERROR });
    await results.goto();

    await expect(page.getByRole("alert")).toContainText(
      "Could not load this analysis",
    );
    await expect(page.getByText("Analysis not found")).toHaveCount(0);
    await expect(results.tabs).toHaveCount(0);
  });
});

test.describe("Results page for an unfinished analysis", () => {
  test("a failed analysis shows its status and failure reason", async ({
    page,
  }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn();
    await results.goto();

    await expect(results.heading).toHaveText("Results");
    const status = page.getByRole("status", { name: "Analysis status" });
    await expect(status).toContainText("Analysis failed");
    await expect(status).toContainText("Clone failed: repository not found");
    await expect(results.tabs).toHaveCount(0);
    await expect(page.getByText("Could not load the SBOM")).toHaveCount(0);
    expect(results.requested("/sbom/stats")).toBe(false);
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "results-failed");
  });

  for (const [state, text] of [
    ["requested", "Analysis queued"],
    ["started", "Analysis running"],
  ]) {
    test(`a ${state} analysis says it is not finished`, async ({ page }) => {
      const results = new ResultsStatusPage(page);
      await results.signIn({
        analysis: analysis(state, [[step("js-sbom", "requested")]]),
      });
      await results.goto();

      await expect(
        page.getByRole("status", { name: "Analysis status" }),
      ).toContainText(text);
      await expect(results.tabs).toHaveCount(0);
      expect(results.requested("/sbom/stats")).toBe(false);
    });
  }

  test("a failed analysis still shows the tabs of plugins that succeeded", async ({
    page,
  }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({
      analysis: analysis(
        "failure",
        [
          [step("codeql", "failure"), step("js-sbom", "success")],
          [step("vuln-finder", "failure")],
        ],
        { failure_reason: "vuln-finder failed unexpectedly." },
      ),
    });
    await results.goto();

    await expect(
      page.getByRole("status", { name: "Analysis status" }),
    ).toContainText("vuln-finder failed unexpectedly.");
    await expect(results.tabs.getByRole("tab")).toHaveText(["SBOM"]);
    await expect(page.getByRole("tab", { name: "SBOM" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page
        .getByRole("list", { name: "Dependency numbers" })
        .getByRole("listitem")
        .nth(3),
    ).toHaveText(/Security issues\s*-/);
    expect(results.requested("/sbom/stats")).toBe(true);
    expect(results.requested("/vulnerabilities/stats")).toBe(false);
  });
});

test.describe("Results tabs", () => {
  test("a vulnerability list that fails to load shows only its error", async ({
    page,
  }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({
      analysis: analysis("completed", [
        [step("vuln-finder", "success"), step("js-sbom", "success")],
      ]),
      vulnerabilities: SERVER_ERROR,
    });
    await results.goto();

    await expect(
      page.getByText("Could not load the vulnerabilities"),
    ).toBeVisible();
    await expect(page.getByText("No vulnerabilities found.")).toHaveCount(0);
  });
});

test.describe("Detail pages for something they cannot show", () => {
  const completed = analysis("completed", [
    [step("js-sbom", "success"), step("vuln-finder", "success")],
  ]);

  test("a dependency without an id is not found, with a way back", async ({
    page,
  }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({ analysis: completed });
    await results.gotoDependency(IDS);

    await expect(results.heading).toHaveText("Dependency not found");
    expect(results.requested("/sbom/dependency")).toBe(false);
    await expectNoAxeViolations(page);
    await expectBackTo(
      page,
      "Back to results",
      new RegExp(`/results\\?analysis_id=${ANALYSIS}&project_id=${PROJECT}$`),
    );
  });

  test("an unknown dependency is not found", async ({ page }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({ analysis: completed });
    await results.gotoDependency(`${IDS}&package_id=nope%401.0.0`);

    await expect(results.heading).toHaveText("Dependency not found");
  });

  test("a dependency of a malformed analysis is not found", async ({
    page,
  }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({ analysis: completed });
    await results.gotoDependency(
      `analysis_id=nope&project_id=${PROJECT}&package_id=lodash%404.17.20`,
    );

    await expect(results.heading).toHaveText("Dependency not found");
    await expectBackTo(page, "Back to projects", /\/projects$/);
  });

  test("a dependency that fails to load shows an error", async ({ page }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({ analysis: completed, details: SERVER_ERROR });
    await results.gotoDependency(`${IDS}&package_id=lodash%404.17.20`);

    await expect(
      page.getByText("Could not load this dependency"),
    ).toBeVisible();
    await expect(page.getByText("Dependency not found")).toHaveCount(0);
  });

  test("a vulnerability without an id is not found, with a way back", async ({
    page,
  }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({ analysis: completed });
    await results.gotoVulnerability(IDS);

    await expect(results.heading).toHaveText("Vulnerability not found");
    expect(results.requested("/vulnerabilities/vulnerability/")).toBe(false);
    await expectNoAxeViolations(page);
    await expectBackTo(
      page,
      "Back to results",
      new RegExp(`/results\\?analysis_id=${ANALYSIS}&project_id=${PROJECT}$`),
    );
  });

  test("an unknown vulnerability is not found", async ({ page }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({ analysis: completed, details: NOT_FOUND });
    await results.gotoVulnerability(`${IDS}&finding_id=CVE-1999-0000`);

    await expect(results.heading).toHaveText("Vulnerability not found");
  });

  test("a vulnerability of an unknown analysis is not found", async ({
    page,
  }) => {
    const results = new ResultsStatusPage(page);
    await results.signIn({ analysis: completed });
    await results.gotoVulnerability(
      `analysis_id=${UNKNOWN}&project_id=${PROJECT}&finding_id=CVE-2024-0001`,
    );

    await expect(results.heading).toHaveText("Vulnerability not found");
  });
});
