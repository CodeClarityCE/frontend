import { expect, type Locator, test } from "@playwright/test";

import {
  BACKGROUND,
  blockAppBundle,
  blockStorage,
  expectTheme,
  imageLuminance,
  storeTheme,
} from "./helpers/theme.mjs";
import { AuthPage } from "./pages/auth.page.mjs";
import { ShellPage } from "./pages/shell.page.mjs";
import { VulnerabilitiesPage } from "./pages/vulnerabilities.page.mjs";

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

test.describe("Severity in dark", () => {
  test("keeps its labels and its red-to-yellow order", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.emulateMedia({ colorScheme: "dark" });
    const vulns = new VulnerabilitiesPage(page);
    await vulns.signIn();
    await vulns.gotoResults();
    await expectTheme(page, "dark");

    const hues: number[] = [];
    for (const [i, label] of ["Critical", "High", "Medium", "Low"].entries()) {
      const badge = vulns.cards
        .nth(i)
        .getByText(new RegExp(`^${label}\\b`))
        .first();
      await expect(badge).toBeVisible();
      hues.push(await hue(badge));
    }
    // Red sits near 0 degrees and yellow near 50, so each step moves up.
    for (let i = 1; i < hues.length; i++) {
      expect(hues[i]!).toBeGreaterThan(hues[i - 1]!);
    }
    expect(hues[0]!).toBeLessThan(15);
    expect(hues[3]!).toBeGreaterThan(35);
    expect(hues[3]!).toBeLessThan(65);
  });
});

// The hue of an element's background in degrees.
async function hue(locator: Locator): Promise<number> {
  const rgb = await locator.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  const [r, g, b] = (rgb.match(/\d+/g) ?? [])
    .slice(0, 3)
    .map((v) => Number(v) / 255);
  // Hue angle from the RGB channels: 0 is red, 60 is yellow, reds past 0 go negative.
  return (
    (Math.atan2(Math.sqrt(3) * (g! - b!), 2 * r! - g! - b!) * 180) / Math.PI
  );
}
