import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { RouterView } from "vue-router";

import {
  ANALYSIS_ID,
  analysisPath,
  paginated,
  PROJECT_ID,
} from "../../../tests/fixtures/results";
import { createTestApp, org, type TestApp } from "../../../tests/real-app";

const project = {
  id: PROJECT_ID,
  name: "Test Project",
  description: "Test Description",
  integration_id: "int-1",
  type: "GITHUB",
  url: "https://github.com/test/repo",
  upload_id: "upload-1",
  added_on: "2025-01-05T10:00:00Z",
  organization_id: org.id,
};

function step(Name: string, Status = "success", Result: unknown = null) {
  return { Name, Version: "1", Status, Result, config: {} };
}

// Opens the results page of analysis a-1 with these plugin steps.
async function open(steps: unknown[], page = ""): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}/projects/${PROJECT_ID}`, {
    data: project,
  });
  app.http.on(
    "GET",
    `/org/${org.id}/projects/${PROJECT_ID}/analyses/${ANALYSIS_ID}`,
    {
      data: {
        id: ANALYSIS_ID,
        created_on: "2025-01-06T10:00:00Z",
        analyzer: { id: "analyzer-1", name: "Test Analyzer" },
        status: "completed",
        steps: [steps],
        branch: "main",
      },
    },
  );
  app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
    data: { workspaces: ["."], package_manager: "NPM" },
  });
  app.http.on("GET", `${analysisPath}/sbom/stats`, {
    data: { number_of_dependencies: 0 },
  });
  app.http.on("GET", `${analysisPath}/sbom`, paginated([]));
  const address = `/results${page ? `/${page}` : ""}?project_id=${PROJECT_ID}&analysis_id=${ANALYSIS_ID}`;
  // The page reads its ids from the window address.
  window.history.replaceState({}, "", address);
  await app.visit(address);
  render(RouterView, { global: app.global });
  await flushPromises();
  return app;
}

function tabNames(): string[] {
  return within(screen.getByRole("tablist", { name: "Results" }))
    .getAllByRole("tab")
    .map((tab) => tab.textContent?.trim() ?? "");
}

describe("ResultsView", () => {
  it("names the project and opens on the SBOM", async () => {
    await open([step("js-sbom")]);
    expect(
      screen.getByRole("heading", { level: 1, name: "Results" }),
    ).toBeTruthy();
    expect(screen.getByText("Test Project")).toBeTruthy();
    expect(
      await screen.findByRole("heading", {
        name: "Software bill of materials",
      }),
    ).toBeTruthy();
  });

  it("shows a tab for each plugin that succeeded", async () => {
    await open([
      step("js-sbom"),
      step("vuln-finder", "failure"),
      step("js-patching"),
    ]);
    expect(tabNames()).toEqual(["SBOM", "Patches"]);
  });

  it("shows every result tab when all plugins succeed", async () => {
    await open([
      step("js-sbom"),
      step("vuln-finder"),
      step("js-patching"),
      step("license-finder"),
      step("codeql"),
    ]);
    expect(tabNames()).toEqual([
      "SBOM",
      "Vulnerabilities",
      "Patches",
      "Licenses",
      "CodeQL",
    ]);
  });

  it("shows a vulnerability's details instead of the tabs on its page", async () => {
    await open([step("js-sbom")], "vulnerabilities_details");
    // Nothing answers the finding, so the details page says it is missing.
    expect(
      await screen.findByRole("heading", { name: "Vulnerability not found" }),
    ).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Results" })).toBeNull();
  });

  it("shows a dependency's details instead of the tabs on its page", async () => {
    await open([step("js-sbom")], "sbom_details");
    expect(
      await screen.findByRole("heading", { name: "Dependency not found" }),
    ).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Results" })).toBeNull();
  });

  it("lists the folders an SBOM step skipped, with the reason", async () => {
    await open([
      step("js-sbom", "success", {
        workspaces: ["api", "frontend"],
        skipped_folders: [
          { path: "docs", reason: "package.json has no lockfile" },
        ],
      }),
    ]);
    const notice = screen.getByRole("status", { name: "Skipped folders" });
    expect(notice.textContent).toContain("docs");
    expect(notice.textContent).toContain("package.json has no lockfile");
  });

  it("shows no skipped folders notice when every folder was analysed", async () => {
    await open([step("js-sbom")]);
    expect(
      screen.queryByRole("status", { name: "Skipped folders" }),
    ).toBeNull();
  });
});
