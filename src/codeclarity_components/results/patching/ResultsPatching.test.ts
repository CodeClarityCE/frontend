import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import { analysisPath } from "../../../../tests/fixtures/results";
import { createTestApp } from "../../../../tests/real-app";

import ResultsPatching from "./ResultsPatching.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

describe("ResultsPatching", () => {
  it("shows the patches of the analysis", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
      data: { workspaces: ["."], package_manager: "NPM" },
    });
    app.http.on("GET", `${analysisPath}/patching/stats`, { data: {} });
    app.http.on("GET", `${analysisPath}/patching`, {
      data: { patches: {}, dev_patches: {} },
    });
    render(ResultsPatching, {
      props: {
        analysis: { id: "a-1", steps: [] } as unknown as Analysis,
        project: { id: "p-1" } as Project,
      },
      global: app.global,
    });
    await flushPromises();
    expect(
      screen.getByRole("heading", { name: "Patches", level: 2 }),
    ).toBeTruthy();
    expect(screen.getByText("No vulnerable direct dependencies.")).toBeTruthy();
  });
});
