import { fileURLToPath } from "node:url";

import { expect, type Page } from "@playwright/test";

// Desktop widths from the spec: designed for 1280 to 1920.
export const SCREENSHOT_WIDTHS = [1280, 1920];
const HEIGHT = 1024;
const stylePath = fileURLToPath(new URL("./screenshot.css", import.meta.url));

/**
 * Compares full-page captures at each width with the committed baselines,
 * named `<name>-<width>.png`, with animations and transitions frozen.
 */
export async function expectScreenshots(
  page: Page,
  name: string,
  widths: number[] = SCREENSHOT_WIDTHS,
): Promise<void> {
  for (const width of widths) {
    await page.setViewportSize({ width, height: HEIGHT });
    await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
      fullPage: true,
      animations: "disabled",
      stylePath,
    });
  }
}
