import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import ProjectsView from "./ProjectsView.vue";

vi.mock("./list/ProjectsList.vue", () => ({
  __esModule: true,
  default: { name: "ProjectsList", template: "<h1>Projects</h1>" },
}));

vi.mock("./create/CreateProject.vue", () => ({
  __esModule: true,
  default: { name: "CreateProject", template: "<h1>Add a Project</h1>" },
}));

describe("ProjectsView", () => {
  it("shows the project list by default", async () => {
    render(ProjectsView);

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeTruthy();
  });

  it("shows the project creation on the add page", async () => {
    render(ProjectsView, { props: { page: "add" } });

    expect(
      await screen.findByRole("heading", { name: "Add a Project" }),
    ).toBeTruthy();
  });

  it("does not add a second main landmark inside the shell", async () => {
    const { container } = render(ProjectsView);

    await screen.findByRole("heading", { name: "Projects" });
    expect(container.querySelector("main")).toBeNull();
  });
});
