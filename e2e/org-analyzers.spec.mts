import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectMainSnapshot } from "./helpers/aria-snapshot.mjs";
import { expectPageSweep } from "./helpers/page-sweep.mjs";
import { describeOnAPhone } from "./helpers/phone.mjs";
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
    await expect(analyzers.row("License audit")).toContainText("1 stage");

    await analyzers
      .row("License audit")
      .getByRole("link", { name: "Edit License audit" })
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
      .row("License audit")
      .getByRole("button", { name: "Delete License audit" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Delete License audit?" });
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
      .row("License audit")
      .getByRole("button", { name: "Delete License audit" })
      .click();
    await confirm.click();

    await expect(dialog).toHaveCount(0);
    expect(analyzers.deleted).toEqual(["an-2"]);
    await expect(analyzers.rows()).toHaveCount(1);
    await expect(page.getByText("Deleted License audit")).toBeVisible();
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
    await expectPageSweep(page);
    await expectMainSnapshot(page, "org-analyzers-empty");

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
    await expectPageSweep(page);
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

test.describe("Analyzer workflow rules", () => {
  async function fillDetails(page: Page): Promise<void> {
    await page.getByLabel("Name").fill("JS audit");
    await page.getByLabel("Description").fill("Audits JavaScript projects");
  }

  test("adding a plugin that needs an SBOM adds no second SBOM plugin", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();
    await expect(analyzers.workflowNodes()).toHaveCount(2);

    await analyzers.addPlugin("license-finder");

    await expect(analyzers.workflowNodes()).toHaveCount(3);
    await expect(analyzers.workflowNode("php-sbom")).toHaveCount(0);
  });

  test("adding a plugin to an empty workflow adds one SBOM plugin and its other dependencies", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();
    await expect(analyzers.workflowNodes()).toHaveCount(2);
    await analyzers.removePlugin("vuln-finder");
    await analyzers.removePlugin("js-sbom");

    await analyzers.addPlugin("js-patching");

    await expect(analyzers.workflowNodes()).toHaveCount(3);
    await expect(analyzers.workflowNodes()).toContainText([
      "js-sbom",
      "vuln-finder",
      "js-patching",
    ]);
    await fillDetails(page);
    await page.getByRole("button", { name: "Create analyzer" }).click();
    await expect(page).toHaveURL(/\/orgs\/manage\/analyzers\/org-123/);
    expect(analyzers.created).toEqual([
      expect.objectContaining({
        steps: [
          [expect.objectContaining({ name: "js-sbom" })],
          [expect.objectContaining({ name: "vuln-finder" })],
          [expect.objectContaining({ name: "js-patching" })],
        ],
      }),
    ]);
  });

  test("an analyzer with no plugins cannot be saved", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();
    await expect(analyzers.workflowNodes()).toHaveCount(2);
    await analyzers.removePlugin("vuln-finder");
    await analyzers.removePlugin("js-sbom");
    await fillDetails(page);

    await page.getByRole("button", { name: "Create analyzer" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "Add at least one plugin to the analyzer.",
    );
    expect(analyzers.created).toEqual([]);
  });

  test("a plugin whose dependency is missing blocks saving, naming the plugin", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();
    await expect(analyzers.workflowNodes()).toHaveCount(2);
    await analyzers.removePlugin("js-sbom");
    await fillDetails(page);

    await page.getByRole("button", { name: "Create analyzer" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "vuln-finder needs js-sbom or php-sbom. Add it to the analyzer.",
    );
    expect(analyzers.created).toEqual([]);
  });

  test("a name longer than 25 characters is refused before saving", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();
    await fillDetails(page);
    await page.getByLabel("Name").fill("A".repeat(26));

    await page.getByRole("button", { name: "Create analyzer" }).click();

    await expect(page.getByLabel("Name")).toHaveAccessibleDescription(
      "Please enter a name of at most 25 characters",
    );
    expect(analyzers.created).toEqual([]);
  });

  test("the add-plugin menu says when no plugins are installed and closes on Escape", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({ plugins: [] });
    await analyzers.gotoCreate();

    await analyzers.openAddPluginMenu();
    await expect(analyzers.addPluginMenu()).toContainText(
      "No plugins are installed",
    );

    await page.keyboard.press("Escape");
    await expect(analyzers.addPluginMenu()).toHaveCount(0);
  });

  test("going back to Custom after a template shows the Custom plugins", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({
      templates: [
        {
          name: "JavaScript licenses",
          description: "SBOM and license scan for JavaScript projects",
          supported_languages: ["javascript"],
          language_config: {
            javascript: { plugins: ["js-sbom", "license-finder"] },
          },
          logo: "js",
          steps: [[{ name: "js-sbom" }], [{ name: "license-finder" }]],
        },
      ],
    });
    await analyzers.gotoCreate();

    await page.getByRole("radio", { name: /JavaScript licenses/ }).check();
    await expect(analyzers.workflowNodes()).toContainText([
      "js-sbom",
      "license-finder",
    ]);

    await page.getByRole("radio", { name: /Custom/ }).check();
    await expect(analyzers.workflowNodes()).toHaveCount(2);
    await expect(analyzers.workflowNodes()).toContainText([
      "js-sbom",
      "vuln-finder",
    ]);
  });
});

