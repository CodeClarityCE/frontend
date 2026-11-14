import { render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dependency } from "./dependency.fixture";
import SbomInformation from "./SbomInformation.vue";

function show(overrides: Parameters<typeof dependency>[0] = {}): void {
  render(SbomInformation, { props: { dependency: dependency(overrides) } });
}

// The value shown next to a label in the package details list.
function detail(label: string): string {
  const term = screen.getByText(label, { selector: "dt" });
  return (
    term.nextElementSibling?.textContent?.replace(/\s+/g, " ").trim() ?? ""
  );
}

describe("SbomInformation", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2022-08-13T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("compares the installed version with the latest", () => {
    show();
    expect(screen.getByText("Installed").nextElementSibling?.textContent).toBe(
      "4.17.20",
    );
    expect(screen.getByText("Latest").nextElementSibling?.textContent).toBe(
      "4.17.21",
    );
    expect(screen.getByText("6 months behind latest")).toBeTruthy();
  });

  it("says when the latest version is installed", () => {
    show({ latest_version: "4.17.20" });
    expect(screen.getByText("Using the latest version")).toBeTruthy();
  });

  it("offers a recent update without a warning", () => {
    show({
      release_date: new Date("2021-01-01"),
      lastest_release_date: new Date("2021-02-01"),
    });
    expect(screen.getByText("Update available (4.17.21)")).toBeTruthy();
  });

  it("shows the license, age, ecosystem and engines", () => {
    show();
    expect(detail("License")).toBe("MIT");
    expect(detail("Release age")).toBe("2 years old");
    expect(detail("Engines")).toBe("Node >=4");
    const registry = screen.getByRole("link", { name: /opens in a new tab/ });
    expect(registry.getAttribute("href")).toBe(
      "https://www.npmjs.com/package/lodash",
    );
  });

  it("flags a dependency without a license", () => {
    show({ license: "" });
    expect(detail("License")).toBe("Unlicensed");
  });
});
