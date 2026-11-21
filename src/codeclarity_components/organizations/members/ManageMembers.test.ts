import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";

import {
  createTestApp,
  org,
  type TestApp,
  user,
  withToaster,
} from "../../../../tests/real-app";

import ManageMembers from "./ManageMembers.vue";

const membersPath = `/org/${org.id}/members`;

function member(id: string, first: string, role: MemberRole): object {
  return {
    role,
    joined_on: "2025-01-10T10:00:00Z",
    user: {
      id,
      first_name: first,
      last_name: "Doe",
      handle: first.toLowerCase(),
      email: `${first.toLowerCase()}@example.com`,
    },
    organization: {
      id: org.id,
      name: org.name,
      description: org.description,
      color_scheme: org.color_scheme,
      created_on: org.created_on,
      personal: false,
    },
  };
}

// The signed-in user is Jane, an admin.
const sample = [
  member(user.id, "Jane", MemberRole.ADMIN),
  member("u-2", "Bob", MemberRole.USER),
  member("u-3", "Olga", MemberRole.OWNER),
  member("u-4", "Mia", MemberRole.MODERATOR),
  member("u-5", "Adam", MemberRole.ADMIN),
];

function page(data: object[], totalPages = 1): object {
  return {
    data,
    entry_count: data.length,
    page: 0,
    entries_per_page: 100,
    total_entries: data.length,
    total_pages: totalPages,
    matching_count: data.length,
    filter_count: {},
    status: "success",
  };
}

