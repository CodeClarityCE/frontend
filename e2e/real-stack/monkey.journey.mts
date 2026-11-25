import { expect, type Page, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

import { type MonkeyRun, runMonkey } from "../helpers/monkey.mjs";

import { LOADED, logIn } from "./stack.mjs";

// Seeded random-interaction runs ("monkey runs") on the golden-journey pages, nightly against
// a real stack after the journeys gave it data. A run fails on an uncaught error, an error
// report or a 5xx. MONKEY_SEED replays a run; MONKEY_STEPS sets its length.

const SEED = process.env.MONKEY_SEED
  ? Number(process.env.MONKEY_SEED)
  : Math.floor(Math.random() * 2 ** 31);
const STEPS = Number(process.env.MONKEY_STEPS ?? 60);

interface MonkeyPage {
  /** Names the page in the test title, for --grep. */
  name: string;
  signedIn: boolean;
  /** URLs that count as this page. */
  stayOn: RegExp;
  /** Opens the page from a signed-in (or signed-out) start. */
  open: (page: Page) => Promise<void>;
}

// Opens the first link whose href matches `href` on the page at `from`.
async function follow(page: Page, from: string, href: RegExp): Promise<void> {
  await page.goto(from);
  let url: string | undefined;
  await expect
    .poll(async () => {
      url = await page
        .locator("a[href]")
        .evaluateAll(
          (links, source) =>
            links
              .map((a) => (a as HTMLAnchorElement).href)
              .find((u) => new RegExp(source).test(u)),
          href.source,
        );
      return url;
    }, LOADED)
    .toBeTruthy();
  await page.goto(url ?? from);
}

// The id of the dev account's first organisation, as the organisations list links it.
async function orgId(page: Page): Promise<string> {
  await follow(page, "/orgs/list", /\/orgs\/manage\/[^/]+\/[0-9a-f-]{36}/);
  const id = /[0-9a-f-]{36}/.exec(page.url())?.[0];
  if (!id) throw new Error(`no organisation id in ${page.url()}`);
  return id;
}

// Opens the latest results of a golden-journey project, which has an advisory, or of any project.
async function journeyResults(page: Page): Promise<void> {
  await page.goto("/projects");
  const results = page.getByRole("link", { name: /^Results of / });
  await expect(results.first()).toBeVisible(LOADED);
  const journey = page.getByRole("link", { name: /^Results of journey-/ });
  await ((await journey.count()) ? journey : results).first().click();
  await expect(page).toHaveURL(/\/results\?/, LOADED);
}

// Opens `path` once the app has loaded it.
const visit =
  (path: string) =>
  async (page: Page): Promise<void> => {
    await page.goto(path);
    await expect(page.locator("#app")).not.toBeEmpty(LOADED);
  };

const orgPage =
  (tab: string) =>
  async (page: Page): Promise<void> => {
    await page.goto(`/orgs/manage/${tab}/${await orgId(page)}`);
  };

/** The pages of golden journeys 1 to 6 (see the journey files), signed-in ones first. */
const MONKEY_PAGES: MonkeyPage[] = [
  {
    name: "dashboard",
    signedIn: true,
    stayOn: /\/(\?.*)?$/,
    open: visit("/"),
  },
  {
    name: "projects",
    signedIn: true,
    stayOn: /\/projects(\?.*)?$/,
    open: visit("/projects"),
  },
  {
    name: "add project",
    signedIn: true,
    stayOn: /\/projects\/add/,
    open: visit("/projects/add"),
  },
  {
    name: "new analysis",
    signedIn: true,
    stayOn: /\/analyses\/add/,
    open: (page) => follow(page, "/projects", /\/analyses\/add\?/),
  },
  {
    name: "results",
    signedIn: true,
    stayOn: /\/results(\?.*)?$/,
    open: journeyResults,
  },
  {
    name: "vulnerability details",
    signedIn: true,
    stayOn: /\/results\/vulnerabilities_details/,
    open: async (page) => {
      await journeyResults(page);
      await page.getByRole("tab", { name: "Vulnerabilities" }).click(LOADED);
      await page
        .getByRole("list", { name: "Vulnerabilities" })
        .getByRole("article")
        .getByRole("link")
        .first()
        .click(LOADED);
      await expect(page).toHaveURL(/vulnerabilities_details/, LOADED);
    },
  },
  {
    name: "organisation vulnerability",
    signedIn: true,
    stayOn: /\/org\/[^/]+\/vulnerabilities\//,
    open: (page) => follow(page, "/", /\/org\/[^/]+\/vulnerabilities\//),
  },
  {
    name: "tickets",
    signedIn: true,
    stayOn: /\/tickets(\?.*)?$/,
    open: visit("/tickets"),
  },
  {
    name: "ticket",
    signedIn: true,
    stayOn: /\/tickets\/(?!integrations)[^/?#]+/,
    open: (page) =>
      follow(page, "/tickets", /\/tickets\/(?!integrations)[^/?#]+$/),
  },
  {
    name: "add organisation",
    signedIn: true,
    stayOn: /\/orgs\/add\/?$/,
    open: visit("/orgs/add"),
  },
  {
    name: "organisation settings",
    signedIn: true,
    stayOn: /\/orgs\/manage\/main\//,
    open: orgPage("main"),
  },
  {
    name: "organisation invites",
    signedIn: true,
    stayOn: /\/orgs\/manage\/invites\//,
    open: orgPage("invites"),
  },
  {
    name: "organisation members",
    signedIn: true,
    stayOn: /\/orgs\/manage\/members\//,
    open: orgPage("members"),
  },
  {
    name: "join organisation",
    signedIn: true,
    stayOn: /\/email_action\/join_org/,
    open: visit("/email_action/join_org?token=monkey&org_id=monkey"),
  },
  {
    name: "sign up",
    signedIn: false,
    stayOn: /\/signup/,
    open: visit("/signup"),
  },
  {
    name: "log in",
    signedIn: false,
    stayOn: /\/login/,
    open: visit("/login"),
  },
  {
    name: "confirm registration",
    signedIn: false,
    stayOn: /\/email_action\/confirm_registration/,
    open: visit(
      "/email_action/confirm_registration?token=monkey&userid=monkey",
    ),
  },
];

/** Runs that once failed, replayed on every run so the fix stays fixed. */
const MONKEY_REGRESSIONS: {
  page: string;
  seed: number;
  steps: number;
  /** What the run found. */
  found: string;
}[] = [
  {
    page: "organisation settings",
    seed: 2001639778,
    steps: 60,
    found:
      "Signed out when reopening the page cut off the default organisation request",
  },
  {
    page: "organisation invites",
    seed: 2001639778,
    steps: 60,
    found:
      "Signed out when reopening the page cut off the default organisation request",
  },
  {
    page: "organisation members",
    seed: 2001639778,
    steps: 60,
    found:
      "Signed out when reopening the page cut off the default organisation request",
  },
];

// The replay command and the run, for the failure message and the ci-failure issue.
function describeRun(name: string, run: MonkeyRun, steps: number): string {
  return [
    `### monkey ${name}, seed ${run.seed}`,
    "",
    "Replay:",
    "",
    "```sh",
    `MONKEY_SEED=${run.seed} MONKEY_STEPS=${steps} bash scripts/monkey/monkey.sh run https://localhost DIR --grep "monkey ${name} seed"`,
    "```",
    "",
    "Problems:",
    "",
    "```",
    ...run.problems,
    "```",
    "",
    "Actions:",
    "",
    "```",
    ...run.actions.map((action, i) => `${i + 1}. ${action}`),
    "```",
    "",
  ].join("\n");
}

async function monkeyTest(
  target: MonkeyPage,
  seed: number,
  steps: number,
  page: Page,
): Promise<void> {
  // Recorded first, so even a run that times out can be replayed.
  test.info().annotations.push({ type: "seed", description: String(seed) });
  if (target.signedIn) await logIn(page);
  const run = await runMonkey(page, {
    seed,
    steps,
    open: target.open,
    stayOn: target.stayOn,
  });
  if (run.problems.length === 0) return;
  const report = describeRun(target.name, run, steps);
  await writeFile(test.info().outputPath("monkey.md"), report);
  throw new Error(report);
}

const byName = new Map(MONKEY_PAGES.map((p) => [p.name, p]));

test.describe("monkey", { tag: "@monkey" }, () => {
  for (const target of MONKEY_PAGES) {
    test(`${target.name} seed`, async ({ page }) => {
      await monkeyTest(target, SEED, STEPS, page);
    });
  }

  for (const regression of MONKEY_REGRESSIONS) {
    test(`regression ${regression.page} seed ${regression.seed}`, async ({
      page,
    }) => {
      const target = byName.get(regression.page);
      if (!target) throw new Error(`no monkey page "${regression.page}"`);
      await monkeyTest(target, regression.seed, regression.steps, page);
    });
  }
});
