import { fireEvent, render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";

import ProjectsList from "./ProjectsList.vue";

const projectsPath = `/org/${org.id}/projects`;

function analysis(id: string, status: string, created_on: string) {
  return { id, status, created_on, steps: [], schedule_type: "once" };
}

const projects = [
  {
    id: "p-1",
    name: "example/web-frontend",
    type: "GITHUB",
    added_on: "2026-10-03T09:00:00Z",
    analyses: [analysis("a-1", "completed", "2026-11-02T09:00:00Z")],
  },
  {
    id: "p-2",
    name: "example/api-server",
    type: "GITLAB",
    added_on: "2026-10-02T09:00:00Z",
    analyses: [analysis("a-2", "failure", "2026-11-01T09:00:00Z")],
  },
  {
    id: "p-3",
    name: "Local archive",
    type: "FILE",
    added_on: "2026-10-01T09:00:00Z",
    analyses: [],
  },
];

// One page of projects as the API lists them.
function page(data: unknown[], totalPages = 1, pageNumber = 0) {
  return {
    data,
    entry_count: data.length,
    page: pageNumber,
    entries_per_page: 100,
    total_entries: data.length,
    total_pages: totalPages,
    status: "success",
    matching_count: data.length,
    filter_count: {},
  };
}

// Answers each request for the project list with the page it asks for.
function answerByPage(app: TestApp, pages: unknown[]): void {
  const fake = globalThis.fetch;
  vi.stubGlobal("fetch", (input: string, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith(projectsPath)) {
      app.http.on(
        "GET",
        projectsPath,
        pages[Number(url.searchParams.get("page"))],
      );
    }
    return fake(input, init);
  });
}

// The projects page, with the project list answered.
async function renderList(answer: unknown = page(projects)): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", projectsPath, answer);
  await app.visit("/projects");
  render(ProjectsList, { global: app.global });
  return app;
}

describe("ProjectsList", () => {
  it("lists each project with its source and latest analysis in words", async () => {
    await renderList();

    const row = (name: string) =>
      screen.getByText(name).closest("tr") as HTMLElement;
    await screen.findByText("example/web-frontend");
    expect(
      within(row("example/web-frontend")).getByText("Completed"),
    ).toBeTruthy();
    expect(
      within(row("example/web-frontend")).getByText("GitHub"),
    ).toBeTruthy();
    expect(within(row("example/api-server")).getByText("Failed")).toBeTruthy();
    // Neither the latest analysis nor the languages exist yet.
    expect(
      within(row("Local archive")).getAllByText("Not analysed"),
    ).toHaveLength(2);
  });

  it("counts projects and analyses in the overview", async () => {
    await renderList();

    const overview = await screen.findByRole("list", {
      name: "Project overview",
    });
    const tiles = within(overview).getAllByRole("listitem");
    expect(tiles.map((tile) => tile.textContent?.trim())).toEqual([
      "Projects3",
      "Completed analyses1",
      "Running analyses0",
      "Last analysisNov 2, 2026",
    ]);
  });

  it("loads every page of projects", async () => {
    const app = createTestApp({ signedIn: true });
    answerByPage(app, [page([projects[0]], 2, 0), page([projects[1]], 2, 1)]);
    await app.visit("/projects");
    render(ProjectsList, { global: app.global });

    await screen.findByText("example/api-server");
    expect(screen.getByText("example/web-frontend")).toBeTruthy();
    expect(
      app.http.requests
        .filter((r) => r.path === projectsPath)
        .map((r) => r.query.get("page")),
    ).toEqual(["0", "1"]);
  });

  it("shows the owl and Add a Project when there are no projects", async () => {
    await renderList(page([]));

    expect(await screen.findByText("No Projects yet")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Add a Project/ })).toBeTruthy();
  });

  it("says when the projects cannot be loaded and retries", async () => {
    const app = await renderList({
      error_code: "InternalError",
      error_message: "down",
    });

    expect(
      await screen.findByText("The projects could not be loaded."),
    ).toBeTruthy();
    app.http.on("GET", projectsPath, page(projects));
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("example/web-frontend")).toBeTruthy();
  });

  it.each([
    ["example/api-server", "its 1 analysis, its tickets"],
    ["Local archive", "The project and its tickets are deleted."],
  ])(
    "warns that deleting %s deletes its tickets but not ClickUp tasks",
    async (name, wording) => {
      await renderList();
      await screen.findByText(name);

      await fireEvent.click(
        screen.getByRole("button", { name: `Delete ${name}` }),
      );

      const dialog = await screen.findByRole("dialog");
      expect(dialog.textContent).toContain(wording);
      expect(dialog.textContent).toContain(
        "Tasks already created in ClickUp are kept.",
      );
    },
  );

  it("deletes a project only after the confirmation", async () => {
    const app = await renderList();
    app.http.on("DELETE", `${projectsPath}/p-2`, {
      status_code: 200,
      status: "success",
    });
    await screen.findByText("example/api-server");
    const deletes = () =>
      app.http.requests.filter((r) => r.method === "DELETE").map((r) => r.path);

    await fireEvent.click(
      screen.getByRole("button", { name: "Delete example/api-server" }),
    );
    expect(deletes()).toEqual([]);
    await fireEvent.click(
      await screen.findByRole("button", { name: "Delete project" }),
    );

    await vi.waitFor(() => expect(deletes()).toEqual([`${projectsPath}/p-2`]));
  });
});
