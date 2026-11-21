import { expect, type Page, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

import {
  BACKGROUND,
  blockAppBundle,
  blockStorage,
  expectTheme,
  imageLuminance,
  storeTheme,
} from "./helpers/theme.mjs";
import { AuthPage } from "./pages/auth.page.mjs";
import { ExperimentDetailPage } from "./pages/experiment-detail.page.mjs";
import { ResultTabsPage } from "./pages/result-tabs.page.mjs";
import { ShellPage } from "./pages/shell.page.mjs";

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

// Puts the page in the theme, then returns the bytes of the file `save` downloads.
async function exportIn(
  page: Page,
  theme: "light" | "dark",
  save: () => Promise<void>,
): Promise<Buffer> {
  await page.emulateMedia({ colorScheme: theme });
  await expectTheme(page, theme);
  const download = page.waitForEvent("download");
  await save();
  return readFile(await (await download).path());
}

test.describe("Exports stay light", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
  });

  test("an SBOM HTML report made in dark matches one made in light", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto();
    const save = async (): Promise<void> => {
      await page.getByRole("button", { name: "Export SBOM" }).click();
      await page.getByRole("menuitem", { name: /HTML report/ }).click();
    };

    const light = await exportIn(page, "light", save);
    const dark = await exportIn(page, "dark", save);

    expect(light.toString("utf8")).toMatch(/--background: #fff(fff)?;/);
    expect(dark.toString("utf8")).toBe(light.toString("utf8"));
  });

  for (const format of ["PDF", "SVG"]) {
    test(`a Figure ${format} made in dark matches one made in light`, async ({
      page,
    }) => {
      const detail = new ExperimentDetailPage(page);
      await detail.signIn();
      await detail.goto();
      await detail.tab("Figures").click();
      const save = (): Promise<void> =>
        page
          .getByRole("region", { name: "Preview" })
          .getByRole("button", { name: `Download ${format}` })
          .click();

      const light = await exportIn(page, "light", save);
      const dark = await exportIn(page, "dark", save);

      expect(light.length).toBeGreaterThan(0);
      expect(dark.equals(light)).toBe(true);
    });
  }
});
