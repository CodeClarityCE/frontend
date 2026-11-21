import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectPageSweep } from "./helpers/page-sweep.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import {
  remediationDetail,
  sampleTickets,
  ticket,
  TicketsPage,
} from "./pages/tickets.page.mjs";

// Waits for dialogs to finish fading in so axe sees the final colours.
async function axe(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished)),
  );
  await expectNoAxeViolations(page);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

test.describe("Tickets list", () => {
  test("lists each ticket with its status and priority in words", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();

    await expect(tickets.heading).toHaveText("Tickets");
    await expect(tickets.rows()).toHaveCount(3);
    await expect(tickets.rows().first()).toContainText(
      "CVE-2026-0002: axios SSRF",
    );
    await expect(tickets.rows().first()).toContainText("In Progress");
    await expect(tickets.rows().first()).toContainText("Critical");
    await expect(tickets.rows().nth(1)).toContainText("Open");
    await expect(tickets.rows().nth(2)).toContainText("Resolved");

    const stats = page.getByRole("list", { name: "Ticket numbers" });
    await expect(stats.getByRole("listitem")).toHaveText([
      /Total\s*3/,
      /Open\s*1/,
      /Critical\s*1/,
      /High priority\s*1/,
    ]);
  });

  test("sorting by priority puts the most urgent first", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();
    const priorities = tickets.rows().locator("td:nth-child(3)");

    await tickets.sortButton("Priority").click();

    await expect(tickets.columnHeader("Priority")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(priorities).toHaveText(["Critical", "High", "Low"]);

    await tickets.sortButton("Priority").click();

    await expect(priorities).toHaveText(["Low", "High", "Critical"]);
  });

  test("the filter narrows the rows and says when nothing matches", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();

    await tickets.filter.fill("express");

    await expect(tickets.rows()).toHaveCount(1);
    await expect(tickets.rows()).toContainText("Upgrade express to 5");

    await tickets.filter.fill("nothing like this");

    await expect(tickets.rows()).toHaveText(["No tickets match."]);
  });

  test("loads every page of tickets so all of them can be sorted", async ({
    page,
  }) => {
    const many = Array.from({ length: 130 }, (_, i) =>
      ticket(`t-${i + 1}`, `Ticket ${String(i + 1).padStart(3, "0")}`),
    );
    const tickets = new TicketsPage(page);
    await tickets.signIn({ tickets: many, pageSize: 100 });
    await tickets.goto();

    await expect(page.getByText("Showing 1 to 20 of 130")).toBeVisible();
  });

  test("an organisation with no tickets sees the owl and the way to Projects", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ tickets: [] });
    await tickets.goto();

    await expect(page.getByRole("img", { name: /owl/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No tickets yet" }),
    ).toBeVisible();
    await expect(tickets.table).toHaveCount(0);

    await page.getByRole("link", { name: "Go to Projects" }).click();

    await expect(page).toHaveURL(/\/projects$/);
  });

  test("while loading, a skeleton stands in for the table", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    const release = await tickets.signIn({ hold: true });
    await tickets.goto();

    await expect(
      page.getByRole("status", { name: "Loading Tickets" }),
    ).toBeVisible();
    await expect(page.getByText("No tickets yet")).toHaveCount(0);

    release();

    await expect(tickets.rows()).toHaveCount(3);
  });

  test("Tab reaches the actions, views, filter, sort buttons and tickets with visible focus", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();
    await expect(tickets.rows()).toHaveCount(3);

    const list = page.getByRole("button", { name: "List" });
    await expect(list).toHaveAttribute("aria-pressed", "true");
    await list.focus();
    await expectVisibleFocus(list);
    for (const target of [
      page.getByRole("button", { name: "Kanban" }),
      page.getByRole("button", { name: "Integrations" }),
      page.getByRole("button", { name: "Refresh" }),
      tickets.filter,
      tickets.sortButton("Ticket"),
      tickets.sortButton("Status"),
      tickets.sortButton("Priority"),
      tickets.sortButton("Project"),
      tickets.sortButton("Created"),
      tickets.table.getByRole("link", { name: /axios SSRF/ }),
    ]) {
      await page.keyboard.press("Tab");
      await expectVisibleFocus(target);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();
    await expect(tickets.rows()).toHaveCount(3);

    await axe(page);
    await expectPageSweep(page);
    await expectScreenshots(page, "tickets-list");
  });

  test("the empty state passes axe and matches the screenshots", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ tickets: [] });
    await tickets.goto();
    await expect(page.getByText("No tickets yet")).toBeVisible();

    await axe(page);
    await expectPageSweep(page);
    await expectScreenshots(page, "tickets-empty");
  });

  test("a failed load says so and offers to try again", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ fail: true });
    await tickets.goto();

    await expect(page.getByRole("alert")).toContainText(
      "The tickets could not be loaded.",
    );
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await axe(page);
  });
});

