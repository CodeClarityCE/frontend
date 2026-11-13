import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { ShellPage } from "./pages/shell.page.mjs";

test.describe("App shell", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
  });

  test("the sidebar lists Dashboard, Research, Projects and Organisation settings in order", async () => {
    await shell.goto();

    await expect(shell.nav.getByRole("listitem")).toHaveText([
      "Dashboard",
      "Datasets",
      "Experiments",
      "Projects",
      "Results",
      "Tickets",
      "Organisation settings",
    ]);
    await expect(
      shell.nav.getByRole("group", { name: "Research" }).getByRole("listitem"),
    ).toHaveText(["Datasets", "Experiments"]);
    await expect(
      shell.nav.getByRole("group", { name: "Projects" }).getByRole("listitem"),
    ).toHaveText(["Projects", "Results", "Tickets"]);
  });

  test("the sidebar marks the current page and navigates", async ({ page }) => {
    await shell.goto();
    await expect(shell.link("Datasets")).toHaveAttribute(
      "aria-current",
      "page",
    );

    await shell.link("Experiments").click();

    await expect(page).toHaveURL(/\/experiments$/);
    await expect(shell.link("Experiments")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(shell.link("Datasets")).not.toHaveAttribute("aria-current");
  });

  test("the sidebar collapses to icons and expands again", async ({ page }) => {
    await shell.goto();
    const wide = (await shell.sidebar.boundingBox())!.width;

    await page.getByRole("button", { name: "Collapse sidebar" }).click();

    const expand = page.getByRole("button", { name: "Expand sidebar" });
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await expect
      .poll(async () => (await shell.sidebar.boundingBox())!.width)
      .toBeLessThan(wide / 2);
    await expect(shell.link("Datasets")).toBeVisible();

    await expand.click();

    await expect(
      page.getByRole("button", { name: "Collapse sidebar" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect
      .poll(async () => (await shell.sidebar.boundingBox())!.width)
      .toBe(wide);
  });

  test("Tab moves through the sidebar in order with a visible focus ring", async ({
    page,
  }) => {
    await shell.goto();

    const order = [
      page.getByRole("link", { name: "Skip to content" }),
      page.getByRole("link", { name: /CodeClarity/ }),
      page.getByRole("button", { name: "Collapse sidebar" }),
      page.getByRole("button", { name: /switch organisation/ }),
      page.getByRole("button", { name: "Search" }),
      shell.link("Dashboard"),
      shell.link("Datasets"),
      shell.link("Experiments"),
      shell.link("Projects"),
      shell.link("Tickets"),
      shell.link("Organisation settings"),
      page.getByRole("button", { name: /account menu/ }),
    ];
    for (const target of order) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("Skip to content moves focus past the sidebar", async ({ page }) => {
    await shell.goto();

    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("main").first()).toBeFocused();
  });
});

test.describe("Organisation switcher and user menu", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
    await shell.goto();
  });

  test("switches organisation from the sidebar with the keyboard", async ({
    page,
  }) => {
    const switcher = page.getByRole("button", { name: /switch organisation/ });
    await expect(switcher).toContainText("Test Organization");
    await switcher.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu");
    await expect(
      menu.getByRole("menuitem", { name: "Test Organization" }),
    ).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(
      menu.getByRole("menuitem", { name: "Research Lab" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/$/);
    await expect(switcher).toContainText("Research Lab");
    await expect(page.getByText("Switched to Research Lab")).toBeVisible();
  });

  test("the user menu opens account settings and logs out", async ({
    page,
  }) => {
    const account = page.getByRole("button", { name: /account menu/ });
    await expect(account).toContainText("John Doe");
    await account.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu");
    await expect(
      menu.getByRole("menuitem", { name: "Account settings" }),
    ).toBeVisible();
    await page.keyboard.press("End");
    await expect(menu.getByRole("menuitem", { name: "Log out" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/login$/);
    await expect(shell.nav).toBeHidden();
  });

  test("the top navigation bar is gone", async ({ page }) => {
    await expect(page.getByRole("navigation")).toHaveCount(1);
    await expect(page.getByRole("banner")).toHaveCount(0);
  });
});

test.describe("Command palette", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
    await shell.goto();
  });

  test("Ctrl+K opens the palette and Esc closes it", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");

    await expect(shell.palette).toBeVisible();
    await expect(
      shell.palette.getByRole("textbox", { name: "Search" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(shell.palette).toBeHidden();
  });

  test("the Search button opens the palette", async ({ page }) => {
    await page.getByRole("button", { name: "Search" }).click();

    await expect(shell.palette).toBeVisible();
  });

  test("lists pages, Datasets, Experiments and Projects", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");

    for (const [group, item] of [
      ["Pages", "Dashboard"],
      ["Datasets", "Top npm packages"],
      ["Experiments", "Fix lag study"],
      ["Projects", "web-frontend"],
    ]) {
      await expect(
        shell.palette
          .getByRole("group", { name: group })
          .getByRole("option", { name: item }),
      ).toBeVisible();
    }
  });

  for (const [query, url] of [
    ["Top npm", /\/datasets\/detail\?id=ds-1$/],
    ["Fix lag", /\/experiments\/detail\?id=exp-1$/],
    ["web-front", /\/analyses\/add\?id=proj-1$/],
    ["Tickets", /\/tickets$/],
  ] as const) {
    test(`typing "${query}" and Enter navigates there`, async ({ page }) => {
      await page.keyboard.press("ControlOrMeta+k");
      await expect(
        shell.palette.getByRole("option", { name: "Fix lag study" }),
      ).toBeVisible();

      await page.keyboard.type(query);
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(url);
      await expect(shell.palette).toBeHidden();
    });
  }
});

test.describe("App shell accessibility and look", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
    await shell.goto();
    await expect(
      page.getByRole("button", { name: /Test Organization/ }),
    ).toBeVisible();
  });

  test("the shell passes axe", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("the open palette passes axe", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(
      shell.palette.getByRole("option", { name: "Fix lag study" }),
    ).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test("screenshots", async ({ page }) => {
    // The page body belongs to each page's own spec; only the shell is compared here.
    await shell.hidePageContent();
    await expectScreenshots(page, "shell");

    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expectScreenshots(page, "shell-collapsed");
    await page.getByRole("button", { name: "Expand sidebar" }).click();

    await page.keyboard.press("ControlOrMeta+k");
    await expect(
      shell.palette.getByRole("option", { name: "Fix lag study" }),
    ).toBeVisible();
    await expectScreenshots(page, "palette");
  });
});
