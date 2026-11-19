import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import VulnList from "./VulnList.vue";
import type { VulnerabilityMerged } from "./VulnStats";

// Renders a route's query as the link's href, so tests can read where it goes.
const RouterLink = {
  props: ["to"],
  computed: {
    href(this: { to: { query: Record<string, string> } }): string {
      return `?${new URLSearchParams(this.to.query).toString()}`;
    },
  },
  template: '<a :href="href"><slot /></a>',
};

const affected = (version: string) => ({
  AffectedDependency: "lodash",
  AffectedVersion: version,
  VulnerabilityId: "CVE-2099-0001",
  Severity: { Severity: 7.5 },
});

const finding = {
  Id: "CVE-2099-0001",
  Vulnerability: "CVE-2099-0001",
  Severity: { Severity: 7.5 },
  Weaknesses: [],
  Description: "",
  Conflict: { ConflictWinner: "NVD", ConflictFlag: "NO_CONFLICT" },
  VLAI: [],
  EPSS: { Score: 0, Percentile: 0 },
  Sources: [],
  Affected: [affected("0.5.0"), affected("1.1.0"), affected("1.5.0")],
} as unknown as VulnerabilityMerged;

function linkQuery(link: HTMLElement): Record<string, string> {
  const href = link.closest("a")!.getAttribute("href")!;
  return Object.fromEntries(new URLSearchParams(href));
}

describe("VulnList detail links", () => {
  it("links each affected version to its own detail", () => {
    render(VulnList, {
      props: {
        findings: [finding],
        loading: false,
        emptyText: "",
        analysisID: "a-1",
        projectID: "p-1",
      },
      global: {
        stubs: {
          RouterLink,
          CreateTicketButton: true,
          AddToPolicyButton: true,
        },
      },
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
