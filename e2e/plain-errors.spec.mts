import { expect, type Page, test } from "@playwright/test";

import { AnalysesPage } from "./pages/analyses.page.mjs";
import { DashboardPage } from "./pages/dashboard.page.mjs";
import { DatasetsPage } from "./pages/datasets.page.mjs";
import { ExperimentDetailPage } from "./pages/experiment-detail.page.mjs";
import { experiment, ExperimentsPage } from "./pages/experiments.page.mjs";
import { OrgMembersPage } from "./pages/org-members.page.mjs";
import { OrgPoliciesPage } from "./pages/org-policies.page.mjs";
import { OrgSettingsPage } from "./pages/org-settings.page.mjs";
import { ProjectsPage } from "./pages/projects.page.mjs";

// A failed action shows one message a user can act on: no error codes, no
// raw server reasons, and no toast repeating an inline error.

const ORG = "org-123";
const EXPERIMENT = `**/api/org/${ORG}/experiments/exp-1`;

// Records the text of every toast shown, so short-lived ones are not missed.
async function recordToasts(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __toasts: string[] }).__toasts = seen;
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (
            node instanceof HTMLElement &&
            node.matches("[data-sonner-toast]")
          )
            seen.push(node.textContent ?? "");
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
  return () =>
    page.evaluate(() => (window as unknown as { __toasts: string[] }).__toasts);
}

function businessError(status: number, code: string, message: string) {
  return {
    status,
    json: {
      status_code: status,
      status: "failure",
      error_code: code,
      error_message: message,
    },
  };
}

