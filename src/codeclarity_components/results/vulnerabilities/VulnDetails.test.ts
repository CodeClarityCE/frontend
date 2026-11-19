import { render } from "@testing-library/vue";
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
