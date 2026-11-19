import { render, screen } from "@testing-library/vue";
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