test.describe("Kanban board", () => {
  test("groups tickets by status in labelled columns", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();

    await page.getByRole("button", { name: "Kanban" }).click();

    const open = page.getByRole("list", { name: "Open, 1 ticket" });
    await expect(open.getByRole("listitem")).toHaveCount(1);
    await expect(open).toContainText("lodash prototype pollution");
    await expect(open).toContainText("High");
    await expect(
      page.getByRole("list", { name: "In Progress, 1 ticket" }),
    ).toContainText("axios SSRF");
    await expect(
      page.getByRole("list", { name: "Closed, 0 tickets" }),
    ).toContainText("No tickets");

    await open.getByRole("button", { name: /lodash/ }).click();
    await expect(page).toHaveURL(/\/tickets\/t-1$/);
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();
    await page.getByRole("button", { name: "Kanban" }).click();
    await expect(
      page.getByRole("list", { name: "Open, 1 ticket" }),
    ).toBeVisible();

    await axe(page);
    await expectPageSweep(page);
    await expectScreenshots(page, "tickets-kanban");
  });
});

test.describe("Ticket page", () => {
  test("opens from the list with the ticket's fix, risk and facts", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();

    await tickets.table
      .getByRole("link", { name: /lodash prototype pollution/ })
      .click();

    await expect(page).toHaveURL(/\/tickets\/t-1$/);
    const detail = tickets.detail();
    await expect(
      detail.getByRole("heading", { level: 1, name: /lodash/ }),
    ).toBeVisible();
    await expect(detail).toContainText("CVSS v3.1");
    await expect(detail).toContainText("4.17.15");
    await expect(detail).toContainText("4.17.21");
    await expect(detail).toContainText("2 active of 3");
    await expect(detail).toContainText("web-frontend");
  });

  test("changes the status and goes back to the list as it was left", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();
    await tickets.filter.fill("lodash");
    await expect(page).toHaveURL(/q=lodash/);
    await tickets.table
      .getByRole("link", { name: /lodash prototype pollution/ })
      .click();

    const start = tickets.detail().getByRole("button", {
      name: "Start progress",
    });
    // The actions come right after the header, so the keyboard reaches them early.
    for (let i = 0; i < 30; i++) {
      if (await start.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expectVisibleFocus(start);
    await start.click();
    await expect
      .poll(() => tickets.updates)
      .toEqual([{ status: "IN_PROGRESS" }]);

    await tickets
      .detail()
      .getByRole("link", { name: "Tickets", exact: true })
      .click();
    await expect(page).toHaveURL(/\/tickets\?q=lodash$/);
    await expect(tickets.filter).toHaveValue("lodash");
  });

  test("old ticket links open the ticket's page", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto("/tickets?ticket_id=t-1");

    await expect(page).toHaveURL(/\/tickets\/t-1$/);
    await expect(tickets.detail()).toContainText("CVSS v3.1");
  });

  test("says when the ticket does not exist", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ missing: true });
    await tickets.goto("/tickets/t-404");

    await expect(tickets.detail().getByText("Ticket not found")).toBeVisible();
  });

  test("a remediation shows what its external issue says, grouped by vulnerability", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ detail: remediationDetail });
    await tickets.goto("/tickets/t-9");
    const detail = tickets.detail();

    await expect(detail).toContainText("Remediation ticket");
    await expect(detail).toContainText("Installed: 3.14.1, 4.1.0");
    await expect(detail).toContainText("it leaves the current major");
    await expect(detail).toContainText("Resolves 4 vulnerabilities");
    await expect(
      detail
        .getByRole("list", { name: "Resolved vulnerabilities" })
        .locator(":scope > li"),
    ).toHaveCount(4);
    await expect(detail).toContainText(
      "lockfile-lint@4.14.1 > lockfile-lint-api@5.9.2",
    );
    await expect(
      detail.getByRole("link", { name: "Compare v4.1.0...v4.3.0 on GitHub" }),
    ).toBeVisible();
    // The stored Markdown body is not shown as text.
    await expect(detail).not.toContainText("external issue body");
    // One vulnerability's risk would misrepresent several.
    await expect(detail).not.toContainText("CVSS v3.1");
  });

  test("never scrolls sideways, even on a phone", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ detail: remediationDetail });
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      // The shell's nav is hidden on a phone, so wait for the page instead.
      await page.goto("/tickets/t-9");
      await expect(tickets.detail()).toContainText("Resolves");
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `at ${width}px`).toBeLessThanOrEqual(0);
    }
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto("/tickets/t-1");
    await expect(tickets.detail()).toContainText("CVSS v3.1");

    await axe(page);
    await expectPageSweep(page);
    await expectScreenshots(page, "ticket-page");
  });

  test("a remediation passes axe and matches the screenshots", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ detail: remediationDetail });
    await tickets.goto("/tickets/t-9");
    await expect(tickets.detail()).toContainText("Resolves");

    await axe(page);
    await expectPageSweep(page);
    await expectScreenshots(page, "ticket-page-remediation");
  });
});

