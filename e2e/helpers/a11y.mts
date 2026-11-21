import { expect, type Locator, type Page } from "@playwright/test";
import { createRequire } from "node:module";

import { THEME_KEY } from "./theme.mjs";

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

// WCAG 2.2 AA means every A and AA rule from 2.0 through 2.2.
export const WCAG_22_AA_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

// An axe rule a page is known to break today, and the ticket that fixes it.
// `theme: "dark"` limits the entry to the dark check.
export interface KnownViolation {
  rule: string;
  owner: string;
  theme?: "dark";
}

type Theme = "light" | "dark";

interface AxeNode {
  target: string[];
  failureSummary?: string;
}

interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: AxeNode[];
}

declare global {
  interface Window {
    axe: {
      run: (
        context: Document,
        options: unknown,
      ) => Promise<{ violations: AxeViolation[] }>;
    };
  }
}

function describe(violation: AxeViolation): string {
  const targets = violation.nodes
    .slice(0, 5)
    .map((node) => {
      // Keeps axe's reason, such as the measured colours, under each target.
      const why = node.failureSummary?.split("\n").slice(1, 2).join("").trim();
      return `    ${node.target.join(" ")}${why ? `\n      ${why}` : ""}`;
    })
    .join("\n");
  return `  ${violation.id} (${violation.impact ?? "n/a"}): ${violation.help}\n${targets}`;
}

// Waits for running finite animations, such as a dialog opening, so axe sees final colours and sizes.
// Gives up after 5 seconds, since WebKit can leave an animation unfinished.
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter(
            (a) =>
              a.playState === "running" &&
              a.effect?.getTiming().iterations !== Infinity,
          )
          .map((a) => a.finished.catch(() => undefined)),
      ),
      new Promise((done) => setTimeout(done, 5000)),
    ]),
  );
}

async function runAxe(page: Page): Promise<AxeViolation[]> {
  await waitForAnimations(page);
  if (!(await page.evaluate(() => "axe" in window))) {
    await page.addScriptTag({ path: axePath });
  }
  const { violations } = await page.evaluate(
    (tags) =>
      window.axe.run(document, { runOnly: { type: "tag", values: tags } }),
    WCAG_22_AA_TAGS,
  );
  return violations;
}

// Lists unexpected violations and known ones that no longer occur in one theme.
function problemsIn(
  theme: Theme,
  violations: AxeViolation[],
  known: KnownViolation[],
): string[] {
  const expected = known.filter(
    (entry) => !entry.theme || entry.theme === theme,
  );
  const knownRules = new Set(expected.map((entry) => entry.rule));
  const unexpected = violations.filter((v) => !knownRules.has(v.id));
  const found = new Set(violations.map((v) => v.id));
  const fixed = expected.filter((entry) => !found.has(entry.rule));

  const problems: string[] = [];
  if (unexpected.length > 0) {
    problems.push(
      `axe found WCAG 2.2 AA violations in ${theme}:\n${unexpected.map(describe).join("\n")}`,
    );
  }
  if (fixed.length > 0) {
    problems.push(
      `Known violations no longer occur in ${theme}, remove them from the list: ${fixed
        .map((entry) => `${entry.rule} (${entry.owner})`)
        .join(", ")}`,
    );
  }
  return problems;
}

const themeOf = async (page: Page): Promise<Theme> =>
  (await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  ))
    ? "dark"
    : "light";

const osIsDark = (page: Page): Promise<boolean> =>
  page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches);

// Waits two frames so a theme change has restyled the page before measuring.
const nextFrames = (page: Page): Promise<void> =>
  page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      ),
  );

// Stores a Theme choice and tells the app, as a change from another tab would.
// Returns the previous value, or `ok: false` when storage is unavailable.
const storeChoice = (
  page: Page,
  value: string | null,
): Promise<{ ok: boolean; old?: string | null }> =>
  page.evaluate(
    ([key, v]) => {
      try {
        const old = localStorage.getItem(key);
        if (v === null) localStorage.removeItem(key);
        else localStorage.setItem(key, v);
        window.dispatchEvent(
          new StorageEvent("storage", { key, oldValue: old, newValue: v }),
        );
        return { ok: true, old };
      } catch {
        return { ok: false };
      }
    },
    [THEME_KEY, value] as const,
  );

// Puts the page in `theme` through the OS scheme, then the app's stored choice,
// and on pages without the app through the root class alone. Returns an undo.
async function switchTo(
  page: Page,
  theme: Theme,
): Promise<() => Promise<void>> {
  const osWasDark = await osIsDark(page);
  await page.emulateMedia({ colorScheme: theme });
  await nextFrames(page);

  let stored: { ok: boolean; old?: string | null } = { ok: false };
  if ((await themeOf(page)) !== theme) {
    stored = await storeChoice(page, theme);
    await nextFrames(page);
    if (stored.ok && (await themeOf(page)) !== theme) {
      await storeChoice(page, stored.old ?? null);
      stored = { ok: false };
    }
  }
  const toggledClass = (await themeOf(page)) !== theme;
  if (toggledClass) {
    await page.evaluate(() =>
      document.documentElement.classList.toggle("dark"),
    );
  }
  await nextFrames(page);

  return async () => {
    if (toggledClass) {
      await page.evaluate(() =>
        document.documentElement.classList.toggle("dark"),
      );
    }
    if (stored.ok) await storeChoice(page, stored.old ?? null);
    await page.emulateMedia({ colorScheme: osWasDark ? "dark" : "light" });
    await nextFrames(page);
    await waitForAnimations(page);
  };
}

/** Runs axe (WCAG 2.2 AA) in the page's theme, then the other one, and fails on any violation.
 * `known` lists rules the page still breaks; it also fails when one of them is fixed. */
export async function expectNoAxeViolations(
  page: Page,
  options: { known?: KnownViolation[] } = {},
): Promise<void> {
  const known = options.known ?? [];
  const first = await themeOf(page);
  const second: Theme = first === "light" ? "dark" : "light";
  const problems = problemsIn(first, await runAxe(page), known);

  const restore = await switchTo(page, second);
  try {
    problems.push(...problemsIn(second, await runAxe(page), known));
  } finally {
    await restore();
  }

  if (problems.length > 0) {
    throw new Error(problems.join("\n\n"));
  }
}

/**
 * Asserts that the element has focus and that focus changes how it looks.
 * Compares the element's area focused and blurred, then focuses it again.
 */
export async function expectVisibleFocus(
  locator: Locator,
  options: { timeout?: number } = {},
): Promise<void> {
  await expect(locator).toBeFocused({ timeout: options.timeout });
  const page = locator.page();
  // Measure where the element ends up, not mid-animation.
  await waitForAnimations(page);
  // Not scrollIntoViewIfNeeded: in WebKit its wait for a stable box can hang.
  await locator.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error("Element has no box, so it has no visible focus indicator");
  }

  // Pad the area so outlines and rings drawn outside the box are included.
  const pad = 8;
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
  const shot = () =>
    page.screenshot({ clip, animations: "disabled", caret: "hide" });

  const focused = await shot();
  await locator.blur();
  const blurred = await shot();
  await locator.focus();

  if (focused.equals(blurred)) {
    throw new Error(
      "Focused element shows no visible focus indicator: it looks the same focused and blurred",
    );
  }
}
