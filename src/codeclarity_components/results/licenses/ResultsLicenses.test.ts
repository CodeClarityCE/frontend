import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import ResultsLicenses from "./ResultsLicenses.vue";

const repo = vi.hoisted(() => ({ getLicenses: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getLicenses = repo.getLicenses;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

describe("ResultsLicenses", () => {
  it("shows the licenses of the analysis", async () => {
    repo.getLicenses.mockResolvedValue({ data: [], total_pages: 1 });
    render(ResultsLicenses, {
      props: {
        analysis: {
          id: "a-1",
          steps: [[{ Name: "js-sbom", Status: AnalysisStatus.SUCCESS }]],
        } as unknown as Analysis,
        project: { id: "p-1" } as Project,
      },
      global: { stubs: { SelectWorkspace: true } },
    });
    await flushPromises();
    expect(
      screen.getByRole("heading", { name: "Licenses", level: 2 }),
    ).toBeTruthy();
    expect(screen.getByText("No licenses found.")).toBeTruthy();
    expect(repo.getLicenses).toHaveBeenCalledWith(
      expect.objectContaining({ analysisId: "a-1", projectId: "p-1" }),
    );
  });
});
