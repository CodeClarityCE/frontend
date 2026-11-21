import { expect, type Page, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Desktop width; phone captures pass 390 instead.
export const SCREENSHOT_WIDTHS = [1280];
const HEIGHT = 1024;
const stylePath = fileURLToPath(new URL("./screenshot.css", import.meta.url));

/**
 * Compares full-page captures at each width with the committed baselines,
 * named `<name>-<width>.png`, with animations and transitions frozen.
 * Only the chromium desktop project compares, so baselines exist for it alone.
 */
export async function expectScreenshots(
  page: Page,
  name: string,
  widths: number[] = SCREENSHOT_WIDTHS,
): Promise<void> {
  if (test.info().project.name !== "chromium") return;
  for (const width of widths) {
    await page.setViewportSize({ width, height: HEIGHT });
    await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
      fullPage: true,
      animations: "disabled",
      stylePath,
    });
  }
}
