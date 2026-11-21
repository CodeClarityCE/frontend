import { expect, type Locator, type Page, test } from "@playwright/test";

import { expectVisibleFocus } from "./helpers/a11y.mjs";
import {
  BACKGROUND,
  blockAppBundle,
  blockStorage,
  expectTheme,
  imageLuminance,
  POPOVER,
  storeTheme,
} from "./helpers/theme.mjs";
import { AuthPage } from "./pages/auth.page.mjs";
import { ShellPage } from "./pages/shell.page.mjs";

// Opens the sidebar user menu and returns it.
async function openUserMenu(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: /account menu/ }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  return menu;
}

function themeOption(menu: Locator, name: string): Locator {
  return menu
    .getByRole("group", { name: "Theme" })
    .getByRole("menuitemradio", { name });
}

test.describe("Theme follows the OS", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
  });

  for (const path of ["/datasets", "/login"]) {
    test(`a dark OS gets dark before the app bundle loads on ${path}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await blockAppBundle(page);

      await page.goto(path);

      await expectTheme(page, "dark");
    });
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`a ${scheme} OS renders the app ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });

      await shell.goto();

      await expectTheme(page, scheme);
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        BACKGROUND[scheme],
      );
    });
  }

  test("the app follows the OS when it switches, without a reload", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await shell.goto();
    await expectTheme(page, "light");
    await page.evaluate(() => ((window as { marker?: number }).marker = 1));

    await page.emulateMedia({ colorScheme: "dark" });
    await expectTheme(page, "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expectTheme(page, "light");

    expect(
      await page.evaluate(() => (window as { marker?: number }).marker),
    ).toBe(1);
  });
});

test.describe("A stored Theme choice", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
  });

  for (const [stored, os, expected] of [
    ["light", "dark", "light"],
    ["dark", "light", "dark"],
    ["purple", "dark", "dark"],
    ["purple", "light", "light"],
    ["system", "dark", "dark"],
  ] as const) {
    test(`"${stored}" under a ${os} OS applies ${expected}, before and after the app loads`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: os });
      await storeTheme(page, stored);

      await blockAppBundle(page);
      await page.goto("/datasets");
      await expectTheme(page, expected);

      await page.unrouteAll();
      await shell.signIn();
      await shell.goto();
      await expectTheme(page, expected);
    });
  }

  test("Light stops following the OS", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await storeTheme(page, "light");
    await shell.goto();

    await page.emulateMedia({ colorScheme: "dark" });

    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      BACKGROUND.light,
    );
    await expectTheme(page, "light");
  });
});

test.describe("Signed out", () => {
  test("Light under a dark OS keeps the form controls light", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await storeTheme(page, "light");
    const auth = new AuthPage(page);

    await auth.goto();

    await expect(auth.emailInput).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  });
});

test.describe("With browser storage blocked", () => {
  for (const os of ["light", "dark"] as const) {
    test(`the login page loads and follows a ${os} OS`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: os });
      await blockStorage(page);
      const auth = new AuthPage(page);

      await auth.goto();

      await auth.expectFormVisible();
      await expectTheme(page, os);
    });
  }
});

test.describe("The auth pages logo", () => {
  for (const path of [
    "/login",
    "/signup",
    "/email_action/confirm_registration?token=t1&userid=u1",
  ]) {
    test(`is light on dark and dark on light on ${path}`, async ({ page }) => {
      await page.route("**/api/**", (route) =>
        route.fulfill({ json: { status_code: 200, status: "success" } }),
      );
      const logo = page
        .getByRole("banner")
        .getByRole("img", { name: "CodeClarity" })
        .filter({ visible: true });

      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(path);
      await expectTheme(page, "dark");
      await expect(logo).toHaveCount(1);
      expect(await imageLuminance(logo)).toBeGreaterThan(0.6);

      await page.emulateMedia({ colorScheme: "light" });
      await expectTheme(page, "light");
      await expect(logo).toHaveCount(1);
      expect(await imageLuminance(logo)).toBeLessThan(0.4);
    });
  }
});

