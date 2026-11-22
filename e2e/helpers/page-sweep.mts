import type { Page } from "@playwright/test";

// The narrowest phone the app supports.
export const PHONE_WIDTH = 390;

// Controls a user can click, matched by element or by role attribute.
const INTERACTIVE = [
  "button",
  "a[href]",
  "summary",
  "select",
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="button"]',
  'input[type="submit"]',
  ...[
    "button",
    "tab",
    "link",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
    "checkbox",
    "switch",
    "radio",
  ].map((role) => `[role="${role}"]`),
].join(",");

// Fails on controls with the wrong cursor and on sideways scroll at the current viewport.
export async function expectPageSweep(page: Page): Promise<void> {
  const wrongCursors = await page.evaluate((selector) => {
    const describe = (el: Element, cursor: string): string => {
      const role = el.getAttribute("role") ?? el.tagName.toLowerCase();
      const name = (el.getAttribute("aria-label") ?? el.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60);
      return `${role} "${name}" has cursor ${cursor}`;
    };
    const clickable = (cursor: string): boolean =>
      cursor === "pointer" || cursor.endsWith("resize");
    const problems: string[] = [];
    for (const el of document.querySelectorAll(selector)) {
      if (!el.checkVisibility({ visibilityProperty: true })) continue;
      const style = getComputedStyle(el);
      const disabled =
        el.matches(":disabled") ||
        el.closest('[aria-disabled="true"]') !== null ||
        el.hasAttribute("data-disabled");
      if (disabled) {
        if (clickable(style.cursor)) {
          problems.push(`disabled ${describe(el, style.cursor)}`);
        }
      } else if (!clickable(style.cursor)) {
        problems.push(describe(el, style.cursor));
      }
    }
    return problems;
  }, INTERACTIVE);
  if (wrongCursors.length > 0) {
    throw new Error(
      `Controls with the wrong cursor:\n${wrongCursors.join("\n")}`,
    );
  }

  // The layout width, since a mobile browser widens innerWidth to fit content.
  const [width, viewport] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ]);
  if (width > viewport) {
    throw new Error(
      `The page scrolls sideways at ${viewport}px: its content is ${width}px wide`,
    );
  }
}
