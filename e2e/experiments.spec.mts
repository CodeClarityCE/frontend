import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  experiment,
  ExperimentsPage,
  sampleDatasets,
} from "./pages/experiments.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Experiments list", () => {
  test("lists each Experiment with its status in words and opens one", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoList();

    await expect(experiments.heading).toHaveText("Experiments");
    await expect(experiments.rows()).toHaveCount(3);
    await expect(experiments.rows().first()).toContainText("Fix lag study");
    await expect(experiments.rows().first()).toContainText("Completed");
    await expect(experiments.rows().first()).toContainText("400 / 400");
    await expect(experiments.rows().nth(1)).toContainText("Running");
    await expect(experiments.rows().nth(1)).toContainText("120 / 400");
    await expect(experiments.rows().nth(2)).toContainText("Failed");
    await expect(experiments.rows().nth(2)).toContainText("Frameworks 2026");

    await experiments.table
      .getByRole("link", { name: "Residence time 2026" })
      .click();

    await expect(page).toHaveURL(/\/experiments\/detail\?id=exp-2$/);
  });

  test("New Experiment opens the creation form", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoList();

    await page.getByRole("link", { name: "New Experiment" }).click();

    await expect(page).toHaveURL(/\/experiments\/add$/);
    await expect(experiments.heading).toHaveText("New Experiment");
  });

  test("sorting by a column header reorders the rows", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoList();
    const names = experiments.rows().locator("td:first-child");

    await experiments.sortButton("Name").click();

    await expect(experiments.columnHeader("Name")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(names).toHaveText([
      /Broken cohort/,
      /Fix lag study/,
      /Residence time 2026/,
    ]);

    await experiments.sortButton("Created").click();

    await expect(experiments.columnHeader("Created")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(names.first()).toContainText("Broken cohort");
    await expect(names.last()).toContainText("Residence time 2026");
  });

  test("the filter narrows the rows and says when nothing matches", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoList();

    await experiments.filter.fill("frameworks");

    await expect(experiments.rows()).toHaveCount(1);
    await expect(experiments.rows()).toContainText("Broken cohort");

    await experiments.filter.fill("nothing like this");

    await expect(experiments.rows()).toHaveText(["No Experiments match."]);
  });

  test("pagination moves between pages of 20", async ({ page }) => {
    const many = Array.from({ length: 25 }, (_, i) =>
      experiment(`exp-${i}`, `Study ${String(i + 1).padStart(2, "0")}`),
    );
    const experiments = new ExperimentsPage(page);
    await experiments.signIn({ experiments: many });
    await experiments.gotoList();

    await expect(experiments.rows()).toHaveCount(20);

    await experiments
      .pagination()
      .getByRole("button", { name: "Next Page" })
      .click();

    await expect(experiments.rows()).toHaveCount(5);
    await expect(experiments.rows().first()).toContainText("Study 21");
  });

  test("an organisation with no Experiments sees the owl and the next step", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn({ experiments: [] });
    await experiments.gotoList();

    await expect(page.getByRole("img", { name: /owl/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No Experiments yet" }),
    ).toBeVisible();
    await expect(experiments.table).toHaveCount(0);

    await page.getByRole("link", { name: "Create an Experiment" }).click();

    await expect(page).toHaveURL(/\/experiments\/add$/);
  });

  test("while loading, a skeleton stands in for the table", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    const release = await experiments.signIn({ hold: true });
    await experiments.gotoList();

    await expect(
      page.getByRole("status", { name: "Loading Experiments" }),
    ).toBeVisible();
    await expect(page.getByText("No Experiments yet")).toHaveCount(0);

    release();

    await expect(experiments.rows()).toHaveCount(3);
  });

  test("a failed load says so instead of the empty state", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await page.route("**/api/org/org-123/experiments?**", (route) =>
      route.fulfill({ status: 500, json: { status: "failure" } }),
    );
    await experiments.gotoList();

    await expect(
      page.getByText("The Experiments could not be loaded."),
    ).toBeVisible();
    await expect(page.getByText("No Experiments yet")).toHaveCount(0);
  });

  test("Tab reaches the page action, filter, sort buttons and rows with visible focus", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoList();
    await expect(experiments.rows()).toHaveCount(3);

    const create = page.getByRole("link", { name: "New Experiment" });
    await create.focus();
    await expectVisibleFocus(create);
    for (const target of [
      experiments.filter,
      experiments.sortButton("Name"),
      experiments.sortButton("Status"),
      experiments.sortButton("Dataset"),
      experiments.sortButton("Finished runs"),
      experiments.sortButton("Created"),
      experiments.table.getByRole("link", { name: "Fix lag study" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }

    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    await expect(experiments.columnHeader("Created")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoList();
    await expect(experiments.rows()).toHaveCount(3);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiments-list");
  });

  test("the empty state passes axe and matches the screenshots", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn({ experiments: [] });
    await experiments.gotoList();
    await expect(page.getByText("No Experiments yet")).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiments-empty");
  });

  test("the loading state passes axe and matches the screenshots", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn({ hold: true });
    await experiments.gotoList();
    await expect(
      page.getByRole("status", { name: "Loading Experiments" }),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiments-loading");
  });
});

