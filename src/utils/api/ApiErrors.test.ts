import { describe, expect, it } from "vitest";

import { APIErrors } from "./ApiErrors";

describe("APIErrors", () => {
  // Codes the API sends as error_code (its static errorCode declarations).
  it.each([
    "AccountNotActivated",
    "AnalyzerDependencyMissing",
    "AnalyzerHasAnalyses",
    "AnalyzerHasNoPlugins",
    "ExperimentAlreadyPublished",
    "ExperimentNotCancellable",
    "ExperimentNotPublishable",
    "IncorrectCurrentPassword",
    "InvalidFigureDefinition",
  ])("knows the %s code", (code) => {
    expect(Object.values(APIErrors)).toContain(code);
  });
});
