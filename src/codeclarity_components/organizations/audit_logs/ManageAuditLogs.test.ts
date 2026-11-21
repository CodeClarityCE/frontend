import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";

import ManageAuditLogs from "./ManageAuditLogs.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const logsPath = `/org/${org.id}/audit_logs`;

function entry(id: string, description: string): object {
  return {
    id,
    action_severity: 1,
    action_class: "Organization",
    action: "OrganizationMemberInvited",
    description,
    blame_on_email: "jane@example.com",
    created_on: "2026-11-17T10:00:00Z",
  };
}

function page(data: object[], total = data.length): object {
  return {
    data,
    entry_count: data.length,
    page: 0,
    entries_per_page: 20,
    total_entries: total,
    matching_count: total,
    total_pages: Math.ceil(total / 20),
    filter_count: {},
    status: "success",
  };
}

const invited = page([entry("log-1", "The User invited bob@example.com")]);

// Opens the audit log page; null leaves the logs unanswered.
async function openLogs(
  logs: object | null = invited,
  options: { status?: number; role?: MemberRole } = {},
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  if (logs) app.http.on("GET", logsPath, logs, options.status);
  if (options.role !== undefined) {
    app.http.on("GET", `/org/${org.id}`, {
      data: { ...org, role: options.role },
    });
  }
  await app.visit(`/orgs/manage/logs/${org.id}`);
  render(ManageAuditLogs, { props: { orgId: org.id }, global: app.global });
  return app;
}

// The query of the latest audit log request.
const lastQuery = (app: TestApp): Record<string, string> =>
  Object.fromEntries(
    app.http.requests.findLast((r) => r.path === logsPath)?.query ?? [],
  );

describe("ManageAuditLogs", () => {
  it("lists the entries the API returns, newest first", async () => {
    const app = await openLogs();

    expect(
      await screen.findByText("The User invited bob@example.com"),
    ).toBeInTheDocument();
    expect(lastQuery(app)).toEqual({
      page: "0",
      entries_per_page: "20",
      search_key: "",
      sort_key: "created_on",
      sort_direction: "DESC",
    });
  });

  it("searches on the API", async () => {
    const app = await openLogs();
    await screen.findByText("The User invited bob@example.com");

    await userEvent.type(screen.getByRole("searchbox"), "bob");

    await vi.waitFor(() => expect(lastQuery(app).search_key).toBe("bob"));
  });

  it("sorts on the API", async () => {
    const app = await openLogs();
    const table = await screen.findByRole("table");

    await userEvent.click(
      within(table).getByRole("button", { name: /Action/ }),
    );

    await vi.waitFor(() =>
      expect(lastQuery(app)).toMatchObject({
        sort_key: "action",
        sort_direction: "ASC",
      }),
    );
  });

  it("pages on the API", async () => {
    const app = await openLogs(page([entry("log-1", "First")], 25));
    await screen.findByText("First");

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));

    await vi.waitFor(() => expect(lastQuery(app).page).toBe("1"));
  });

  it("says plainly when there are no entries", async () => {
    await openLogs(page([]));

    expect(
      await screen.findByText("No audit log entries yet."),
    ).toBeInTheDocument();
  });

  it("says plainly when the role does not allow reading them", async () => {
    await openLogs(
      {
        status_code: 403,
        status: "failure",
        error_code: "NotAuthorized",
        error_message: "Not authorized",
      },
      { status: 403 },
    );

    expect(
      await screen.findByText(
        "You do not have permission to see this organisation's audit logs.",
      ),
    ).toBeInTheDocument();
  });

  it("says the entries could not be loaded and offers a retry", async () => {
    const app = await openLogs(null);

    expect(
      await screen.findByText("The audit logs could not be loaded."),
    ).toBeInTheDocument();

    app.http.on("GET", logsPath, invited);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByText("The User invited bob@example.com"),
    ).toBeInTheDocument();
  });

  it("sends members below admin back to the organisation overview", async () => {
    const app = await openLogs(invited, { role: MemberRole.MODERATOR });

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.params).toMatchObject({
        action: "manage",
        page: "main",
        orgId: org.id,
      }),
    );
  });
});
