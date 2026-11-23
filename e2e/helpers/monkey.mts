import type { Page, Request, Response } from "@playwright/test";

// A seeded random-interaction run ("monkey"): clicks, types and presses keys on a page at
// random. The same seed on the same page takes the same actions, so a run can be replayed.

interface MonkeyOptions {
  /** Picks every action; replaying it repeats the run. */
  seed: number;
  /** How many actions to take. */
  steps: number;
  /** Opens the page under test; called first and whenever an action leaves it. */
  open: (page: Page) => Promise<void>;
  /** The URLs that count as the page under test; leaving them reopens it. */
  stayOn?: RegExp;
}

export interface MonkeyRun {
  seed: number;
  /** One line per action taken, in order. */
  actions: string[];
  /** Uncaught errors, error reports and 5xx responses seen during the run. */
  problems: string[];
}

// mulberry32: a small seeded generator, enough to pick actions.
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Elements a user can click or type into.
const TARGETS = [
  "a[href]",
  "button",
  "input",
  "textarea",
  "select",
  "summary",
  '[role="button"]',
  '[role="tab"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="option"]',
  '[role="combobox"]',
].join(",");

// Text a user could type, from plain to hostile.
const TEXT = [
  "",
  "a",
  "hello world",
  "-1",
  "0",
  "99999999999999999999",
  "3.14",
  "<script>alert(1)</script>",
  "' OR 1=1 --",
  "../../etc/passwd",
  "%00%ff",
  "😀🚀 ñ é",
  "\u202eright to left",
  "x".repeat(300),
  "someone@example.com",
];

// Controls never clicked, so a run keeps its session, its organisation and the data later
// runs rely on.
const UNSAFE =
  /\b(delete|remove|sign ?out|log ?out|leave|revoke|deactivate|destroy|erase|wipe|switch organi[sz]ation)\b/;

const KEYS = ["Enter", "Escape", "Tab", "Shift+Tab", "ArrowDown", "Space"];

const ACTION_TIMEOUT = 1_000;
// Time for the page to react to an action before the next one.
const PAUSE = 250;
const MARK = "data-monkey-target";

interface Picked {
  description: string;
  typeable: boolean;
}

// Marks the element at fraction `at` of the visible, enabled, safe targets and describes it.
async function pick(page: Page, at: number): Promise<Picked | undefined> {
  return page.evaluate(
    ({ selector, at, mark, unsafe }) => {
      const unsafeName = new RegExp(unsafe, "i");
      // The first non-blank of the names a user or screen reader would see.
      const nameOf = (el: HTMLElement): string =>
        [
          el.getAttribute("aria-label"),
          el.textContent,
          (el as HTMLInputElement).labels?.[0]?.textContent,
          el.getAttribute("title"),
          el.getAttribute("name"),
        ]
          .map((name) => (name ?? "").replace(/\s+/g, " ").trim())
          .find((name) => name !== "") ?? "";
      document
        .querySelectorAll(`[${mark}]`)
        .forEach((el) => el.removeAttribute(mark));
      const candidates = [...document.querySelectorAll(selector)].filter(
        (el): el is HTMLElement => {
          if (!(el instanceof HTMLElement)) return false;
          if (el.matches(":disabled, [aria-disabled='true']")) return false;
          if (el instanceof HTMLInputElement && el.type === "file")
            return false;
          if (el instanceof HTMLAnchorElement) {
            if (el.target === "_blank") return false;
            if (el.origin !== window.location.origin) return false;
          }
          if (unsafeName.test(nameOf(el))) return false;
          const box = el.getBoundingClientRect();
          return box.width > 0 && box.height > 0;
        },
      );
      const el = candidates[Math.floor(at * candidates.length)];
      if (!el) return undefined;
      el.setAttribute(mark, "");
      const role = el.getAttribute("role") ?? el.tagName.toLowerCase();
      const typeable =
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLInputElement &&
          !["checkbox", "radio", "button", "submit", "reset"].includes(
            el.type,
          )) ||
        el.isContentEditable;
      return {
        description: `${role} "${nameOf(el).slice(0, 60)}"`,
        typeable,
      };
    },
    { selector: TARGETS, at, mark: MARK, unsafe: UNSAFE.source },
  );
}

// Takes one random action and returns what it did; an element that moved or vanished
// in the meantime marks the action skipped, as part of the run.
async function act(page: Page, next: () => number): Promise<string> {
  const kind = next();
  if (kind < 0.1) {
    const key = KEYS[Math.floor(next() * KEYS.length)] ?? "Escape";
    await page.keyboard.press(key);
    return `press ${key}`;
  }
  if (kind < 0.15) {
    const y = Math.floor(next() * 2000) - 500;
    await page.mouse.wheel(0, y);
    return `scroll ${y}`;
  }
  const target = await pick(page, next());
  const text = TEXT[Math.floor(next() * TEXT.length)] ?? "";
  if (!target) return "no target";
  const element = page.locator(`[${MARK}]`).first();
  const fill = target.typeable && kind < 0.5;
  const done = fill
    ? `fill ${target.description} with ${JSON.stringify(text)}`
    : `click ${target.description}`;
  try {
    if (fill) await element.fill(text, { timeout: ACTION_TIMEOUT });
    else await element.click({ timeout: ACTION_TIMEOUT });
  } catch {
    return `${done} (skipped)`;
  }
  return done;
}

/** Runs the monkey on the page `open` opens and returns what it did and saw. */
export async function runMonkey(
  page: Page,
  options: MonkeyOptions,
): Promise<MonkeyRun> {
  const next = random(options.seed);
  const actions: string[] = [];
  const problems: string[] = [];
  // Problems name the action under way; step 0 is opening the page.
  let step = 0;
  const problem = (text: string): void => {
    problems.push(`step ${step}: ${text}`);
  };
  const onError = (error: Error): void => {
    problem(`uncaught error: ${error.message}`);
  };
  // The frontend logger posts error reports to the API's POST /logs.
  const onRequest = (request: Request): void => {
    if (request.method() !== "POST") return;
    if (!new URL(request.url()).pathname.endsWith("/logs")) return;
    let report: { level?: string; msg?: string } = {};
    try {
      report = request.postDataJSON() as typeof report;
    } catch {
      // A report without a JSON body is still a report.
    }
    problem(`error report: ${report.level ?? "?"} ${report.msg ?? ""}`);
  };
  const onResponse = (response: Response): void => {
    if (response.status() < 500) return;
    const path = new URL(response.url()).pathname;
    problem(`${response.status()} ${response.request().method()} ${path}`);
  };
  page.on("pageerror", onError);
  page.on("request", onRequest);
  page.on("response", onResponse);
  try {
    await options.open(page);
    for (step = 1; step <= options.steps; step++) {
      actions.push(await act(page, next));
      await page.waitForTimeout(PAUSE);
      if (options.stayOn && !options.stayOn.test(page.url())) {
        const left = new URL(page.url());
        await options.open(page);
        actions.push(`left for ${left.pathname}${left.search}, reopened`);
      }
    }
  } finally {
    page.off("pageerror", onError);
    page.off("request", onRequest);
    page.off("response", onResponse);
  }
  return { seed: options.seed, actions, problems };
}
