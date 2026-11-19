import { render, screen } from "@testing-library/vue";
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

    expect(screen.getByText("CVE-2024-0001")).toBeTruthy();
    expect(screen.getByText("CVE-2024-0002")).toBeTruthy();
    expect(screen.getAllByText("Disputed")).toHaveLength(1);
  });
});
