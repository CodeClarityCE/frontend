import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { analyzer, OrgAnalyzersPage } from "./pages/org-analyzers.page.mjs";

// Three stages with plugin options that a save must keep as is.
const configuredAnalyzer = analyzer("an-3", "Patched audit", {
  steps: [
    [
      {
        name: "js-sbom",
        version: "1.0.0",
        config: {
          branch: {
            name: "branch",
            type: "string",
            required: true,
            description: "The branch you want to analyze",
          },
        },
      },
    ],
    [
      {
        name: "vuln-finder",
        version: "0.9.0",
        config: {},
      },
    ],
    [
      {
        name: "js-patching",
        version: "1.0.0",
        config: {},
      },
    ],
  ],
});

// The organisation header (HeaderItem) still has a green badge with white text.

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Organisation analyzers list", () => {
  test("lists each analyzer with its stages and links to edit it", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoList();

    await expect(analyzers.heading).toHaveText("Analyzers");
    await expect(analyzers.rows()).toHaveCount(2);
    await expect(analyzers.row("Default analyzer")).toContainText("2 stages");
    await expect(analyzers.row("Licence audit")).toContainText("1 stage");

    await analyzers
      .row("Licence audit")
      .getByRole("link", { name: "Edit Licence audit" })
      .click();

    await expect(page).toHaveURL(
      /\/orgs\/edit\/analyzers\/org-123\/?\?analyzerId=an-2$/,
    );
  });

  test("deleting asks for confirmation in a dialog that keeps focus", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoList();

    await analyzers
      .row("Licence audit")
      .getByRole("button", { name: "Delete Licence audit" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Delete Licence audit?" });
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole("button", { name: "Delete analyzer" });
    const cancel = dialog.getByRole("button", { name: "Cancel" });

    // Tab cycles inside the dialog and never reaches the page behind it.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }

    await cancel.click();
    await expect(dialog).toHaveCount(0);
    expect(analyzers.deleted).toEqual([]);

    await analyzers
      .row("Licence audit")
      .getByRole("button", { name: "Delete Licence audit" })
      .click();
    await confirm.click();

    await expect(dialog).toHaveCount(0);
    expect(analyzers.deleted).toEqual(["an-2"]);
    await expect(analyzers.rows()).toHaveCount(1);
    await expect(page.getByText("Deleted Licence audit")).toBeVisible();
  });

  test("an organisation with no analyzers sees the owl and Create an analyzer", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({ analyzers: [] });
    await analyzers.gotoList();

    await expect(
      page.getByRole("heading", { name: "No analyzers yet" }),
    ).toBeVisible();
    await expect(analyzers.table).toHaveCount(0);

    await page.getByRole("link", { name: "Create an analyzer" }).click();

    await expect(page).toHaveURL(/\/orgs\/add\/analyzers\/org-123/);
  });

  test("a failed load says so and offers to try again", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({ failList: true });
    await analyzers.gotoList();

    await expect(
      page.getByText("The analyzers could not be loaded."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});

test.describe("New analyzer", () => {
  test("submitting an empty form shows each error next to its field", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();

    await expect(analyzers.heading).toHaveText("New analyzer");
    await page.getByRole("button", { name: "Create analyzer" }).click();

    const name = page.getByLabel("Name");
    const description = page.getByLabel("Description");
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription(
      "Please enter a name (minimum 5 characters)",
    );
    await expect(description).toHaveAccessibleDescription(
      "Please enter a description (minimum 10 characters)",
    );
    expect(analyzers.created).toEqual([]);
  });

  test("picking a template fills in the form, and creating returns to the list", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();

    await page.getByRole("radio", { name: /JavaScript security/ }).check();

    await expect(page.getByLabel("Name")).toHaveValue("JavaScript security");
    await expect(page.getByLabel("Description")).toHaveValue(
      "SBOM and vulnerability scan for JavaScript projects",
    );

    await page.getByRole("button", { name: "Create analyzer" }).click();

    await expect(page).toHaveURL(/\/orgs\/manage\/analyzers\/org-123/);
    expect(analyzers.created).toEqual([
      expect.objectContaining({
        name: "JavaScript security",
        supported_languages: ["javascript"],
      }),
    ]);
  });
});

