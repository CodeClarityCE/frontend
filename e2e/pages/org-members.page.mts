import { type Locator, type Page, type Route } from "@playwright/test";

import { apiUser } from "../fixtures/memberships.mjs";
import user from "../fixtures/user.json" with { type: "json" };

import { ShellPage } from "./shell.page.mjs";

const ORG = "org-123";
const DAY = 86_400_000;

/** Pages see this as now, so expiry dates and screenshots stay stable. */
export const NOW = new Date("2026-11-13T12:00:00Z");

type Role = 0 | 1 | 2 | 3;

interface Membership {
  role: Role;
  joined_on: string;
  user: Record<string, unknown>;
  organization: Record<string, unknown>;
}

/** A user as the members endpoint nests it in a membership. */
function memberUser(
  id: string,
  first: string,
  last: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return apiUser({
    id,
    first_name: first,
    last_name: last,
    handle: `${first.toLowerCase()}${last.toLowerCase()}`,
    email: `${first.toLowerCase()}@example.com`,
    created_on: "2026-01-10T09:00:00Z",
    ...overrides,
  });
}

/** The organisation each membership of the members endpoint carries. */
export const memberOrg = {
  id: ORG,
  name: "Test Organization",
  description: "Test org",
  color_scheme: "1",
  created_on: "2024-01-01T00:00:00Z",
  personal: false,
  auto_resolve_tickets: false,
};

/** A membership as the members endpoint returns it; `joined_on` is the membership's, the rest the user's. */
export function member(
  id: string,
  first: string,
  last: string,
  role: Role,
  overrides: Record<string, unknown> = {},
): Membership {
  const { joined_on = "2026-01-12T09:00:00Z", ...user } = overrides;
  return {
    role,
    joined_on: joined_on as string,
    user: memberUser(id, first, last, user),
    organization: memberOrg,
  };
}

export const sampleMembers: [Membership, Membership, Membership] = [
  member(user.id, "John", "Doe", 0, {
    handle: "JohnDoe",
    email: user.email,
    joined_on: "2025-06-01T09:00:00Z",
  }),
  member("u-alice", "Alice", "Martin", 1),
  member("u-bob", "Bob", "Keller", 3, { joined_on: "2026-03-04T09:00:00Z" }),
];

/** A member as the invitation and audit log fixtures embed them, with their role. */
function person(m: Membership): Record<string, unknown> {
  return { ...m.user, role: m.role };
}

/** An open invitation as the invitations endpoint returns it. */
export function invitation(
  id: string,
  email: string,
  role: Role,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    created_on: "2026-11-10T09:00:00Z",
    created_by: person(sampleMembers[0]),
    role,
    organization_id: ORG,
    user_email: email,
    ttl: new Date(NOW.getTime() + 5 * DAY + 3_600_000).toISOString(),
    ...overrides,
  };
}

export const sampleInvitations = [
  invitation("inv-1", "carol@example.com", 3),
  invitation("inv-2", "dave@example.com", 2, {
    created_by: person(sampleMembers[1]),
    created_on: "2026-11-12T09:00:00Z",
  }),
];

/** An audit log entry as the audit logs endpoint returns it. */
export function auditLog(
  id: string,
  severity: 0 | 1 | 2 | 3,
  action: string,
  description: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    action_severity: severity,
    action_class:
      ["Project", "Analyzer"].find((kind) => action.startsWith(kind)) ??
      "Organization",
    action,
    description,
    blame_on: person(sampleMembers[0]),
    blame_on_email: user.email,
    created_on: "2026-11-12T10:30:00Z",
    ...overrides,
  };
}

export const sampleLogs = [
  auditLog("log-1", 0, "ProjectCreate", "Added the project web-frontend", {
    created_on: "2026-11-12T10:30:00Z",
  }),
  auditLog(
    "log-2",
    2,
    "OrganizationMembershipRevoked",
    "Removed eve@example.com",
    {
      blame_on: person(sampleMembers[1]),
      blame_on_email: "alice@example.com",
      created_on: "2026-11-11T08:00:00Z",
    },
  ),
  auditLog("log-3", 1, "AnalyzerUpdate", "Updated Default analyzer", {
    blame_on: undefined,
    blame_on_email: "former@example.com",
    created_on: "2026-11-10T16:45:00Z",
  }),
];

