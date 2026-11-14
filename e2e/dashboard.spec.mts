import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { DashboardPage, week } from "./pages/dashboard.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test("unauthenticated visitors are sent to the login page", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login/);
});

test.describe("Research section", () => {
  test("shows Experiments in progress with their snapshot progress", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();

    const items = dashboard
      .list("Experiments in progress")
      .locator(":scope > li");
    await expect(items).toHaveCount(2);
    const first = items.first();
    await expect(first.getByRole("link")).toHaveText("Upstream leverage");
    await expect(first).toContainText("Pending");
    await expect(first).toContainText("0 / 200");
    const second = items.nth(1);
    await expect(second.getByRole("link")).toHaveText("Residence time 2026");
    await expect(second).toContainText("Running");
    await expect(second).toContainText("120 / 400");
    await expect(second.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "30",
    );
    await expect(
      second.getByRole("list", { name: "Runs by state" }).getByRole("listitem"),
    ).toHaveText([/Done\s*110/, /Failed\s*6/, /Skipped\s*4/]);

    await second.getByRole("link").click();
    await expect(page).toHaveURL(/\/experiments\/detail\?id=exp-2$/);
  });

  test("lists recently finished Experiments, newest first, with their status in words", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();

    const items = dashboard.list("Recently finished").getByRole("listitem");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText("Licence drift");
    await expect(items.nth(0)).toContainText("Completed");
    await expect(items.nth(0)).toContainText("Ended Nov 1, 2026");
    await expect(items.nth(1)).toContainText("Fix lag study");
    await expect(items.nth(2)).toContainText("Broken cohort");
    await expect(items.nth(2)).toContainText("Failed");
  });

  test("lists recent Published results, newest first, marked as frozen", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();

    const items = dashboard
      .list("Recent Published results")
      .getByRole("listitem");
    await expect(items).toHaveText([
      /Licence drift\s*Metric version 1, published Nov 2, 2026 by Jane Roe\s*Frozen/,
      /Fix lag study\s*Metric version 2, published Oct 20, 2026 by John Doe\s*Frozen/,
      /Fix lag study\s*Metric version 1, published Oct 7, 2026\s*Frozen/,
    ]);

    await items.nth(1).getByRole("link", { name: "Fix lag study" }).click();
    await expect(page).toHaveURL(/\/experiments\/detail\?id=exp-1$/);
  });

  test("an organisation with no Datasets sees the owl and Create a Dataset", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ datasets: [], experiments: [] });
    await dashboard.goto();

    await expect(
      dashboard.research.getByRole("img", { name: /owl/ }),
    ).toBeVisible();
    await expect(
      dashboard.research.getByRole("heading", { name: "No Datasets yet" }),
    ).toBeVisible();
    await expect(dashboard.research.getByRole("list")).toHaveCount(0);

    await dashboard.research
      .getByRole("link", { name: "Create a Dataset" })
      .click();
    await expect(page).toHaveURL(/\/datasets\/add$/);
  });

  test("with Datasets but no Experiments, each list says it is empty", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ experiments: [] });
    await dashboard.goto();

    await expect(dashboard.research).toContainText(
      "No Experiments are running.",
    );
    await expect(dashboard.research).toContainText(
      "No Experiments have finished yet.",
    );
    await expect(dashboard.research).toContainText("Nothing is published yet.");
    await expect(
      dashboard.research.getByRole("link", { name: "New Experiment" }),
    ).toBeVisible();
  });

  test("while loading, a skeleton stands in for the Research lists", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    const release = await dashboard.signIn({ hold: true });
    await dashboard.goto();

    await expect(
      page.getByRole("status", { name: "Loading Research" }),
    ).toBeVisible();

    release();

    await expect(dashboard.list("Experiments in progress")).toBeVisible();
  });

  test("a failed load says so and can try again", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ failExperiments: true });
    await dashboard.goto();

    await expect(dashboard.research.getByRole("alert")).toContainText(
      "The Research overview could not be loaded.",
    );
    await expect(
      dashboard.research.getByRole("button", { name: "Try again" }),
    ).toBeVisible();
  });
});