test.describe("One plain error per failure", () => {
  test("a policy list that fails to load says so once, in plain words", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await page.route(
      `**/api/org/${ORG}/policies/vulnerability_policy**`,
      (route) =>
        route.fulfill(
          businessError(403, "NotAuthorized", "Not authorized to do this."),
        ),
    );
    await policies.gotoList();
    await policies.tab("Vulnerability policies").click();

    await expect(
      page.getByText("The vulnerability policies could not be loaded."),
    ).toBeVisible();
    await expect(page.getByText(/Not authorized to do this/)).toHaveCount(0);
    expect(await shown()).toEqual([]);
  });

  test("a failed policy delete shows one plain toast", async ({ page }) => {
    const shown = await recordToasts(page);
    const policies = new OrgPoliciesPage(page);
    await policies.signIn();
    await page.route(
      `**/api/org/${ORG}/policies/vulnerability_policy/vp-2`,
      (route) =>
        route.request().method() === "DELETE"
          ? route.fulfill(
              businessError(500, "InternalError", "The server crashed hard."),
            )
          : route.fallback(),
    );
    await policies.gotoList();
    await policies.tab("Vulnerability policies").click();

    await page
      .getByRole("button", { name: "Delete Test fixtures only" })
      .click();
    await page
      .getByRole("dialog", { name: "Delete Test fixtures only?" })
      .getByRole("button", { name: "Delete policy" })
      .click();

    await expect.poll(shown).toContain("The policy could not be deleted");
    expect(await shown()).toEqual(["The policy could not be deleted"]);
  });

  test("inviting an address with no account explains that an account is needed", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const members = new OrgMembersPage(page);
    await members.signIn();
    await page.route(`**/api/org/${ORG}/create_invite`, (route) =>
      route.fulfill(
        businessError(
          400,
          "UserDoesNotExist",
          "The referenced user does not exists.",
        ),
      ),
    );
    await members.gotoInvites();

    await page.getByRole("button", { name: "Invite a member" }).click();
    const dialog = page.getByRole("dialog", { name: "Invite a member" });
    await expect(dialog).toContainText("already have a CodeClarity account");

    await dialog.getByLabel("Email").fill("nobody@example.com");
    await dialog.getByRole("button", { name: "Send invitation" }).click();

    await expect(dialog.getByLabel("Email")).toHaveAccessibleDescription(
      /No CodeClarity account uses nobody@example.com\. They need to sign up before you can invite them\./,
    );
    await expect(dialog).toBeVisible();
    expect(await shown()).toEqual([]);
  });

  test("the organisation create form enforces the server's length limits", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoCreate();

    const name = page.getByRole("textbox", { name: "Name" });
    const description = page.getByRole("textbox", { name: "Description" });
    const create = page.getByRole("button", { name: "Create organisation" });
    await name.fill("n".repeat(51));
    await description.fill("d".repeat(251));
    await create.click();

    await expect(name).toHaveAccessibleDescription(/At most 50 characters/);
    await expect(description).toHaveAccessibleDescription(
      /At most 250 characters/,
    );
    // Waits for the refused submit to finish before typing valid values.
    await expect(create).toBeEnabled();
    expect(orgs.created).toEqual([]);

    await name.fill("n".repeat(50));
    await description.fill("d".repeat(250));
    await create.click();
    await expect.poll(() => orgs.created.length).toBe(1);
  });

  test("a refused organisation submit does not send values typed after the click", async ({
    page,
  }) => {
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn();
    await orgs.gotoCreate();

    const name = page.getByRole("textbox", { name: "Name" });
    const description = page.getByRole("textbox", { name: "Description" });
    await name.fill("n".repeat(51));
    await description.fill("d".repeat(251));
    await page.getByRole("button", { name: "Create organisation" }).click();
    await name.fill("n".repeat(50));
    await description.fill("d".repeat(250));

    await expect(name).not.toHaveAccessibleDescription(/At most/);
    await page.waitForTimeout(500);
    expect(orgs.created).toEqual([]);
  });

  test("a rejected create shows a plain message without the server's reason", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const orgs = new OrgSettingsPage(page);
    await orgs.signIn({
      failWrite: { status: 400, error_code: "ValidationFailed" },
    });
    await orgs.gotoCreate();

    await page.getByRole("textbox", { name: "Name" }).fill("Research Lab");
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Ecosystem studies");
    await page.getByRole("button", { name: "Create organisation" }).click();

    await expect.poll(shown).not.toEqual([]);
    expect(await shown()).toEqual(["The organisation could not be created"]);
  });

  test("a missing terms checkbox on signup is reported next to it", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const registered: unknown[] = [];
    await page.route("**/api/auth/register", (route) => {
      registered.push(route.request().postDataJSON());
      return route.fulfill({ json: { status: "success" } });
    });
    await page.goto("/signup");
    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByLabel("First name").fill("Jane");
    await page.getByLabel("Last name").fill("Doe");
    await page.getByLabel("Handle").fill("janedoe");
    await page.getByLabel("Password", { exact: true }).fill("ThisIs4Str0ng!");
    await page.getByLabel("Confirm password").fill("ThisIs4Str0ng!");
    await page.getByRole("button", { name: "Create account" }).click();

    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).toHaveAttribute("aria-invalid", "true");
    await expect(checkbox).toHaveAccessibleDescription(
      /You must accept our terms and conditions to continue/,
    );
    expect(await shown()).toEqual([]);
    expect(registered).toEqual([]);
  });

  test("a rejected upload file is cleared from the input", async ({ page }) => {
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await projects.gotoCreate();
    await page.getByRole("button", { name: /Upload an archive/ }).click();

    const input = page.getByLabel("Archive", { exact: true });
    await input.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("x"),
    });

    await expect(page.getByRole("alert")).toContainText(
      "Invalid file type. Please upload a ZIP or TAR.GZ archive.",
    );
    await expect(input).toHaveValue("");
  });

  test("a failed archive upload says so once, without the server's reply", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const projects = new ProjectsPage(page);
    await projects.signIn();
    await page.route(`**/api/org/${ORG}/file/**`, (route) =>
      route.fulfill(
        businessError(500, "InternalError", "Disk quota blew up badly."),
      ),
    );
    await projects.gotoCreate();
    await page.getByRole("button", { name: /Upload an archive/ }).click();

    await page.getByLabel("Name").fill("Shop");
    await page.getByLabel("Archive", { exact: true }).setInputFiles({
      name: "shop.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("PK"),
    });
    await page
      .getByRole("button", { name: "Create project and upload" })
      .click();

    await expect(page.getByRole("alert")).toHaveText(
      "The project was created, but the archive could not be uploaded.",
    );
    await expect(page.getByText(/Disk quota|Upload failed/)).toHaveCount(0);
    expect(await shown()).toEqual([]);
  });

  for (const [kind, body] of [
    ["a server error", businessError(500, "InternalError", "Pool exhausted.")],
    ["a gateway error", { status: 502, json: { message: "Bad gateway" } }],
  ] as const) {
    test(`a Datasets list that fails with ${kind} says so once, inline`, async ({
      page,
    }) => {
      const shown = await recordToasts(page);
      const datasets = new DatasetsPage(page);
      await datasets.signIn();
      await page.route(/\/api\/org\/org-123\/datasets(\?|$)/, (route) =>
        route.fulfill(body),
      );
      await datasets.gotoList();

      await expect(
        page.getByText("The Datasets could not be loaded."),
      ).toBeVisible();
      expect(await shown()).toEqual([]);
    });

    test(`an Experiments list that fails with ${kind} says so once, inline`, async ({
      page,
    }) => {
      const shown = await recordToasts(page);
      const experiments = new ExperimentsPage(page);
      await experiments.signIn();
      await page.route(/\/api\/org\/org-123\/experiments(\?|$)/, (route) =>
        route.fulfill(body),
      );
      await experiments.gotoList();

      await expect(
        page.getByText("The Experiments could not be loaded."),
      ).toBeVisible();
      expect(await shown()).toEqual([]);
    });
  }

  for (const [kind, body] of [
    ["a server error", { status: 500, json: { message: "Internal error" } }],
    ["a gateway error", { status: 502, json: { message: "Bad gateway" } }],
  ] as const) {
    test(`an Experiment that fails to load with ${kind} shows one toast`, async ({
      page,
    }) => {
      const shown = await recordToasts(page);
      const detail = new ExperimentDetailPage(page);
      await detail.signIn();
      await page.route(EXPERIMENT, (route) => route.fulfill(body));
      await detail.goto();

      await expect.poll(shown).not.toEqual([]);
      await page.waitForTimeout(500);
      expect(await shown()).toEqual(["Failed to load the experiment"]);
    });

    test(`a Figure preview that fails with ${kind} shows one toast`, async ({
      page,
    }) => {
      const shown = await recordToasts(page);
      const detail = new ExperimentDetailPage(page);
      await detail.signIn();
      await page.route(`${EXPERIMENT}/figure-data`, (route) =>
        route.fulfill(body),
      );
      await detail.goto();
      await detail.tab("Figures").click();

      await expect.poll(shown).not.toEqual([]);
      await page.waitForTimeout(500);
      expect(await shown()).toEqual(["Failed to compute the Figure"]);
    });

    test(`a Figure save that fails with ${kind} shows one toast`, async ({
      page,
    }) => {
      const shown = await recordToasts(page);
      const detail = new ExperimentDetailPage(page);
      await detail.signIn();
      await page.route(`${EXPERIMENT}/figures`, (route) =>
        route.request().method() === "POST"
          ? route.fulfill(body)
          : route.fallback(),
      );
      await detail.goto();
      await detail.tab("Figures").click();
      await expect(
        page.getByRole("region", { name: "Preview" }).getByRole("figure"),
      ).toBeVisible();

      await page.getByLabel("Name").fill("Load trend");
      await page.getByRole("button", { name: "Save", exact: true }).click();

      await expect.poll(shown).not.toEqual([]);
      await page.waitForTimeout(500);
      expect(await shown()).toEqual(["Failed to save the Figure"]);
    });

    test(`an Experiment create that fails with ${kind} shows one toast`, async ({
      page,
    }) => {
      const shown = await recordToasts(page);
      const experiments = new ExperimentsPage(page);
      await experiments.signIn();
      await page.route(`**/api/org/${ORG}/experiments`, (route) =>
        route.request().method() === "POST"
          ? route.fulfill(body)
          : route.fallback(),
      );
      await experiments.gotoCreate();

      await page.getByLabel("Name").fill("top100-2026-11");
      await experiments.choose("Dataset", /Top npm packages/);
      await page.getByRole("button", { name: "Start Experiment" }).click();

      await expect.poll(shown).not.toEqual([]);
      await page.waitForTimeout(500);
      expect(await shown()).toEqual(["Failed to create the experiment"]);
    });
  }

  test("a failing results progress poll shows no toast", async ({ page }) => {
    const shown = await recordToasts(page);
    const detail = new ExperimentDetailPage(page);
    await detail.signIn({
      experiment: experiment("exp-1", "Residence time 2026", "RUNNING"),
      holdResults: true,
    });
    let polls = 0;
    await page.route(`${EXPERIMENT}/results/progress`, (route) => {
      polls++;
      return route.fulfill({ status: 502, json: { message: "Bad gateway" } });
    });
    await detail.goto();

    await expect(page.getByText("Preparing the results")).toBeVisible();
    await expect.poll(() => polls).toBeGreaterThan(1);
    expect(await shown()).toEqual([]);
  });

  test("a research overview that fails to load says so inline, with no toast", async ({
    page,
  }) => {
    const shown = await recordToasts(page);
    const dashboard = new DashboardPage(page);
    await dashboard.signIn({ failExperiments: true });
    await dashboard.goto();

    await expect(dashboard.research.getByRole("alert")).toBeVisible();
    await page.waitForTimeout(500);
    expect(await shown()).toEqual([]);
  });

  test("an analysis the server fails to start says so in plain words", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({
      createError: {
        status_code: 500,
        status: "failure",
        error_code: "InternalError",
        error_message: "relation analysis_x does not exist",
      },
    });
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();
    await analyses.submit.click();

    await expect(page.getByRole("alert")).toContainText(
      "The analysis could not be started. Please try again.",
    );
    await expect(page.getByText(/relation analysis_x/)).toHaveCount(0);
  });

  test("an analysis missing a plugin option shows the server's plain reason", async ({
    page,
  }) => {
    const analyses = new AnalysesPage(page);
    await analyses.signIn({
      createError: {
        status_code: 400,
        status: "failure",
        error_code: "AnaylzerMissingConfigAttribute",
        error_message:
          'The plugin "license-finder" needs the option "licensePolicy", which is missing.',
      },
    });
    await analyses.goto();

    await analyses.analyzer("JavaScript Analyzer").click();
    await analyses.submit.click();

    await expect(page.getByRole("alert")).toContainText(
      'The plugin "license-finder" needs the option "licensePolicy", which is missing.',
    );
  });
});
