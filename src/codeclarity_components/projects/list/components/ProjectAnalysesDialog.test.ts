import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import type { Project } from "@/codeclarity_components/projects/project.entity";

import {
  createTestApp,
  org,
  type TestApp,
} from "../../../../../tests/real-app";

import ProjectAnalysesDialog from "./ProjectAnalysesDialog.vue";

const project = {
  id: "p-1",
  name: "example/web-frontend",
  analyses: [
    {
      id: "a-1",
      status: "completed",
      created_on: "2026-11-02T09:00:00Z",
      steps: [],
      schedule_type: "once",
    },
  ],
} as unknown as Project;

const analysisPath = `/org/${org.id}/projects/p-1/analyses/a-1`;

// The projects page with the project's analyses dialog open, at the delete confirmation.
async function confirmDelete(): Promise<{
  app: TestApp;
  view: ReturnType<typeof render>;
}> {
  const app = createTestApp({ signedIn: true });
  app.http.on("DELETE", analysisPath, { status_code: 200, status: "success" });
  await app.visit("/projects");
  const view = render(ProjectAnalysesDialog, {
    props: { project, open: true },
    global: app.global,
  });
  await fireEvent.click(
    await screen.findByRole("button", {
      name: /^Delete the analysis started/,
    }),
  );
  return { app, view };
}

describe("ProjectAnalysesDialog", () => {
  it("says that deleting an analysis keeps its tickets", async () => {
    await confirmDelete();

    expect(
      (await screen.findByRole("dialog", { name: "Delete this analysis?" }))
        .textContent,
    ).toContain("Tickets it found are kept.");
  });

  it("deletes the analysis once confirmed and tells the list", async () => {
    const { app, view } = await confirmDelete();

    await fireEvent.click(
      await screen.findByRole("button", { name: "Delete analysis" }),
    );

    await vi.waitFor(() => expect(view.emitted("changed")).toHaveLength(1));
    expect(
      app.http.requests.filter((r) => r.method === "DELETE").map((r) => r.path),
    ).toEqual([analysisPath]);
  });
});