test.describe("Project overview", () => {
  test("keeps the security numbers, with the grade scale one click away", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();

    const numbers = dashboard.projects.getByRole("list", {
      name: "Project numbers",
    });
    await expect(numbers.getByRole("listitem")).toHaveText([
      /Critical issues\s*2\s*2 issues found/,
      /High severity\s*5\s*5 issues found/,
      /Projects scanned\s*3/,
      /Security score\s*B/,
    ]);

    await dashboard.projects
      .getByRole("button", { name: "About the security score" })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Security Grade Scale",
    );
  });

  test("draws exposure, licences and impact on the shared charts", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();

    const exposure = dashboard.chart(
      "Summed severity of vulnerabilities by week",
    );
    await expect(exposure.getByRole("img")).toHaveCount(4);
    await expect(exposure.getByRole("img").first()).toHaveAccessibleName(
      /Oct 12 - Oct 18, 2026: summed severity 120/,
    );
    const weeks = dashboard.projects.getByRole("list", {
      name: "Weekly exposure",
    });
    await expect(weeks.getByRole("listitem").first()).toHaveText(
      /Nov 02 - Nov 08, 2026\s*No vulnerabilities/,
    );
    await expect(weeks.getByRole("listitem").nth(1)).toContainText(
      "2 Critical",
    );

    const licences = dashboard.chart("Dependencies by licence");
    await expect(licences.getByRole("img")).toHaveCount(3);
    await expect(licences.getByRole("img").first()).toHaveAccessibleName(
      "MIT: 40 dependencies (70%)",
    );

    const impact = dashboard.chart(
      "Mean impact on confidentiality, integrity and availability",
    );
    await expect(impact.getByRole("img").nth(2)).toHaveAccessibleName(
      "Availability: mean impact 0.8",
    );
  });

  test("lists the most severe vulnerabilities with their severity in words", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();

    await expect(
      dashboard.projects
        .getByRole("list", { name: "Vulnerabilities by severity" })
        .getByRole("listitem"),
    ).toHaveText([/Critical\s*2/, /High\s*5/, /Medium\s*9/]);
    await expect(
      dashboard.projects
        .getByRole("list", { name: "Most severe vulnerabilities" })
        .getByRole("listitem"),
    ).toHaveText([
      /Critical\s*9.8\s*Code Injection/,
      /High\s*7.5\s*Prototype Pollution/,
      /Medium\s*5.3\s*Uncontrolled Resource Consumption/,
      /Low\s*2.1\s*Information Exposure/,
    ]);
  });

  test("summarises tickets by state and priority and links to them", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();

    await expect(
      dashboard.projects
        .getByRole("list", { name: "Tickets by state" })
        .getByRole("listitem"),
    ).toHaveText([/Open\s*4/, /In progress\s*2/, /Resolved this week\s*1/]);
    await expect(
      dashboard.projects
        .getByRole("list", { name: "Tickets by priority" })
        .getByRole("listitem"),
    ).toHaveText([/Critical\s*1/, /High\s*2/, /Medium\s*1/]);

    await dashboard.projects
      .getByRole("link", { name: /lodash prototype pollution/ })
      .click();
    await expect(page).toHaveURL(/\/tickets\?ticket_id=t-1$/);
  });

  test("labels each week with its ISO week, also across the new year", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({
      weeklySeverity: [
        week(52, 10, [1, 0, 0, 0, 0], 2024),
        week(1, 20, [2, 0, 0, 0, 0], 2025),
        week(1, 30, [3, 0, 0, 0, 0], 2026),
      ],
    });
    await dashboard.goto();

    await expect(
      dashboard.projects
        .getByRole("list", { name: "Weekly exposure" })
        .getByRole("listitem"),
    ).toHaveText([
      /^Dec 29, 2025 - Jan 04, 2026/,
      /^Dec 30, 2024 - Jan 05, 2025/,
      /^Dec 23 - Dec 29, 2024/,
    ]);
  });

  test("a failed summary request shows an error instead of numbers, and retries", async ({
    page,
  }) => {
    const fail = ["/dashboard/quick_stats"];
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ fail });
    await dashboard.goto();

    const alert = dashboard.projects.getByRole("alert").filter({
      hasText: "The project numbers could not be loaded.",
    });
    await expect(alert).toBeVisible();
    await expect(
      dashboard.projects.getByRole("list", { name: "Project numbers" }),
    ).toHaveCount(0);
    await expect(dashboard.projects).not.toContainText("A+");
    await expect(
      dashboard.projects.getByRole("heading", { name: /first analysis/ }),
    ).toHaveCount(0);
    await expect(
      dashboard.chart("Dependencies by licence").getByRole("img"),
    ).toHaveCount(3);

    fail.length = 0;
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(
      dashboard.projects
        .getByRole("list", { name: "Project numbers" })
        .getByRole("listitem"),
    ).toHaveText([
      /Critical issues\s*2/,
      /High severity\s*5/,
      /Projects scanned\s*3/,
      /Security score\s*B/,
    ]);
  });

  test("failed vulnerability counts show errors on the tiles and on their card", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ fail: ["/dashboard/recent_vulns"] });
    await dashboard.goto();

    await expect(
      dashboard.projects.getByRole("alert").filter({
        hasText: "The project numbers could not be loaded.",
      }),
    ).toBeVisible();
    await expect(
      dashboard.projects.getByRole("alert").filter({
        hasText: "The vulnerabilities summary could not be loaded.",
      }),
    ).toBeVisible();
    await expect(dashboard.projects).not.toContainText("No critical issues");
  });

  test("each chart card that fails says so and offers a retry", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({
      fail: [
        "/dashboard/weekly_severity_info",
        "/dashboard/overall_license_dist",
        "/dashboard/overall_cia_impact",
        "/tickets/stats",
      ],
    });
    await dashboard.goto();

    for (const label of [
      "vulnerability exposure",
      "licences",
      "impact analysis",
      "ticket statistics",
    ]) {
      const alert = dashboard.projects.getByRole("alert").filter({
        hasText: `The ${label} could not be loaded.`,
      });
      await expect(alert).toBeVisible();
      await expect(
        alert.getByRole("button", { name: "Try again" }),
      ).toBeVisible();
    }
  });

  test("a failed project list shows an error, not the onboarding", async ({
    page,
  }) => {
    const fail = ["/meta_data"];
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ fail });
    await dashboard.goto();

    await expect(
      dashboard.projects.getByRole("heading", {
        name: "Unable to load the project overview",
      }),
    ).toBeVisible();
    await expect(
      dashboard.projects.getByRole("heading", { name: /first project/ }),
    ).toHaveCount(0);

    fail.length = 0;
    await dashboard.projects.getByRole("button", { name: "Try again" }).click();
    await expect(
      dashboard.projects.getByRole("list", { name: "Project numbers" }),
    ).toBeVisible();
  });

  test("an organisation with projects but no analyses is asked to run one", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ analyses: false });
    await dashboard.goto();

    await expect(
      dashboard.projects.getByRole("heading", {
        name: "Run your first analysis",
      }),
    ).toBeVisible();
  });

  test("requests each endpoint once per load", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();
    await expect(
      dashboard.projects.getByRole("list", { name: "Tickets by state" }),
    ).toBeVisible();
    await expect(dashboard.list("Recent Published results")).toBeVisible();
    await expect(dashboard.chart("Dependencies by licence")).toBeVisible();

    const repeated = [...dashboard.requests].filter(([, n]) => n > 1);
    expect(repeated).toEqual([]);

    dashboard.requests.clear();
    await dashboard.projects.getByRole("button", { name: "Refresh" }).click();
    await expect(dashboard.chart("Dependencies by licence")).toBeVisible();
    await expect(
      dashboard.projects.getByRole("list", { name: "Tickets by state" }),
    ).toBeVisible();
    expect([...dashboard.requests].filter(([, n]) => n > 1)).toEqual([]);
    expect(dashboard.requests.get("/dashboard/quick_stats")).toBe(1);
  });

  test("chart axes use whole numbers for counts and keep their labels apart", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({
      licenseDist: {
        MIT: 3,
        "Apache-2.0": 2,
        "BSD-3-Clause": 2,
        "LGPL-2.1-or-later": 1,
        "GPL-3.0-only": 1,
        "MPL-2.0": 1,
      },
      // Two months of weeks, the API's default period.
      weeklySeverity: [38, 39, 40, 41, 42, 43, 44, 45, 46].map((n) =>
        week(n, 2, [0, 0, 0, 1, 0]),
      ),
    });
    await dashboard.goto();

    for (const name of [
      "Dependencies by licence",
      "Summed severity of vulnerabilities by week",
    ]) {
      const chart = dashboard.chart(name);
      await expect(chart).toBeVisible();
      const svg = await chart.boundingBox();
      const texts = await chart.locator("text").all();
      const boxes: {
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
      }[] = [];
      const yTicks: string[] = [];
      for (const text of texts) {
        const box = (await text.boundingBox())!;
        boxes.push({ ...box, text: (await text.textContent())!.trim() });
        if ((await text.getAttribute("text-anchor")) === "end") {
          yTicks.push((await text.textContent())!.trim());
        }
      }
      expect(yTicks.length, name).toBeGreaterThan(1);
      for (const tick of yTicks) expect(tick, name).toMatch(/^\d+$/);
      expect(new Set(yTicks).size, name).toBe(yTicks.length);
      for (const [i, a] of boxes.entries()) {
        expect(a.x, `${name}: "${a.text}"`).toBeGreaterThanOrEqual(
          svg!.x - 0.5,
        );
        expect(a.x + a.width, `${name}: "${a.text}"`).toBeLessThanOrEqual(
          svg!.x + svg!.width + 0.5,
        );
        for (const b of boxes.slice(i + 1)) {
          const overlap =
            a.x < b.x + b.width &&
            b.x < a.x + a.width &&
            a.y < b.y + b.height &&
            b.y < a.y + a.height;
          expect(overlap, `${name}: "${a.text}" overlaps "${b.text}"`).toBe(
            false,
          );
        }
      }
    }
  });

  test("an organisation without projects sees how to add one", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ projects: false });
    await dashboard.goto();

    await expect(
      dashboard.projects.getByRole("heading", { name: "Get started" }),
    ).toBeVisible();
    await expect(
      dashboard.projects.getByRole("link", { name: "Upload a project" }),
    ).toBeVisible();
    await expect(
      dashboard.projects.getByRole("link", { name: "Connect a VCS" }),
    ).toBeVisible();
  });
});

