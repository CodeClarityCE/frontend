import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import VulnList from "./VulnList.vue";
import type { VulnerabilityMerged } from "./VulnStats";
import VulnTable from "./VulnTable.vue";

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

const affected = (version: string, score: number) => ({
  AffectedDependency: "qs",
  AffectedVersion: version,
  VulnerabilityId: "CVE-2024-0001",
  Severity: { Severity: score },
});

// The API sends the worst severity of the affected versions as the CVE's.
const twoVersions = {
  Id: "CVE-2024-0001",
  Vulnerability: "CVE-2024-0001",
  Severity: { Severity: 9.5 },
  Weaknesses: [],
  Description: "",
  Conflict: { ConflictWinner: "NVD", ConflictFlag: "NO_CONFLICT" },
  VLAI: [],
  EPSS: { Score: 0, Percentile: 0 },
  Sources: ["NVD", "OSV"],
  Affected: [affected("6.0.0", 4.0), affected("6.5.0", 9.5)],
} as unknown as VulnerabilityMerged;

const props = {
  findings: [twoVersions],
  loading: false,
  emptyText: "None",
  analysisID: "a-1",
  projectID: "p-1",
  workspace: ".",
};
const global = { stubs: { RouterLink: { template: "<a><slot /></a>" } } };

describe("a CVE found in two versions of a dependency", () => {
  it("shows its worst severity and both versions on the card", () => {
    render(VulnList, { props, global });

    const card = screen.getByTestId("vulnerability-card");
    expect(within(card).getByText("Critical")).toBeTruthy();
    expect(within(card).queryByText("Medium")).toBeNull();
    const versions = within(
      within(card).getByRole("list", { name: "Affected dependencies" }),
    ).getAllByRole("listitem");
    expect(versions.map((v) => v.textContent?.replace(/\s/g, ""))).toEqual([
      "qs@6.0.0",
      "qs@6.5.0",
    ]);
  });

  it("shows its worst severity and both versions in the table", () => {
    render(VulnTable, {
      props: {
        ...props,
        total: 1,
        sorting: [],
        pageSize: 20,
        pageIndex: 0,
      },
      global,
    });

    expect(screen.getByText("Critical")).toBeTruthy();
    expect(screen.queryByText("Medium")).toBeNull();
    expect(screen.getByText("qs@6.0.0")).toBeTruthy();
    expect(screen.getByText("qs@6.5.0")).toBeTruthy();
  });
});

// Renders a route's query as the link's href, so tests can read where it goes.
const LinkWithQuery = {
  props: ["to"],
  computed: {
    href(this: { to: { query: Record<string, string> } }): string {
      return `?${new URLSearchParams(this.to.query).toString()}`;
    },
  },
  template: '<a :href="href"><slot /></a>',
};

const lodashAt = (version: string) => ({
  AffectedDependency: "lodash",
  AffectedVersion: version,
  VulnerabilityId: "CVE-2099-0001",
  Severity: { Severity: 7.5 },
});

const threeVersions = {
  ...twoVersions,
  Id: "CVE-2099-0001",
  Vulnerability: "CVE-2099-0001",
  Affected: [lodashAt("0.5.0"), lodashAt("1.1.0"), lodashAt("1.5.0")],
} as unknown as VulnerabilityMerged;

function linkQuery(link: HTMLElement): Record<string, string> {
  const href = link.closest("a")!.getAttribute("href")!;
  return Object.fromEntries(new URLSearchParams(href));
}

describe("detail links of a CVE found in three versions", () => {
  it("links each affected version to its own detail", () => {
    render(VulnList, {
      props: { ...props, findings: [threeVersions] },
      global: { stubs: { RouterLink: LinkWithQuery } },
    });

    const badges = within(
      screen.getByRole("list", { name: "Affected dependencies" }),
    );
    expect(
      ["0.5.0", "1.1.0", "1.5.0"].map((v) =>
        linkQuery(badges.getByText(`lodash@${v}`)),
      ),
    ).toEqual(
      ["0.5.0", "1.1.0", "1.5.0"].map((version) => ({
        analysis_id: "a-1",
        project_id: "p-1",
        finding_id: "CVE-2099-0001",
        workspace: ".",
        dependency: "lodash",
        version,
      })),
    );
    expect(linkQuery(screen.getByText("CVE-2099-0001"))).toMatchObject({
      dependency: "lodash",
      version: "0.5.0",
    });
  });
});
