import { expect, type Locator, type Page, test } from "@playwright/test";

import { describeOnAPhone } from "./helpers/phone.mjs";
import { AnalysesPage, codeqlAnalyzer } from "./pages/analyses.page.mjs";
import { DashboardPage } from "./pages/dashboard.page.mjs";
import {
  ExperimentDetailPage,
  samplePublishedVersion,
} from "./pages/experiment-detail.page.mjs";
import { ExperimentsPage } from "./pages/experiments.page.mjs";
import { ResultTabsPage } from "./pages/result-tabs.page.mjs";
import { ShellPage } from "./pages/shell.page.mjs";

// Experiments (with Published results and the As-of and Hindsight views) and
// CodeQL are Preview features; see GLOSSARY.md.
const PREVIEW_NOTE =
  "Preview feature: it and the data it keeps may change between releases.";

/** The Preview marker inside `region`: the word Preview with its tooltip. */
function marker(region: Locator | Page): Locator {
  return region.getByTitle(PREVIEW_NOTE);
}

async function expectMarked(region: Locator | Page): Promise<void> {
  await expect(marker(region)).toBeVisible();
  await expect(marker(region)).toHaveText("Preview");
}

/** No user-facing text calls a feature experimental. */
async function expectNoExperimentalWording(page: Page): Promise<void> {
  await expect(page.locator("body")).not.toContainText(/experimental/i);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Preview features in the navigation", () => {
  test("the Experiments link is marked Preview, the others are not", async ({
    page,
  }) => {
    const shell = new ShellPage(page);
    await shell.signIn();
    await shell.goto();

    const experiments = shell.link("Experiments");
    await expectMarked(experiments);
    await expect(experiments).toHaveAccessibleDescription("Preview");
    for (const name of ["Dashboard", "Datasets", "Projects", "Tickets"]) {
      await expect(marker(shell.link(name))).toHaveCount(0);
      await expect(shell.link(name)).toHaveAccessibleDescription("");
    }
    await expectNoExperimentalWording(page);
  });

  test("the collapsed sidebar names Experiments as Preview in its tooltip", async ({
    page,
  }) => {
    const shell = new ShellPage(page);
    await shell.signIn();
    await shell.goto();
    await page.getByRole("button", { name: "Collapse sidebar" }).click();

    await shell.link("Experiments").hover();

    await expect(page.getByRole("tooltip")).toHaveText("Experiments (Preview)");
  });

  test("the palette marks the Experiments page and Create an Experiment", async ({
    page,
  }) => {
    const shell = new ShellPage(page);
    await shell.signIn();
    await shell.goto();
    await page.keyboard.press("ControlOrMeta+k");

    for (const name of ["Experiments", "Create an Experiment"]) {
      const option = shell.palette.getByRole("option", { name, exact: true });
      await expectMarked(option);
      await expect(option).toHaveAccessibleDescription("Preview");
    }
    await expect(
      marker(
        shell.palette.getByRole("option", { name: "Datasets", exact: true }),
      ),
    ).toHaveCount(0);
  });
});

test.describe("Preview features on their pages", () => {
  test("the Experiments list is marked Preview", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoList();

    await expect(experiments.heading).toHaveText("Experiments");
    await expectMarked(page.getByRole("main"));
    await expectNoExperimentalWording(page);
  });

  test("the New Experiment form is marked Preview", async ({ page }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoCreate();

    await expect(experiments.heading).toHaveText("New Experiment");
    await expectMarked(page.getByRole("main"));
    await expectNoExperimentalWording(page);
  });

  test("an Experiment with Published results and its As-of and Hindsight views is marked Preview", async ({
    page,
  }) => {
    const detail = new ExperimentDetailPage(page);
    await detail.signIn({ published: [samplePublishedVersion] });
    await detail.goto();

    await expect(detail.heading).toHaveText("Fix lag study");
    await expect(
      detail.section("Results").getByText("Frozen", { exact: true }),
    ).toBeVisible();
    await expectMarked(page.getByRole("main"));
    await expectNoExperimentalWording(page);
  });

  test("the Dashboard marks its Experiment and Published results lists, not Research as a whole", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();
    await expect(dashboard.list("Recent Published results")).toBeVisible();

    for (const name of [
      "Experiments in progress",
      "Recently finished",
      "Recent Published results",
    ]) {
      const card = dashboard.research
        .locator("[data-slot=card]")
        .filter({ has: page.getByText(name, { exact: true }) });
      await expectMarked(card);
    }
    await expect(
      page.getByRole("heading", { name: "Research", exact: true }),
    ).toHaveText("Research");
    await expectNoExperimentalWording(page);
  });

  test("the CodeQL results tab and its findings are marked Preview", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto("CodeQL");

    const tab = page.getByRole("tab", { name: "CodeQL", exact: true });
    await expectMarked(tab);
    await expect(tab).toHaveAccessibleDescription("Preview");
    await expect(
      marker(page.getByRole("tab", { name: "SBOM", exact: true })),
    ).toHaveCount(0);
    await expectMarked(page.getByRole("region", { name: "CodeQL findings" }));
    await expectNoExperimentalWording(page);
  });

  test("the CodeQL options of a New Analysis are marked Preview", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({ analyzers: [codeqlAnalyzer] });
    await analyses.goto();
    await analyses.analyzer("CodeQL").click();

    await expectMarked(page.getByRole("group", { name: /^codeql/ }));
    await expectNoExperimentalWording(page);
  });
});

describeOnAPhone("Preview features on a phone", () => {
  test("the navigation drawer marks Experiments Preview", async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.signIn();
    await shell.goto();
    await shell.navTrigger.tap();

    await expectMarked(shell.link("Experiments"));
  });

  test("the Experiments page marker fits next to the heading", async ({
    page,
  }) => {
    const experiments = new ExperimentsPage(page);
    await experiments.signIn();
    await experiments.gotoList();

    await expectMarked(page.getByRole("main"));
    const box = (await marker(page.getByRole("main")).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
