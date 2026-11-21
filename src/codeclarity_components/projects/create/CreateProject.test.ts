import { fireEvent, render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/user";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";

import CreateProject from "./CreateProject.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

function vcs(provider: string, invalid = false) {
  return {
    id: `${provider}-1`,
    added_on: "2024-01-01T00:00:00Z",
    added_by: "u-1",
    integration_type: "VCS",
    integration_provider: provider,
    service_domain: `${provider.toLowerCase()}.com`,
    invalid,
  };
}

// The organisation's integrations as the API lists them.
const page = (data: object[]) => ({
  data,
  entry_count: data.length,
  page: 0,
  entries_per_page: 100,
  total_entries: data.length,
  total_pages: 1,
  status: "success",
  matching_count: data.length,
  filter_count: {},
});

const vcsPath = (orgId: string): string => `/org/${orgId}/integrations/vcs`;

// The add project page, with these integrations answered.
async function openAddProject(
  integrations: object[] = [vcs("GITHUB"), vcs("GITLAB")],
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", vcsPath(org.id), page(integrations));
  await app.visit("/projects/add");
  render(CreateProject, { global: app.global });
  return app;
}

describe("CreateProject", () => {
  it("offers each valid integration, the popular list and the upload", async () => {
    await openAddProject([vcs("GITHUB"), vcs("GITLAB", true)]);

    const methods = await screen.findByRole("list", {
      name: "Import methods",
    });
    const buttons = within(methods).getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]!.textContent).toMatch(/^\s*GitHub\s+Import from/);
    expect(buttons[1]!.textContent).toMatch(/Popular on GitHub/);
    expect(buttons[2]!.textContent).toMatch(/Upload an archive/);
  });

  it("opens the chosen importer and goes back to the methods", async () => {
    await openAddProject();

    await fireEvent.click(await screen.findByText("GitLab"));
    expect(
      screen.getByRole("heading", { name: "GitLab repositories" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Import methods" }),
    ).not.toBeInTheDocument();

    await fireEvent.click(
      screen.getByRole("button", { name: "Back to import methods" }),
    );
    expect(
      screen.getByRole("list", { name: "Import methods" }),
    ).toBeInTheDocument();
  });

  it("opens the upload form", async () => {
    await openAddProject();

    await fireEvent.click(await screen.findByText("Upload an archive"));

    expect(screen.getByLabelText("Archive")).toBeInTheDocument();
  });

  it("explains what to do without any integration", async () => {
    await openAddProject([]);

    expect(
      await screen.findByText("No GitHub or GitLab integration yet"),
    ).toBeInTheDocument();
  });

  it("says when the integrations cannot be loaded and retries", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on(
      "GET",
      vcsPath(org.id),
      { error_code: "InternalError", error_message: "down" },
      500,
    );
    await app.visit("/projects/add");
    render(CreateProject, { global: app.global });

    expect(
      await screen.findByText(/The integrations could not be loaded/),
    ).toBeInTheDocument();
    app.http.on("GET", vcsPath(org.id), page([vcs("GITHUB")]));
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("list", { name: "Import methods" }),
    ).toBeInTheDocument();
  });

  it("lists the new organisation's integrations after switching", async () => {
    const app = await openAddProject([vcs("GITHUB")]);
    expect(await screen.findByText("GitHub")).toBeInTheDocument();

    app.http.on("GET", vcsPath("org-2"), page([vcs("GITLAB")]));
    const userStore = useUserStore();
    userStore.setDefaultOrg({ ...userStore.defaultOrg!, id: "org-2" });

    expect(await screen.findByText("GitLab")).toBeInTheDocument();
    expect(screen.queryByText("GitHub")).toBeNull();
  });
});
