import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import router from "@/router";

import ExperimentCreate from "./ExperimentCreate.vue";

const {
  createExperiment,
  getDatasets,
  getAnalyzers,
  successToast,
  errorToast,
  routeQuery,
} = vi.hoisted(() => {
  const query: { dataset?: string } = {};
  return {
    createExperiment: vi.fn(),
    getDatasets: vi.fn(),
    getAnalyzers: vi.fn(),
    successToast: vi.fn(),
    errorToast: vi.fn(),
    routeQuery: query,
  };
});

vi.mock("../experiments.repository", () => ({
  ExperimentsRepository: class {
    createExperiment = createExperiment;
  },
}));

vi.mock("@/codeclarity_components/datasets/datasets.repository", () => ({
  DatasetsRepository: class {
    getDatasets = getDatasets;
  },
}));

vi.mock(
  "@/codeclarity_components/organizations/analyzers/AnalyzerRepository",
  () => ({
    AnalyzerRepository: class {
      getAnalyzers = getAnalyzers;
    },
  }),
);

vi.mock("@/utils/toasts", () => ({ successToast, errorToast }));

vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError: class BusinessLogicError extends Error {
    error_code: string;
    constructor(error_code: string) {
      super(error_code);
      this.error_code = error_code;
    }
  },
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: routeQuery }),
}));

