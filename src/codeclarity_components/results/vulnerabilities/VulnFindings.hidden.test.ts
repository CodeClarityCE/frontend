import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
function answer(options: {
  show_contradicted?: boolean;
  show_retired?: boolean;
}) {
  const data = [
    finding("CVE-2024-0001", { ContradictedBy: ["gcve"] }),
    ...(options.show_contradicted
      ? [
          finding("CVE-2024-0002", {
            Hidden: "contradicted",
            ContradictedBy: ["osv"],
          }),
        ]
      : []),
    ...(options.show_retired
      ? [finding("CVE-2024-0003", { Hidden: "retired_all" })]
      : []),
  ];
  return Promise.resolve({
    data,
    total_entries: data.length,
    matching_count: data.length,
    filter_count: {},
    hidden_counts: { contradicted: 1, retired_all: 1 },
    source_verdicts_available: true,
  });
}

async function renderFindings(): Promise<void> {
  render(VulnFindings, {
    props: { analysisID: "a-1", projectID: "p-1", hasPatching: false },
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });
  await flushPromises();
}

describe("VulnFindings hidden instances", () => {
  beforeEach(() => {
    repo.getVulnerabilities.mockReset();
    repo.getVulnerabilities.mockImplementation(answer);
  });

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

    expect(repo.getVulnerabilities).toHaveBeenLastCalledWith(
      expect.objectContaining({ show_contradicted: true, show_retired: false }),
    );
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

    expect(repo.getVulnerabilities).toHaveBeenLastCalledWith(
      expect.objectContaining({ show_retired: true }),
    );
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
    repo.getVulnerabilities.mockResolvedValue({
      data: [finding("CVE-2024-0004")],
      total_entries: 1,
      matching_count: 1,
      filter_count: {},
      hidden_counts: { contradicted: 0, retired_all: 0 },
      source_verdicts_available: true,
    });
    await renderFindings();

    expect(screen.queryByText(/hidden:/)).toBeNull();
  });
});
