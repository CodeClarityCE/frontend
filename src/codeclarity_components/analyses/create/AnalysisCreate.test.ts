import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";

import AnalysisCreate from "./AnalysisCreate.vue";

const analyzersPath = `/org/${org.id}/analyzers`;
const analysesPath = `/org/${org.id}/projects/project-1/analyses`;

// One page of analyzers as the API lists them.
const analyzerPage = (data: object[]) => ({
  data,
  entry_count: data.length,
  page: 0,
  entries_per_page: 100,
  total_entries: data.length,
  total_pages: 1,
  status: "success",
  matching_count: data.length,
  filter_count: {},
});

const OFF = "Needs CodeQL, which is off on this instance.";
const DOWN = "vuln-finder is temporarily down. Try again shortly.";

function analyzer(id: string, plugins: string[], availability: object): object {
  return {
    id,
    name: `analyzer ${id}`,
    description: `runs ${plugins.join(", ")}`,
    created_on: new Date(),
    steps: [plugins.map((name) => ({ name, version: "v1", config: {} }))],
    availability,
  };
}

const defaultAnalyzer = analyzer("an-default", ["js-sbom", "vuln-finder"], {
  state: "available",
});
const codeqlAnalyzer = analyzer("an-codeql", ["js-sbom", "codeql"], {
  state: "off",
  components: ["CodeQL"],
  message: OFF,
});

const downAnalyzer = analyzer("an-down", ["js-sbom", "vuln-finder"], {
  state: "down",
  plugins: ["vuln-finder"],
  message: DOWN,
});

let app: TestApp;

// The new analysis page of project-1, with these analyzers listed.
async function mountForm(
  listed: object[] = [defaultAnalyzer, codeqlAnalyzer],
): Promise<VueWrapper> {
  app.http.on("GET", analyzersPath, analyzerPage(listed));
  await app.visit("/analyses/add?id=project-1");
  const wrapper = mount(AnalysisCreate, { global: app.global });
  await flushPromises();
  return wrapper;
}

describe("AnalysisCreate", () => {
  beforeEach(() => {
    // The page reads the project id from the address bar.
    window.history.replaceState({}, "", "/?id=project-1");
    app = createTestApp({ signedIn: true });
    app.http.on("GET", `/org/${org.id}/projects/project-1`, {
      data: { id: "project-1", name: "app", type: "FILE", url: "" },
    });
  });

  it("shows an analyzer whose component is off as unavailable, naming it", async () => {
    const wrapper = await mountForm();

    const codeql = wrapper.find('[data-analyzer="an-codeql"]');
    expect(codeql.text()).toContain(OFF);
    expect(codeql.find("button").attributes("disabled")).toBeDefined();
  });

  it("leaves analyzers of running plugins selectable", async () => {
    const wrapper = await mountForm();

    const available = wrapper.find('[data-analyzer="an-default"]');
    expect(available.text()).not.toContain("off on this instance");
    expect(available.find("button").attributes("disabled")).toBeUndefined();
  });

  describe("with a plugin down", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows the analyzer as temporarily unavailable, not off", async () => {
      const wrapper = await mountForm([downAnalyzer]);

      const down = wrapper.find('[data-analyzer="an-down"]');
      expect(down.text()).toContain(`Temporarily unavailable: ${DOWN}`);
      expect(down.text()).not.toContain("off on this instance");
      expect(down.find("button").attributes("disabled")).toBeDefined();
    });

    it("makes the analyzer selectable again once the plugin is back", async () => {
      vi.useFakeTimers();
      const wrapper = await mountForm([downAnalyzer]);

      app.http.on(
        "GET",
        analyzersPath,
        analyzerPage([
          { ...downAnalyzer, availability: { state: "available" } },
        ]),
      );
      await vi.advanceTimersByTimeAsync(30_000);
      await flushPromises();

      const back = wrapper.find('[data-analyzer="an-down"]');
      expect(back.text()).not.toContain("Temporarily unavailable");
      expect(back.find("button").attributes("disabled")).toBeUndefined();
      wrapper.unmount();
    });
  });

  it("shows the API's reason when it refuses the analyzer", async () => {
    app.http.on("GET", `${analyzersPath}/an-default`, {
      data: defaultAnalyzer,
    });
    app.http.on(
      "POST",
      analysesPath,
      {
        status_code: 409,
        status: "error",
        error_code: "AnalyzerUnavailable",
        error_message: OFF,
      },
      409,
    );
    const wrapper = await mountForm();

    await wrapper.find('[data-analyzer="an-default"] button').trigger("click");
    await flushPromises();
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const started = app.http.requests.filter(
      (r) => r.method === "POST" && r.path === analysesPath,
    );
    expect(started).toHaveLength(1);
    expect(started[0]!.body).toMatchObject({
      analyzer_id: "an-default",
      branch: "main",
    });
    const alert = wrapper.find('[role="alert"]');
    expect(alert.text()).toContain("The analysis was not started");
    expect(alert.text()).toContain(OFF);
  });
});
