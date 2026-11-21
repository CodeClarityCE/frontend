import { expect, type Locator, type Page } from "@playwright/test";
import { createRequire } from "node:module";

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

// Waits for finite animations, such as a dialog opening, so axe sees final colours and sizes.
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
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

const isDark = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.documentElement.classList.contains("dark"));

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

// Turns the OS scheme dark, and sets the dark class itself on pages that do not follow the OS.
async function switchToDark(page: Page): Promise<() => Promise<void>> {
  const osWasDark = await osIsDark(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await nextFrames(page);
  const addedClass = !(await isDark(page));
  if (addedClass) {
    await page.evaluate(() => document.documentElement.classList.add("dark"));
  }
  await nextFrames(page);
  return async () => {
    if (addedClass) {
      await page.evaluate(() =>
        document.documentElement.classList.remove("dark"),
      );
    }
    await page.emulateMedia({ colorScheme: osWasDark ? "dark" : "light" });
    await nextFrames(page);
    await waitForAnimations(page);
  };
}

/**
 * Runs axe-core with the WCAG 2.2 AA tags in the current theme, then in dark,
 * and fails on any violation. `known` lists rules the page still breaks; it
 * fails if one of them is fixed, so the entry gets removed.
 */
export async function expectNoAxeViolations(
  page: Page,
  options: { known?: KnownViolation[] } = {},
): Promise<void> {
  const known = options.known ?? [];
  const startTheme: Theme = (await isDark(page)) ? "dark" : "light";
  const problems = problemsIn(startTheme, await runAxe(page), known);

  if (startTheme === "light") {
    const restore = await switchToDark(page);
    try {
      problems.push(...problemsIn("dark", await runAxe(page), known));
    } finally {
      await restore();
    }
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
  await locator.scrollIntoViewIfNeeded();
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
