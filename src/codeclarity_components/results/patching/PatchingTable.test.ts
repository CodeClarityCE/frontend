import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PatchingTable from "./PatchingTable.vue";

const repo = vi.hoisted(() => ({ getPatches: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getPatches = repo.getPatches;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

const semver = (Major: number, Minor: number, Patch: number) => ({
  Major,
  Minor,
  Patch,
  PreReleaseTag: "",
  MetaData: "",
});

const vuln = (dep: string) => ({
  DependencyName: dep,
  DependencyVersion: "1.0.0",
  Path: [dep],
  Vulnerability: { VulnerabilityId: `CVE-${dep}`, Severity: { Severity: 5 } },
});

const workspace = {
  patches: {
    "express@4.18.2": {
      IsPatchable: "FULL",
      Patchable: [vuln("qs"), vuln("cookie")],
      Unpatchable: [],
      Patches: {},
      Update: semver(4, 21, 2),
    },
    "request@2.88.2": {
      IsPatchable: "NONE",
      Patchable: [],
      Unpatchable: [vuln("request")],
      Patches: {},
      Update: semver(0, 0, 0),
    },
  },
  dev_patches: {
    "vitest@3.2.0": {
      IsPatchable: "PARTIAL",
      Patchable: [vuln("vite")],
      Unpatchable: [vuln("esbuild")],
      Patches: {},
      Update: semver(3, 2, 4),
    },
  },
};

async function show(): Promise<HTMLElement[]> {
  render(PatchingTable, { props: { analysisID: "a-1", projectID: "p-1" } });
  await flushPromises();
  const table = screen.getByRole("table", { name: "Patches" });
  return within(table).getAllByRole("row").slice(1);
}

function cells(row: HTMLElement): string[] {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent?.trim() ?? "");
}

describe("PatchingTable", () => {
  beforeEach(() => {
    repo.getPatches.mockResolvedValue({ data: workspace });
  });

  it("lists every vulnerable direct dependency with its patch status", async () => {
    const rows = await show();
    expect(rows.map((row) => cells(row).slice(0, 6))).toEqual([
      ["express@4.18.2", "Production", "Full patch", "2", "2", "4.21.2"],
      [
        "request@2.88.2",
        "Production",
        "No patch",
        "1",
        "0",
        "No fixed version",
      ],
      ["vitest@3.2.0", "Development", "Partial patch", "2", "1", "3.2.4"],
    ]);
  });

  it("gives each row a Details button", async () => {
    await show();
    expect(
      screen.getByRole("button", { name: "Details of vitest@3.2.0" }),
    ).toBeTruthy();
  });

  it("says so when the patches cannot be loaded", async () => {
    repo.getPatches.mockRejectedValue(new Error("down"));
    render(PatchingTable, { props: { analysisID: "a-1", projectID: "p-1" } });
    await flushPromises();
    expect(screen.getByText("Could not load the patches")).toBeTruthy();
  });
});
