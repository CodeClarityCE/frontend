import { describe, expect, it } from "vitest";

import { severityLevelFromLabel } from "./severity";

describe("severityLevelFromLabel", () => {
  it("maps API severity names to severity levels", () => {
    expect(severityLevelFromLabel("CRITICAL")).toBe("critical");
    expect(severityLevelFromLabel("High")).toBe("high");
    expect(severityLevelFromLabel("medium")).toBe("medium");
    expect(severityLevelFromLabel("LOW")).toBe("low");
  });

  it("treats a missing or unknown name as none", () => {
    expect(severityLevelFromLabel(undefined)).toBe("none");
    expect(severityLevelFromLabel("UNKNOWN")).toBe("none");
  });
});
