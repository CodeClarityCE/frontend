import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp, org } from "../../../tests/real-app";

import ProjectsView from "./ProjectsView.vue";

const emptyPage = {
  data: [],
  entry_count: 0,
  page: 0,
  entries_per_page: 100,
  total_entries: 0,
  total_pages: 1,
  status: "success",
  matching_count: 0,
  filter_count: {},
};

// The projects page at this subpage, with an organisation that has nothing yet.
async function renderPage(page?: string): Promise<ReturnType<typeof render>> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}/projects`, emptyPage);
  app.http.on("GET", `/org/${org.id}/integrations/vcs`, emptyPage);
  await app.visit(page ? `/projects/${page}` : "/projects");
  return render(ProjectsView, { props: { page }, global: app.global });
}

describe("ProjectsView", () => {
  it("shows the project list by default", async () => {
    await renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
  });

  it("shows the project creation on the add page", async () => {
    await renderPage("add");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Add a Project" }),
    ).toBeInTheDocument();
  });

  it("does not add a second main landmark inside the shell", async () => {
    const { container } = await renderPage();

    await screen.findByRole("heading", { level: 1, name: "Projects" });
    expect(container.querySelector("main")).toBeNull();
  });
});
