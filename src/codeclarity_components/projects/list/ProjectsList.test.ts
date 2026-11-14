import { fireEvent, render, screen, within } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import ProjectsList from "./ProjectsList.vue";

const { getProjects, deleteProject } = vi.hoisted(() => ({
  getProjects: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock("@/codeclarity_components/projects/project.repository", () => ({
  ProjectRepository: class {
    getProjects = getProjects;
    deleteProject = deleteProject;
  },
  ProjectsSortInterface: { NAME: "name" },
}));

vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError: class extends Error {},
}));

// The languages column asks the results API; not under test here.
vi.mock(
  "@/codeclarity_components/projects/components/ProjectLanguageDetection.vue",
  () => ({
    default: { name: "ProjectLanguageDetection", template: "<span />" },
  }),
);

// The real helpers, so dialogs and inputs behave as in the browser.
vi.mock("@vueuse/core", async () => await vi.importActual("@vueuse/core"));

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

function page(data: unknown[], totalPages = 1) {
  return { data, total_pages: totalPages };
}

function renderList(): void {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      {
        path: "/projects/:page?",
        name: "projects",
        component: { template: "<div />" },
      },
      {
        path: "/analyses/:page?",
        name: "analyses",
        component: { template: "<div />" },
      },
      { path: "/results", name: "results", component: { template: "<div />" } },
      {
        path: "/orgs/:action?/:page?/:orgId?",
        name: "orgs",
        component: { template: "<div />" },
      },
    ],
  });
  render(ProjectsList, { global: { plugins: [router] } });
}

describe("ProjectsList", () => {
  beforeEach(() => {
    getProjects.mockReset();
    deleteProject.mockReset();
    getProjects.mockResolvedValue(page(projects));
  });

  it("lists each project with its source and latest analysis in words", async () => {
    renderList();

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
    expect(within(row("Local archive")).getByText("Not analysed")).toBeTruthy();
  });

  it("counts projects and analyses in the overview", async () => {
    renderList();

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
    getProjects
      .mockResolvedValueOnce(page([projects[0]], 2))
      .mockResolvedValueOnce(page([projects[1]], 2));
    renderList();

    await screen.findByText("example/api-server");
    expect(screen.getByText("example/web-frontend")).toBeTruthy();
    expect(
      getProjects.mock.calls.map(([options]) => options.pagination.page),
    ).toEqual([0, 1]);
  });

  it("shows the owl and Add a Project when there are no projects", async () => {
    getProjects.mockResolvedValue(page([]));
    renderList();

    expect(await screen.findByText("No Projects yet")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Add a Project/ })).toBeTruthy();
  });

  it("says when the projects cannot be loaded and retries", async () => {
    getProjects.mockRejectedValueOnce(new Error("down"));
    renderList();

    expect(
      await screen.findByText("The projects could not be loaded."),
    ).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("example/web-frontend")).toBeTruthy();
  });

  it("deletes a project only after the confirmation", async () => {
    deleteProject.mockResolvedValue({});
    renderList();
    await screen.findByText("example/api-server");

    await fireEvent.click(
      screen.getByRole("button", { name: "Delete example/api-server" }),
    );
    expect(deleteProject).not.toHaveBeenCalled();
    await fireEvent.click(
      await screen.findByRole("button", { name: "Delete project" }),
    );

    expect(deleteProject).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "p-2" }),
    );
  });
});
