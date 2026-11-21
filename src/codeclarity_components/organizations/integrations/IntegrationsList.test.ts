import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";

import {
  createTestApp,
  org,
  type TestApp,
  withToaster,
} from "../../../../tests/real-app";

import IntegrationsList from "./IntegrationsList.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const vcsPath = `/org/${org.id}/integrations/vcs`;

const github = {
  id: "vcs-1",
  added_on: "2025-01-10T10:00:00Z",
  added_by: "u-1",
  service_domain: "github.com",
  integration_type: "VCS",
  integration_provider: "GITHUB",
  invalid: false,
};

const gitlab = {
  ...github,
  id: "vcs-2",
  service_domain: "gitlab.example.com",
  integration_provider: "GITLAB",
  invalid: true,
};

const page = (data: unknown[]) => ({
  data,
  entry_count: data.length,
  page: 0,
  entries_per_page: 100,
  total_entries: data.length,
  total_pages: 1,
  matching_count: data.length,
  filter_count: {},
  status: "success",
});

// Opens the integrations page of the signed-in user's org.
async function openList(
  options: { vcs?: boolean; role?: MemberRole } = {},
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  if (options.vcs !== false)
    app.http.on("GET", vcsPath, page([github, gitlab]));
  app.http.on("GET", `/org/${org.id}/tickets/integrations`, { data: [] });
  if (options.role !== undefined) {
    app.http.on("GET", `/org/${org.id}`, {
      data: { ...org, role: options.role },
    });
  }
  await app.visit(`/orgs/manage/integrations/${org.id}`);
  render(withToaster(IntegrationsList, { orgId: org.id }), {
    global: app.global,
  });
  return app;
}

const tile = (label: string): string =>
  within(screen.getByLabelText("Integration health"))
    .getAllByRole("listitem")
    .find((li) => li.textContent?.includes(label))?.textContent ?? "";

describe("IntegrationsList", () => {
  it("lists each connected service with its health", async () => {
    await openList();

    const table = await screen.findByRole("table");
    await within(table).findByText("github.com");
    expect(table).toHaveTextContent("GitHub");
    expect(table).toHaveTextContent("Healthy");
    expect(table).toHaveTextContent("GitLab");
    expect(table).toHaveTextContent("Invalid");
  });

  it("counts healthy and invalid integrations", async () => {
    await openList();
    await screen.findByText("github.com");

    expect(tile("Healthy")).toContain("1");
    expect(tile("Invalid or expired")).toContain("1");
    expect(tile("Total")).toContain("2");
  });

  it("offers to add only the services that are not connected", async () => {
    await openList();
    await screen.findByText("github.com");

    expect(screen.getByRole("link", { name: /Add ClickUp/ })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /Add GitHub/ }),
    ).not.toBeInTheDocument();
  });

  it("says when the version control integrations fail and retries", async () => {
    const app = await openList({ vcs: false });

    expect(
      await screen.findByText(
        "The version control integrations failed to load.",
      ),
    ).toBeInTheDocument();

    app.http.on("GET", vcsPath, page([github, gitlab]));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("gitlab.example.com")).toBeInTheDocument();
  });

  it("deletes an integration after confirmation", async () => {
    const app = await openList();
    app.http.on("DELETE", `/org/${org.id}/integrations/vcs-2`, {
      status_code: 200,
      status: "success",
    });

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Delete the GitLab integration on gitlab.example.com",
      }),
    );
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Delete integration",
      }),
    );

    expect(
      await screen.findByText("Deleted the GitLab integration"),
    ).toBeInTheDocument();
    expect(
      app.http.requests.some(
        (r) =>
          r.method === "DELETE" &&
          r.path === `/org/${org.id}/integrations/vcs-2`,
      ),
    ).toBe(true);
  });

  it("sends members who are not admins to the organisation overview", async () => {
    const app = await openList({ role: MemberRole.USER });

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.params).toMatchObject({
        action: "manage",
        page: "main",
        orgId: org.id,
      }),
    );
  });
});
