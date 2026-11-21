import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { APIErrors } from "@/utils/api/ApiErrors";

import { analysisPath } from "../../../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../../../tests/real-app";

import MaliciousPackageAdvisories from "./MaliciousPackageAdvisories.vue";

const ADVISORIES_PATH = `${analysisPath}/vulnerabilities/malicious-packages`;

const advisory = {
  AdvisoryId: "MAL-2025-1234",
  AffectedDependency: "evil-package",
  AffectedVersion: "1.2.3",
  DirectDependency: true,
  Summary: "Malicious code in evil-package",
};

let app: TestApp;

// Answers the advisories request with this list, or this error.
function answer(data: unknown[]): void {
  app.http.on("GET", ADVISORIES_PATH, { data });
}

function answerError(code: string, status = 400): void {
  app.http.on(
    "GET",
    ADVISORIES_PATH,
    { error_code: code, error_message: "no result" },
    status,
  );
}

// The workspace each advisories request asked for.
function requestedWorkspaces(): (string | null)[] {
  return urls
    .filter((url) => url.pathname.endsWith("/malicious-packages"))
    .map((url) => url.searchParams.get("workspace"));
}

let urls: URL[] = [];

// Records every URL and lets a test hold the next answer until it says so.
function recordUrls(): { holdNext: () => () => void } {
  urls = [];
  const answerRequest = globalThis.fetch;
  let held: Promise<void> | null = null;
  vi.stubGlobal(
    "fetch",
    async (input: string | URL, init?: RequestInit): Promise<Response> => {
      urls.push(new URL(String(input)));
      const response = answerRequest(input, init);
      const wait = held;
      held = null;
      if (wait) await wait;
      return response;
    },
  );
  return {
    holdNext() {
      let release: () => void = () => undefined;
      held = new Promise((resolve) => {
        release = resolve;
      });
      return release;
    },
  };
}

function mountAdvisories(
  workspace = ".",
): ReturnType<typeof mount<typeof MaliciousPackageAdvisories>> {
  return mount(MaliciousPackageAdvisories, {
    props: { analysisID: "a-1", projectID: "p-1", workspace },
    global: app.global,
  });
}

describe("MaliciousPackageAdvisories", () => {
  beforeEach(async () => {
    app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    answer([]);
  });

  it("marks advisories as malicious and says to remove the package", async () => {
    answer([advisory]);

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
      answerError(code);

      const wrapper = mountAdvisories();
      await flushPromises();

      expect(wrapper.text()).toBe("");
    },
  );

  it("shows that the check could not run when the network is down", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("offline")));

    const wrapper = mountAdvisories();
    await flushPromises();

    expect(wrapper.text()).toMatch(/could not check for malicious packages/i);
  });

  it("shows that the check could not run when the plugin failed", async () => {
    answerError(APIErrors.PluginFailed, 500);

    const wrapper = mountAdvisories();
    await flushPromises();

    expect(wrapper.text()).toMatch(/could not check for malicious packages/i);
  });

  it("clears the failure when a later selection loads", async () => {
    answerError(APIErrors.PluginFailed, 500);
    const wrapper = mountAdvisories();
    await flushPromises();
    expect(wrapper.text()).toMatch(/could not check/i);

    answer([]);
    await wrapper.setProps({ workspace: "other" });
    await flushPromises();

    expect(wrapper.text()).toBe("");
  });

  it("shows no severity scores", async () => {
    answer([advisory]);

    const wrapper = mountAdvisories();
    await flushPromises();

    expect(wrapper.text()).not.toMatch(
      /severity|cvss|epss|critical|\bhigh\b|\bmedium\b|\blow\b/i,
    );
  });

  it("shows whether the package is a direct dependency", async () => {
    answer([
      advisory,
      {
        ...advisory,
        AffectedDependency: "deep-evil",
        AdvisoryId: "MAL-2",
        DirectDependency: false,
      },
    ]);

    const wrapper = mountAdvisories();
    await flushPromises();

    const items = wrapper.findAll("li[data-advisory]").map((li) => li.text());
    expect(items[0]).toMatch(/direct/i);
    expect(items[1]).toMatch(/transitive/i);
  });

  it("keeps two advisories for the same package apart", async () => {
    answer([advisory, { ...advisory, AdvisoryId: "GHSA-aaaa-bbbb-cccc" }]);

    const wrapper = mountAdvisories();
    await flushPromises();

    expect(wrapper.findAll("li[data-advisory]")).toHaveLength(2);
  });

  it("shows details, aliases and the publication date when present", async () => {
    answer([
      {
        ...advisory,
        Details: "Steals environment variables on install",
        Aliases: ["GHSA-aaaa-bbbb-cccc"],
        Published: "2025-03-04T00:00:00Z",
      },
    ]);

    const wrapper = mountAdvisories();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("Steals environment variables on install");
    expect(text).toContain("GHSA-aaaa-bbbb-cccc");
    expect(text).toContain("2025");
  });

  it("links web references and does not link anything else", async () => {
    answer([
      {
        ...advisory,
        References: ["https://example.com/report", "ftp://example.com/payload"],
      },
    ]);

    const wrapper = mountAdvisories();
    await flushPromises();

    const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
    expect(hrefs).toEqual(["https://example.com/report"]);
  });

  it("loads the selected workspace when it changes and drops the old list", async () => {
    recordUrls();
    answer([advisory]);
    const wrapper = mountAdvisories("first");
    await flushPromises();
    expect(wrapper.text()).toContain("evil-package");

    answer([]);
    await wrapper.setProps({ workspace: "second" });
    await flushPromises();

    expect(requestedWorkspaces()).toEqual(["first", "second"]);
    expect(wrapper.text()).toBe("");
  });

  it("ignores a slow answer for a workspace no longer selected", async () => {
    const { holdNext } = recordUrls();
    answer([{ ...advisory, AffectedDependency: "old-package" }]);
    const finishFirst = holdNext();
    const wrapper = mountAdvisories("first");
    await flushPromises();

    answer([{ ...advisory, AffectedDependency: "current-package" }]);
    await wrapper.setProps({ workspace: "second" });
    await flushPromises();
    finishFirst();
    await flushPromises();

    expect(wrapper.text()).toContain("current-package");
    expect(wrapper.text()).not.toContain("old-package");
  });

  it("does not ask for advisories when signed out", async () => {
    app = createTestApp();

    mountAdvisories();
    await flushPromises();

    expect(app.http.requests).toEqual([]);
  });
});
