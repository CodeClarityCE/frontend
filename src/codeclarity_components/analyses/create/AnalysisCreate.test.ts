import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AnalysisCreate from "./AnalysisCreate.vue";

const { getAnalyzers, getAnalyzer, getProjectById, createAnalysis } =
  vi.hoisted(() => ({
    getAnalyzers: vi.fn(),
    getAnalyzer: vi.fn(),
    getProjectById: vi.fn(),
    createAnalysis: vi.fn(),
  }));

vi.mock(
  "@/codeclarity_components/organizations/analyzers/AnalyzerRepository",
  () => ({
    AnalyzerRepository: class {
      getAnalyzers = getAnalyzers;
      getAnalyzer = getAnalyzer;
    },
  }),
);

vi.mock("@/codeclarity_components/projects/project.repository", () => ({
  ProjectRepository: class {
    getProjectById = getProjectById;
  },
}));

vi.mock("@/codeclarity_components/analyses/analysis.repository", () => ({
  AnalysisRepository: class {
    createAnalysis = createAnalysis;
  },
}));

vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError: class BusinessLogicError extends Error {
    error_code: string;
    error_message: string;
    constructor(error_code: string, error_message: string) {
      super(error_code);
      this.error_code = error_code;
      this.error_message = error_message;
    }
  },
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ defaultOrg: { id: "org-1", role: 1 } }),
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/state", () => ({
  useStateStore: () => ({ $reset: vi.fn(), page: "" }),
}));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-sonner", () => ({ toast: { success: vi.fn() } }));

const OFF = "Needs CodeQL, which is off on this instance.";

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

async function mountForm(): Promise<VueWrapper> {
  const wrapper = mount(AnalysisCreate, {
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });
  await flushPromises();
  return wrapper;
}

describe("AnalysisCreate", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?id=project-1");
    getProjectById.mockReset().mockResolvedValue({
      data: { id: "project-1", name: "app", type: "FILE", url: "" },
    });
    getAnalyzers.mockReset().mockResolvedValue({
      data: [defaultAnalyzer, codeqlAnalyzer],
      total_pages: 1,
    });
    getAnalyzer.mockReset();
    createAnalysis.mockReset();
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

  it("shows the API's reason when it refuses the analyzer", async () => {
    getAnalyzer.mockResolvedValue({ data: defaultAnalyzer });
    const { BusinessLogicError } = await import("@/utils/api/BaseRepository");
    createAnalysis.mockRejectedValue(
      new (
        BusinessLogicError as unknown as new (
          code: string,
          message: string,
        ) => Error
      )("AnalyzerUnavailable", OFF),
    );
    const wrapper = await mountForm();

    await wrapper.find('[data-analyzer="an-default"] button').trigger("click");
    await flushPromises();
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createAnalysis).toHaveBeenCalledTimes(1);
    const alert = wrapper.find('[role="alert"]');
    expect(alert.text()).toContain("The analysis was not started");
    expect(alert.text()).toContain(OFF);
  });
});
