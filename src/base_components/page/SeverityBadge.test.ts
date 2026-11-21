import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { SeverityBadge } from "@/base_components/page";

describe("SeverityBadge", () => {
  it("shows a CVSS 4.0 score with its version", () => {
    const badge = mount(SeverityBadge, {
      props: {
        severity: {
          Severity: 9.3,
          SeverityClass: "CRITICAL",
          SeverityType: "CVSS_V40",
        },
      },
    });

    expect(badge.text()).toMatch(/^Critical\s*9\.3\s*CVSS 4\.0$/);
  });

  it("shows a GHSA severity without a number", () => {
    const badge = mount(SeverityBadge, {
      props: {
        severity: { Severity: 0, SeverityClass: "HIGH", SeverityType: "GHSA" },
      },
    });

    expect(badge.text()).toMatch(/^High\s*GHSA$/);
  });

  it("shows None when there is no score and no class", () => {
    const badge = mount(SeverityBadge, {
      props: {
        severity: {
          Severity: 0,
          SeverityClass: "NONE",
          SeverityType: "CVSS_V31",
        },
      },
    });

    expect(badge.text()).toBe("None");
  });
});
