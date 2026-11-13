import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { dependency } from "./dependency.fixture";
import SbomDependencyHealth from "./SbomDependencyHealth.vue";

function show(overrides: Parameters<typeof dependency>[0] = {}): void {
  render(SbomDependencyHealth, {
    props: {
      dependency: dependency({
        release_date: new Date("2021-01-01"),
        lastest_release_date: new Date("2021-02-01"),
        ...overrides,
      }),
    },
  });
}

describe("SbomDependencyHealth", () => {
  it("says a dependency with no problems is healthy", () => {
    show();
    expect(screen.getByText("Healthy")).toBeTruthy();
    expect(
      screen.getByText(
        "No known vulnerabilities, license problems or outdated versions.",
      ),
    ).toBeTruthy();
  });

  it("lists vulnerabilities, a missing license and a stale release", () => {
    show({
      vulnerabilities: ["CVE-1", "CVE-2"],
      license: "",
      release_date: new Date("2020-01-01"),
      lastest_release_date: new Date("2021-01-01"),
    });
    expect(screen.getByText("3 issues")).toBeTruthy();
    const titles = screen
      .getAllByRole("listitem")
      .map((item) => within(item).getAllByText(/./)[0]?.textContent);
    expect(titles).toEqual([
      "Security vulnerabilities",
      "Unlicensed",
      "Outdated",
    ]);
    expect(screen.getByText("2 found")).toBeTruthy();
    expect(screen.getByText("366 days behind")).toBeTruthy();
  });

  it("counts one issue in the singular", () => {
    show({ vulnerabilities: ["CVE-1"] });
    expect(screen.getByText("1 issue")).toBeTruthy();
    expect(
      screen.getByText("1 known vulnerability affects this version."),
    ).toBeTruthy();
  });
});
