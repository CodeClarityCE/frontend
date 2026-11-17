import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { patchStatus } from "./vuln-format";
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
function answer({ active_filters }: { active_filters: string }) {
  const wanted = active_filters
    .split(",")
    .filter((filter) => filter.startsWith("patch_"))
    .map((filter) => filter.replace("patch_", "").toUpperCase());
  const data = all.filter(
    (row) =>
      wanted.length === 0 ||
      row.Affected.some((a) => wanted.includes(a.PatchType ?? "")),
  );
  return Promise.resolve({
    data,
    total_entries: data.length,
    matching_count: data.length,
    filter_count: { patch_full: 1, patch_partial: 1, patch_none: 1 },
  });
}

async function show(hasPatching: boolean): Promise<void> {
  render(VulnFindings, {
    props: { analysisID: "a-1", projectID: "p-1", hasPatching },
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });
  await flushPromises();
}

describe("VulnFindings patch status filters", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    repo.getVulnerabilities.mockReset();
    repo.getVulnerabilities.mockImplementation(answer);
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

    expect(repo.getVulnerabilities).toHaveBeenLastCalledWith(
      expect.objectContaining({ active_filters: "patch_full" }),
    );
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
    repo.getVulnerabilities.mockRejectedValue(new Error("offline"));
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
