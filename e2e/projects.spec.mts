import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  analysis,
  paginated,
  project,
  ProjectsPage,
  repo,
} from "./pages/projects.page.mjs";

// Jumps dialog fade-ins to their end so axe sees the final colours;
// looping spinners are left alone.
async function axe(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getTiming().iterations !== Infinity) {
        animation.finish();
      }
    }
  });
  await expectNoAxeViolations(page);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test("unauthenticated visitors are sent to the login page", async ({
  page,
}) => {
  await page.goto("/projects");

  await expect(page).toHaveURL(/\/login/);
});

test.describe("Projects list", () => {
  test("lists each project with its source and latest analysis in words", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoList();

    await expect(projects.heading).toHaveText("Projects");
    await expect(projects.rows()).toHaveCount(3);
    await expect(projects.row("web-frontend")).toContainText("GitHub");
    await expect(projects.row("web-frontend")).toContainText("Completed");
    await expect(projects.row("api-server")).toContainText("GitLab");
    await expect(projects.row("api-server")).toContainText("Failed");
    await expect(projects.row("api-server")).toContainText(
      "Clone failed: not found",
    );
    await expect(projects.row("Local archive")).toContainText("Upload");
    await expect(projects.row("Local archive")).toContainText("Not analysed");
  });

  test("sorting and the filter work on every loaded project", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoList();
    const names = projects.rows().locator("td:first-child");

    await projects.sortButton("Project").click();
    await expect(projects.columnHeader("Project")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(names).toHaveText([
      "Local archive",
      "example/api-server",
      "example/web-frontend",
    ]);

    await projects.filter.fill("api");
    await expect(projects.rows()).toHaveCount(1);
    await expect(projects.rows()).toContainText("example/api-server");

    await projects.filter.fill("nothing like this");
    await expect(projects.rows()).toHaveText(["No projects match."]);
  });

  test("loads every page of projects so the table holds them all", async ({
    page,
  }) => {
    const first = Array.from({ length: 100 }, (_, i) =>
      project(`p-${i}`, `org/repo-${String(i).padStart(3, "0")}`),
    );
    const second = [project("p-100", "org/repo-100")];
    const projects = new ProjectsPage(page);
    await projects.signIn({ pages: [first, second] });
    await projects.gotoList();

    await expect(page.getByText("Showing 1 to 20 of 101")).toBeVisible();
    await projects.filter.fill("repo-100");
    await expect(projects.rows()).toHaveCount(1);
  });

  test("the project overview counts projects and analyses", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoList();

    const stats = page.getByRole("list", { name: "Project overview" });
    await expect(stats.getByRole("listitem")).toHaveText([
      /Projects\s*3/,
      /Completed analyses\s*2/,
      /Running analyses\s*0/,
      /Last analysis\s*Nov 2, 2026/,
    ]);
  });

  test("the analyses dialog lists every analysis with its steps, traps focus and closes with Escape", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoList();

    const opener = page.getByRole("button", {
      name: "2 analyses of example/web-frontend",
    });
    await opener.click();
    const dialog = page.getByRole("dialog", {
      name: "Analyses of example/web-frontend",
    });
    await expect(dialog).toBeVisible();
    const rows = projects.rows(dialog.getByRole("table"));
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("Once");
    await expect(rows.nth(1)).toContainText("Weekly");
    await expect(rows.nth(1)).toContainText("Next");

    await rows.first().getByRole("button", { name: "3 steps" }).click();
    await expect(rows.first()).toContainText("php-sbom");
    await expect(rows.first()).toContainText("Skipped");
    await expect(rows.first()).toContainText("No composer.lock");

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test("a completed analysis links to its results", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoList();

    await projects
      .row("web-frontend")
      .getByRole("link", { name: "Results of example/web-frontend" })
      .click();

    await expect(page).toHaveURL(/\/results\?analysis_id=a-1&project_id=p-1$/);
  });

  test("a scheduled analysis shows its runs", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn({
      runs: [
        {
          run_date: "2026-11-13T09:00:00Z",
          plugin_count: 3,
          result_count: 3,
          plugins: ["js-sbom", "vuln-finder", "license-finder"],
        },
        {
          run_date: "2026-11-06T09:00:00Z",
          plugin_count: 3,
          result_count: 2,
        },
      ],
    });
    await projects.gotoList();
    await page
      .getByRole("button", { name: "2 analyses of example/web-frontend" })
      .click();

    await page.getByRole("button", { name: "Runs" }).click();

    const runs = page.getByRole("dialog", { name: "Runs of this analysis" });
    await expect(projects.rows(runs.getByRole("table"))).toHaveCount(2);
    await expect(runs).toContainText("Latest");
    await runs.getByRole("link", { name: "Results" }).nth(1).click();
    await expect(page).toHaveURL(/run_index=1$/);
  });

  test("deleting a project asks first and then removes it", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoList();

    await page
      .getByRole("button", { name: "Delete example/api-server" })
      .click();
    const confirm = page.getByRole("dialog", {
      name: "Delete example/api-server?",
    });
    await expect(confirm).toContainText("1 analysis");
    await axe(page);

    await confirm.getByRole("button", { name: "Delete project" }).click();

    await expect(confirm).toHaveCount(0);
    expect(projects.writes).toEqual(["DELETE /org/org-123/projects/p-2"]);
  });

  test("deleting an analysis asks first", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoList();
    await page
      .getByRole("button", { name: "1 analysis of example/api-server" })
      .click();

    await page
      .getByRole("button", { name: /^Delete the analysis started/ })
      .click();
    await page.getByRole("button", { name: "Delete analysis" }).click();

    await expect
      .poll(() => projects.writes)
      .toEqual(["DELETE /org/org-123/projects/p-2/analyses/a-3"]);
  });

  test("a running analysis says so and the list refreshes until it ends", async ({
    page,
  }) => {
    const withStatus = (status: "started" | "completed") => [
      project("p-1", "example/web-frontend", {
        analyses: [analysis("a-9", status)],
      }),
    ];
    const projects = new ProjectsPage(page);
    await projects.signIn({ projects: withStatus("started") });
    await projects.gotoList();

    await expect(projects.row("web-frontend")).toContainText("Running");
    await expect(
      page.getByRole("list", { name: "Project overview" }),
    ).toContainText(/Running analyses\s*1/);

    await page.route(
      (url) => url.pathname === "/api/org/org-123/projects",
      (route) => route.fulfill({ json: paginated(withStatus("completed")) }),
    );
    await expect(projects.row("web-frontend")).toContainText("Completed", {
      timeout: 10_000,
    });
  });

  test("an organisation with no projects sees the owl and Add a Project", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn({ projects: [] });
    await projects.gotoList();

    await expect(page.getByRole("img", { name: /owl/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No Projects yet" }),
    ).toBeVisible();
    await expect(projects.table).toHaveCount(0);
    await axe(page);
    await expectScreenshots(page, "projects-empty");

    await page.getByRole("link", { name: "Add a Project" }).click();
    await expect(page).toHaveURL(/\/projects\/add$/);
  });

  test("while loading, a skeleton stands in for the table", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    const release = await projects.signIn({ hold: true });
    await projects.gotoList();

    await expect(
      page.getByRole("status", { name: "Loading Projects" }),
    ).toBeVisible();
    await axe(page);

    release();
    await expect(projects.rows()).toHaveCount(3);
  });

  test("a failed load says so and can be retried", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn({ failList: true });
    await projects.gotoList();

    await expect(page.getByRole("alert")).toContainText(
      "The projects could not be loaded.",
    );
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("Tab reaches the page action, filter, sort buttons and row actions with visible focus", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn({ projects: [projects_one()] });
    await projects.gotoList();
    await expect(projects.rows()).toHaveCount(1);

    await page.getByRole("link", { name: "Add Project" }).focus();
    await expectVisibleFocus(page.getByRole("link", { name: "Add Project" }));
    for (const target of [
      projects.filter,
      projects.sortButton("Project"),
      projects.sortButton("Source"),
      projects.sortButton("Latest analysis"),
      projects.sortButton("Analyses"),
      projects.sortButton("Added"),
      page.getByRole("button", { name: "2 analyses of example/web-frontend" }),
      page.getByRole("link", { name: "New analysis of example/web-frontend" }),
      page.getByRole("link", { name: "Results of example/web-frontend" }),
      page.getByRole("button", { name: "Delete example/web-frontend" }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoList();
    await expect(projects.row("web-frontend")).toContainText("JavaScript");

    await axe(page);
    await expectScreenshots(page, "projects-list");

    await page.setViewportSize({ width: 1280, height: 1024 });
    await page
      .getByRole("button", { name: "2 analyses of example/web-frontend" })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "3 steps" }).first().click();
    await expect(dialog).toContainText("No composer.lock");
    await axe(page);
    await expectScreenshots(page, "projects-analyses-dialog");
  });
});

