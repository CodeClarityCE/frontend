import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResultsRepository } from "./results.repository";

// Runs the real repository so only the network is faked.
vi.unmock("@/utils/api/BaseRepository");
vi.unmock("@/codeclarity_components/results/results.repository");
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-toast-notification", () => ({
  useToast: () => ({ error: vi.fn() }),
}));

describe("ResultsRepository.getMaliciousPackageAdvisories", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks for one workspace and returns the advisories unchanged", async () => {
    const advisory = {
      AdvisoryId: "MAL-2025-1234",
      AffectedDependency: "evil-package",
      AffectedVersion: "1.2.3",
      DirectDependency: false,
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: [advisory] }), { status: 200 }),
    );

    const response =
      await new ResultsRepository().getMaliciousPackageAdvisories({
        orgId: "org-1",
        projectId: "project-1",
        analysisId: "analysis-1",
        workspace: "packages/app",
        bearerToken: "token",
        handleBusinessErrors: true,
      });

    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain(
      "/org/org-1/projects/project-1/analysis/analysis-1/vulnerabilities/malicious-packages",
    );
    expect(new URL(url, "http://localhost").searchParams.get("workspace")).toBe(
      "packages/app",
    );
    expect(response.data).toEqual([advisory]);
  });
});
