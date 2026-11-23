import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import { analysisPath, paginated } from "../../../../tests/fixtures/results";
import { createTestApp } from "../../../../tests/real-app";

import ResultsLicenses from "./ResultsLicenses.vue";

describe("ResultsLicenses", () => {
  it("shows the licenses of the analysis", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
      data: { workspaces: ["."], package_manager: "NPM" },
    });
    app.http.on("GET", `${analysisPath}/licenses`, paginated([]));
    render(ResultsLicenses, {
      props: {
        analysis: {
          id: "a-1",
          steps: [[{ Name: "js-sbom", Status: AnalysisStatus.SUCCESS }]],
        } as unknown as Analysis,
        project: { id: "p-1" } as Project,
      },
      global: app.global,
    });
    await flushPromises();
    expect(
      screen.getByRole("heading", { name: "Licenses", level: 2 }),
    ).toBeTruthy();
    expect(screen.getByText("No licenses found.")).toBeTruthy();
  });
});