test.describe("New Experiment", () => {
  test("offers only ready Datasets and analyzers that run js-sbom and vuln-finder", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoCreate();

    await expect(experiments.heading).toHaveText("New Experiment");
    await expect(experiments.select("Analyzer")).toContainText(
      "JavaScript analyzer",
    );

    await experiments.select("Dataset").click();
    await expect(page.getByRole("option")).toHaveText([
      "Top npm packages (100 repositories)",
    ]);
    await page.keyboard.press("Escape");

    await experiments.select("Analyzer").click();
    await expect(page.getByRole("option")).toHaveText(["JavaScript analyzer"]);
  });

  test("shows each field's error next to it after a submit", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoCreate();

    await page.getByLabel("Retries per failed run").fill("11");
    await page.getByRole("button", { name: "Start Experiment" }).click();

    await expect(page.getByLabel("Name")).toHaveAccessibleDescription(
      "A name is required",
    );
    await expect(page.getByLabel("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(experiments.select("Dataset")).toHaveAccessibleDescription(
      "Pick a ready dataset",
    );
    await expect(
      page.getByLabel("Retries per failed run"),
    ).toHaveAccessibleDescription(
      /A failed analysis is retried on the same commit\. A whole number between 0 and 10/,
    );
    expect(experiments.created).toHaveLength(0);
  });

  test("estimates the analyses and starts the Experiment", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoCreate();

    await page.getByLabel("Name").fill("top100-2026-11");
    await experiments.choose("Dataset", /Top npm packages/);
    await expect(page.getByText(/Estimated/)).toHaveText(
      "Estimated 3,700 analyses: 2,500 snapshots (25 grid dates including HEAD) and about 1,200 fix probes.",
    );

    await experiments.choose("Grid interval", "Weekly");
    await page.getByLabel("Grid dates before HEAD").fill("4");
    await page.getByLabel("Analysis budget (optional)").fill("300");
    await expect(
      page.getByText("The budget is at or below the 500 snapshots"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Start Experiment" }).click();

    await expect(page).toHaveURL(/\/experiments\/detail\?id=exp-new$/);
    expect(experiments.created).toEqual([
      {
        name: "top100-2026-11",
        dataset_id: "ds-1",
        analyzer_id: "an-1",
        retries: 2,
        grid_interval: "week",
        grid_count: 4,
        analysis_budget: 300,
      },
    ]);
  });

  test("a Dataset passed in the link is preselected", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoCreate("?dataset=ds-1");

    await expect(experiments.select("Dataset")).toContainText(
      "Top npm packages",
    );
  });

  test("without a ready Dataset it links to building one", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn({ datasets: [sampleDatasets[1]] });
    await experiments.gotoCreate();

    await expect(page.getByText("No ready Dataset.")).toBeVisible();
    await page.getByRole("link", { name: "Build one" }).click();

    await expect(page).toHaveURL(/\/datasets\/add$/);
  });

  test("Tab moves through the form in order with visible focus", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoCreate();
    await expect(experiments.select("Analyzer")).toContainText(
      "JavaScript analyzer",
    );

    await page
      .getByRole("link", { name: "Experiments", exact: true })
      .last()
      .focus();
    for (const target of [
      page.getByLabel("Name"),
      experiments.select("Dataset"),
      experiments.select("Analyzer"),
      page.getByLabel("Retries per failed run"),
      experiments.select("Grid interval"),
      page.getByLabel("Grid dates before HEAD"),
      page.getByLabel("Analysis budget (optional)"),
      page.getByRole("button", { name: "Start Experiment" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoCreate("?dataset=ds-1");
    await expect(page.getByText(/Estimated/)).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiments-create");

    await page.getByRole("button", { name: "Start Experiment" }).click();
    await page.getByLabel("Name").blur();
    await expect(page.getByText("A name is required")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "experiments-create-errors");
  });
});
