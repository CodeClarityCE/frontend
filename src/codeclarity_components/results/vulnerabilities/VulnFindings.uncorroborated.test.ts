import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import VulnFindings from "./VulnFindings.vue";

vi.mock("@vueuse/core", async () => await vi.importActual("@vueuse/core"));

const repo = vi.hoisted(() => ({ getVulnerabilities: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getVulnerabilities = repo.getVulnerabilities;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

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

async function renderFindings(data: unknown[]): Promise<void> {
  repo.getVulnerabilities.mockResolvedValue({
    data,
    total_entries: data.length,
    matching_count: data.length,
    filter_count: {},
  });
  render(VulnFindings, {
    props: { analysisID: "a-1", projectID: "p-1", hasPatching: false },
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
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

    expect(repo.getVulnerabilities).toHaveBeenLastCalledWith(
      expect.objectContaining({ active_filters: "hide_uncorroborated" }),
    );
  });
});
