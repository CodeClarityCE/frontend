import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import ResultsCodeQL from "./ResultsCodeQL.vue";

const repo = vi.hoisted(() => ({ getResultByType: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getResultByType = repo.getResultByType;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

const finding = (ruleId: string, uri: string, start: number, end: number) => ({
  ruleId,
  message: { text: `${ruleId} found` },
  locations: [
    {
      physicalLocation: {
        artifactLocation: { uri },
        region: { startLine: start, endLine: end },
      },
    },
  ],
});

async function show(results: unknown[], runIndex?: number): Promise<void> {
  repo.getResultByType.mockResolvedValue({
    data: {
      created_on: "2026-06-01T10:00:00Z",
      result: { workspaces: { ".": { results } } },
    },
  });
  render(ResultsCodeQL, {
    props: {
      analysis: { id: "a-1" } as Analysis,
      project: { id: "p-1" } as Project,
      runIndex,
    },
  });
  await flushPromises();
}

describe("ResultsCodeQL", () => {
  it("lists each finding with its rule, file and lines", async () => {
    await show([
      finding("js/xss", "src/view.js", 40, 42),
      finding("js/sql-injection", "src/db.js", 12, 12),
    ]);
    const table = screen.getByRole("table", { name: "CodeQL findings" });
    const rows = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent?.trim()),
      );
    expect(rows).toEqual([
      ["js/sql-injection", "js/sql-injection found", "src/db.js", "12"],
      ["js/xss", "js/xss found", "src/view.js", "40 to 42"],
    ]);
  });

  it("says when CodeQL found nothing", async () => {
    await show([]);
    expect(screen.getByText("No findings")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("shows which run the result belongs to", async () => {
    await show([], 2);
    expect(screen.getByText("Run #3")).toBeTruthy();
    expect(repo.getResultByType).toHaveBeenCalledWith(
      expect.objectContaining({ type: "codeql", runIndex: 2 }),
    );
  });

  it("says so when the result cannot be loaded", async () => {
    repo.getResultByType.mockRejectedValue(new Error("down"));
    render(ResultsCodeQL, {
      props: {
        analysis: { id: "a-1" } as Analysis,
        project: { id: "p-1" } as Project,
      },
    });
    await flushPromises();
    expect(screen.getByText("Could not load the CodeQL results")).toBeTruthy();
  });
});