test.describe("Ticket integrations", () => {
  test("the dialog traps focus, opens ClickUp setup and closes with Escape", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();
    const opener = page.getByRole("button", { name: "Integrations" });

    await opener.click();

    const dialog = page.getByRole("dialog", { name: "Ticket integrations" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("ClickUp");
    await expect(dialog).toContainText("Coming soon");
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }

    await dialog.getByRole("button", { name: "Connect ClickUp" }).click();
    const clickup = page.getByRole("dialog", { name: "Connect ClickUp" });
    await expect(clickup).toBeVisible();
    await expect(clickup.getByLabel("ClickUp API key")).toBeVisible();
    await axe(page);

    await page.keyboard.press("Escape");
    await expect(clickup).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({
      integrations: [
        {
          id: "i-1",
          provider: "CLICKUP",
          enabled: true,
          created_on: "2026-01-01T00:00:00Z",
          has_config: true,
        },
      ],
    });
    await tickets.goto();
    await page.getByRole("button", { name: "Integrations" }).click();
    const dialog = page.getByRole("dialog", { name: "Ticket integrations" });
    await expect(dialog).toContainText("Connected");
    await expect(dialog).not.toContainText("Workspace");

    await axe(page);
    await expectPageSweep(page);
    await expectScreenshots(page, "tickets-integrations");
  });
});

test.describe("ClickUp authorisation callback", () => {
  test("says why the connection failed and links back to Tickets", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto("/tickets/integrations/clickup/callback");

    await expect(
      page.getByRole("heading", { name: "Connection failed" }),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(
      "No authorization code received from ClickUp",
    );
    await axe(page);
    await expectPageSweep(page);
    await expectScreenshots(page, "tickets-clickup-callback-error");

    await page.getByRole("link", { name: "Go to Tickets" }).click();
    await expect(page).toHaveURL(/\/tickets$/);
  });
});

test.describe("Tickets read the same everywhere", () => {
  const synced = ticket(
    "t-1",
    "CVE-2026-0001: lodash prototype pollution",
    "RESOLVED",
    "HIGH",
    {
      external_status: "complete",
      has_external_links: true,
    },
  );
  const wontFix = ticket("t-4", "CVE-2026-0004: minimist", "WONT_FIX", "LOW");

  test("the board has a column for every status, adding up to the total", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ tickets: [...sampleTickets, wontFix] });
    await tickets.goto();
    await page.getByRole("button", { name: "Kanban" }).click();

    await expect(
      page.getByRole("list", { name: "Won't Fix, 1 ticket" }),
    ).toContainText("minimist");
    const stats = page.getByRole("list", { name: "Ticket numbers" });
    await expect(stats.getByRole("listitem").first()).toHaveText(/Total\s*4/);
    await expect(page.locator("main li[draggable]")).toHaveCount(4);
  });

  test("a synced ticket shows the same status in the list, board and page", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({
      tickets: [synced],
      detail: { status: "RESOLVED", external_status: "complete" },
    });
    await tickets.goto();

    await expect(tickets.rows().first().locator("td").nth(1)).toHaveText(
      "Resolved",
    );
    await page.getByRole("button", { name: "Kanban" }).click();
    await expect(
      page.getByRole("list", { name: "Resolved, 1 ticket" }),
    ).toContainText("lodash");
    await page.getByRole("button", { name: /lodash/ }).click();
    await expect(page).toHaveURL(/\/tickets\/t-1$/);
    await expect(
      tickets.detail().getByText("Resolved", { exact: true }),
    ).toBeVisible();
    await expect(tickets.detail()).not.toContainText("complete");
  });

  test("the page words the exploit chance as the vulnerability pages do", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto("/tickets?ticket_id=t-1");

    await expect(tickets.detail()).toContainText(
      "Higher than 90.0% of vulnerabilities",
    );
    await expect(tickets.detail()).not.toContainText("top 90");
  });

  test("the description is rendered and references are listed once", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    const advisory = { url: "https://example.com/advisory", tags: [] };
    await tickets.signIn({
      detail: {
        description:
          "#### Prototype Pollution in lodash.\n\nUpgrade to **4.17.21**.",
      },
      vulnerability: {
        references: [
          advisory,
          { url: "https://example.com/other", tags: [] },
          advisory,
        ],
      },
    });
    await tickets.goto("/tickets?ticket_id=t-1");
    const detail = tickets.detail();

    await expect(
      detail.getByRole("heading", { name: "Prototype Pollution in lodash." }),
    ).toBeVisible();
    await expect(detail).not.toContainText("####");
    await expect(detail).not.toContainText("**");
    await expect(
      detail.getByRole("link", { name: /example\.com\/advisory/ }),
    ).toHaveCount(1);
    await expect(
      detail.getByRole("link", { name: /example\.com/ }),
    ).toHaveCount(2);
  });

  test("status badges stay on one line", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn({ tickets: [...sampleTickets, wontFix] });
    await page.setViewportSize({ width: 900, height: 1024 });
    await tickets.goto();

    for (const label of ["In Progress", "Won't Fix"]) {
      const badge = tickets.rows().getByText(label, { exact: true });
      const box = await badge.boundingBox();
      expect(box?.height ?? 0).toBeLessThan(26);
    }
  });
});