test.describe("Edit analyzer", () => {
  test("loads the analyzer and saves a new name", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoEdit("an-2");

    await expect(analyzers.heading).toHaveText("Edit analyzer");
    await expect(page.getByLabel("Name")).toHaveValue("License audit");

    await page.getByLabel("Name").fill("License review");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/orgs\/manage\/analyzers\/org-123/);
    expect(analyzers.updated).toEqual([
      expect.objectContaining({ name: "License review" }),
    ]);
  });

  test("an analyzer saved with no plugins cannot be saved again as is", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({
      analyzers: [analyzer("an-4", "Empty audit", { steps: [] })],
    });
    await analyzers.gotoEdit("an-4");
    await expect(page.getByLabel("Name")).toHaveValue("Empty audit");

    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "Add at least one plugin to the analyzer.",
    );
    expect(analyzers.updated).toEqual([]);
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
        description: "Patched audit for JavaScript projects",
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

test.describe("Analyzer wording", () => {
  // The glossary calls an analyzer a set of plugin stages, never a workflow.
  test("no analyzer page calls an analyzer a workflow", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    const main = page.locator("#main-content");
    await analyzers.signIn();

    await analyzers.gotoList();
    await expect(analyzers.rows()).toHaveCount(2);
    await expect(main).not.toContainText(/workflow/i);

    await analyzers.gotoCreate();
    await expect(analyzers.workflowNodes()).not.toHaveCount(0);
    await expect(main).not.toContainText(/workflow/i);

    await analyzers.gotoEdit("an-2");
    await expect(page.getByLabel("Name")).toHaveValue("License audit");
    await expect(main).not.toContainText(/workflow/i);
  });

  test("the empty analyzer list does not call an analyzer a workflow", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn({ analyzers: [] });
    await analyzers.gotoList();

    await expect(
      page.getByRole("heading", { name: "No analyzers yet" }),
    ).toBeVisible();
    await expect(page.locator("#main-content")).not.toContainText(/workflow/i);
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
    await expectPageSweep(page);

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
    await expectPageSweep(page);
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
    await expectPageSweep(page);
    await page.getByRole("button", { name: "Create analyzer" }).click();
    await expectNoAxeViolations(page);
    await expectPageSweep(page);

    const name = page.getByLabel("Name");
    await name.focus();
    await expectVisibleFocus(name);
  });

  test("list and new analyzer screenshots", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoList();
    await expect(analyzers.rows()).toHaveCount(2);
    await expectPageSweep(page);
    await expectMainSnapshot(page, "org-analyzers");
    await expectScreenshots(page, "org-analyzers");

    // The canvas fits itself to the width it opens at.
    await page.setViewportSize({ width: 1280, height: 1024 });
    await analyzers.gotoCreate();
    await expect(page.getByRole("radio")).toHaveCount(2);
    await expect(page.getByText("js-sbom")).toBeVisible();
    await expectPageSweep(page);
    await expectMainSnapshot(page, "org-analyzer-create");
    await expectScreenshots(page, "org-analyzer-create");
  });
});

describeOnAPhone("On a phone", () => {
  test("the analyzers list fits without scrolling sideways", async ({
    page,
  }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoList();
    await expect(analyzers.rows()).toHaveCount(2);
    await expectPageSweep(page);
    await expectScreenshots(page, "org-analyzers");
  });

  test("New analyzer fits without scrolling sideways", async ({ page }) => {
    const analyzers = new OrgAnalyzersPage(page);
    await analyzers.signIn();
    await analyzers.gotoCreate();
    await expect(page.getByRole("radio")).toHaveCount(2);
    await expectPageSweep(page);
    await expectScreenshots(page, "org-analyzer-create");
  });
});
