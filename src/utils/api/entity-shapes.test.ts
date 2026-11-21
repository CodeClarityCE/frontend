import { plainToInstance } from "class-transformer";
import { describe, expect, it, vi } from "vitest";

import { Analyzer } from "@/codeclarity_components/organizations/analyzers/Analyzer";
import { VulnerabilityPolicy } from "@/codeclarity_components/organizations/policy/vulnerability_policy.entity";

import { Entity } from "./BaseEntity";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

// Response items shaped as the API sends them.
describe("entities accept what the API sends", () => {
  it("an analyzer has no organisation id", () => {
    const analyzer = {
      id: "a-1",
      name: "JS analyzer",
      description: "Finds vulnerabilities",
      created_on: "2026-10-01T00:00:00.000Z",
      steps: [[{ name: "js-sbom", version: "1.0.0", config: {} }]],
      supported_languages: ["javascript"],
      language_config: { javascript: { plugins: ["js-sbom"] } },
      logo: "js",
    };

    expect(() =>
      Entity.validate(plainToInstance(Analyzer, analyzer)),
    ).not.toThrow();
  });

  it("a vulnerability policy has the policy kind as its type", () => {
    const policy = {
      id: "vp-1",
      name: "Known exploited",
      description: "Flag these",
      default: false,
      content: ["CVE-2021-44228"],
      created_on: "2026-10-01T00:00:00.000Z",
      created_by: "john.doe@codeclarity.io",
      policy_type: "VULNERABILITY_POLICY",
    };

    expect(() =>
      Entity.validate(plainToInstance(VulnerabilityPolicy, policy)),
    ).not.toThrow();
  });
});
