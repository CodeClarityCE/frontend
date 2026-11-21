import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
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

const verdicts = (osv: string, nvd: string, gcve: string) => [
  { source: "osv", verdict: osv },
  { source: "nvd", verdict: nvd },
  { source: "gcve", verdict: gcve },
];

const finding = (
  id: string,
  extra: Record<string, unknown>,
  affected: Record<string, unknown> = {},
) => ({
  Id: id,
  Vulnerability: id,
  Severity: { Severity: 9.8 },
  Weaknesses: [],
  Description: "",
  Conflict: { ConflictWinner: "NVD", ConflictFlag: "NO_CONFLICT" },
  VLAI: [],
  EPSS: { Score: 0, Percentile: 0 },
  Sources: [],
  ...extra,
  Affected: [
    {
      AffectedDependency: `${id}-dep`,
      AffectedVersion: "1.0.0",
      VulnerabilityId: id,
      Severity: { Severity: 9.8 },
      ...affected,
    },
  ],
});

let queries: URLSearchParams[] = [];

async function renderFindings(data: unknown[]): Promise<void> {
  app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  queries = serveFindings(() => paginated(data));
  render(VulnFindings, {
    props: { analysisID: "a-1", projectID: "p-1", hasPatching: false },
    global: app.global,
  });
  await flushPromises();
}

describe("VulnFindings uncorroborated badge", () => {
  it("badges only the uncorroborated finding", async () => {
    await renderFindings([
      finding(
        "CVE-2024-0001",
        { Uncorroborated: true },
        {
          Uncorroborated: true,
          SourceVerdicts: verdicts("no_package_data", "no_record", "matched"),
        },
      ),
      finding("CVE-2024-0002", { Uncorroborated: false }),
    ]);

    expect(screen.getAllByText("Uncorroborated")).toHaveLength(1);
  });

  it("lists each source's verdict when hovering the badge", async () => {
    await renderFindings([
      finding(
        "CVE-2024-0001",
        { Uncorroborated: true },
        {
          Uncorroborated: true,
          SourceVerdicts: verdicts("no_package_data", "no_record", "matched"),
        },
      ),
    ]);

    const badge = screen.getByText("Uncorroborated");
    expect(badge.getAttribute("title")).toBe(
      "Matched by one source origin only. OSV: No package data. NVD: No record. GCVE: Matched.",
    );
  });

  it("shows no warning for a possibly incorrect match flag alone", async () => {
    await renderFindings([
      finding("CVE-2024-0003", {
        Conflict: {
          ConflictWinner: "GCVE",
          ConflictFlag: "MATCH_POSSIBLE_INCORRECT",
        },
      }),
    ]);

    expect(screen.queryByRole("list", { name: "Warnings" })).toBeNull();
  });

  it("sends the filter that hides uncorroborated findings", async () => {
    await renderFindings([finding("CVE-2024-0004", {})]);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitemcheckbox", {
        name: "Hide uncorroborated",
      }),
    );
    await flushPromises();

    expect(queries.at(-1)?.get("active_filters")).toBe("hide_uncorroborated");
  });
});
