import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import ResultsSBOMDetails from "./ResultsSBOMDetails.vue";
import { dependency } from "./SbomDetails/dependency.fixture";

const repo = vi.hoisted(() => ({ getDependency: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getDependency = repo.getDependency;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useRoute: () => ({
    params: {},
    query: {
      analysis_id: "a-1",
      project_id: "p-1",
      package_id: "lodash@4.17.20",
    },
  }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

describe("ResultsSBOMDetails", () => {
  it("shows the dependency of the analysis and project in the address", async () => {
    repo.getDependency.mockResolvedValue({ data: dependency() });
    render(ResultsSBOMDetails, {
      global: { stubs: { SbomDependencyGraph: true } },
    });
    await flushPromises();
    expect(
      screen.getByRole("heading", { level: 1, name: /lodash/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Back to results/ }),
    ).toBeTruthy();
    expect(repo.getDependency).toHaveBeenCalledWith(
      expect.objectContaining({ analysisId: "a-1", projectId: "p-1" }),
    );
  });
});
