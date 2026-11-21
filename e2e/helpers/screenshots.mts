import { expect, type Page, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const DESKTOP = { width: 1280, height: 1024 };
const stylePath = fileURLToPath(new URL("./screenshot.css", import.meta.url));

/**
 * Compares a full-page capture with its committed baseline, named
 * `<name>-<width>.png`, with animations and transitions frozen.
 * - chromium: at 1280px wide.
 * - pixel-5: at the phone viewport (390px), one image pixel per CSS pixel.
 * - Other projects take no screenshots, so they have no baselines.
 */
export async function expectScreenshots(
  page: Page,
  name: string,
): Promise<void> {
  const project = test.info().project.name;
  if (project === "chromium") await page.setViewportSize(DESKTOP);
  else if (project !== "pixel-5") return;
  const width = page.viewportSize()?.width ?? DESKTOP.width;
  await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
    fullPage: true,
    animations: "disabled",
    scale: "css",
    stylePath,
  });
}
