import { expect, type Page, test } from "@playwright/test";

import { expectNoAxeViolations, expectVisibleFocus } from "./helpers/a11y.mjs";
import { expectScreenshots } from "./helpers/screenshots.mjs";
import { ticket, TicketsPage } from "./pages/tickets.page.mjs";

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
      tickets.table.getByRole("button", { name: /axios SSRF/ }),
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
    await expect(tickets.detail()).toBeVisible();
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
    await expectScreenshots(page, "tickets-kanban");
  });
});

test.describe("Ticket detail", () => {
  test("opens from the list with the ticket's risk, details and actions", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();

    await tickets.table
      .getByRole("button", { name: /lodash prototype pollution/ })
      .click();

    const detail = tickets.detail();
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Open");
    await expect(detail).toContainText("High");
    await expect(detail).toContainText("High risk");
    await expect(detail).toContainText("CVSS v3.1");
    await expect(detail).toContainText("lodash");
    await expect(detail).toContainText("4.17.15");
    await expect(detail).toContainText("4.17.21");
    await expect(detail).toContainText("3 total occurrences");
  });

  test("keeps focus inside, changes the status and closes with Escape", async ({
    page,
  }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();
    const opener = tickets.table.getByRole("button", {
      name: /lodash prototype pollution/,
    });
    await opener.click();
    const detail = tickets.detail();
    await expect(detail).toBeVisible();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      await expect(detail.locator(":focus")).toHaveCount(1);
    }

    const start = detail.getByRole("button", { name: "Start progress" });
    await start.focus();
    await expectVisibleFocus(start);
    await start.click();
    await expect
      .poll(() => tickets.updates)
      .toEqual([{ status: "IN_PROGRESS" }]);

    await page.keyboard.press("Escape");
    await expect(detail).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test("opens straight from a ticket link", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto("/tickets?ticket_id=t-1");

    await expect(tickets.detail()).toBeVisible();
  });

  test("passes axe and matches the screenshots", async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.signIn();
    await tickets.goto();
    await tickets.table
      .getByRole("button", { name: /lodash prototype pollution/ })
      .click();
    await expect(tickets.detail()).toContainText("CVSS v3.1");

    await axe(page);
    await expectScreenshots(page, "tickets-detail");
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
          workspace_name: "Security",
          list_name: "Remediation",
        },
      ],
    });
    await tickets.goto();
    await page.getByRole("button", { name: "Integrations" }).click();
    const dialog = page.getByRole("dialog", { name: "Ticket integrations" });
    await expect(dialog).toContainText("Connected");
    await expect(dialog).toContainText("Workspace: Security");

    await axe(page);
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
    await expectScreenshots(page, "tickets-clickup-callback-error");

    await page.getByRole("link", { name: "Go to Tickets" }).click();
    await expect(page).toHaveURL(/\/tickets$/);
  });
});
