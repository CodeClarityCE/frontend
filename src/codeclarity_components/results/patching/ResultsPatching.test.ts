import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import ResultsPatching from "./ResultsPatching.vue";

const repo = vi.hoisted(() => ({
  getPatchesStat: vi.fn(),
  getPatches: vi.fn(),
  getPatchesManifest: vi.fn(),
}));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getPatchesStat = repo.getPatchesStat;
    getPatches = repo.getPatches;
    getPatchesManifest = repo.getPatchesManifest;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

describe("ResultsPatching", () => {
  it("shows the patches of the analysis", async () => {
    repo.getPatchesStat.mockResolvedValue({ data: {} });
    repo.getPatches.mockResolvedValue({
      data: { patches: {}, dev_patches: {} },
    });
    repo.getPatchesManifest.mockRejectedValue(new Error("none"));
    render(ResultsPatching, {
      props: {
        analysis: { id: "a-1", steps: [] } as unknown as Analysis,
        project: { id: "p-1" } as Project,
      },
      global: { stubs: { SelectWorkspace: true } },
    });
    await flushPromises();
    expect(
      screen.getByRole("heading", { name: "Patches", level: 2 }),
    ).toBeTruthy();
    expect(screen.getByText("No vulnerable direct dependencies.")).toBeTruthy();
    expect(repo.getPatchesStat).toHaveBeenCalledWith(
      expect.objectContaining({ analysisId: "a-1", projectId: "p-1" }),
    );
  });
});
