import { expect, type Page, test } from "@playwright/test";

import { runMonkey } from "./helpers/monkey.mjs";

// Proves the monkey of the nightly real-stack runs on inline pages served from a fake origin.

const ORIGIN = "https://monkey.test";

// Serves `html` at the fake origin's root and answers its API with `api`.
async function serve(
  page: Page,
  html: string,
  api: (path: string) => { status: number; body?: string } = () => ({
    status: 200,
    body: "{}",
  }),
): Promise<() => Promise<void>> {
  await page.route(`${ORIGIN}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/api/")) {
      const { status, body } = api(path);
      await route.fulfill({ status, body: body ?? "", contentType: "json" });
      return;
    }
    await route.fulfill({ body: html, contentType: "text/html" });
  });
  return async () => {
    await page.goto(`${ORIGIN}/`);
  };
}

const BUSY_PAGE = `<!doctype html><html lang="en"><body><main>
  <h1>Busy</h1>
  <button>One</button><button>Two</button><button>Three</button>
  <a href="/other">Other page</a>
  <label>Name <input name="name"></label>
  <label>Notes <textarea name="notes"></textarea></label>
  <select aria-label="Pick"><option>a</option><option>b</option></select>
  <div role="tab" tabindex="0">Tab</div>
</main></body></html>`;

test.describe("Monkey", () => {
  test("replaying a seed repeats the same actions", async ({ page }) => {
    const open = await serve(page, BUSY_PAGE);
    const first = await runMonkey(page, { seed: 42, steps: 25, open });
    const replay = await runMonkey(page, { seed: 42, steps: 25, open });
    const other = await runMonkey(page, { seed: 7, steps: 25, open });

    expect(first.actions).toHaveLength(25);
    expect(replay.actions).toEqual(first.actions);
    expect(other.actions).not.toEqual(first.actions);
    expect(first.problems).toEqual([]);
  });

  test("an uncaught error is a problem", async ({ page }) => {
    const open = await serve(
      page,
      `<!doctype html><html lang="en"><body><main>
        <button onclick="null.boom()">Crash</button>
      </main></body></html>`,
    );
    const run = await runMonkey(page, { seed: 1, steps: 10, open });
    expect(run.problems).toContainEqual(
      expect.stringMatching(/^step \d+: uncaught error: .*null/),
    );
  });

  test("an error report is a problem", async ({ page }) => {
    const open = await serve(
      page,
      `<!doctype html><html lang="en"><body><main>
        <button onclick="fetch('/api/logs', { method: 'POST', body: JSON.stringify({ level: 'error', msg: 'it broke', fields: {} }) })">Report</button>
      </main></body></html>`,
    );
    const run = await runMonkey(page, { seed: 1, steps: 10, open });
    expect(run.problems).toContainEqual(
      expect.stringMatching(/^step \d+: error report: error it broke$/),
    );
  });

  test("a 5xx response is a problem, a 4xx is not", async ({ page }) => {
    const open = await serve(
      page,
      `<!doctype html><html lang="en"><body><main>
        <button onclick="fetch('/api/missing')">Missing</button>
        <button onclick="fetch('/api/broken')">Broken</button>
      </main></body></html>`,
      (path) => ({ status: path === "/api/broken" ? 500 : 404 }),
    );
    const run = await runMonkey(page, { seed: 3, steps: 20, open });
    expect(run.actions).toContain('click button "Missing"');
    expect(run.problems).toContainEqual(
      expect.stringMatching(/^step \d+: 500 GET \/api\/broken$/),
    );
    expect(run.problems.join()).not.toContain("404");
  });

  test("never clicks what would end the session, delete data or leave the site", async ({
    page,
  }) => {
    const open = await serve(
      page,
      `<!doctype html><html lang="en"><body><main>
        <button onclick="throw new Error('deleted')">Delete account</button>
        <button onclick="throw new Error('removed')"><span>Remove member</span></button>
        <a href="/logout" onclick="throw new Error('signed out')">Sign out</a>
        <button aria-label="Log out" onclick="throw new Error('logged out')">x</button>
        <button onclick="throw new Error('switched')">Organisation Acme, switch organisation</button>
        <a href="https://example.org/">Elsewhere</a>
        <a href="/docs" target="_blank">New tab</a>
        <button>Safe</button>
      </main></body></html>`,
    );
    const run = await runMonkey(page, { seed: 5, steps: 30, open });
    expect(run.problems).toEqual([]);
    expect(run.actions.join("\n")).not.toMatch(
      /Delete|Remove|Sign out|Log out|switch|Elsewhere|New tab/,
    );
    expect(run.actions).toContain('click button "Safe"');
  });

  test("goes back to the page under test when an action leaves it", async ({
    page,
  }) => {
    const open = await serve(
      page,
      `<!doctype html><html lang="en"><body><main>
        <a href="/away">Away</a>
      </main></body></html>`,
    );
    const run = await runMonkey(page, {
      seed: 1,
      steps: 5,
      open,
      stayOn: /monkey\.test\/$/,
    });
    expect(run.actions).toContain("left for /away, reopened");
    expect(page.url()).toBe(`${ORIGIN}/`);
  });
});