function paginated(data: unknown[]): Record<string, unknown> {
  return {
    data,
    page: 0,
    entry_count: data.length,
    entries_per_page: 100,
    total_entries: data.length,
    total_pages: 1,
    matching_count: data.length,
    filter_count: {},
    status_code: 200,
    status: "success",
  };
}

const ok = { status_code: 200, status: "success" };

/** The organisation members, invitations and audit log pages, with their API mocked. */
export class OrgMembersPage {
  readonly page: Page;
  readonly shell: ShellPage;
  readonly heading: Locator;
  readonly table: Locator;
  readonly filter: Locator;
  /** Paths of DELETE requests, in order. */
  readonly deleted: string[] = [];
  /** Bodies of invitation requests, in order. */
  readonly invited: unknown[] = [];
  /** Paths of resend requests, in order. */
  readonly resent: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.shell = new ShellPage(page);
    this.heading = page.getByRole("heading", { level: 1 }).last();
    this.table = page.getByRole("table");
    this.filter = page.getByRole("searchbox");
  }

  /**
   * Signs in and answers the member, invitation and audit log endpoints.
   * `hold` keeps the list requests pending until the returned function runs.
   */
  async signIn(
    options: {
      members?: unknown[];
      invitations?: unknown[];
      logs?: unknown[];
      /** Overrides the organisation the header loads, e.g. `{ personal: true }`. */
      org?: Record<string, unknown>;
      fail?: boolean;
      hold?: boolean;
    } = {},
  ): Promise<() => void> {
    // A fixed clock breaks mouse opening of selects, so time flows from NOW.
    await this.page.clock.install({ time: NOW });
    await this.shell.signIn();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let members = [...(options.members ?? sampleMembers)] as {
      user: { id: string };
    }[];
    let invitations = [...(options.invitations ?? sampleInvitations)] as {
      id: string;
    }[];
    const logs = options.logs ?? sampleLogs;

    const list = async (route: Route, data: unknown[]): Promise<void> => {
      if (options.hold) await held;
      if (options.fail) {
        return route.fulfill({
          status: 500,
          json: { status_code: 500, status: "failure", error_code: "x" },
        });
      }
      return route.fulfill({ json: paginated(data) });
    };

    if (options.org) {
      const org = {
        ...memberOrg,
        role: 0,
        number_of_members: 1,
        ...options.org,
      };
      await this.page.route(`**/api/org/${ORG}`, (route) =>
        route.fulfill({ json: { data: { joined_on: NOW, ...org } } }),
      );
    }
    await this.page.route(`**/api/org/${ORG}/members**`, (route) => {
      const request = route.request();
      if (request.method() === "DELETE") {
        const path = new URL(request.url()).pathname;
        this.deleted.push(path);
        const id = path.split("/").pop();
        members = members.filter((m) => m.user.id !== id);
        return route.fulfill({ json: ok });
      }
      return list(route, members);
    });
    await this.page.route(`**/api/org/${ORG}/invitations**`, (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() === "DELETE") {
        this.deleted.push(path);
        const id = path.split("/").pop();
        invitations = invitations.filter((i) => i.id !== id);
        return route.fulfill({ json: ok });
      }
      if (request.method() === "POST") {
        this.resent.push(path);
        return route.fulfill({ json: ok });
      }
      return list(route, invitations);
    });
    await this.page.route(`**/api/org/${ORG}/create_invite`, (route) => {
      const body = route.request().postDataJSON() as { user_email: string };
      this.invited.push(body);
      invitations = [
        ...invitations,
        invitation("inv-new", body.user_email, 3) as { id: string },
      ];
      return route.fulfill({ status: 201, json: ok });
    });
    await this.page.route(`**/api/org/${ORG}/audit_logs**`, (route) =>
      list(route, logs),
    );
    return release;
  }

  async gotoMembers(): Promise<void> {
    await this.shell.goto(`/orgs/manage/members/${ORG}`);
  }

  async gotoInvites(action = "manage"): Promise<void> {
    await this.shell.goto(`/orgs/${action}/invites/${ORG}`);
  }

  async gotoLogs(search?: string): Promise<void> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    await this.shell.goto(`/orgs/manage/logs/${ORG}${query}`);
  }

  /** The table's body rows, without the header row. */
  rows(): Locator {
    return this.table.locator("tbody tr");
  }

  row(text: string): Locator {
    return this.rows().filter({ hasText: text });
  }

  columnHeader(name: string): Locator {
    return this.table.getByRole("columnheader", { name });
  }

  sortButton(name: string): Locator {
    return this.columnHeader(name).getByRole("button");
  }
}