test.describe("Whole page", () => {
  test("Tab moves through Research, then the project overview, with visible focus", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();
    await expect(dashboard.list("Recent Published results")).toBeVisible();

    const start = dashboard.research.getByRole("link", {
      name: "New Experiment",
    });
    await start.focus();
    await expectVisibleFocus(start);
    const link = (list: string, name: string, nth = 0) =>
      dashboard.list(list).getByRole("link", { name }).nth(nth);
    for (const target of [
      link("Experiments in progress", "Upstream leverage"),
      link("Experiments in progress", "Residence time 2026"),
      link("Recently finished", "Licence drift"),
      link("Recently finished", "Fix lag study"),
      link("Recently finished", "Broken cohort"),
      link("Recent Published results", "Licence drift"),
      link("Recent Published results", "Fix lag study"),
      link("Recent Published results", "Fix lag study", 1),
      dashboard.projects.getByRole("button", { name: "Refresh" }),
      dashboard.projects.getByRole("button", {
        name: "About the security score",
      }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("chart columns take focus and say what they show", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();

    const mit = dashboard
      .chart("Dependencies by licence")
      .getByRole("img", { name: /^MIT/ });
    await mit.focus();
    await expectVisibleFocus(mit);
    await expect(
      dashboard.projects.getByText("MIT: 40 dependencies (70%)").first(),
    ).toBeVisible();
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn();
    await dashboard.goto();
    await expect(dashboard.list("Recent Published results")).toBeVisible();
    await expect(dashboard.chart("Dependencies by licence")).toBeVisible();
    await expect(
      dashboard.chart("Summed severity of vulnerabilities by week"),
    ).toBeVisible();
    await expect(
      dashboard.projects.getByRole("list", { name: "Tickets by state" }),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "dashboard");
  });

  test("the empty organisation passes axe and matches the screenshots", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ datasets: [], experiments: [], projects: false });
    await dashboard.goto();
    await expect(
      dashboard.research.getByRole("heading", { name: "No Datasets yet" }),
    ).toBeVisible();
    await expect(
      dashboard.projects.getByRole("heading", { name: "Get started" }),
    ).toBeVisible();

    await expectNoAxeViolations(page);
    await expectScreenshots(page, "dashboard-empty");
  });
});
