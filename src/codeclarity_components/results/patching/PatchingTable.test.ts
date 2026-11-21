import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { analysisPath } from "../../../../tests/fixtures/results";
import { createTestApp } from "../../../../tests/real-app";

import PatchingTable from "./PatchingTable.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

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

// Opens the patch table, with the patches answer or a server error when none is given.
async function open(answer?: unknown): Promise<void> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  if (answer) app.http.on("GET", `${analysisPath}/patching`, { data: answer });
  else app.http.on("GET", `${analysisPath}/patching`, {}, 500);
  render(PatchingTable, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: app.global,
  });
  await flushPromises();
}

async function show(): Promise<HTMLElement[]> {
  await open(workspace);
  const table = screen.getByRole("table", { name: "Patches" });
  return within(table).getAllByRole("row").slice(1);
}

function cells(row: HTMLElement): string[] {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent?.trim() ?? "");
}

describe("PatchingTable", () => {
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
    await open();
    expect(screen.getByText("Could not load the patches")).toBeTruthy();
  });
});
