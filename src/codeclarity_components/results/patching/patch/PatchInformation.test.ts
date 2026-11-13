import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import type { PatchInfo, ToPatch } from "../Patching";

import PatchInformation from "./PatchInformation.vue";

const semver = (Major: number, Minor: number, Patch: number) => ({
  Major,
  Minor,
  Patch,
  PreReleaseTag: "",
  MetaData: "",
});

function toPatch(path: string[]): ToPatch {
  return {
    DependencyName: "qs",
    DependencyVersion: "6.10.3",
    Path: path,
    Vulnerability: {
      VulnerabilityId: "CVE-2022-24999",
      Severity: { Severity: 7.5 },
    },
  } as unknown as ToPatch;
}

function show(patches: PatchInfo["Patches"], path = ["express", "qs"]): void {
  render(PatchInformation, {
    props: {
      patch: toPatch(path),
      patchInfo: { Patches: patches } as PatchInfo,
    },
  });
}

describe("PatchInformation", () => {
  it("names the vulnerability, its severity and the affected package", () => {
    show({});
    expect(screen.getByText("CVE-2022-24999")).toBeTruthy();
    expect(screen.getByText(/High/)).toBeTruthy();
    expect(screen.getByText(/in qs@6\.10\.3/)).toBeTruthy();
  });

  it("shows the path from the direct dependency in order", () => {
    show({}, ["express", "body-parser", "qs"]);
    const path = screen.getByRole("list", { name: "Dependency path" });
    expect(
      within(path)
        .getAllByRole("listitem")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["express", "body-parser", "qs"]);
  });

  it("shows the version that fixes the vulnerability", () => {
    show({ "qs@6.10.3": semver(6, 11, 0) });
    expect(screen.getByText("Fixed in").textContent).toContain("6.11.0");
  });

  it("says when no version fixes it", () => {
    show({});
    expect(screen.getByText("No fixed version")).toBeTruthy();
  });
});
