import { describe, expect, it } from "vitest";

import { createTestApp, org } from "../../../tests/real-app";

import { ResultsRepository } from "./results.repository";

const analysisPath = `/org/${org.id}/projects/project-1/analysis/analysis-1`;
const ids = {
  orgId: org.id,
  projectId: "project-1",
  analysisId: "analysis-1",
  bearerToken: "token",
  handleBusinessErrors: true,
};

describe("ResultsRepository.getMaliciousPackageAdvisories", () => {
  it("asks for one workspace and returns the advisories unchanged", async () => {
    const app = createTestApp();
    const advisory = {
      AdvisoryId: "MAL-2025-1234",
      AffectedDependency: "evil-package",
      AffectedVersion: "1.2.3",
      DirectDependency: false,
    };
    app.http.on("GET", `${analysisPath}/vulnerabilities/malicious-packages`, {
      data: [advisory],
    });

    const response =
      await new ResultsRepository().getMaliciousPackageAdvisories({
        ...ids,
        workspace: "packages/app",
      });

    expect(app.http.requests[0]?.query.get("workspace")).toBe("packages/app");
    expect(response.data).toEqual([advisory]);
  });
});

describe("ResultsRepository.getFinding", () => {
  it("keeps a vulnerability ID with slashes in one path segment", async () => {
    const app = createTestApp();
    app.http.on(
      "GET",
      `${analysisPath}/vulnerabilities/vulnerability/FRIENDSOFPHP-symfony%2Fhttp-foundation%2F2019-11-13-1`,
      { data: { vulnerability_info: { vulnerability_id: "FRIENDSOFPHP" } } },
    );

    const response = await new ResultsRepository().getFinding({
      ...ids,
      vulnerability_id: "FRIENDSOFPHP-symfony/http-foundation/2019-11-13-1",
      workspace: ".",
    });

    expect(response.data).toEqual({
      vulnerability_info: { vulnerability_id: "FRIENDSOFPHP" },
    });
  });
});

describe("ResultsRepository.getVulnerabilitiesStat", () => {
  it("sends the policy toggle", async () => {
    const app = createTestApp();
    app.http.on("GET", `${analysisPath}/vulnerabilities/stats`, { data: {} });

    await new ResultsRepository().getVulnerabilitiesStat({
      ...ids,
      workspace: ".",
      show_blacklisted: true,
    });

    expect(app.http.requests[0]?.query.get("show_blacklisted")).toBe("true");
  });
});

describe("ResultsRepository.downloadSourceVerdicts", () => {
  it.each(["csv", "json"] as const)(
    "downloads the %s export of every workspace as a blob",
    async (format) => {
      const app = createTestApp();
      // The export is a file, so the answer is sent as raw text.
      app.http.on(
        "GET",
        `${analysisPath}/vulnerabilities/source-verdicts`,
        "workspace,source\r\n",
      );

      const blob = await new ResultsRepository().downloadSourceVerdicts({
        ...ids,
        format,
      });

      const request = app.http.requests[0];
      expect(request?.path).toBe(
        `${analysisPath}/vulnerabilities/source-verdicts`,
      );
      expect(request?.query.get("format")).toBe(format);
      expect(request?.query.has("workspace")).toBe(false);
      expect(await blob.text()).toBe("workspace,source\r\n");
    },
  );

  it("rejects with the API's error code when the analysis has no verdicts", async () => {
    const app = createTestApp();
    app.http.on(
      "GET",
      `${analysisPath}/vulnerabilities/source-verdicts`,
      {
        error_code: "SourceVerdictsNotAvailable",
        error_message: "This analysis predates source verdicts.",
        status_code: 409,
      },
      409,
    );

    await expect(
      new ResultsRepository().downloadSourceVerdicts({ ...ids, format: "csv" }),
    ).rejects.toMatchObject({ error_code: "SourceVerdictsNotAvailable" });
  });
});
