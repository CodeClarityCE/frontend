import { devices, test } from "@playwright/test";

// Pixel 5 without its browser choice, which only a project can set.
const { defaultBrowserType: _browser, ...PIXEL_5 } = devices["Pixel 5"];

/**
 * Runs the tests of the enclosing describe block on a Pixel 5. The viewport is
 * set again after each spec's desktop `beforeEach`, which would otherwise win.
 */
export function onAPhone(): void {
  test.use(PIXEL_5);
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(PIXEL_5.viewport);
  });
}
