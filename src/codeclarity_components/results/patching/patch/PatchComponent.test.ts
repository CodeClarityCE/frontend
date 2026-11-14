import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import type { PatchInfo, ToPatch } from "../Patching";

import PatchComponent from "./PatchComponent.vue";

const semver = (Major: number, Minor: number, Patch: number) => ({
  Major,
  Minor,
  Patch,
  PreReleaseTag: "",
  MetaData: "",
});

const vuln = (dep: string, id: string): ToPatch =>
  ({
    DependencyName: dep,
    DependencyVersion: "1.0.0",
    Path: ["express", dep],
    Vulnerability: { VulnerabilityId: id, Severity: { Severity: 5 } },
  }) as unknown as ToPatch;

function patch(overrides: Partial<PatchInfo> = {}): PatchInfo {
  return {
    TopLevelVulnerable: false,
    IsPatchable: "FULL",
    Unpatchable: [],
    Patchable: [vuln("qs", "CVE-2022-24999")],
    Introduced: [],
    Patches: {},
    Update: semver(4, 21, 2),
    ...overrides,
  };
}

async function open(info: PatchInfo, type: "prod" | "dev" = "prod") {
  render(PatchComponent, {
    props: { patch: info, name: "express@4.18.2", type },
  });
  await userEvent.click(
    screen.getByRole("button", { name: "Details of express@4.18.2" }),
  );
  return screen.getByRole("dialog", { name: "express@4.18.2" });
}

describe("PatchComponent", () => {
  it("opens the patch details from the Details button", async () => {
    const dialog = await open(patch());
    expect(within(dialog).getByText("Full patch")).toBeTruthy();
    expect(within(dialog).getByText(/upgrade to 4\.21\.2/)).toBeTruthy();
    expect(within(dialog).getByText("Production dependency")).toBeTruthy();
  });

  it("splits fixed and unfixed vulnerabilities", async () => {
    const dialog = await open(
      patch({
        IsPatchable: "PARTIAL",
        Unpatchable: [vuln("esbuild", "GHSA-67mh-4wv8-2f99")],
      }),
      "dev",
    );
    expect(within(dialog).getByText("Partial patch")).toBeTruthy();
    expect(within(dialog).getByText("Development dependency")).toBeTruthy();
    expect(
      within(dialog).getByRole("heading", { name: "Fixed by the upgrade (1)" }),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("heading", { name: "Not fixed (1)" }),
    ).toBeTruthy();
    expect(within(dialog).getByText("GHSA-67mh-4wv8-2f99")).toBeTruthy();
  });

  it("shows No patch and no upgrade when nothing fixes it", async () => {
    const dialog = await open(
      patch({
        IsPatchable: "NONE",
        Patchable: [],
        Unpatchable: [vuln("request", "CVE-2023-28155")],
        Update: semver(0, 0, 0),
      }),
    );
    expect(within(dialog).getByText("No patch")).toBeTruthy();
    expect(within(dialog).queryByText(/upgrade to/)).toBeNull();
    expect(
      within(dialog).queryByRole("heading", { name: /Fixed by the upgrade/ }),
    ).toBeNull();
  });
});
