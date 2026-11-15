import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";

import { LanguageDetectionService } from "./languageDetection";

const { getResultByType, signedIn } = vi.hoisted(() => ({
  getResultByType: vi.fn(),
  signedIn: { user: undefined as { id: string } | undefined },
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getUser: signedIn.user }),
}));

vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getResultByType = getResultByType;
  },
}));

const analysis = {
  id: "an-1",
  steps: [[{ Name: "js-sbom", Status: AnalysisStatus.SUCCESS }]],
} as unknown as Analysis;

function signIn(id: string): void {
  signedIn.user = { id };
}

describe("LanguageDetectionService", () => {
  beforeEach(() => {
    getResultByType.mockReset();
    getResultByType.mockResolvedValue({
      data: { result: { workspaces: { ".": { dependencies: { a: {} } } } } },
    });
  });

  it("fetches an analysis's languages once for the same user", async () => {
    signIn("u-1");
    const service = new LanguageDetectionService();

    await service.detectProjectLanguages("o", "p", analysis, "t");
    const again = await service.detectProjectLanguages("o", "p", analysis, "t");

    expect(again.map((l) => l.name)).toEqual(["JavaScript"]);
    expect(getResultByType).toHaveBeenCalledTimes(1);
  });

  it("fetches again once another user signs in", async () => {
    signIn("u-2");
    const service = new LanguageDetectionService();
    await service.detectProjectLanguages("o", "p", analysis, "t");

    signedIn.user = undefined;
    signIn("u-3");
    await service.detectProjectLanguages("o", "p", analysis, "t");

    expect(getResultByType).toHaveBeenCalledTimes(2);
  });
});
