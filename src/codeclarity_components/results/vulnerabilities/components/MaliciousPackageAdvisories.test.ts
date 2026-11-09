import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import MaliciousPackageAdvisories from "./MaliciousPackageAdvisories.vue";

vi.unmock("@/utils/api/BaseRepository");

const getAdvisories = vi.hoisted(() => vi.fn());
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getMaliciousPackageAdvisories = getAdvisories;
  },
}));
const auth = vi.hoisted(() => ({ getAuthenticated: true, getToken: "token" }));
vi.mock("@/stores/auth", () => ({ useAuthStore: () => auth }));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

const advisory = {
  AdvisoryId: "MAL-2025-1234",
  AffectedDependency: "evil-package",
  AffectedVersion: "1.2.3",
  DirectDependency: true,
  Summary: "Malicious code in evil-package",
};

function mountAdvisories(
  workspace = ".",
): ReturnType<typeof mount<typeof MaliciousPackageAdvisories>> {
  return mount(MaliciousPackageAdvisories, {
    props: { analysisID: "analysis-1", projectID: "project-1", workspace },
  });
}

describe("MaliciousPackageAdvisories", () => {
  beforeEach(() => {
    getAdvisories.mockReset();
    getAdvisories.mockResolvedValue({ data: [] });
    auth.getAuthenticated = true;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks advisories as malicious and says to remove the package", async () => {
    getAdvisories.mockResolvedValue({ data: [advisory] });

    const wrapper = mountAdvisories();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("Malicious package");
    expect(text).toContain("evil-package");
    expect(text).toContain("1.2.3");
    expect(text).toContain("MAL-2025-1234");
    expect(text).toContain("Malicious code in evil-package");
    expect(text).toMatch(/remove/i);
    expect(text).toMatch(/potentially compromised/i);
  });

  it("renders nothing when the analysis has no advisories", async () => {
    const wrapper = mountAdvisories();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="malicious-package-advisories"]').exists(),
    ).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it.each([APIErrors.PluginResultNotAvailable, APIErrors.UnknownWorkspace])(
    "renders nothing when the analysis has no result yet (%s)",
    async (code) => {
      getAdvisories.mockRejectedValue(
        new BusinessLogicError(code, "no result"),
      );

      const wrapper = mountAdvisories();
      await flushPromises();

      expect(wrapper.text()).toBe("");
    },
  );

  it.each([
    ["network failure", new Error("Failed to fetch")],
    [
      "plugin failure",
      new BusinessLogicError(APIErrors.PluginFailed, "failed"),
    ],
  ])("shows that the check could not run on a %s", async (_name, error) => {
    getAdvisories.mockRejectedValue(error);

    const wrapper = mountAdvisories();
    await flushPromises();

    expect(wrapper.text()).toMatch(/could not check for malicious packages/i);
  });

  it("clears the failure when a later selection loads", async () => {
    getAdvisories.mockRejectedValueOnce(new Error("Failed to fetch"));

    const wrapper = mountAdvisories();
    await flushPromises();
    await wrapper.setProps({ workspace: "other" });
    await flushPromises();

    expect(wrapper.text()).toBe("");
  });

  it("shows no severity scores", async () => {
    getAdvisories.mockResolvedValue({ data: [advisory] });

    const wrapper = mountAdvisories();
    await flushPromises();

    expect(wrapper.text()).not.toMatch(
      /severity|cvss|epss|critical|\bhigh\b|\bmedium\b|\blow\b/i,
    );
  });

  it("shows whether the package is a direct dependency", async () => {
    getAdvisories.mockResolvedValue({
      data: [
        advisory,
        {
          ...advisory,
          AffectedDependency: "deep-evil",
          AdvisoryId: "MAL-2",
          DirectDependency: false,
        },
      ],
    });

    const wrapper = mountAdvisories();
    await flushPromises();

    const items = wrapper.findAll("li[data-advisory]").map((li) => li.text());
    expect(items[0]).toMatch(/direct/i);
    expect(items[1]).toMatch(/transitive/i);
  });

  it("keeps two advisories for the same package apart", async () => {
    getAdvisories.mockResolvedValue({
      data: [advisory, { ...advisory, AdvisoryId: "GHSA-aaaa-bbbb-cccc" }],
    });

    const wrapper = mountAdvisories();
    await flushPromises();

    expect(wrapper.findAll("li[data-advisory]")).toHaveLength(2);
  });

  it("shows details, aliases and the publication date when present", async () => {
    getAdvisories.mockResolvedValue({
      data: [
        {
          ...advisory,
          Details: "Steals environment variables on install",
          Aliases: ["GHSA-aaaa-bbbb-cccc"],
          Published: "2025-03-04T00:00:00Z",
        },
      ],
    });

    const wrapper = mountAdvisories();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("Steals environment variables on install");
    expect(text).toContain("GHSA-aaaa-bbbb-cccc");
    expect(text).toContain("2025");
  });

  it("links web references and does not link anything else", async () => {
    getAdvisories.mockResolvedValue({
      data: [
        {
          ...advisory,
          References: [
            "https://example.com/report",
            "ftp://example.com/payload",
          ],
        },
      ],
    });

    const wrapper = mountAdvisories();
    await flushPromises();

    const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
    expect(hrefs).toEqual(["https://example.com/report"]);
  });

  it("loads the selected workspace when it changes and drops the old list", async () => {
    getAdvisories.mockResolvedValueOnce({ data: [advisory] });
    const wrapper = mountAdvisories("first");
    await flushPromises();
    expect(wrapper.text()).toContain("evil-package");

    getAdvisories.mockResolvedValueOnce({ data: [] });
    await wrapper.setProps({ workspace: "second" });
    await flushPromises();

    expect(getAdvisories).toHaveBeenLastCalledWith(
      expect.objectContaining({ workspace: "second" }),
    );
    expect(wrapper.text()).toBe("");
  });

  it("ignores a slow answer for a workspace no longer selected", async () => {
    let finishFirst: (value: unknown) => void = () => undefined;
    getAdvisories.mockReturnValueOnce(
      new Promise((resolve) => {
        finishFirst = resolve;
      }),
    );
    const wrapper = mountAdvisories("first");

    getAdvisories.mockResolvedValueOnce({
      data: [{ ...advisory, AffectedDependency: "current-package" }],
    });
    await wrapper.setProps({ workspace: "second" });
    await flushPromises();
    finishFirst({ data: [{ ...advisory, AffectedDependency: "old-package" }] });
    await flushPromises();

    expect(wrapper.text()).toContain("current-package");
    expect(wrapper.text()).not.toContain("old-package");
  });

  it("does not ask for advisories when signed out", async () => {
    auth.getAuthenticated = false;

    mountAdvisories();
    await flushPromises();

    expect(getAdvisories).not.toHaveBeenCalled();
  });
});
