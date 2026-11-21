import { expect, type Locator, type Page } from "@playwright/test";

// The browser storage key that holds the Theme choice.
export const THEME_KEY = "theme";

// Background colours of the applied themes, from the token block in main.css.
export const BACKGROUND = {
  light: "rgb(255, 255, 255)",
  dark: "rgb(17, 17, 17)",
} as const;

// Popover backgrounds (menus, toasts and the command palette) of the applied themes.
export const POPOVER = {
  light: "rgb(255, 255, 255)",
  dark: "rgb(18, 19, 21)",
} as const;

/** Stores a Theme choice before any page script runs. */
export async function storeTheme(page: Page, value: string): Promise<void> {
  await page.addInitScript(
    ([key, v]) => localStorage.setItem(key!, v!),
    [THEME_KEY, value],
  );
}

/** Makes every access to browser storage throw, as a blocked-storage browser does. */
export async function blockStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    for (const name of ["localStorage", "sessionStorage"]) {
      Object.defineProperty(window, name, {
        configurable: true,
        get() {
          throw new DOMException("Storage is blocked", "SecurityError");
        },
      });
    }
  });
}

/** Stops the app bundle from loading, so only what the HTML does is seen. */
export async function blockAppBundle(page: Page): Promise<void> {
  await page.route(/\.(js|ts)(\?.*)?$/, (route) => route.abort());
}

/** Asserts the applied theme: the root class and the browser theme colour. */
export async function expectTheme(
  page: Page,
  theme: "light" | "dark",
): Promise<void> {
  const root = page.locator("html");
  if (theme === "dark") {
    await expect(root).toHaveClass(/(^|\s)dark(\s|$)/);
  } else {
    await expect(root).not.toHaveClass(/(^|\s)dark(\s|$)/);
  }
  const meta = page.locator('meta[name="theme-color"]');
  await expect(meta).toHaveCount(1);
  // Compares the colour, whatever notation the meta tag uses.
  await expect
    .poll(() =>
      meta.evaluate((el) => {
        const probe = document.createElement("i");
        probe.style.color = el.getAttribute("content") ?? "";
        document.head.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }),
    )
    .toBe(BACKGROUND[theme]);
}

/** Mean luminance (0 to 1) of the opaque pixels of an image on the page. */
export async function imageLuminance(image: Locator): Promise<number> {
  return image.evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 64;
    canvas.height = img.naturalHeight || 64;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! < 128) continue;
      sum +=
        (0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!) /
        255;
      count++;
    }
    return count ? sum / count : 0;
  });
}
