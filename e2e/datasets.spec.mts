import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  dataset,
  DatasetsPage,
  entry,
  sampleDatasets,
} from "./pages/datasets.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Datasets list", () => {
  test("an organisation with no Datasets sees the owl and Create a Dataset", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn({ datasets: [] });
    await datasets.gotoList();

    await expect(page.getByRole("img", { name: /owl/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No Datasets yet" }),
    ).toBeVisible();
    await expect(datasets.table).toHaveCount(0);

    await page.getByRole("link", { name: "Create a Dataset" }).click();

    await expect(page).toHaveURL(/\/datasets\/add$/);
  });

  test("lists each Dataset with its status in words and opens one", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoList();

    await expect(datasets.heading).toHaveText("Datasets");
    await expect(datasets.rows()).toHaveCount(3);
    await expect(datasets.rows().first()).toContainText("Top npm packages");
    await expect(datasets.rows().first()).toContainText("Ready");
    await expect(datasets.rows().nth(1)).toContainText("Building");
    await expect(datasets.rows().nth(2)).toContainText("Failed");

    await datasets.table.getByRole("link", { name: "Frameworks 2026" }).click();

    await expect(page).toHaveURL(/\/datasets\/detail\?id=ds-2$/);
  });

  test("sorting by a column header reorders the rows", async ({ page }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoList();
    const names = datasets.rows().locator("td:first-child");

    await datasets.sortButton("Name").click();

    await expect(datasets.columnHeader("Name")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(names).toHaveText([
      /Archived cohort/,
      /Frameworks 2026/,
      /Top npm packages/,
    ]);

    await datasets.sortButton("Name").click();

    await expect(datasets.columnHeader("Name")).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await expect(names.first()).toContainText("Top npm packages");
  });

  test("the filter narrows the rows and says when nothing matches", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoList();

    await datasets.filter.fill("frame");

    await expect(datasets.rows()).toHaveCount(1);
    await expect(datasets.rows()).toContainText("Frameworks 2026");

    await datasets.filter.fill("nothing like this");

    await expect(datasets.rows()).toHaveText(["No Datasets match."]);
  });

  test("pagination moves between pages of 20", async ({ page }) => {
    const many = Array.from({ length: 25 }, (_, i) =>
      dataset(`ds-${i}`, `Cohort ${String(i + 1).padStart(2, "0")}`),
    );
    const datasets = new DatasetsPage(page);
    await datasets.signIn({ datasets: many });
    await datasets.gotoList();

    await expect(datasets.rows()).toHaveCount(20);
    await expect(page.getByText("Showing 1 to 20 of 25")).toBeVisible();

    await datasets
      .pagination()
      .getByRole("button", { name: "Next Page" })
      .click();

    await expect(datasets.rows()).toHaveCount(5);
    await expect(datasets.rows().first()).toContainText("Cohort 21");
    await expect(page.getByText("Showing 21 to 25 of 25")).toBeVisible();
  });

  test("while loading, a skeleton stands in for the table", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    const release = await datasets.signIn({ hold: true });
    await datasets.gotoList();

    await expect(
      page.getByRole("status", { name: "Loading Datasets" }),
    ).toBeVisible();
    await expect(page.getByText("No Datasets yet")).toHaveCount(0);

    release();

    await expect(datasets.rows()).toHaveCount(3);
    await expect(
      page.getByRole("status", { name: "Loading Datasets" }),
    ).toHaveCount(0);
  });

  test("Tab reaches the page actions, filter, sort buttons and rows with visible focus", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoList();
    await expect(datasets.rows()).toHaveCount(3);

    await page.getByRole("link", { name: "New Dataset" }).focus();
    await expectVisibleFocus(page.getByRole("link", { name: "New Dataset" }));
    for (const target of [
      datasets.filter,
      datasets.sortButton("Name"),
      datasets.sortButton("Status"),
      datasets.sortButton("Repositories"),
      datasets.sortButton("Built"),
      datasets.table.getByRole("link", { name: "Top npm packages" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }

    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    await expect(datasets.columnHeader("Built")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoList();
    await expect(datasets.rows()).toHaveCount(3);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "datasets-list");
  });

  test("the empty state passes axe and matches the screenshots", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn({ datasets: [] });
    await datasets.gotoList();
    await expect(page.getByText("No Datasets yet")).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "datasets-empty");
  });

  test("the loading state passes axe and matches the screenshots", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn({ hold: true });
    await datasets.gotoList();
    await expect(
      page.getByRole("status", { name: "Loading Datasets" }),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "datasets-loading");
  });
});

