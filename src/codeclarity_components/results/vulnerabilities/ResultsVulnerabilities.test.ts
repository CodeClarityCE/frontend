import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import ResultsVulnerabilities from "./ResultsVulnerabilities.vue";

vi.mock("@vueuse/core", async () => await vi.importActual("@vueuse/core"));

const repo = vi.hoisted(() => ({
  getVulnerabilities: vi.fn(),
  getVulnerabilitiesStat: vi.fn(),
}));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getVulnerabilities = repo.getVulnerabilities;
    getVulnerabilitiesStat = repo.getVulnerabilitiesStat;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token", getAuthenticated: true }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

async function show(): Promise<void> {
  render(ResultsVulnerabilities, {
    props: {
      analysis: { id: "a-1", steps: [] } as unknown as Analysis,
      project: { id: "p-1" } as unknown as Project,
    },
    global: {
      stubs: {
        RouterLink: { template: "<a><slot /></a>" },
        SelectWorkspace: true,
        KnowledgeStatusNotice: true,
        MaliciousPackageAdvisories: true,
      },
    },
  });
  await flushPromises();
}

describe("ResultsVulnerabilities policy exclusions", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    repo.getVulnerabilities.mockReset();
    repo.getVulnerabilities.mockResolvedValue({
      data: [],
      total_entries: 0,
      matching_count: 0,
      filter_count: {},
    });
    repo.getVulnerabilitiesStat.mockReset();
    repo.getVulnerabilitiesStat.mockResolvedValue({ data: {} });
  });

  it("asks the stats and the list for the same policy toggle", async () => {
    await show();
    expect(repo.getVulnerabilitiesStat).toHaveBeenLastCalledWith(
      expect.objectContaining({ show_blacklisted: false }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitemcheckbox", {
        name: "Show policy excluded",
      }),
    );
    await flushPromises();

    expect(repo.getVulnerabilities).toHaveBeenLastCalledWith(
      expect.objectContaining({ show_blacklisted: true }),
    );
    expect(repo.getVulnerabilitiesStat).toHaveBeenLastCalledWith(
      expect.objectContaining({ show_blacklisted: true }),
    );
  });
});
