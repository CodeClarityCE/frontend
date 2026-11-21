import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { BACKGROUND, expectTheme, storeTheme } from "./helpers/theme.mjs";
import { ShellPage } from "./pages/shell.page.mjs";

// Proves the shared helpers fail on bad pages, using inline HTML only.
test.describe("E2E harness", () => {
  test("axe check fails on a page with a WCAG violation", async ({ page }) => {
    await page.setContent(
      `<html lang="en"><head><title>t</title></head><body><main><img src="x.png"></main></body></html>`,
    );
    await expect(expectNoAxeViolations(page)).rejects.toThrow(/image-alt/);
  });

  test("axe check passes on a clean page", async ({ page }) => {
    await page.setContent(
      `<html lang="en"><head><title>t</title></head><body><main><h1>Hello</h1></main></body></html>`,
    );
    await expectNoAxeViolations(page);
  });

  test("axe check tolerates a listed known violation", async ({ page }) => {
    await page.setContent(
      `<html lang="en"><head><title>t</title></head><body><main><img src="x.png"></main></body></html>`,
    );
    await expectNoAxeViolations(page, {
      known: [{ rule: "image-alt", owner: "#0" }],
    });
  });

  test("axe check fails when a known violation is gone", async ({ page }) => {
    await page.setContent(
      `<html lang="en"><head><title>t</title></head><body><main><h1>Hello</h1></main></body></html>`,
    );
    await expect(
      expectNoAxeViolations(page, {
        known: [{ rule: "image-alt", owner: "#0" }],
      }),
    ).rejects.toThrow(/image-alt/);
  });

  // Grey text that only fails contrast while the root has the dark class.
  const darkOnlyFailure = `<html lang="en"><head><title>t</title><style>.dark p{color:#777;background:#111}</style></head><body><main><p>Hello</p></main></body></html>`;

  test("axe check also checks the page in dark", async ({ page }) => {
    await page.setContent(darkOnlyFailure);
    await expect(expectNoAxeViolations(page)).rejects.toThrow(
      /in dark[\s\S]*color-contrast/,
    );
  });

  test("axe check puts the page back in its own theme", async ({ page }) => {
    await page.setContent(
      `<html lang="en"><head><title>t</title></head><body><main><h1>Hello</h1></main></body></html>`,
    );
    await expectNoAxeViolations(page);
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-color-scheme: dark)").matches,
      ),
    ).toBe(false);
  });

  test("axe check also checks a dark page in light, then puts it back", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setContent(
      `<html lang="en" class="dark"><head><title>t</title><style>html:not(.dark) p{color:#bbb;background:#fff}</style></head><body><main><p>Hello</p></main></body></html>`,
    );
    await expect(expectNoAxeViolations(page)).rejects.toThrow(
      /in light[\s\S]*color-contrast/,
    );
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-color-scheme: dark)").matches,
      ),
    ).toBe(true);
  });

  test("axe check tolerates a dark-only known violation", async ({ page }) => {
    await page.setContent(darkOnlyFailure);
    await expectNoAxeViolations(page, {
      known: [{ rule: "color-contrast", owner: "#0", theme: "dark" }],
    });
  });

  test("a dark-only known violation does not excuse light", async ({
    page,
  }) => {
    await page.setContent(
      `<html lang="en"><head><title>t</title><style>html:not(.dark) p{color:#bbb;background:#fff}</style></head><body><main><p>Hello</p></main></body></html>`,
    );
    await expect(
      expectNoAxeViolations(page, {
        known: [{ rule: "color-contrast", owner: "#0", theme: "dark" }],
      }),
    ).rejects.toThrow(/in light[\s\S]*color-contrast/);
  });

  test("axe check fails when a dark-only known violation is gone", async ({
    page,
  }) => {
    await page.setContent(
      `<html lang="en"><head><title>t</title></head><body><main><h1>Hello</h1></main></body></html>`,
    );
    await expect(
      expectNoAxeViolations(page, {
        known: [{ rule: "color-contrast", owner: "#0", theme: "dark" }],
      }),
    ).rejects.toThrow(/no longer occur in dark[\s\S]*color-contrast/);
  });

  test("focus check passes when focus is visible", async ({ page }) => {
    await page.setContent(
      `<style>button:focus-visible{outline:3px solid blue}</style><button>Go</button>`,
    );
    await page.keyboard.press("Tab");
    await expectVisibleFocus(page.getByRole("button", { name: "Go" }));
  });

  test("focus check keeps focus so tabbing continues", async ({ page }) => {
    await page.setContent(`<button>One</button><button>Two</button>`);
    await page.keyboard.press("Tab");
    const one = page.getByRole("button", { name: "One" });
    await expectVisibleFocus(one);
    await expect(one).toBeFocused();
    await page.keyboard.press("Tab");
    await expectVisibleFocus(page.getByRole("button", { name: "Two" }));
  });

  test("focus check fails when focus is invisible", async ({ page }) => {
    await page.setContent(
      `<style>button{outline:none !important}</style><button>Go</button>`,
    );
    await page.keyboard.press("Tab");
    await expect(
      expectVisibleFocus(page.getByRole("button", { name: "Go" })),
    ).rejects.toThrow(/focus indicator/);
  });

  test("focus check fails when the element is not focused", async ({
    page,
  }) => {
    await page.setContent(`<button>Go</button>`);
    await expect(
      expectVisibleFocus(page.getByRole("button", { name: "Go" }), {
        timeout: 500,
      }),
    ).rejects.toThrow();
  });
});

test.describe("E2E harness in the app", () => {
  for (const [stored, os] of [
    ["light", "dark"],
    ["dark", "light"],
  ] as const) {
    test(`axe check switches a stored ${stored} choice through the app and restores it`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 1024 });
      await page.emulateMedia({ colorScheme: os });
      await storeTheme(page, stored);
      const shell = new ShellPage(page);
      await shell.signIn();
      await shell.goto();
      await expectTheme(page, stored);
      // Records the root class and theme colour after every change.
      await page.evaluate(() => {
        const w = window as { seen?: [boolean, string][] };
        w.seen = [];
        const probe = document.createElement("i");
        document.head.append(probe);
        const meta = document.querySelector('meta[name="theme-color"]')!;
        const record = (): void => {
          probe.style.color = meta.getAttribute("content") ?? "";
          w.seen!.push([
            document.documentElement.classList.contains("dark"),
            getComputedStyle(probe).color,
          ]);
        };
        new MutationObserver(record).observe(document.documentElement, {
          attributes: true,
          subtree: true,
          attributeFilter: ["class", "content"],
        });
      });

      await expectNoAxeViolations(page);

      const seen = await page.evaluate(
        () => (window as { seen?: [boolean, string][] }).seen!,
      );
      expect(seen.some(([dark]) => dark === (stored === "light"))).toBe(true);
      for (const [dark, color] of seen) {
        expect(color).toBe(BACKGROUND[dark ? "dark" : "light"]);
      }
      await expectTheme(page, stored);
      expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
        stored,
      );
    });
  }
});
