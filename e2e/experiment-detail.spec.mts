import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";

import {
  ExperimentDetailPage,
  samplePublishedVersion,
} from "./pages/experiment-detail.page.mjs";
import { experiment } from "./pages/experiments.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Experiment progress", () => {
  test("counts done, failed, skipped and pending runs in words", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();

    await expect(detail.heading).toHaveText("Fix lag study");
    const states = detail.progress.getByRole("list", { name: "Runs by state" });
    await expect(states.getByRole("listitem")).toHaveText([
      /Done\s*390/,
      /Failed\s*6/,
      /Skipped\s*4/,
      /Pending\s*0/,
    ]);
    await expect(detail.progress).toContainText("400 / 400");
  });

  test("lists each run with its state as a label", async ({ page }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();

    await expect(detail.runRows()).toHaveCount(4);
    await expect(detail.runRows().nth(0)).toContainText("Done");
    await expect(detail.runRows().nth(1)).toContainText("Failed");
    await expect(detail.runRows().nth(1)).toContainText(
      "missing result: vuln-finder",
    );
    await expect(detail.runRows().nth(1)).toContainText("3 attempts");
    await expect(detail.runRows().nth(2)).toContainText("Skipped");
    await expect(detail.runRows().nth(3)).toContainText("2026-09-01");
    await expect(
      detail.runRows().nth(0).getByRole("link", { name: "Open" }),
    ).toBeVisible();
  });
});

test.describe("Published results", () => {
  test("are marked as frozen, with their version", async ({ page }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn({ published: [samplePublishedVersion] });
    await detail.goto();

    const results = detail.section("Results");
    await expect(results.getByText("Frozen", { exact: true })).toBeVisible();
    await expect(results).toContainText(
      "These numbers are frozen under metric version 2 and will not change.",
    );
    await expect(page.getByRole("combobox", { name: "Version" })).toContainText(
      "Metric version 2",
    );
    await expect(detail.section("Results")).toContainText(
      `Package SHA-256: ${samplePublishedVersion.package_checksum}`,
    );
  });

  test("results not yet published are not marked as frozen", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();

    await expect(detail.section("Results")).toContainText("Coverage");
    await expect(page.getByText("Frozen", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
  });
});

test.describe("Experiment results", () => {
  test("the HEAD numbers are tiles with a label each", async ({ page }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();

    const tiles = detail
      .section("At HEAD")
      .getByRole("list", { name: "Numbers at HEAD" })
      .getByRole("listitem");
    await expect(tiles).toHaveCount(8);
    await expect(tiles.first()).toContainText("Affected projects");
    await expect(tiles.first()).toContainText("62 / 100");
  });

  for (const name of [
    "Fix lag",
    "Exposure survival",
    "Pre-disclosure residence",
    "Upstream leverage over time",
    "Load over time",
  ]) {
    test(`the ${name} chart keeps its caption, export and data table`, async ({
      page,
    }) => {
      const detail = new ExperimentDetailPage(page);
      await detail.signIn();
      await detail.goto();
      const section = detail.section(name);

      const figure = section.getByRole("figure").first();
      await expect(figure).toHaveAccessibleName(
        /^Unpublished results, not for citation\./,
      );
      await expect(
        section.getByRole("button", { name: "Download SVG" }).first(),
      ).toBeVisible();
      await expect(
        section.getByRole("button", { name: "Download data (CSV)" }).first(),
      ).toBeVisible();

      const showTable = section.getByText("Show table").first();
      await showTable.click();
      await expect(
        section.locator("details[open] table").first(),
      ).toBeVisible();
    });
  }

  test("a chart's CSV download saves its data", async ({ page }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();

    const download = page.waitForEvent("download");
    await detail
      .section("Load over time")
      .getByRole("button", { name: "Download data (CSV)" })
      .click();

    expect((await download).suggestedFilename()).toMatch(
      /load-over-time.*\.csv$/,
    );
  });
});

test.describe("Figures", () => {
  test("the composer previews a chart with its caption and export", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();

    await detail.tab("Figures").click();

    await expect(page.getByRole("combobox", { name: "Metric" })).toContainText(
      "Load over time",
    );
    const preview = page.getByRole("region", { name: "Preview" });
    await expect(preview.getByRole("figure")).toHaveAccessibleName(
      /Load over time/,
    );
    await expect(
      preview.getByRole("button", { name: "Download PDF" }),
    ).toBeVisible();
    await preview.getByText("Show table").click();
    await expect(preview.locator("details[open] table")).toBeVisible();
  });
});

test.describe("Keyboard and accessibility", () => {
  test("Tab reaches the links, actions and tabs with visible focus; arrows switch tabs", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();
    await expect(detail.runRows()).toHaveCount(4);

    const back = page
      .getByRole("link", { name: "Experiments", exact: true })
      .last();
    await back.focus();
    await expectVisibleFocus(back);
    for (const target of [
      page.getByRole("link", { name: "Top npm packages" }),
      page.getByRole("button", { name: "Publish" }),
      page.getByRole("button", { name: "Delete" }),
      detail.tab("Results"),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }

    await page.keyboard.press("ArrowRight");
    await expectVisibleFocus(detail.tab("Figures"));
    await expect(detail.tab("Figures")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("the results pass axe and match the screenshots", async ({ page }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();
    await expect(detail.runRows()).toHaveCount(4);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiment-detail-results");
  });

  test("Published results pass axe and match the screenshots", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn({ published: [samplePublishedVersion] });
    await detail.goto();
    await expect(page.getByText("Frozen", { exact: true })).toBeVisible();
    await expect(detail.runRows()).toHaveCount(4);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiment-detail-published");
  });

  test("the Figures tab passes axe and matches the screenshots", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn();
    await detail.goto();
    await detail.tab("Figures").click();
    await expect(
      page.getByRole("region", { name: "Preview" }).getByRole("figure"),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiment-detail-figures");
  });

  test("a running Experiment loading its results passes axe and matches the screenshots", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn({
      experiment: experiment("exp-1", "Residence time 2026", "RUNNING"),
      holdResults: true,
    });
    await detail.goto();
    await expect(page.getByText(/Reading stored results/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cancel Experiment" }),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiment-detail-running");
  });

  test("a failed Experiment says why, passes axe and matches the screenshots", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn({
      experiment: experiment("exp-1", "Broken cohort", "FAILED"),
      runs: [],
    });
    await detail.goto();
    await expect(page.getByRole("alert")).toContainText(
      "The Experiment failed: Dataset entries could not be read",
    );

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiment-detail-failed");
  });
});
