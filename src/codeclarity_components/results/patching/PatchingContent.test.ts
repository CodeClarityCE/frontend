import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import PatchingContent from "./PatchingContent.vue";

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

const stats = {
  before_patch_number_of_issues: 4,
  after_patch_number_of_issues: 2,
  before_patch_number_of_vulnerabilities: 5,
  after_patch_number_of_vulnerabilities: 1,
  before_patch_number_of_vulnerable_dependencies: 3,
  after_patch_number_of_vulnerable_dependencies: 2,
  before_patch_number_of_critical: 1,
  after_patch_number_of_critical: 0,
  before_patch_overall_confidentiality_impact: 6.2,
  after_patch_overall_confidentiality_impact: 3.1,
};

// The visible text pieces of an element, in reading order.
function texts(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll("*"))
    .filter((el) => el.children.length === 0)
    .map((el) => el.textContent?.trim() ?? "")
    .filter(Boolean);
}

async function show(): Promise<void> {
  repo.getPatches.mockResolvedValue({ data: { patches: {}, dev_patches: {} } });
  repo.getPatchesManifest.mockRejectedValue(new Error("none"));
  render(PatchingContent, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: { stubs: { SelectWorkspace: true } },
  });
  await flushPromises();
}

describe("PatchingContent", () => {
  it("shows the numbers after patching next to the numbers before", async () => {
    repo.getPatchesStat.mockResolvedValue({ data: stats });
    await show();
    const tiles = within(screen.getByRole("list", { name: "Patch numbers" }))
      .getAllByRole("listitem")
      .map((tile) => texts(tile));
    expect(tiles).toEqual([
      ["Issues after patching", "2", "4 before patching"],
      ["Vulnerabilities after patching", "1", "5 before patching"],
      ["Vulnerable dependencies after patching", "2", "3 before patching"],
    ]);
  });

  it("describes the severity chart and the impact change in words", async () => {
    repo.getPatchesStat.mockResolvedValue({ data: stats });
    await show();
    expect(
      screen.getByLabelText("Critical: 1 before patching, 0 after"),
    ).toBeTruthy();
    const impact = screen.getByText("Confidentiality").parentElement;
    expect(impact?.textContent?.replace(/\s+/g, " ")).toContain("6.2 to 3.1");
  });

  it("says so when the summary cannot be loaded", async () => {
    repo.getPatchesStat.mockRejectedValue(new Error("down"));
    await show();
    expect(screen.getByText("Could not load the patch summary")).toBeTruthy();
  });
});
