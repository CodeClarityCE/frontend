import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import type { Project } from "@/codeclarity_components/projects/project.entity";

import ProjectAnalysesDialog from "./ProjectAnalysesDialog.vue";

vi.mock("@/codeclarity_components/analyses/analysis.repository", () => ({
  AnalysisRepository: class {
    deleteAnalysis = vi.fn();
  },
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "test-token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

// The real helpers, so dialogs behave as in the browser.
vi.mock("@vueuse/core", async () => await vi.importActual("@vueuse/core"));

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

describe("ProjectAnalysesDialog", () => {
  it("says that deleting an analysis keeps its tickets", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div />" } },
        {
          path: "/results",
          name: "results",
          component: { template: "<div />" },
        },
      ],
    });
    render(ProjectAnalysesDialog, {
      props: { project, open: true },
      global: { plugins: [router] },
    });

    await fireEvent.click(
      await screen.findByRole("button", {
        name: /^Delete the analysis started/,
      }),
    );

    expect(
      (await screen.findByRole("dialog", { name: "Delete this analysis?" }))
        .textContent,
    ).toContain("Tickets it found are kept.");
  });
});
