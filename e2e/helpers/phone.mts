import { devices, test } from "@playwright/test";

import { PHONE_WIDTH } from "./page-sweep.mjs";

/** The phone viewport: Pixel 5 emulation at the 390px screenshot width. */
const PHONE_VIEWPORT = { width: PHONE_WIDTH, height: 844 };

// Pixel 5 without its browser choice, which only a project can set.
const { defaultBrowserType: _browser, ...PIXEL_5 } = devices["Pixel 5"];

// A describe block of phone tests, run only in the pixel-5 project at the phone viewport.
export function describeOnAPhone(title: string, body: () => void): void {
  test.describe(title, { tag: "@phone" }, () => {
    test.use({ ...PIXEL_5, viewport: PHONE_VIEWPORT });
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(PHONE_VIEWPORT);
    });
    body();
  });
}
