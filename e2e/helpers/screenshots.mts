import { expect, type Page, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const DESKTOP = { width: 1280, height: 1024 };
const stylePath = fileURLToPath(new URL("./screenshot.css", import.meta.url));

// Compares a full-page capture with `<name>-1280.png` in chromium or `<name>-390.png` in pixel-5.
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
