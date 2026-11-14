import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import ResultsSBOM from "./ResultsSBOM.vue";

const repo = vi.hoisted(() => ({
  getSbomStat: vi.fn(),
  getSbom: vi.fn(),
  getVulnerabilitiesStat: vi.fn(),
}));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getSbomStat = repo.getSbomStat;
    getSbom = repo.getSbom;
    getVulnerabilitiesStat = repo.getVulnerabilitiesStat;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token", getAuthenticated: true }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

describe("ResultsSBOM", () => {
  it("shows the SBOM of the analysis", async () => {
    repo.getSbomStat.mockResolvedValue({ data: { number_of_dependencies: 0 } });
    repo.getSbom.mockResolvedValue({ data: [], total_pages: 1 });
    repo.getVulnerabilitiesStat.mockResolvedValue({ data: null });
    render(ResultsSBOM, {
      props: {
        analysis: {
          id: "a-1",
          steps: [[{ Name: "js-sbom", Status: AnalysisStatus.SUCCESS }]],
        } as unknown as Analysis,
        project: { id: "p-1", name: "web" } as Project,
      },
      global: { stubs: { SelectWorkspace: true } },
    });
    await flushPromises();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Software bill of materials",
      }),
    ).toBeTruthy();
    expect(screen.getByText("No dependencies found")).toBeTruthy();
    expect(repo.getSbomStat).toHaveBeenCalledWith(
      expect.objectContaining({ analysisId: "a-1", projectId: "p-1" }),
    );
  });
});
