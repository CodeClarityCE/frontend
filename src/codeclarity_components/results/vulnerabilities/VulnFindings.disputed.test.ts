import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { analysisPath, paginated } from "../../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../../tests/real-app";

import VulnFindings from "./VulnFindings.vue";

const FINDINGS_PATH = `${analysisPath}/vulnerabilities`;

let app: TestApp;

// Answers the findings list from its query, as the API filters it, and keeps each query sent.
function serveFindings(
  answer: (query: URLSearchParams) => unknown,
): URLSearchParams[] {
  const queries: URLSearchParams[] = [];
  const answerOther = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    async (input: string | URL, init?: RequestInit): Promise<Response> => {
      const url = new URL(String(input));
      if (!url.pathname.endsWith(FINDINGS_PATH))
        return answerOther(input, init);
      queries.push(url.searchParams);
      return new Response(JSON.stringify(answer(url.searchParams)), {
        headers: { "Content-Type": "application/json" },
      });
    },
  );
  return queries;
}

const finding = (id: string, disputed: boolean) => ({
  Id: id,
  Vulnerability: id,
  Severity: { Severity: 9.8 },
  Weaknesses: [],
  Description: "",
  Conflict: { ConflictWinner: "NVD", ConflictFlag: "NO_CONFLICT" },
  VLAI: [],
  EPSS: { Score: 0, Percentile: 0 },
  Sources: [],
  ...(disputed ? { Disputed: true } : {}),
  Affected: [
    {
      AffectedDependency: `${id}-dep`,
      AffectedVersion: "1.0.0",
      VulnerabilityId: id,
      Severity: { Severity: 9.8 },
      ...(disputed ? { Disputed: true } : {}),
    },
  ],
});

describe("VulnFindings disputed badge", () => {
  it("badges only the disputed finding", async () => {
    const data = [
      finding("CVE-2024-0001", true),
      finding("CVE-2024-0002", false),
    ];
    app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    serveFindings(() => paginated(data));

    render(VulnFindings, {
      props: { analysisID: "a-1", projectID: "p-1" },
      global: app.global,
    });
    await flushPromises();

    expect(screen.getByText("CVE-2024-0001")).toBeTruthy();
    expect(screen.getByText("CVE-2024-0002")).toBeTruthy();
    expect(screen.getAllByText("Disputed")).toHaveLength(1);
  });
});
