import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { License } from "./License";
import LicensesComponent from "./LicensesComponent.vue";

// The real useVModel, so typing in the search box filters the table.
vi.unmock("@vueuse/core");

const repo = vi.hoisted(() => ({ getLicenses: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getLicenses = repo.getLicenses;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

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

async function show(pages: License[][] = [licenses]): Promise<HTMLElement[]> {
  repo.getLicenses.mockImplementation(({ pagination }) =>
    Promise.resolve({
      data: pages[pagination.page as number],
      total_pages: pages.length,
    }),
  );
  render(LicensesComponent, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: { stubs: { SelectWorkspace: true } },
  });
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
    repo.getLicenses.mockRejectedValue(new Error("down"));
    render(LicensesComponent, {
      props: { analysisID: "a-1", projectID: "p-1" },
      global: { stubs: { SelectWorkspace: true } },
    });
    await flushPromises();
    expect(screen.getByText("Could not load the licenses")).toBeTruthy();
  });
});
