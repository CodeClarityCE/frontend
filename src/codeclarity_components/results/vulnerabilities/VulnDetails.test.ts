import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import VulnDetails from "./VulnDetails.vue";

const repo = vi.hoisted(() => ({ getFinding: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getFinding = repo.getFinding;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

// OSV says only 1.0.0 to 1.2.0 is affected, NVD says every version is.
const OSV_AFFECTED = ["1.1.0"];

// Answers like the API: the detail of the chosen version, else the first one stored.
function answer({ version }: { version?: string | null }) {
  const installed = version ?? "0.5.0";
  const osvAffected = OSV_AFFECTED.includes(installed);
  return Promise.resolve({
    data: {
      vulnerability_info: {
        vulnerability_id: "CVE-2099-0001",
        description: "",
        version_info: {
          affected_versions_string: ">=0.1.0 <3.0.0",
          patched_versions_string: "",
          versions: [],
          source_comparison: {
            agree: osvAffected,
            nvdReason: `Version ${installed} is in affected range >=0.1.0 <3.0.0`,
            osvReason: osvAffected
              ? `Version ${installed} is in affected range >=1.0.0 <1.2.0`
              : `Version ${installed} is NOT in OSV's known affected ranges`,
            gcveReason: "",
            nvdAllVersions: ">=0.1.0 <3.0.0",
            osvAllVersions: ">=1.0.0 <1.2.0",
            gcveAllVersions: "",
          },
        },
        published: "2099-01-01T00:00:00Z",
        last_modified: "2099-01-02T00:00:00Z",
        sources: [],
        aliases: [],
      },
      dependency_info: { name: "lodash", version: installed },
      weaknesses: [],
      severities: {},
      common_consequences: {},
      references: [],
    },
  });
}

async function open(search: string): Promise<void> {
  window.history.replaceState({}, "", `/results${search}`);
  repo.getFinding.mockImplementation(answer);
  render(VulnDetails, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: {
      stubs: {
        RouterLink: { template: "<a><slot /></a>" },
        AddToPolicyButton: true,
        VulnSummaryContent: true,
        VulnerabilitySeverities: true,
        VulnReferences: true,
      },
    },
  });
  await flushPromises();
}

describe("VulnDetails per affected version", () => {
  afterEach(() => {
    repo.getFinding.mockReset();
  });

  it("shows the source comparison of the version that was clicked", async () => {
    await open("?finding_id=CVE-2099-0001&dependency=lodash&version=1.5.0");

    expect(repo.getFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        vulnerability_id: "CVE-2099-0001",
        dependency: "lodash",
        version: "1.5.0",
      }),
    );
    expect(
      screen.getByText("Vulnerability sources disagree on your version"),
    ).toBeTruthy();
    expect(
      screen.getByText("Version 1.5.0 is NOT in OSV's known affected ranges"),
    ).toBeTruthy();
  });

  it("shows a version the sources agree on without the disagreement panel", async () => {
    await open("?finding_id=CVE-2099-0001&dependency=lodash&version=1.1.0");

    expect(screen.getAllByText("lodash@1.1.0").length).toBeGreaterThan(0);
    expect(
      screen.queryByText("Vulnerability sources disagree on your version"),
    ).toBeNull();
  });

  it("asks for the first occurrence when the link names no version", async () => {
    await open("?finding_id=CVE-2099-0001");

    expect(repo.getFinding).toHaveBeenCalledWith(
      expect.objectContaining({ dependency: null, version: null }),
    );
    expect(screen.getAllByText("lodash@0.5.0").length).toBeGreaterThan(0);
  });
});

const ANALYSIS = "5d6e7f80-91a2-4b3c-8d4e-5f6a7b8c9d0e";
const PROJECT = "9b0f6a4e-2c1d-4c3b-8f7a-1e2d3c4b5a69";

async function showAt(search: string): Promise<void> {
  window.history.replaceState(
    {},
    "",
    `/results/vulnerabilities_details?${search}`,
  );
  repo.getFinding.mockRejectedValue(new Error("down"));
  render(VulnDetails, {
    props: { analysisID: ANALYSIS, projectID: PROJECT },
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });
  await flushPromises();
}

describe("VulnDetails", () => {
  afterEach(() => {
    repo.getFinding.mockReset();
    window.history.replaceState({}, "", "/");
  });

  it("loads the finding from the root workspace by default", async () => {
    await showAt("finding_id=CVE-2021-23337");
    expect(repo.getFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        vulnerability_id: "CVE-2021-23337",
        workspace: ".",
      }),
    );
  });

  it("loads the finding from the workspace in the address", async () => {
    await showAt("finding_id=CVE-2021-23337&workspace=packages%2Fapp");
    expect(repo.getFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        vulnerability_id: "CVE-2021-23337",
        workspace: "packages/app",
      }),
    );
  });
});

