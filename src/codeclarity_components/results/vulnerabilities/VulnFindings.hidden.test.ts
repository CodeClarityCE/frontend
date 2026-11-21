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

const finding = (id: string, affected: Record<string, unknown> = {}) => ({
  Id: id,
  Vulnerability: id,
  Severity: { Severity: 9.8 },
  Weaknesses: [],
  Description: "",
  Conflict: { ConflictWinner: "GCVE", ConflictFlag: "NO_CONFLICT" },
  VLAI: [],
  EPSS: { Score: 0, Percentile: 0 },
  Sources: [],
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

// Answers like the API: hidden instances come back only when their filter asks.
function answer(query: URLSearchParams) {
  const data = [
    finding("CVE-2024-0001", { ContradictedBy: ["gcve"] }),
    ...(query.get("show_contradicted") === "true"
      ? [
          finding("CVE-2024-0002", {
            Hidden: "contradicted",
            ContradictedBy: ["osv"],
          }),
        ]
      : []),
    ...(query.get("show_retired") === "true"
      ? [finding("CVE-2024-0003", { Hidden: "retired_all" })]
      : []),
  ];
  return paginated(data, {
    hidden_counts: { contradicted: 1, retired_all: 1 },
    source_verdicts_available: true,
  });
}

let queries: URLSearchParams[] = [];

// Shows the findings, answered by the API stand-in unless a fixed answer is given.
async function renderFindings(fixed?: Record<string, unknown>): Promise<void> {
  app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  queries = serveFindings((query) => fixed ?? answer(query));
  render(VulnFindings, {
    props: { analysisID: "a-1", projectID: "p-1", hasPatching: false },
    global: app.global,
  });
  await flushPromises();
}

describe("VulnFindings hidden instances", () => {
  it("says how many instances it hid and why", async () => {
    await renderFindings();

    expect(
      screen.getByText("1 hidden: contradicted by another source"),
    ).toBeTruthy();
    expect(screen.getByText("1 hidden: retired on all sources")).toBeTruthy();
    expect(screen.queryByText("CVE-2024-0002")).toBeNull();
  });

  it("shows contradicted instances from the hidden line", async () => {
    await renderFindings();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: "Show instances contradicted by another source",
      }),
    );
    await flushPromises();

    expect(queries.at(-1)?.get("show_contradicted")).toBe("true");
    expect(queries.at(-1)?.get("show_retired")).toBeNull();
    expect(screen.getByText("CVE-2024-0002")).toBeTruthy();
    expect(screen.getByText("Contradicted")).toBeTruthy();
    expect(
      screen.getByText("1 shown: contradicted by another source"),
    ).toBeTruthy();
  });

  it("shows all-retired instances from the filter menu", async () => {
    await renderFindings();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitemcheckbox", {
        name: "Show retired on all sources",
      }),
    );
    await flushPromises();

    expect(queries.at(-1)?.get("show_retired")).toBe("true");
    expect(screen.getByText("CVE-2024-0003")).toBeTruthy();
    expect(screen.getByText("Retired everywhere")).toBeTruthy();
  });

  it("names the source that contradicted part of a visible instance", async () => {
    await renderFindings();

    const note = screen.getByText("Contradicted by GCVE");
    expect(note.getAttribute("title")).toContain(
      "GCVE withdrew this vulnerability or says the installed version is not affected",
    );
  });

  it("shows no hidden line when nothing was hidden", async () => {
    await renderFindings(
      paginated([finding("CVE-2024-0004")], {
        hidden_counts: { contradicted: 0, retired_all: 0 },
        source_verdicts_available: true,
      }),
    );

    expect(screen.queryByText(/hidden:/)).toBeNull();
  });

  it("says an analysis without source verdicts hides nothing until it is re-run", async () => {
    await renderFindings(
      paginated([finding("CVE-2024-0005")], {
        hidden_counts: { contradicted: 0, retired_all: 0 },
        source_verdicts_available: false,
      }),
    );

    expect(
      screen.getByText(
        "This analysis predates source verdicts, so nothing is hidden. Re-run it to explain each vulnerability.",
      ),
    ).toBeTruthy();
  });

  it("says nothing about re-running when the analysis has source verdicts", async () => {
    await renderFindings();

    expect(screen.queryByText(/predates source verdicts/)).toBeNull();
  });
});