test.describe("Edit analyzer", () => {
  test("loads the analyzer and saves a new name", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoEdit("an-2");

    await expect(analyzers.heading).toHaveText("Edit analyzer");
    await expect(page.getByLabel("Name")).toHaveValue("Licence audit");

    await page.getByLabel("Name").fill("Licence review");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/orgs\/manage\/analyzers\/org-123/);
    expect(analyzers.updated).toEqual([
      expect.objectContaining({ name: "Licence review" }),
    ]);
  });

  test("shows the saved steps, not every installed plugin", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoEdit("an-2");

    await expect(analyzers.workflowNodes()).toHaveCount(1);
    await expect(analyzers.workflowNodes()).toContainText(["js-sbom"]);
    await expect(page.getByText("1 plugins")).toBeVisible();
  });

  test("saving without changes sends the steps that were loaded", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({ analyzers: [configuredAnalyzer] });
    await analyzers.gotoEdit("an-3");
    await expect(page.getByLabel("Name")).toHaveValue("Patched audit");

    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/orgs\/manage\/analyzers\/org-123/);
    expect(analyzers.updated).toEqual([
      {
        name: "Patched audit",
        description: "Patched audit workflow for JavaScript projects",
        steps: configuredAnalyzer.steps,
      },
    ]);
  });

  test("renaming keeps the stages after a reload", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({ analyzers: [configuredAnalyzer] });
    await analyzers.gotoEdit("an-3");
    await expect(page.getByLabel("Name")).toHaveValue("Patched audit");

    await page.getByLabel("Name").fill("Patched review");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(analyzers.row("Patched review")).toContainText("3 stages");

    await analyzers.gotoEdit("an-3");
    await expect(page.getByLabel("Name")).toHaveValue("Patched review");
    await expect(analyzers.workflowNodes()).toHaveCount(3);
    await expect(analyzers.workflowNodes()).toContainText([
      "js-sbom",
      "vuln-finder",
      "js-patching",
    ]);
  });

  test("the canvas opens with every node in view", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({ analyzers: [configuredAnalyzer] });
    await analyzers.gotoEdit("an-3");
    await expect(analyzers.workflowNodes()).toHaveCount(3);

    await expect(async () => {
      const canvas = await analyzers.canvas().boundingBox();
      expect(canvas).not.toBeNull();
      for (const node of await analyzers.workflowNodes().all()) {
        const box = await node.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(canvas!.x);
        expect(box!.y).toBeGreaterThanOrEqual(canvas!.y);
        expect(box!.x + box!.width).toBeLessThanOrEqual(
          canvas!.x + canvas!.width,
        );
        expect(box!.y + box!.height).toBeLessThanOrEqual(
          canvas!.y + canvas!.height,
        );
      }
    }).toPass({ timeout: 5000 });
  });
});

test.describe("Analyzers accessibility and look", () => {
  test("the list passes axe and Tab reaches every action with visible focus", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoList();
    await expect(analyzers.rows()).toHaveCount(2);

    await expectNoAxeViolations(page);

    const newAnalyzer = page.getByRole("link", { name: "New analyzer" });
    await newAnalyzer.focus();
    await expectVisibleFocus(newAnalyzer);
    const order = [
      page.getByRole("searchbox", { name: "Filter analyzers" }),
      analyzers.table.getByRole("button", { name: /Name/ }),
      analyzers.table.getByRole("button", { name: /Stages/ }),
      analyzers.table.getByRole("button", { name: /Created/ }),
      page.getByRole("link", { name: "Edit Default analyzer" }),
      page.getByRole("button", { name: "Delete Default analyzer" }),
    ];
    for (const target of order) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }

    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    // Measure contrast once the dialog has finished fading in.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    await expectNoAxeViolations(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the new analyzer form passes axe, with errors shown", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();
    await expect(page.getByRole("radio")).toHaveCount(2);

    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Create analyzer" }).click();
    await expectNoAxeViolations(page);

    const name = page.getByLabel("Name");
    await name.focus();
    await expectVisibleFocus(name);
  });

  test("list and new analyzer screenshots", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoList();
    await expect(analyzers.rows()).toHaveCount(2);
    await expectScreenshots(page, "org-analyzers");

    // The canvas fits itself to the width it opens at.
    await page.setViewportSize({ width: 1280, height: 1024 });
    await analyzers.gotoCreate();
    await expect(page.getByRole("radio")).toHaveCount(2);
    await expect(page.getByText("js-sbom")).toBeVisible();
    await expectScreenshots(page, "org-analyzer-create");
  });
});