function projects_one(): Record<string, unknown> {
  return project("p-1", "example/web-frontend", {
    analyses: [
      analysis("a-1", "completed", { created_on: "2026-11-02T09:00:00Z" }),
      analysis("a-2", "failure"),
    ],
  });
}

test.describe("Add a Project", () => {
  test("offers each import method as a button", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();

    await expect(projects.heading).toHaveText("Add a Project");
    const methods = page.getByRole("list", { name: "Import methods" });
    await expect(methods.getByRole("button")).toHaveText([
      /GitHub/,
      /GitLab/,
      /Popular on GitHub/,
      /Upload an archive/,
    ]);
  });

  test("without integrations, an archive upload is still offered", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn({ integrations: [] });
    await projects.gotoCreate();

    await expect(
      page.getByText("No GitHub or GitLab integration yet"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Manage integrations" }),
    ).toBeVisible();
    await axe(page);
    await expectScreenshots(page, "projects-add-no-integration");

    await page.getByRole("button", { name: "Upload an archive" }).click();
    await expect(
      page.getByRole("heading", { name: "Upload an archive" }).first(),
    ).toBeVisible();
  });

  test("selecting GitHub repositories imports them together", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();
    await page.getByTestId("github-card").click();

    await expect(
      page.getByRole("heading", { name: "GitHub repositories" }),
    ).toBeVisible();
    await expect(projects.rows()).toHaveCount(3);
    await expect(
      page.getByRole("checkbox", { name: "Select example/web-frontend" }),
    ).toBeDisabled();

    await page
      .getByRole("checkbox", {
        name: "Select every repository not imported yet",
      })
      .click();
    await expect(page.getByText("2 repositories selected")).toBeVisible();
    await page.getByRole("button", { name: "Import 2 Projects" }).click();

    await expect(page).toHaveURL(/\/projects$/);
    expect(projects.writes.sort()).toEqual([
      "POST /org/org-123/projects",
      "POST /org/org-123/projects",
    ]);
  });

  test("failed imports are listed with the reason", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn({
      failImport: ["https://github.com/example/billing"],
    });
    await projects.gotoCreate();
    await page.getByTestId("github-card").click();

    await page
      .getByRole("checkbox", { name: "Select example/billing" })
      .click();
    await page
      .getByRole("checkbox", { name: "Select example/docs-site" })
      .click();
    await page.getByRole("button", { name: "Import 2 Projects" }).click();

    const failures = page.getByRole("table", { name: "Failed imports" });
    await expect(projects.rows(failures)).toHaveCount(1);
    await expect(projects.rows(failures)).toContainText("example/billing");
    await expect(projects.rows(failures)).toContainText("Already imported");
    await axe(page);
  });

  test("the repository filter, sort and view choice work on every loaded repository", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();
    await page.getByTestId("gitlab-card").click();
    await expect(projects.rows()).toHaveCount(3);

    await projects.filter.fill("docs");
    await expect(projects.rows()).toHaveCount(1);
    await projects.filter.fill("");

    await projects.sortButton("Repository").click();
    await expect(projects.rows().first()).toContainText("example/billing");

    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/repositories")) requests.push(request.url());
    });
    await page.getByLabel("Show").click();
    await page.getByRole("option", { name: "All repositories" }).click();
    await expect
      .poll(() => requests.at(-1))
      .toContain("imported_and_non_imported");
  });

  test("Popular on GitHub ranks by stars and filters by language", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn({
      repos: [
        { ...repoWithStars("vuejs/core", 48000) },
        { ...repoWithStars("facebook/react", 230000) },
      ],
    });
    await projects.gotoCreate();
    await page.getByTestId("popular-github-card").click();

    await expect(projects.rows().first()).toContainText("facebook/react");
    await expect(projects.rows().first()).toContainText("230,000");

    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/popular")) requests.push(request.url());
    });
    await page.getByLabel("Language").click();
    await page.getByRole("option", { name: "PHP", exact: true }).click();
    await expect.poll(() => requests.at(-1)).toContain("PHP");
  });

  test("the URL import says what is missing next to the field", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();
    await page.getByTestId("github-card").click();

    await page.getByRole("button", { name: "Import repository" }).click();

    await expect(page.getByLabel("Repository URL")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel("Repository URL")).toHaveAccessibleDescription(
      "A repository URL is required",
    );

    await page
      .getByLabel("Repository URL")
      .fill("https://github.com/example/tools.git");
    await page.getByRole("button", { name: "Import repository" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    expect(projects.writes).toEqual(["POST /org/org-123/projects"]);
  });

  test("the archive upload checks the name and file type", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();
    await page.getByRole("button", { name: /Upload an archive/ }).click();

    await page.getByLabel("Archive", { exact: true }).setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("x"),
    });
    await expect(page.getByRole("alert")).toContainText(
      "Invalid file type. Please upload a ZIP or TAR.GZ archive.",
    );

    await page.getByLabel("Archive", { exact: true }).setInputFiles({
      name: "shop.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("PK"),
    });
    await expect(page.getByText("shop.zip", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Create project and upload" })
      .click();
    await expect(page.getByLabel("Name")).toHaveAccessibleDescription(
      "A name of at least 2 characters is required",
    );
    await axe(page);
    await expectScreenshots(page, "projects-add-upload-errors");
  });

  test("Tab moves through the import methods and back with visible focus", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();
    const methods = page
      .getByRole("list", { name: "Import methods" })
      .getByRole("button");
    await expect(methods).toHaveCount(4);

    await methods.first().focus();
    await expectVisibleFocus(methods.first());
    for (const index of [1, 2, 3]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(methods.nth(index));
    }

    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Popular on GitHub" }),
    ).toBeVisible();
    await expect(projects.rows()).toHaveCount(3);
    const back = page.getByRole("button", { name: "Back to import methods" });
    await back.focus();
    await expectVisibleFocus(back);
    for (const target of [
      page.getByRole("button", { name: "Refresh from provider" }),
      page.getByLabel("Show"),
      page.getByLabel("Language"),
      page.getByRole("checkbox", {
        name: "Select every repository not imported yet",
      }),
      projects.filter,
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();
    await expect(
      page.getByRole("list", { name: "Import methods" }).getByRole("button"),
    ).toHaveCount(4);

    await axe(page);
    await expectScreenshots(page, "projects-add");

    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.getByTestId("github-card").click();
    await expect(projects.rows()).toHaveCount(3);
    await page
      .getByRole("checkbox", { name: "Select example/billing" })
      .click();
    await axe(page);
    await expectScreenshots(page, "projects-add-github");
  });

  test("while the integrations load, a skeleton stands in", async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/org/org-123/integrations/vcs**", async (route) => {
      await held;
      await route.fallback();
    });
    await projects.gotoCreate();

    await expect(
      page.getByRole("status", { name: "Loading the import methods" }),
    ).toBeVisible();
    release();
    await expect(
      page.getByRole("list", { name: "Import methods" }),
    ).toBeVisible();
  });
});

function repoWithStars(name: string, stars: number): Record<string, unknown> {
  return repo(name, { stargazers_count: stars, language: "JavaScript" });
}
