import { describe, expect, it } from "vitest";

import {
  cvssVersionLabel,
  findingSeverityLevel,
  severityLevelFromLabel,
} from "./severity";

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

describe("findingSeverityLevel", () => {
  it("buckets CVSS 3 and 4 scores with the same thresholds", () => {
    expect(
      findingSeverityLevel({ Severity: 9.3, SeverityClass: "CRITICAL" }),
    ).toBe("critical");
    expect(findingSeverityLevel({ Severity: 8.7 })).toBe("high");
  });

  it("uses the class of a severity without a score", () => {
    expect(findingSeverityLevel({ Severity: 0, SeverityClass: "MEDIUM" })).toBe(
      "medium",
    );
    expect(findingSeverityLevel(undefined)).toBe("none");
  });
});

describe("cvssVersionLabel", () => {
  it("names the CVSS version of a severity type", () => {
    expect(cvssVersionLabel("CVSS_V40")).toBe("CVSS 4.0");
    expect(cvssVersionLabel("CVSS_V31")).toBe("CVSS 3.1");
    expect(cvssVersionLabel("CVSS_V3")).toBe("CVSS 3.0");
    expect(cvssVersionLabel("CVSS_V2")).toBe("CVSS 2.0");
    expect(cvssVersionLabel("GHSA")).toBe("GHSA");
    expect(cvssVersionLabel(undefined)).toBeUndefined();
  });
});