test.describe("The Theme control in the user menu", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
  });

  for (const [os, picked] of [
    ["light", "Dark"],
    ["dark", "Light"],
  ] as const) {
    test(`${picked} under a ${os} OS applies at once and survives a reload and a new page`, async ({
      page,
      context,
    }) => {
      const theme = picked === "Dark" ? "dark" : "light";
      await page.emulateMedia({ colorScheme: os });
      await shell.goto();
      await expectTheme(page, os);

      const menu = await openUserMenu(page);
      await expect(themeOption(menu, "System")).toBeChecked();
      await themeOption(menu, picked).click();

      await expectTheme(page, theme);
      await expect(themeOption(menu, picked)).toBeChecked();
      await expect(menu).toHaveCSS("background-color", POPOVER[theme]);

      await page.reload();
      await expectTheme(page, theme);
      const other = await context.newPage();
      await other.emulateMedia({ colorScheme: os });
      await new ShellPage(other).signIn();
      await other.goto("/datasets");
      await expectTheme(other, theme);
      await expect(
        themeOption(await openUserMenu(other), picked),
      ).toBeChecked();
    });
  }

  test("choosing System again follows the OS, including a live switch", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await shell.goto();
    await themeOption(await openUserMenu(page), "Dark").click();
    await page.reload();
    await expectTheme(page, "dark");

    const menu = await openUserMenu(page);
    await expect(themeOption(menu, "Dark")).toBeChecked();
    await themeOption(menu, "System").click();
    await expectTheme(page, "light");

    await page.emulateMedia({ colorScheme: "dark" });
    await expectTheme(page, "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expectTheme(page, "light");

    await page.reload();
    await expectTheme(page, "light");
  });

  test("is keyboard operable with visible focus and announces the choice", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await shell.goto();
    const account = page.getByRole("button", { name: /account menu/ });
    await account.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("group", { name: "Theme" })).toBeVisible();

    const dark = themeOption(menu, "Dark");
    while (!(await dark.evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press("ArrowDown");
    }
    await expectVisibleFocus(dark);
    await expect(dark).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Enter");

    await expectTheme(page, "dark");
    await expect(dark).toHaveAttribute("aria-checked", "true");
    await expect(themeOption(menu, "System")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await page.keyboard.press("ArrowUp");
    await expectVisibleFocus(themeOption(menu, "Light"));
    await page.keyboard.press("Space");
    await expectTheme(page, "light");

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(account).toBeFocused();
  });
});

test.describe("The Theme commands in the palette", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
  });

  // Opens the palette, runs the named command and waits for the palette to close.
  async function runCommand(page: Page, name: string): Promise<void> {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(shell.palette).toBeVisible();
    await page.keyboard.type(name);
    await expect(
      shell.palette.getByRole("option", { name, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(shell.palette).toBeHidden();
  }

  test("each command changes the choice, and it survives a reload", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await shell.goto();
    await expect(page).toHaveURL(/\/datasets$/);

    await runCommand(page, "Theme: Dark");
    await expectTheme(page, "dark");
    await expect(page).toHaveURL(/\/datasets$/);
    await page.reload();
    await expectTheme(page, "dark");

    await page.emulateMedia({ colorScheme: "dark" });
    await runCommand(page, "Theme: Light");
    await expectTheme(page, "light");
    await page.reload();
    await expectTheme(page, "light");

    await runCommand(page, "Theme: System");
    await expectTheme(page, "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expectTheme(page, "light");
    await expect(themeOption(await openUserMenu(page), "System")).toBeChecked();
  });
});

test.describe("Open overlays", () => {
  let shell: ShellPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    shell = new ShellPage(page);
    await shell.signIn();
    await page.emulateMedia({ colorScheme: "light" });
    await shell.goto();
  });

  test("the command palette follows an OS switch at once", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");
    const panel = shell.palette.locator('[data-slot="command"]');
    await expect(panel).toHaveCSS("background-color", POPOVER.light);

    await page.emulateMedia({ colorScheme: "dark" });

    await expect(panel).toHaveCSS("background-color", POPOVER.dark);
  });

  test("a toast and the user menu follow a Theme choice at once", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /switch organisation/ }).click();
    await page.getByRole("menuitem", { name: "Research Lab" }).click();
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toContainText("Switched to Research Lab");
    await expect(toast).toHaveCSS("background-color", POPOVER.light);

    const menu = await openUserMenu(page);
    await themeOption(menu, "Dark").click();

    await expect(toast).toHaveCSS("background-color", POPOVER.dark);
    await expect(toast).toHaveCSS("color", "rgb(248, 249, 250)");
    await expect(menu).toHaveCSS("background-color", POPOVER.dark);
  });
});