test.describe("New Dataset", () => {
  test("shows each field's error next to it after a submit", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoCreate();
    await expect(datasets.heading).toHaveText("New Dataset");

    await page.getByLabel("Repositories").fill("0");
    await page.getByRole("button", { name: "Build Dataset" }).click();

    await expect(page.getByLabel("Name")).toHaveAccessibleDescription(
      "A name is required",
    );
    await expect(page.getByLabel("Repositories")).toHaveAccessibleDescription(
      "A whole number between 1 and 500",
    );
    await expect(page.getByLabel("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("Tab moves through the form in order with visible focus", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoCreate();
    await expect(page.getByRole("combobox")).toContainText("github.com");

    await page
      .getByRole("link", { name: "Datasets", exact: true })
      .last()
      .focus();
    for (const target of [
      page.getByLabel("Name"),
      page.getByRole("combobox"),
      page.getByRole("checkbox", { name: "JavaScript" }),
      page.getByRole("checkbox", { name: "TypeScript" }),
      page.getByLabel("Repositories"),
      page.getByLabel("Search pages per language"),
      page.getByLabel("Minimum stars"),
      page.getByRole("button", { name: "Build Dataset" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoCreate();
    await expect(page.getByRole("combobox")).toContainText("github.com");

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "datasets-create");

    await page.getByRole("button", { name: "Build Dataset" }).click();
    await page.getByLabel("Name").blur();
    await expect(page.getByText("A name is required")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "datasets-create-errors");
  });

  test("the open integration list passes axe", async ({ page }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoCreate();

    await page.getByRole("combobox").click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );

    await expectNoAxeViolations(page);

    // Closing hands focus back and the rest of the form works again.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("combobox")).toBeFocused();
    await page.getByLabel("Name").fill("Top npm packages");
    await expect(page.getByLabel("Name")).toHaveValue("Top npm packages");
  });
});

test.describe("Dataset detail", () => {
  test("shows the build numbers as stat cards and the entries in a table", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoDetail();

    await expect(datasets.heading).toHaveText("Top npm packages");
    await expect(page.getByText("Ready", { exact: true })).toBeVisible();
    const stats = page.getByRole("list", { name: "Build numbers" });
    await expect(stats.getByRole("listitem")).toHaveText([
      /Selected\s*100 \/ 100/,
      /Candidates\s*540/,
      /Probed\s*180/,
      /Built\s*Oct 1, 2026/,
    ]);
    await expect(datasets.rows()).toHaveCount(5);
    await expect(datasets.rows().first()).toContainText("facebook/react");
  });

  test("sorts the entries by stars and filters them by repository", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoDetail();
    await expect(datasets.rows()).toHaveCount(5);

    await datasets.sortButton("Stars").click();
    await expect(datasets.rows().first()).toContainText("vuejs/core");
    await datasets.sortButton("Stars").click();
    await expect(datasets.rows().first()).toContainText("facebook/react");

    await datasets.filter.fill("svelte");
    await expect(datasets.rows()).toHaveCount(1);
    await expect(datasets.rows()).toContainText("sveltejs/svelte");
  });

  test("paginates more than 20 entries", async ({ page }) => {
    const many = Array.from({ length: 45 }, (_, i) =>
      entry(i, `org/repo-${i + 1}`, 10000 - i),
    );
    const datasets = new DatasetsPage(page);
    await datasets.signIn({ entries: many });
    await datasets.gotoDetail();

    await expect(datasets.rows()).toHaveCount(20);
    await datasets.pagination().getByRole("button", { name: "Page 3" }).click();
    await expect(datasets.rows()).toHaveCount(5);
    await expect(datasets.rows().first()).toContainText("org/repo-41");
  });

  test("Tab reaches the actions, filter and entries with visible focus", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoDetail();
    await expect(datasets.rows()).toHaveCount(5);

    await page
      .getByRole("link", { name: "Datasets", exact: true })
      .last()
      .focus();
    for (const target of [
      page.getByRole("button", { name: "Run Experiment" }),
      page.getByRole("button", { name: "Import as projects" }),
      page.getByRole("button", { name: "Delete" }),
      datasets.filter,
      datasets.sortButton("Rank"),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn();
    await datasets.gotoDetail();
    await expect(datasets.rows()).toHaveCount(5);

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "dataset-detail");

    await page.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("button", { name: "Confirm delete" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("a building Dataset passes axe and matches the screenshots", async ({
    page,
  }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn({ detail: sampleDatasets[1] });
    await datasets.gotoDetail("ds-2");
    await expect(page.getByText("Building", { exact: true })).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "dataset-detail-building");
  });

  test("a failed Dataset says why and passes axe", async ({ page }) => {
    const datasets = new DatasetsPage(page);
    await datasets.signIn({ detail: sampleDatasets[2] });
    await datasets.gotoDetail("ds-3");

    await expect(page.getByRole("alert")).toContainText("Bad credentials");
    await expectNoAxeViolations(page);
    await expectScreenshots(page, "dataset-detail-failed");
  });

  test("while loading, a skeleton stands in for the page", async ({ page }) => {
    const datasets = new DatasetsPage(page);
    const release = await datasets.signIn({ hold: true });
    await datasets.gotoDetail();

    await expect(
      page.getByRole("status", { name: "Loading the Dataset" }),
    ).toBeVisible();

    release();

    await expect(datasets.heading).toHaveText("Top npm packages");
  });
});