// Opens the members page as a member with this role; null leaves the members unanswered.
async function openMembers(
  options: {
    role?: MemberRole;
    personal?: boolean;
    members?: object | null;
    orgId?: string;
  } = {},
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}`, {
    data: {
      ...org,
      role: options.role ?? MemberRole.ADMIN,
      personal: options.personal ?? false,
    },
  });
  if (options.members !== null) {
    app.http.on("GET", membersPath, options.members ?? page(sample));
  }
  await app.visit(`/orgs/manage/members/${org.id}`);
  render(withToaster(ManageMembers, { orgId: options.orgId ?? org.id }), {
    global: app.global,
  });
  return app;
}

// Waits for the members table to show its rows.
async function table(): Promise<HTMLElement> {
  const found = await screen.findByRole("table");
  await within(found).findByText("Bob Doe");
  return found;
}

const button = (name: string) => screen.queryByRole("button", { name });

async function removeBob(): Promise<void> {
  await table();
  await userEvent.click(button("Remove Bob Doe")!);
  expect(
    await screen.findByText("Remove Bob Doe from the organisation?"),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Remove member" }));
}

describe("ManageMembers", () => {
  it("shows the Members heading", async () => {
    await openMembers();

    expect(
      await screen.findByRole("heading", { level: 1, name: /Members/ }),
    ).toBeInTheDocument();
  });

  it("shows a loading status until the members arrive", async () => {
    await openMembers({ members: null });

    expect(
      screen.getByRole("status", { name: "Loading Members" }),
    ).toBeInTheDocument();
  });

  it("lists every member with the role in words", async () => {
    await openMembers();

    const rows = await table();
    expect(rows).toHaveTextContent("Jane Doe");
    expect(rows).toHaveTextContent("(you)");
    expect(rows).toHaveTextContent("User");
    expect(rows).toHaveTextContent("Owner");
  });

  it("says the members could not be loaded and offers a retry", async () => {
    const app = await openMembers({ members: null });

    expect(
      await screen.findByText("The members could not be loaded."),
    ).toBeInTheDocument();

    app.http.on("GET", membersPath, page(sample));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    await table();
  });

  it("offers invitations to admins", async () => {
    await openMembers();
    await table();

    expect(
      screen.getByRole("link", { name: /Invite a member/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open invitations/ }),
    ).toBeInTheDocument();
  });

  it("hides invitations in a personal organisation", async () => {
    await openMembers({ personal: true });
    await table();

    expect(
      screen.queryByRole("link", { name: /Invite a member/ }),
    ).not.toBeInTheDocument();
  });

  it("loads every page of members so sorting covers them all", async () => {
    const app = createTestApp({ signedIn: true });
    // Answers each page of members with its own slice.
    const fake = globalThis.fetch;
    vi.stubGlobal("fetch", (input: string, init?: RequestInit) => {
      const second = new URL(input).searchParams.get("page") === "1";
      app.http.on(
        "GET",
        membersPath,
        second ? page(sample.slice(2), 2) : page(sample.slice(0, 2), 2),
      );
      return fake(input, init);
    });
    await app.visit(`/orgs/manage/members/${org.id}`);
    render(ManageMembers, { props: { orgId: org.id }, global: app.global });

    expect(within(await table()).getByText("Olga Doe")).toBeInTheDocument();
    expect(
      app.http.requests
        .filter((r) => r.path === membersPath)
        .map((r) => r.query.get("page")),
    ).toEqual(["0", "1"]);
  });

  it("sorting by Role puts owners first", async () => {
    await openMembers();
    const rows = await table();

    await userEvent.click(within(rows).getByRole("button", { name: /Role/ }));

    expect(within(rows).getAllByRole("row")[1]).toHaveTextContent("Olga Doe");
  });

  it("filtering narrows the rows and says when nothing matches", async () => {
    await openMembers();
    const rows = await table();
    const filter = screen.getByRole("searchbox");

    await userEvent.type(filter, "bob");
    expect(within(rows).getAllByRole("row")).toHaveLength(2);

    await userEvent.clear(filter);
    await userEvent.type(filter, "nobody here");
    expect(rows).toHaveTextContent("No members match.");
  });

  it("sends users without admin rights back to the organisation overview", async () => {
    const app = await openMembers({ role: MemberRole.USER });

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.params).toMatchObject({
        action: "manage",
        page: "main",
        orgId: org.id,
      }),
    );
  });

  it("goes back when no organisation is given", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    await app.router.push(`/orgs/manage/members/${org.id}`);
    render(ManageMembers, { props: { orgId: "" }, global: app.global });

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.path).toBe("/projects"),
    );
  });

  it("offers an admin Remove for a moderator, a user and another admin", async () => {
    await openMembers();
    await table();

    expect(button("Remove Bob Doe")).toBeInTheDocument();
    expect(button("Remove Mia Doe")).toBeInTheDocument();
    expect(button("Remove Adam Doe")).toBeInTheDocument();
  });

  it("offers an admin no Remove for an owner or themselves", async () => {
    await openMembers();
    await table();

    expect(button("Remove Olga Doe")).not.toBeInTheDocument();
    expect(button("Remove Jane Doe")).not.toBeInTheDocument();
  });

  it("offers a moderator no Remove at all", async () => {
    await openMembers({ role: MemberRole.MODERATOR });
    const rows = await table();

    expect(button("Remove Bob Doe")).not.toBeInTheDocument();
    expect(rows).not.toHaveTextContent("Actions");
  });

  it("offers no Remove in a personal organisation", async () => {
    await openMembers({ personal: true });
    await table();

    expect(button("Remove Bob Doe")).not.toBeInTheDocument();
  });

  it.each([
    ["NotAuthorized", "Your role does not allow removing this member"],
    ["CannotRevokeOwnMembership", "You cannot remove yourself"],
  ])("says plainly why the API refused with %s", async (code, message) => {
    const app = await openMembers();
    app.http.on(
      "DELETE",
      `${membersPath}/u-2`,
      {
        status_code: 403,
        status: "failure",
        error_code: code,
        error_message: code,
      },
      403,
    );

    await removeBob();

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("removes a member after confirming and reloads the list", async () => {
    const app = await openMembers();
    app.http.on("DELETE", `${membersPath}/u-2`, {
      status_code: 200,
      status: "success",
    });

    await table();
    app.http.on("GET", membersPath, page([sample[0]!, sample[2]!]));
    await removeBob();

    expect(await screen.findByText("Removed Bob Doe")).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(screen.getByRole("table")).not.toHaveTextContent("Bob Doe"),
    );
    expect(
      app.http.requests.some(
        (r) => r.method === "DELETE" && r.path === `${membersPath}/u-2`,
      ),
    ).toBe(true);
  });
});
