import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";

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
