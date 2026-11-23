import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import { createTestApp, type TestApp } from "../../../../tests/real-app";

import ResultsCodeQL from "./ResultsCodeQL.vue";

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

// Opens the CodeQL tab of analysis a-1, with the API answering the given findings.
async function show(
  results: unknown[] | null,
  runIndex?: number,
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  if (results)
    app.http.on("GET", "/result", {
      data: {
        plugin: "codeql",
        created_on: "2026-06-01T10:00:00Z",
        result: { workspaces: { ".": { results } } },
      },
    });
  else app.http.on("GET", "/result", { error: "down" }, 500);
  render(ResultsCodeQL, {
    props: {
      analysis: { id: "a-1" } as Analysis,
      project: { id: "p-1" } as Project,
      runIndex,
    },
    global: app.global,
  });
  await flushPromises();
  return app;
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
    const app = await show([], 2);
    expect(screen.getByText("Run #3")).toBeTruthy();
    const asked = app.http.requests.find((r) => r.path === "/result")?.query;
    expect(asked?.get("type")).toBe("codeql");
    expect(asked?.get("run_index")).toBe("2");
  });

  it("says so when the result cannot be loaded", async () => {
    await show(null);
    expect(screen.getByText("Could not load the CodeQL results")).toBeTruthy();
  });
});
