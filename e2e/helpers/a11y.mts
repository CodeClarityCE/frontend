import { createRequire } from "node:module";

import { expect, type Locator, type Page } from "@playwright/test";

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
export interface KnownViolation {
  rule: string;
  owner: string;
}

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
    .map((node) => `    ${node.target.join(" ")}`)
    .join("\n");
  return `  ${violation.id} (${violation.impact ?? "n/a"}): ${violation.help}\n${targets}`;
}

/**
 * Runs axe-core with the WCAG 2.2 AA tags and fails on any violation.
 * `known` lists rules the page still breaks; it fails if one of them is fixed,
 * so the entry gets removed.
 */
export async function expectNoAxeViolations(
  page: Page,
  options: { known?: KnownViolation[] } = {},
): Promise<void> {
  const known = options.known ?? [];
  await page.addScriptTag({ path: axePath });
  const { violations } = await page.evaluate(
    (tags) =>
      window.axe.run(document, { runOnly: { type: "tag", values: tags } }),
    WCAG_22_AA_TAGS,
  );

  const knownRules = new Set(known.map((entry) => entry.rule));
  const unexpected = violations.filter((v) => !knownRules.has(v.id));
  const found = new Set(violations.map((v) => v.id));
  const fixed = known.filter((entry) => !found.has(entry.rule));

  const problems: string[] = [];
  if (unexpected.length > 0) {
    problems.push(
      `axe found WCAG 2.2 AA violations:\n${unexpected.map(describe).join("\n")}`,
    );
  }
  if (fixed.length > 0) {
    problems.push(
      `Known violations no longer occur, remove them from the list: ${fixed
        .map((entry) => `${entry.rule} (${entry.owner})`)
        .join(", ")}`,
    );
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
