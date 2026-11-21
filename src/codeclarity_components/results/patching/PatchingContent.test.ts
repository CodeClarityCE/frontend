import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { analysisPath } from "../../../../tests/fixtures/results";
import { createTestApp } from "../../../../tests/real-app";

import PatchingContent from "./PatchingContent.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

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

// Opens the patch summary, with the stats answer or a server error when none is given.
async function show(statsAnswer?: unknown): Promise<void> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
    data: { workspaces: ["."], package_manager: "NPM" },
  });
  if (statsAnswer)
    app.http.on("GET", `${analysisPath}/patching/stats`, { data: statsAnswer });
  else app.http.on("GET", `${analysisPath}/patching/stats`, {}, 500);
  app.http.on("GET", `${analysisPath}/patching`, {
    data: { patches: {}, dev_patches: {} },
  });
  render(PatchingContent, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: app.global,
  });
  await flushPromises();
}

describe("PatchingContent", () => {
  it("shows the numbers after patching next to the numbers before", async () => {
    await show(stats);
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
    await show(stats);
    expect(
      screen.getByLabelText("Critical: 1 before patching, 0 after"),
    ).toBeTruthy();
    const impact = screen.getByText("Confidentiality").parentElement;
    expect(impact?.textContent?.replace(/\s+/g, " ")).toContain("6.2 to 3.1");
  });

  it("says so when the summary cannot be loaded", async () => {
    await show();
    expect(screen.getByText("Could not load the patch summary")).toBeTruthy();
  });
});
