import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";

import SbomDetails from "./SbomDetails.vue";
import { dependency } from "./SbomDetails/dependency.fixture";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const ANALYSIS = "5d6e7f80-91a2-4b3c-8d4e-5f6a7b8c9d0e";
const PROJECT = "9b0f6a4e-2c1d-4c3b-8f7a-1e2d3c4b5a69";
const dependencyPath = `/org/${org.id}/projects/${PROJECT}/analysis/${ANALYSIS}/sbom/dependency`;

// Opens the dependency page at the address and answers the dependency request.
async function show(
  overrides: Parameters<typeof dependency>[0] = {},
  address = "/results/sbom_details?package_id=lodash@4.17.20",
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", dependencyPath, { data: dependency(overrides) });
  app.http.on("GET", `${dependencyPath}/graph`, { data: [] });
  await app.visit(address);
  render(SbomDetails, {
    props: {
      analysisID: ANALYSIS,
      projectID: PROJECT,
      showBack: true,
      runIndex: 1,
    },
    global: app.global,
  });
  await flushPromises();
  return app;
}

// The query of the last dependency request.
function dependencyQuery(app: TestApp): URLSearchParams | undefined {
  return app.http.requests.filter((r) => r.path === dependencyPath).at(-1)
    ?.query;
}

// The visible text pieces of an element, in reading order.
function texts(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll("*"))
    .filter((el) => el.children.length === 0)
    .map((el) => el.textContent?.trim() ?? "")
    .filter(Boolean);
}

function tile(label: string): string[] {
  const list = screen.getByRole("list", { name: "Dependency numbers" });
  return texts(within(list).getByText(label).closest("li") as HTMLElement);
}

// The workspace named in a link's address.
function linkWorkspace(name: RegExp): string | null {
  const href = screen.getByRole("link", { name }).getAttribute("href") ?? "";
  return new URL(href, "http://localhost").searchParams.get("workspace");
}

describe("SbomDetails", () => {
  it("loads the dependency from the root workspace by default", async () => {
    const app = await show();
    expect(dependencyQuery(app)?.get("workspace")).toBe(".");
  });

  it("loads the dependency and its findings from the workspace in the address", async () => {
    const app = await show(
      {
        vulnerabilities: ["CVE-2021-23337"],
        severity_dist: { critical: 1, high: 0, medium: 0, low: 0, none: 0 },
      },
      "/results/sbom_details?package_id=lodash@4.17.20&workspace=packages/app",
    );
    expect(dependencyQuery(app)?.get("workspace")).toBe("packages/app");
    expect(linkWorkspace(/CVE-2021-23337/)).toBe("packages/app");
  });

  it("loads the dependency named in the address", async () => {
    const app = await show();
    expect(
      screen.getByRole("heading", { level: 1, name: /lodash/ }),
    ).toBeTruthy();
    expect(dependencyQuery(app)?.get("dependency")).toBe("lodash@4.17.20");
    expect(dependencyQuery(app)?.get("run_index")).toBe("1");
  });

  it("grades a package without vulnerabilities A", async () => {
    await show();
    expect(tile("Security score").slice(0, 2)).toEqual(["Security score", "A"]);
    expect(tile("License").slice(0, 2)).toEqual(["License", "MIT"]);
  });

  it("grades a package with a critical vulnerability F and links to it", async () => {
    await show({
      vulnerabilities: ["CVE-2021-23337"],
      severity_dist: { critical: 1, high: 0, medium: 0, low: 0, none: 0 },
    });
    expect(tile("Security score").slice(0, 2)).toEqual(["Security score", "F"]);
    expect(tile("Vulnerabilities")).toContain("1 critical or high");
    expect(screen.getByRole("link", { name: /CVE-2021-23337/ })).toBeTruthy();
    expect(screen.getByText("Fix critical and high first.")).toBeTruthy();
  });

  it("says Direct for a dependency that is both direct and transitive", async () => {
    await show({ direct: true, transitive: true });
    expect(tile("Added as").slice(0, 2)).toEqual(["Added as", "Direct"]);
  });

  it("says Transitive for a dependency that is only transitive", async () => {
    await show({ direct: false, transitive: true });
    expect(tile("Added as").slice(0, 2)).toEqual(["Added as", "Transitive"]);
  });

  it("links back to the results of its analysis", async () => {
    await show();
    expect(
      screen
        .getByRole("link", { name: /Back to results/ })
        .getAttribute("href"),
    ).toBe(
      `/results?analysis_id=${ANALYSIS}&project_id=${PROJECT}&run_index=1`,
    );
  });

  it("says so when the dependency cannot be loaded", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", dependencyPath, {}, 500);
    await app.visit("/results/sbom_details?package_id=lodash@4.17.20");
    // Real ids: a request with malformed ids that fails reads as not found.
    render(SbomDetails, {
      props: { analysisID: ANALYSIS, projectID: PROJECT },
      global: app.global,
    });
    await flushPromises();
    expect(screen.getByText("Could not load this dependency")).toBeTruthy();
  });
});