// The detail of 1.1.0 with the given source verdicts, or as an older analysis without them.
async function openWithVerdicts(
  verdicts?: object[],
  available = verdicts !== undefined,
): Promise<void> {
  window.history.replaceState(
    {},
    "",
    "/results?finding_id=CVE-2099-0001&dependency=lodash&version=1.1.0",
  );
  repo.getFinding.mockImplementation(async (request) => {
    const detail = await answer(request);
    Object.assign(detail.data, {
      source_verdicts: verdicts ?? [],
      source_verdicts_available: available,
    });
    return detail;
  });
  render(VulnDetails, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: {
      stubs: {
        RouterLink: { template: "<a><slot /></a>" },
        AddToPolicyButton: true,
        VulnSummaryContent: true,
        VulnerabilitySeverities: true,
        VulnReferences: true,
      },
    },
  });
  await flushPromises();
}

describe("VulnDetails source verdicts", () => {
  afterEach(() => {
    repo.getFinding.mockReset();
  });

  it("shows each source's verdict for the chosen version", async () => {
    await openWithVerdicts([
      {
        source: "osv",
        verdict: "matched",
        evidence: { record_ids: ["GHSA-test-0001"] },
      },
      { source: "nvd", verdict: "no_record" },
      {
        source: "gcve",
        verdict: "stale_or_failed",
        evidence: { source_status: "failed" },
      },
    ]);

    const panel = screen.getByRole("region", { name: "Source verdicts" });
    const rows = within(panel).getAllByRole("listitem");
    const parts = rows.map((row) =>
      [...row.children].map((part) => part.textContent?.trim()),
    );
    expect(parts).toEqual([
      ["OSV", "Matched", "GHSA-test-0001"],
      ["NVD", "No record"],
      [
        "GCVE",
        "Stale or failed",
        "Its last update had failed when this analysis ran.",
      ],
    ]);
  });

  it("shows the evidence behind each verdict that does not report the vulnerability", async () => {
    await openWithVerdicts([
      {
        source: "osv",
        verdict: "version_excluded",
        evidence: {
          record_ids: ["GHSA-test-0002"],
          evaluated: {
            ranges: [
              { fixed: "1.0.4" },
              { introduced: "2.0.0", fixed: "2.1.0" },
            ],
            exact: [],
            universal: false,
          },
        },
      },
      {
        source: "nvd",
        verdict: "names_another_product",
        evidence: {
          record_ids: ["CVE-2099-0001"],
          names: [
            { vendor: "acme", product: "lodash", target_sw: "wordpress" },
          ],
        },
      },
      {
        source: "gcve",
        verdict: "retired",
        evidence: {
          record_ids: ["GCVE-0-2099-0001"],
          retired_reason: "withdrawn",
          retired_at: "2099-03-01T10:00:00Z",
        },
      },
    ]);

    const panel = screen.getByRole("region", { name: "Source verdicts" });
    const parts = within(panel)
      .getAllByRole("listitem")
      .map((row) => [...row.children].map((part) => part.textContent?.trim()));
    expect(parts).toEqual([
      [
        "OSV",
        "Version excluded",
        "GHSA-test-0002",
        "Affects <1.0.4, >=2.0.0 <2.1.0.",
      ],
      [
        "NVD",
        "Names another product",
        "CVE-2099-0001",
        "Names acme lodash (wordpress).",
      ],
      ["GCVE", "Retired", "GCVE-0-2099-0001", "Withdrawn on 2099-03-01."],
    ]);
  });

  it("shows a GCVE unaffected entry and an advisory without package data", async () => {
    await openWithVerdicts([
      {
        source: "osv",
        verdict: "no_package_data",
        evidence: { record_ids: ["GHSA-test-0003"] },
      },
      {
        source: "gcve",
        verdict: "version_excluded",
        evidence: {
          record_ids: ["CVE-2099-0001"],
          evaluated: {
            ranges: [{ introduced: "1.0.0", fixed: "2.0.0" }],
            exact: [],
            universal: false,
          },
          unaffected: { ranges: [], exact: ["1.1.0"], universal: false },
        },
      },
    ]);

    const panel = screen.getByRole("region", { name: "Source verdicts" });
    expect(
      within(panel).getByText("The record names no package."),
    ).toBeTruthy();
    expect(
      within(panel).getByText(
        "Affects >=1.0.0 <2.0.0. Marks 1.1.0 unaffected.",
      ),
    ).toBeTruthy();
  });

  it("does not ask to re-run for a finding without verdicts in an analysis that has them", async () => {
    await openWithVerdicts([], true);

    const panel = screen.getByRole("region", { name: "Source verdicts" });
    expect(within(panel).queryByText(/Re-run/)).toBeNull();
    expect(
      within(panel).getByText(/comes from an analyzer that does not match/),
    ).toBeTruthy();
  });

  it("asks to re-run an analysis stored without source verdicts", async () => {
    await openWithVerdicts();

    const panel = screen.getByRole("region", { name: "Source verdicts" });
    expect(
      within(panel).getByText(
        "Source verdicts are not available for this analysis. Re-run it to see what each knowledge source said.",
      ),
    ).toBeTruthy();
    expect(within(panel).queryAllByRole("listitem")).toEqual([]);
  });
});
