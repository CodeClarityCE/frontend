import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import { analysisPath, paginated } from "../../../../tests/fixtures/results";
import { createTestApp } from "../../../../tests/real-app";

import ResultsSBOM from "./ResultsSBOM.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

describe("ResultsSBOM", () => {
  it("shows the SBOM of the analysis", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
      data: { workspaces: ["."], package_manager: "NPM" },
    });
    app.http.on("GET", `${analysisPath}/sbom/stats`, {
      data: { number_of_dependencies: 0 },
    });
    app.http.on("GET", `${analysisPath}/sbom`, paginated([]));
    render(ResultsSBOM, {
      props: {
        analysis: {
          id: "a-1",
          steps: [[{ Name: "js-sbom", Status: AnalysisStatus.SUCCESS }]],
        } as unknown as Analysis,
        project: { id: "p-1", name: "web" } as Project,
      },
      global: app.global,
    });
    await flushPromises();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Software bill of materials",
      }),
    ).toBeTruthy();
    expect(screen.getByText("No dependencies found")).toBeTruthy();
  });
});
