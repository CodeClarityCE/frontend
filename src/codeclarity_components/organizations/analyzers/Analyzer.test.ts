import { describe, expect, it } from "vitest";

import { isUnavailable, unavailableLabel } from "./Analyzer";

describe("isUnavailable", () => {
  it("is false when the API says nothing or says available", () => {
    expect(isUnavailable(undefined)).toBe(false);
    expect(isUnavailable({ state: "available" })).toBe(false);
  });

  it("is true for an off component or a down plugin", () => {
    expect(
      isUnavailable({ state: "off", components: ["CodeQL"], message: "m" }),
    ).toBe(true);
    expect(
      isUnavailable({ state: "down", plugins: ["vuln-finder"], message: "m" }),
    ).toBe(true);
  });
});

describe("unavailableLabel", () => {
  it("says temporarily for a down plugin and plainly for an off component", () => {
    expect(
      unavailableLabel({
        state: "down",
        plugins: ["x"],
        message: "x is down.",
      }),
    ).toBe("Temporarily unavailable: x is down.");
    expect(
      unavailableLabel({
        state: "off",
        components: ["C"],
        message: "C is off.",
      }),
    ).toBe("Unavailable: C is off.");
    expect(unavailableLabel({ state: "available" })).toBe("");
  });
});
