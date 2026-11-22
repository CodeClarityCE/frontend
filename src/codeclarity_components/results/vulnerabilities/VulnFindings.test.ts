import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const finding = (id: string, PatchType: string | undefined) => ({
  Id: id,
  Vulnerability: id,
  Severity: { Severity: 7.5 },
  Weaknesses: [],
  Description: "",
  Conflict: { ConflictWinner: "NVD", ConflictFlag: "NO_CONFLICT" },
  VLAI: [],
  EPSS: { Score: 0, Percentile: 0 },
  Sources: [],
  Affected: [
    {
      AffectedDependency: `${id}-dep`,
      AffectedVersion: "1.0.0",
      VulnerabilityId: id,
      Severity: { Severity: 7.5 },
      ...(PatchType ? { PatchType } : {}),
    },
  ],
});

const all = [finding("CVE-2024-0001", "FULL")];

let queries: URLSearchParams[] = [];

// Signs in and answers the findings list like the API.
async function start(): Promise<void> {
  app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  queries = serveFindings(() => paginated(all));
}

describe("VulnFindings without patch status", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await start();
  });

  // An API from before js-patching was removed still sent a patch type.
  it("offers no patch status filter or badge, even for a finding with a patch type", async () => {
    render(VulnFindings, {
      props: { analysisID: "a-1", projectID: "p-1" },
      global: app.global,
    });
    await flushPromises();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).queryByText("Patch status")).toBeNull();
    expect(within(menu).getByText("Matching")).toBeTruthy();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("tab", { name: "Table" }));
    expect(screen.getByText("CVE-2024-0001")).toBeTruthy();
    expect(screen.queryByText("Patchable")).toBeNull();
    expect(screen.queryByText("Not checked")).toBeNull();
  });
});

describe("VulnFindings links", () => {
  beforeEach(async () => {
    await start();
  });

  it("keeps the selected workspace in each details link", async () => {
    render(VulnFindings, {
      props: { analysisID: "a-1", projectID: "p-1", workspace: "packages/app" },
      global: app.global,
    });
    await flushPromises();

    expect(queries.at(-1)?.get("workspace")).toBe("packages/app");
    const links = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) => href.includes("finding_id="));
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      expect(
        new URL(href, "http://localhost").searchParams.get("workspace"),
      ).toBe("packages/app");
    }
  });
});
