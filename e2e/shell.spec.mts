import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectAriaSnapshot } from "./helpers/aria-snapshot.mjs";
import { expectPageSweep } from "./helpers/page-sweep.mjs";
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

  test("the user menu opens Help", async ({ page }) => {
    await page.getByRole("button", { name: /account menu/ }).click();
    await page.getByRole("menuitem", { name: "Help" }).click();

    await expect(page).toHaveURL(/\/help$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /help/i }),
    ).toBeVisible();
  });

  test("the top navigation bar is gone", async ({ page }) => {
    await expect(page.getByRole("navigation")).toHaveCount(1);
    await expect(page.getByRole("banner")).toHaveCount(0);
  });

  test("with reduced motion, dialogs and the sidebar change state without animating", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await shell.goto();
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(shell.palette).toBeVisible();

    // The longest animation or transition on any element, in milliseconds.
    const longest = await page.evaluate(() => {
      const ms = (value: string): number[] =>
        value
          .split(",")
          .map((v) => parseFloat(v) * (v.trim().endsWith("ms") ? 1 : 1000));
      return Math.max(
        ...[...document.querySelectorAll("*")].flatMap((el) => {
          const style = getComputedStyle(el);
          return [
            ...ms(style.animationDuration),
            ...ms(style.transitionDuration),
          ];
        }),
      );
    });
    expect(longest).toBeLessThanOrEqual(1);
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

  // The only snapshot of the sidebar: page snapshots cover main alone.
  test("the sidebar matches its aria snapshot, open and collapsed", async ({
    page,
  }) => {
    await expectAriaSnapshot(shell.sidebar, "sidebar");

    await page.getByRole("button", { name: "Collapse sidebar" }).click();

    await expectAriaSnapshot(shell.sidebar, "sidebar-collapsed");
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
    await expectPageSweep(page);
    await expectScreenshots(page, "shell");

    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expectPageSweep(page);
    await expectScreenshots(page, "shell-collapsed");
    await page.getByRole("button", { name: "Expand sidebar" }).click();

    await page.keyboard.press("ControlOrMeta+k");
    await expect(
      shell.palette.getByRole("option", { name: "Fix lag study" }),
    ).toBeVisible();
    await expectPageSweep(page);
    await expectScreenshots(page, "palette");
  });
});

test.describe("App shell on a phone", () => {
  let shell: ShellPage;

  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    shell = new ShellPage(page);
    await shell.signIn();
    await page.goto("/datasets");
  });

  test("a header with a navigation trigger is shown and the sidebar starts closed", async () => {
    await expect(shell.mobileHeader).toBeVisible();
    await expect(shell.navTrigger).toBeVisible();
    await expect(shell.navTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(shell.nav).toBeHidden();
  });

  test("the trigger opens the navigation and the close button closes it", async ({
    page,
  }) => {
    await shell.navTrigger.tap();

    await expect(shell.nav).toBeVisible();
    await expect(shell.link("Datasets")).toBeVisible();

    await page.getByRole("button", { name: "Close navigation" }).tap();

    await expect(shell.nav).toBeHidden();
    await expect(shell.navTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("the drawer has a close button and no desktop collapse controls", async ({
    page,
  }) => {
    // Up to the sidebar breakpoint, where the desktop rail used to show.
    for (const width of [390, 700]) {
      await page.setViewportSize({ width, height: 844 });
      await shell.navTrigger.tap();
      await expect(shell.nav).toBeVisible();

      const drawer = page.locator('[data-mobile="true"]');
      await expect(
        drawer.getByRole("button", { name: /sidebar/i }),
      ).toHaveCount(0);
      const close = drawer.getByRole("button", { name: "Close navigation" });
      await expect(close.locator("svg.lucide-x")).toBeVisible();
      await expect(close.locator("svg.lucide-panel-left")).toHaveCount(0);

      await close.tap();
      await expect(shell.nav).toBeHidden();
    }
  });

  test("the navigation closes after following a link", async ({ page }) => {
    await shell.navTrigger.tap();
    await shell.link("Experiments").tap();

    await expect(page).toHaveURL(/\/experiments$/);
    await expect(shell.nav).toBeHidden();
  });

  test("logout is reachable by touch", async ({ page }) => {
    await shell.navTrigger.tap();
    await page.getByRole("button", { name: /account menu/ }).tap();
    await page.getByRole("menuitem", { name: "Log out" }).tap();

    await expect(page).toHaveURL(/\/login$/);
    await expect(shell.navTrigger).toBeHidden();
  });

  // The only snapshot of the phone header and its navigation drawer.
  test("the header and the open navigation match their aria snapshots", async () => {
    await expectAriaSnapshot(shell.mobileHeader, "mobile-header");

    await shell.navTrigger.tap();
    await expect(shell.nav).toBeVisible();

    await expectAriaSnapshot(shell.sidebar, "mobile-navigation");
  });

  test("the header fits the viewport and the open navigation passes axe", async ({
    page,
  }) => {
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(width).toBeLessThanOrEqual(390);

    await shell.navTrigger.tap();
    await expect(shell.nav).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
