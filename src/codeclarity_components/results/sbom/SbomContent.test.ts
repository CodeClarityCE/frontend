import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { sbomDependency } from "./sbom.fixture";
import SbomContent from "./SbomContent.vue";

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

const stats = {
  number_of_dependencies: 3,
  number_of_direct_dependencies: 1,
  number_of_transitive_dependencies: 2,
  number_of_both_direct_transitive_dependencies: 0,
  number_of_deprecated_dependencies: 1,
  number_of_unlicensed_dependencies: 0,
  number_of_outdated_dependencies: 2,
};

const dependencies = [
  sbomDependency("express", "4.18.2", {
    newest_release: "5.0.1",
    outdated: true,
    is_direct: true,
    is_direct_count: 1,
  }),
  sbomDependency("qs", "6.10.3"),
  sbomDependency("ms", "2.1.3"),
];

async function show(
  options: { stats?: object; issues?: number | null } = {},
): Promise<void> {
  repo.getSbomStat.mockResolvedValue({ data: options.stats ?? stats });
  repo.getSbom.mockResolvedValue({ data: dependencies, total_pages: 1 });
  if (options.issues === null)
    repo.getVulnerabilitiesStat.mockRejectedValue(new Error("none"));
  else
    repo.getVulnerabilitiesStat.mockResolvedValue({
      data: { number_of_issues: options.issues ?? 4 },
    });
  render(SbomContent, {
    props: { analysisID: "a-1", projectID: "p-1", projectName: "web" },
    global: { stubs: { SelectWorkspace: true } },
  });
  await flushPromises();
}

// The visible text pieces of an element, in reading order.
function texts(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll("*"))
    .filter((el) => el.children.length === 0)
    .map((el) => el.textContent?.trim() ?? "")
    .filter(Boolean);
}

describe("SbomContent", () => {
  it("sums up the dependencies in tiles", async () => {
    await show();
    const tiles = within(
      screen.getByRole("list", { name: "Dependency numbers" }),
    )
      .getAllByRole("listitem")
      .map((tile) => texts(tile).slice(0, 2));
    expect(tiles).toEqual([
      ["Dependencies", "3"],
      ["Direct dependencies", "1"],
      ["Health grade", expect.any(String)],
      ["Security issues", "4"],
    ]);
  });

  it("shows a dash when vulnerability data is missing", async () => {
    await show({ issues: null });
    const tile = screen
      .getByText("Security issues")
      .closest("li") as HTMLElement;
    expect(texts(tile)).toEqual([
      "Security issues",
      "-",
      "Vulnerability data unavailable",
    ]);
  });

  it("describes the composition chart in words", async () => {
    await show();
    expect(
      screen.getByLabelText("Transitive: 2 dependencies, 67% of total"),
    ).toBeTruthy();
  });

  it("lists every dependency in the table", async () => {
    await show();
    const table = screen.getByRole("table", { name: "Dependencies" });
    expect(within(table).getAllByRole("row")).toHaveLength(4);
  });

  it("opens the updates for direct dependencies behind their latest release", async () => {
    await show();
    await userEvent.click(
      screen.getByRole("button", { name: "Update 1 direct dependency" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Update direct dependencies",
    });
    expect(within(dialog).getByText("express")).toBeTruthy();
  });

  it("explains an analysis with no dependencies", async () => {
    await show({ stats: { number_of_dependencies: 0 } });
    expect(screen.getByText("No dependencies found")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("says so when the SBOM cannot be loaded", async () => {
    repo.getSbomStat.mockRejectedValue(new Error("down"));
    repo.getSbom.mockResolvedValue({ data: [], total_pages: 1 });
    repo.getVulnerabilitiesStat.mockResolvedValue({ data: null });
    render(SbomContent, {
      props: { analysisID: "a-1", projectID: "p-1" },
      global: { stubs: { SelectWorkspace: true } },
    });
    await flushPromises();
    expect(screen.getByText("Could not load the SBOM")).toBeTruthy();
  });
});
