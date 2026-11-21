import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { analysisPath, paginated } from "../../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../../tests/real-app";

import type { License } from "./License";
import LicensesComponent from "./LicensesComponent.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const license = (id: string, overrides: Partial<License> = {}): License =>
  ({
    id,
    name: id,
    license_category: "",
    license_compliance_violation: false,
    unable_to_infer: false,
    deps_using_license: ["a@1.0.0"],
    license_properties: null,
    references: [],
    ...overrides,
  }) as unknown as License;

const licenses = [
  license("MIT", { deps_using_license: ["a@1", "b@1", "c@1"] }),
  license("GPL-3.0", { license_compliance_violation: true }),
  license("Custom", { unable_to_infer: true }),
];

// Signs in and answers the workspaces of analysis a-1.
async function signedIn(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
    data: { workspaces: ["."], package_manager: "NPM" },
  });
  return app;
}

// Answers each page of the licenses list by its page query param.
function answerLicensePages(pages: License[][]): void {
  const fetch = globalThis.fetch;
  vi.stubGlobal("fetch", (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (!url.pathname.endsWith(`${analysisPath}/licenses`))
      return fetch(input, init);
    const page = Number(url.searchParams.get("page") ?? 0);
    const body = paginated(pages[page] ?? [], {
      page,
      total_pages: pages.length,
    });
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
}

function showLicenses(app: TestApp): void {
  render(LicensesComponent, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: app.global,
  });
}

async function show(pages: License[][] = [licenses]): Promise<HTMLElement[]> {
  const app = await signedIn();
  answerLicensePages(pages);
  showLicenses(app);
  await flushPromises();
  const table = screen.getByRole("table", { name: "Licenses" });
  return within(table).getAllByRole("row").slice(1);
}

function cells(row: HTMLElement): string[] {
  return within(row)
    .getAllByRole("cell")
    .slice(0, 4)
    .map((cell) => cell.textContent?.trim() ?? "");
}

describe("LicensesComponent", () => {
  it("lists each license with its type, status and dependency count", async () => {
    const rows = await show();
    expect(rows.map(cells)).toEqual([
      ["MIT", "Permissive", "Compliant", "3"],
      ["GPL-3.0", "Copyleft", "Violation", "1"],
      ["Custom", "Other", "Needs review", "1"],
    ]);
  });

  it("sums up the licenses in tiles", async () => {
    await show();
    const tiles = within(screen.getByRole("list", { name: "License numbers" }));
    const tile = (label: string): string =>
      tiles.getByText(label).closest("li")?.textContent ?? "";
    expect(tile("Licenses")).toContain("3");
    expect(tile("Dependencies")).toContain("5");
    expect(tile("Policy violations")).toContain("1");
    expect(tile("Policy violations")).toContain("1 need review");
  });

  it("loads every page of licenses", async () => {
    const rows = await show([[licenses[0]!], [licenses[1]!]]);
    expect(rows).toHaveLength(2);
  });

  it("filters the table by search", async () => {
    await show();
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search licenses" }),
      "GPL",
    );
    await flushPromises();
    const table = screen.getByRole("table", { name: "Licenses" });
    expect(within(table).getAllByRole("row").slice(1).map(cells)).toEqual([
      ["GPL-3.0", "Copyleft", "Violation", "1"],
    ]);
  });

  it("says so when the licenses cannot be loaded", async () => {
    const app = await signedIn();
    app.http.on("GET", `${analysisPath}/licenses`, { error: "down" }, 500);
    showLicenses(app);
    await flushPromises();
    expect(screen.getByText("Could not load the licenses")).toBeTruthy();
  });
});
