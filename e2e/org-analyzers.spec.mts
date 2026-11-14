import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { OrgAnalyzersPage } from "./pages/org-analyzers.page.mjs";

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

    await analyzers.gotoCreate();
    await expect(page.getByRole("radio")).toHaveCount(2);
    await expect(page.getByText("js-sbom")).toBeVisible();
    await expectScreenshots(page, "org-analyzer-create");
  });
});