// @vueuse/core is mocked globally, which breaks the shadcn inputs: plain stand-ins.
vi.mock("@/shadcn/ui/input", () => ({
  Input: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

vi.mock("@/shadcn/ui/select", () => ({
  Select: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
    inheritAttrs: false,
  },
  SelectTrigger: { template: "<span />" },
  SelectValue: { template: "<span />" },
  SelectContent: { template: "<slot />" },
  SelectItem: {
    props: ["value"],
    template: '<option :value="value"><slot /></option>',
  },
}));

function dataset(id: string, status: string): object {
  return {
    id,
    name: `dataset ${id}`,
    status,
    entry_count: 3,
    params: { limit: 3 },
  };
}

function analyzer(id: string, plugins: string[][]): object {
  return {
    id,
    name: `analyzer ${id}`,
    steps: plugins.map((stage) =>
      stage.map((name) => ({ name, version: "v1", config: {} })),
    ),
  };
}

const jsAnalyzer = analyzer("an-js", [
  ["js-sbom"],
  ["vuln-finder", "license-finder"],
]);

async function mountForm(): Promise<VueWrapper> {
  const wrapper = mount(ExperimentCreate, {
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });
  await flushPromises();
  return wrapper;
}

function optionValues(wrapper: VueWrapper, testId: string): string[] {
  return wrapper
    .find(`[data-testid="${testId}"]`)
    .findAll("option")
    .map((option) => option.attributes("value") ?? "");
}

describe("ExperimentCreate", () => {
  beforeEach(() => {
    createExperiment.mockReset();
    getDatasets.mockReset().mockResolvedValue({
      data: [
        dataset("ds-1", "READY"),
        dataset("ds-2", "BUILDING"),
        dataset("ds-3", "FAILED"),
        dataset("ds-4", "READY"),
      ],
      total_pages: 1,
    });
    getAnalyzers.mockReset().mockResolvedValue({
      data: [
        jsAnalyzer,
        analyzer("an-sbom-only", [["js-sbom"]]),
        analyzer("an-other", [["license-finder"]]),
      ],
    });
    successToast.mockReset();
    errorToast.mockReset();
    vi.mocked(router.push).mockClear();
    delete routeQuery.dataset;
  });

  it("offers only READY datasets and analyzers that run js-sbom and vuln-finder", async () => {
    const wrapper = await mountForm();

    expect(optionValues(wrapper, "experiment-dataset")).toEqual([
      "ds-1",
      "ds-4",
    ]);
    expect(optionValues(wrapper, "experiment-analyzer")).toEqual(["an-js"]);
    // A single eligible analyzer is preselected
    expect(
      (
        wrapper.find('[data-testid="experiment-analyzer"]')
          .element as HTMLSelectElement
      ).value,
    ).toBe("an-js");
  });

  it("defaults the grid to monthly x 24 and estimates entries x grid dates plus HEAD", async () => {
    const wrapper = await mountForm();

    expect(
      (wrapper.find('[data-testid="experiment-grid-interval"]').element as HTMLSelectElement).value,
    ).toBe("month");
    expect(
      (wrapper.find('[data-testid="experiment-grid-count"]').element as HTMLInputElement).value,
    ).toBe("24");
    expect(wrapper.find('[data-testid="experiment-estimate"]').exists()).toBe(false);

    await wrapper.find('[data-testid="experiment-dataset"]').setValue("ds-1");
    expect(wrapper.find('[data-testid="experiment-estimate"]').text()).toContain("75 snapshots");

    await wrapper.find('[data-testid="experiment-grid-count"]').setValue("2");
    expect(wrapper.find('[data-testid="experiment-estimate"]').text()).toContain("9 snapshots");

    await wrapper.find('[data-testid="experiment-grid-count"]').setValue("0");
    expect(wrapper.find('[data-testid="experiment-estimate"]').text()).toContain("3 snapshots");
  });

  it("adds about two fix probes per repository per grid interval to the estimate", async () => {
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-dataset"]').setValue("ds-1");

    // 3 repositories: 75 snapshots and 3 x 24 x 2 probes
    expect(wrapper.find('[data-testid="experiment-estimate"]').text()).toContain(
      "Estimated 219 analyses: 75 snapshots (25 grid dates including HEAD) and about 144 fix probes",
    );

    await wrapper.find('[data-testid="experiment-grid-count"]').setValue("0");
    expect(wrapper.find('[data-testid="experiment-estimate"]').text()).toContain(
      "Estimated 3 analyses: 3 snapshots (1 grid date including HEAD) and no fix probes",
    );
  });

  it("has no analysis budget by default and does not send one", async () => {
    routeQuery.dataset = "ds-1";
    createExperiment.mockResolvedValue({ id: "exp-1" });
    const wrapper = await mountForm();
    expect(
      (wrapper.find('[data-testid="experiment-budget"]').element as HTMLInputElement).value,
    ).toBe("");
    await wrapper.find('[data-testid="experiment-name"]').setValue("top100");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment.mock.calls[0]![0].data).not.toHaveProperty("analysis_budget");
  });

  it("sends the analysis budget and says what it caps", async () => {
    routeQuery.dataset = "ds-1";
    createExperiment.mockResolvedValue({ id: "exp-1" });
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-name"]').setValue("top100");
    await wrapper.find('[data-testid="experiment-budget"]').setValue("100");

    expect(wrapper.find('[data-testid="experiment-budget-note"]').text()).toContain(
      "Fix probes stop once 100 analyses are submitted",
    );

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ analysis_budget: 100 }) }),
    );
  });

  it("warns when the budget does not cover the snapshots, which still all run", async () => {
    routeQuery.dataset = "ds-1";
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-budget"]').setValue("50");

    expect(wrapper.find('[data-testid="experiment-budget-note"]').text()).toContain(
      "below the 75 snapshots: every snapshot still runs and no fix probe will",
    );
  });

  it("rejects a budget that is not a whole number of at least 1", async () => {
    routeQuery.dataset = "ds-1";
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-name"]').setValue("top100");
    await wrapper.find('[data-testid="experiment-budget"]').setValue("0");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Leave empty for no budget, or a whole number of at least 1");
  });

  it("rejects a grid count outside 0 to 120", async () => {
    routeQuery.dataset = "ds-1";
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-name"]').setValue("top100");
    await wrapper.find('[data-testid="experiment-grid-count"]').setValue("121");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("A whole number between 0 and 120");
    expect(wrapper.find('[data-testid="experiment-estimate"]').exists()).toBe(false);
  });

  it("preselects the dataset it was opened from", async () => {
    routeQuery.dataset = "ds-4";
    createExperiment.mockResolvedValue({ id: "exp-1" });
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-name"]').setValue("top100");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dataset_id: "ds-4" }),
      }),
    );
  });

  it("offers the READY datasets of every page, and preselects one past the first", async () => {
    const firstPage = Array.from({ length: 100 }, (_, i) =>
      dataset(`ds-p0-${i}`, "BUILDING"),
    );
    getDatasets.mockReset().mockImplementation(
      async ({ pagination }: { pagination: { page: number } }) =>
        pagination.page === 0
          ? { data: firstPage, total_pages: 2 }
          : { data: [dataset("ds-late", "READY")], total_pages: 2 },
    );
    routeQuery.dataset = "ds-late";
    createExperiment.mockResolvedValue({ id: "exp-1" });
    const wrapper = await mountForm();

    expect(optionValues(wrapper, "experiment-dataset")).toEqual(["ds-late"]);
    await wrapper.find('[data-testid="experiment-name"]').setValue("top100");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dataset_id: "ds-late" }),
      }),
    );
  });

  it("ignores a preselected dataset that is not ready", async () => {
    routeQuery.dataset = "ds-2";
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-name"]').setValue("top100");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Pick a ready dataset");
  });

  it("shows the validation errors and does not submit an invalid form", async () => {
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-retries"]').setValue("11");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("A name is required");
    expect(wrapper.text()).toContain("Pick a ready dataset");
    expect(wrapper.text()).toContain("A whole number between 0 and 10");
  });

  it("creates the experiment and opens it", async () => {
    routeQuery.dataset = "ds-1";
    createExperiment.mockResolvedValue({ id: "exp-1" });
    const wrapper = await mountForm();
    await wrapper
      .find('[data-testid="experiment-name"]')
      .setValue("  top100 head ");
    await wrapper.find('[data-testid="experiment-retries"]').setValue("1");
    await wrapper
      .find('[data-testid="experiment-grid-interval"]')
      .setValue("week");
    await wrapper.find('[data-testid="experiment-grid-count"]').setValue("12");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createExperiment).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "test-org-id",
        bearerToken: "test-token",
        data: {
          name: "top100 head",
          dataset_id: "ds-1",
          analyzer_id: "an-js",
          retries: 1,
          grid_interval: "week",
          grid_count: 12,
        },
      }),
    );
    expect(router.push).toHaveBeenCalledWith({
      name: "experiments",
      params: { page: "detail" },
      query: { id: "exp-1" },
    });
  });

  it.each([
    ["AlreadyExists", "An experiment with this name already exists"],
    ["DatasetNotReady", "The dataset is not ready"],
    [
      "AnalyzerMissingRequiredPlugins",
      "The analyzer must run js-sbom and vuln-finder",
    ],
    ["NotAuthorized", "Only organization admins can create experiments"],
  ])("explains a %s rejection", async (code, message) => {
    const { BusinessLogicError } = await import("@/utils/api/BaseRepository");
    createExperiment.mockRejectedValue(
      new (BusinessLogicError as unknown as new (code: string) => Error)(code),
    );
    routeQuery.dataset = "ds-1";
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="experiment-name"]').setValue("top100");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(errorToast).toHaveBeenCalledWith(message);
    expect(router.push).not.toHaveBeenCalled();
  });
});
