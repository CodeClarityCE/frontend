import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { analysisPath, paginated } from "../../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../../tests/real-app";

import { patchStatus } from "./vuln-format";
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

let all = [
  finding("CVE-2024-0001", "FULL"),
  finding("CVE-2024-0002", "PARTIAL"),
  finding("CVE-2024-0003", "NONE"),
];

// Answers like the API: the patch filters keep rows of their type.
function answer(query: URLSearchParams) {
  const wanted = (query.get("active_filters") ?? "")
    .split(",")
    .filter((filter) => filter.startsWith("patch_"))
    .map((filter) => filter.replace("patch_", "").toUpperCase());
  const data = all.filter(
    (row) =>
      wanted.length === 0 ||
      row.Affected.some((a) => wanted.includes(a.PatchType ?? "")),
  );
  return paginated(data, {
    filter_count: { patch_full: 1, patch_partial: 1, patch_none: 1 },
  });
}

let queries: URLSearchParams[] = [];

// Signs in and answers the findings list like the API.
async function start(): Promise<void> {
  app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  queries = serveFindings(answer);
}

async function show(hasPatching: boolean): Promise<void> {
  render(VulnFindings, {
    props: { analysisID: "a-1", projectID: "p-1", hasPatching },
    global: app.global,
  });
  await flushPromises();
}

describe("VulnFindings patch status filters", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await start();
  });

  it("sends patch_full and shows only patchable findings", async () => {
    await show(true);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Patch status")).toBeTruthy();
    await user.click(
      within(menu).getByRole("menuitemcheckbox", { name: "Patchable (1)" }),
    );
    await flushPromises();

    expect(queries.at(-1)?.get("active_filters")).toBe("patch_full");
    expect(screen.getByText("CVE-2024-0001")).toBeTruthy();
    expect(screen.queryByText("CVE-2024-0002")).toBeNull();
    expect(screen.queryByText("CVE-2024-0003")).toBeNull();
  });

  it("titles the patch filters like the badges", async () => {
    await show(true);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");

    for (const type of ["FULL", "PARTIAL", "NONE"]) {
      expect(
        within(menu).getByRole("menuitemcheckbox", {
          name: `${patchStatus(type).label} (1)`,
        }),
      ).toBeTruthy();
    }
  });

  it("shows a finding without a patch type as not checked, not as not patchable", async () => {
    all = [finding("CVE-2024-0004", undefined)];
    try {
      await show(true);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.click(screen.getByRole("tab", { name: "Table" }));

      expect(screen.getByText("Not checked")).toBeTruthy();
      expect(screen.queryByText("Not patchable")).toBeNull();
    } finally {
      all = [
        finding("CVE-2024-0001", "FULL"),
        finding("CVE-2024-0002", "PARTIAL"),
        finding("CVE-2024-0003", "NONE"),
      ];
    }
  });

  it("drops the filter counts when the request fails", async () => {
    await show(true);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("offline")));
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitemcheckbox", { name: "Patchable (1)" }),
    );
    await flushPromises();

    expect(
      within(menu).getByRole("menuitemcheckbox", { name: "Patchable" }),
    ).toBeTruthy();
  });

  it("offers no patch status group without a patching result", async () => {
    await show(false);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).queryByText("Patch status")).toBeNull();
    expect(within(menu).getByText("Matching")).toBeTruthy();
  });
});

describe("VulnFindings links", () => {
  beforeEach(async () => {
    all = [finding("CVE-2024-0001", "FULL")];
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
