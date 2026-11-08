import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import router from "@/router";

import type { GridCoverageRow } from "../experiment.entity";

import ExperimentDetail from "./ExperimentDetail.vue";

const {
  getExperiment,
  getExperimentRuns,
  cancelExperiment,
  deleteExperiment,
  getExperimentResults,
  downloadExperimentExport,
  getFigureCatalog,
  getFigures,
  computeFigureData,
  createFigure,
  updateFigure,
  deleteFigure,
  saveBlob,
  successToast,
  errorToast,
} = vi.hoisted(() => ({
  getExperiment: vi.fn(),
  getExperimentRuns: vi.fn(),
  cancelExperiment: vi.fn(),
  deleteExperiment: vi.fn(),
  getExperimentResults: vi.fn(),
  downloadExperimentExport: vi.fn(),
  getFigureCatalog: vi.fn(),
  getFigures: vi.fn(),
  computeFigureData: vi.fn(),
  createFigure: vi.fn(),
  updateFigure: vi.fn(),
  deleteFigure: vi.fn(),
  saveBlob: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock("../experiments.repository", () => ({
  ExperimentsRepository: class {
    getExperiment = getExperiment;
    getExperimentRuns = getExperimentRuns;
    cancelExperiment = cancelExperiment;
    deleteExperiment = deleteExperiment;
    getExperimentResults = getExperimentResults;
    downloadExperimentExport = downloadExperimentExport;
    getFigureCatalog = getFigureCatalog;
    getFigures = getFigures;
    computeFigureData = computeFigureData;
    createFigure = createFigure;
    updateFigure = updateFigure;
    deleteFigure = deleteFigure;
  },
}));

vi.mock("@/utils/download", () => ({ saveBlob }));

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
  useRoute: () => ({ query: { id: "exp-1" } }),
}));

vi.mock("@/base_components", () => ({
  PaginationComponent: { template: "<div />" },
}));

vi.mock("@/shadcn/ui/progress", () => ({
  Progress: {
    props: ["modelValue"],
    template: '<div data-testid="progress" :data-value="modelValue" />',
  },
}));

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

function experiment(status: string, overrides: object = {}): object {
  return {
    id: "exp-1",
    name: "top4 head",
    status,
    retries: 2,
    grid_interval: "month",
    grid_count: 0,
    grid_dates: [],
    analysis_budget: null,
    error: null,
    dataset_id: "ds-1",
    dataset_name: "top4",
    analyzer_id: "an-1",
    analyzer_name: "JS",
    analyzer_steps: null,
    created_by_name: "John Doe",
    created_on: new Date("2026-11-01T10:00:00Z"),
    started_on: null,
    ended_on: null,
    run_count: 4,
    run_counts: { pending: 4, done: 0, failed: 0, skipped: 0 },
    ...overrides,
  };
}

function run(rank: number, overrides: object = {}): object {
  return {
    id: `run-${rank}`,
    status: "pending",
    error: null,
    attempts: 0,
    branch: null,
    commit_hash: null,
    committed_at: null,
    grid_index: 0,
    grid_date: null,
    shared_from_run_id: null,
    submitted_on: null,
    ended_on: null,
    analysis_id: null,
    project_id: null,
    entry: {
      id: `e-${rank}`,
      rank,
      full_name: `org/repo-${rank}`,
      git_url: `https://github.com/org/repo-${rank}`,
      stars: 1000 - rank,
    },
    ...overrides,
  };
}

function scalars(nAffected: number): object {
  return {
    n_projects: 98,
    n_affected: nAffected,
    affected_share: nAffected / 98,
    instances: 16304,
    distinct_vuln_packages: 412,
    load_median: 42,
    load_mean: 166.37,
    load_max: 2104,
    high_critical_share: 0.4321,
    top10_pkg_share: 0.31,
    top10_proj_share: 0.62,
    gini_pkg: 0.8331,
    gini_proj: 0.7012,
    pkgs_clear_50: 10,
    pkgs_clear_80: 35,
    pkgs_clear_90: 61,
  };
}

function results(overrides: object = {}): object {
  return {
    coverage: {
      runs: 100,
      attempted: 100,
      done: 98,
      failed: 1,
      skipped: 1,
      pending: 0,
      failure_reasons: { "missing result: vuln-finder": 1 },
      skip_reasons: { "repository not found": 1 },
    },
    grid_coverage: [
      {
        grid_date: null,
        runs: 100,
        done: 98,
        empty: 0,
        failed: 1,
        skipped: 1,
        pending: 0,
        mixed_knowledge: false,
      },
    ],
    headline: {
      ...scalars(87),
      sev_counts: {
        CRITICAL: 900,
        HIGH: 6100,
        MEDIUM: 7000,
        LOW: 2000,
        NONE: 304,
      },
      top_packages: [
        ["semver", 61],
        ["minimist", 44],
      ],
      high_critical_share_of_classed: 0.44,
    },
    sweep: [
      { subset: "all", ...scalars(87) },
      { subset: "match_correct_only", ...scalars(80) },
      { subset: "non_withdrawn", ...scalars(86) },
    ],
    epss: {
      nonnull_share: 0.91,
      median: 0.0012,
      p90: 0.034,
      over_10pct: 120,
      over_50pct: 30,
      missing_non_cve: 1200,
      missing_cve: 267,
    },
    match_flags: { MATCH_CORRECT: 15000, MATCH_INCORRECT: 1304 },
    winning_source_head: { NVD: 9000, OSV: 7304 },
    rqc: { spearman_rho: 0.015, p: 0.88, n: 98, excluded_zero_dep_projects: 0 },
    rqd: [
      { package_manager: "yarn", projects: 50, med_deps: 1200, med_vulns: 30 },
      { package_manager: "npm", projects: 48, med_deps: 900, med_vulns: 22 },
    ],
    provenance: {
      api_version: "v1.2.3",
      analyzer_steps: [[{ name: "js-sbom", version: "v0.9.1" }]],
      knowledge_start: null,
      knowledge_end: null,
      knowledge_changed: false,
      created_by: "John Doe",
      created_on: "2026-11-01T10:00:00Z",
      started_on: "2026-11-01T10:01:00Z",
      ended_on: null,
    },
    ...overrides,
  };
}

function mountDetail(): VueWrapper {
  return mount(ExperimentDetail, {
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });
}

describe("ExperimentDetail", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getExperiment.mockReset();
    getExperimentRuns
      .mockReset()
      .mockResolvedValue({ data: [run(0), run(1)], total_pages: 1 });
    cancelExperiment.mockReset();
    deleteExperiment.mockReset();
    getExperimentResults.mockReset().mockResolvedValue({ data: results() });
    downloadExperimentExport.mockReset();
    saveBlob.mockReset();
    successToast.mockReset();
    errorToast.mockReset();
    vi.mocked(router.push).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls every 10s while running and stops once completed", async () => {
    getExperiment
      .mockResolvedValueOnce({ data: experiment("PENDING") })
      .mockResolvedValueOnce({
        data: experiment("RUNNING", {
          run_counts: { pending: 2, done: 1, failed: 1, skipped: 0 },
        }),
      })
      .mockResolvedValueOnce({
        data: experiment("COMPLETED", {
          run_counts: { pending: 0, done: 2, failed: 1, skipped: 1 },
        }),
      });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-status"]').text()).toBe(
      "Pending",
    );

    await vi.advanceTimersByTimeAsync(9_999);
    expect(getExperiment).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-status"]').text()).toBe(
      "Running",
    );
    expect(
      wrapper.find('[data-testid="progress"]').attributes("data-value"),
    ).toBe("50");
    expect(
      wrapper.find('[data-testid="experiment-progress"]').text(),
    ).toContain("2 / 4");

    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();
    expect(wrapper.find('[data-testid="experiment-status"]').text()).toBe(
      "Completed",
    );

    // The runs are reloaded along with the experiment
    expect(getExperimentRuns).toHaveBeenCalledTimes(3);

    // Completed experiments are not polled any more
    await vi.advanceTimersByTimeAsync(60_000);
    expect(getExperiment).toHaveBeenCalledTimes(3);
  });
  it("stops polling when unmounted", async () => {
    getExperiment.mockResolvedValue({ data: experiment("RUNNING") });
    const wrapper = mountDetail();
    await flushPromises();

    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(getExperiment).toHaveBeenCalledTimes(1);
  });

  it("lists each run with its state, error, pinned SHA and analysis", async () => {
    getExperiment.mockResolvedValue({ data: experiment("COMPLETED") });
    getExperimentRuns.mockResolvedValue({
      data: [
        run(0, {
          status: "done",
          attempts: 1,
          branch: "main",
          commit_hash: "0123456789abcdef0123456789abcdef01234567",
          analysis_id: "an-0",
          project_id: "p-0",
        }),
        run(1, {
          status: "failed",
          attempts: 3,
          error: "missing result: vuln-finder",
          commit_hash: "fedcba9876543210fedcba9876543210fedcba98",
          analysis_id: "an-1",
          project_id: "p-1",
        }),
        run(2, { status: "skipped", error: "repository not found" }),
      ],
      total_pages: 1,
    });
    const wrapper = mountDetail();
    await flushPromises();

    const rows = wrapper.findAll('[data-testid="experiment-run"]');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.text()).toContain("#1");
    expect(rows[0]?.text()).toContain("org/repo-0");
    expect(rows[0]?.text()).toContain("Done");
    expect(rows[0]?.text()).toContain("0123456");
    expect(rows[0]?.text()).not.toContain("0123456789");
    expect(rows[0]?.find('[data-testid="run-analysis"]').exists()).toBe(true);
    expect(rows[1]?.text()).toContain("missing result: vuln-finder");
    expect(rows[2]?.text()).toContain("Skipped");
    expect(rows[2]?.text()).toContain("repository not found");
    expect(rows[2]?.find('[data-testid="run-analysis"]').exists()).toBe(false);
  });

  it("shows why an experiment failed", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("FAILED", { error: "GitHub authentication failed" }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-error"]').text()).toContain(
      "GitHub authentication failed",
    );
  });

  it("shows the analysis budget it was created with, if any", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("RUNNING", { analysis_budget: 500 }),
    });
    const wrapper = mountDetail();
    await flushPromises();
    expect(wrapper.find('[data-testid="experiment-budget"]').text()).toBe(
      "Analysis budget: 500 analyses.",
    );

    getExperiment.mockResolvedValue({ data: experiment("RUNNING") });
    const unbudgeted = mountDetail();
    await flushPromises();
    expect(unbudgeted.find('[data-testid="experiment-budget"]').exists()).toBe(
      false,
    );
  });

  it("says when the experiment does not exist", async () => {
    const { BusinessLogicError } = await import("@/utils/api/BaseRepository");
    const Err = BusinessLogicError as unknown as new (code: string) => Error;
    getExperiment.mockRejectedValue(new Err("EntityNotFound"));
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.text()).toContain("Experiment not found");
    expect(getExperimentRuns).not.toHaveBeenCalled();
    expect(errorToast).not.toHaveBeenCalled();
  });
  it("cancels a running experiment after confirmation and shows the new state", async () => {
    getExperiment
      .mockResolvedValueOnce({ data: experiment("RUNNING") })
      .mockResolvedValueOnce({ data: experiment("CANCELLED") });
    cancelExperiment.mockResolvedValue({});
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find('[data-testid="experiment-cancel"]').trigger("click");
    expect(cancelExperiment).not.toHaveBeenCalled();
    await wrapper
      .find('[data-testid="experiment-cancel-confirm"]')
      .trigger("click");
    await flushPromises();

    expect(cancelExperiment).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "test-org-id", experimentId: "exp-1" }),
    );
    expect(successToast).toHaveBeenCalledWith("Experiment cancelled");
    expect(wrapper.find('[data-testid="experiment-status"]').text()).toBe(
      "Cancelled",
    );
    expect(wrapper.find('[data-testid="experiment-cancel"]').exists()).toBe(
      false,
    );
  });

  it("does not offer to cancel a finished experiment", async () => {
    getExperiment.mockResolvedValue({ data: experiment("COMPLETED") });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-cancel"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="experiment-delete"]').exists()).toBe(
      true,
    );
  });

  it("explains that only admins can cancel", async () => {
    const { BusinessLogicError } = await import("@/utils/api/BaseRepository");
    const Err = BusinessLogicError as unknown as new (code: string) => Error;
    getExperiment.mockResolvedValue({ data: experiment("RUNNING") });
    cancelExperiment.mockRejectedValue(new Err("NotAuthorized"));
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find('[data-testid="experiment-cancel"]').trigger("click");
    await wrapper
      .find('[data-testid="experiment-cancel-confirm"]')
      .trigger("click");
    await flushPromises();

    expect(errorToast).toHaveBeenCalledWith(
      "Only organization admins can cancel experiments",
    );
  });

  it("deletes after confirmation and goes back to the list", async () => {
    getExperiment.mockResolvedValue({ data: experiment("COMPLETED") });
    deleteExperiment.mockResolvedValue({});
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find('[data-testid="experiment-delete"]').trigger("click");
    expect(deleteExperiment).not.toHaveBeenCalled();
    await wrapper
      .find('[data-testid="experiment-delete-confirm"]')
      .trigger("click");
    await flushPromises();

    expect(deleteExperiment).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "test-org-id", experimentId: "exp-1" }),
    );
    expect(router.push).toHaveBeenCalledWith({ name: "experiments" });
  });

  it("explains that only admins can delete", async () => {
    const { BusinessLogicError } = await import("@/utils/api/BaseRepository");
    const Err = BusinessLogicError as unknown as new (code: string) => Error;
    getExperiment.mockResolvedValue({ data: experiment("COMPLETED") });
    deleteExperiment.mockRejectedValue(new Err("NotAuthorized"));
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find('[data-testid="experiment-delete"]').trigger("click");
    await wrapper
      .find('[data-testid="experiment-delete-confirm"]')
      .trigger("click");
    await flushPromises();

    expect(errorToast).toHaveBeenCalledWith(
      "Only organization admins can delete experiments",
    );
    expect(router.push).not.toHaveBeenCalled();
  });
  it("does not load results before any run is done", async () => {
    getExperiment.mockResolvedValue({ data: experiment("RUNNING") });
    const wrapper = mountDetail();
    await flushPromises();

    expect(getExperimentResults).not.toHaveBeenCalled();
    expect(
      wrapper.find('[data-testid="experiment-results-empty"]').exists(),
    ).toBe(true);
  });

  it("loads the results once a run is done and refreshes them with the poll", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("RUNNING", {
        run_counts: { pending: 3, done: 1, failed: 0, skipped: 0 },
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(getExperimentResults).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "test-org-id", experimentId: "exp-1" }),
    );
    const headline = wrapper.find('[data-testid="experiment-headline"]');
    expect(headline.text()).toContain("87 / 98");
    expect(headline.text()).toContain("16,304");
    expect(headline.text()).toContain("0.833");
    expect(headline.text()).toContain("10 / 35 / 61");
    expect(
      wrapper.find('[data-testid="experiment-top-packages"]').text(),
    ).toContain("semver");
    expect(wrapper.find('[data-testid="experiment-rqc"]').text()).toContain(
      "0.015",
    );
    expect(
      wrapper.find('[data-testid="experiment-coverage"]').text(),
    ).toContain("missing result: vuln-finder");

    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();
    expect(getExperimentResults).toHaveBeenCalledTimes(2);
  });

  it("names each run's snapshot, its grid date or HEAD", async () => {
    getExperiment.mockResolvedValue({ data: experiment("RUNNING") });
    getExperimentRuns.mockResolvedValue({
      data: [
        run(0, { grid_index: 0, grid_date: "2026-09-01T00:00:00.000Z" }),
        run(0, { id: "run-head", grid_index: 1, grid_date: null }),
      ],
      total_pages: 1,
    });
    const wrapper = mountDetail();
    await flushPromises();

    const snapshots = wrapper
      .findAll('[data-testid="experiment-run-snapshot"]')
      .map((cell) => cell.text());
    expect(snapshots).toEqual(["2026-09-01", "HEAD"]);
  });

  it("shows coverage per grid date, counting no lockfile yet as empty, HEAD last", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("RUNNING", {
        grid_count: 2,
        grid_dates: ["2026-09-01", "2026-10-01"],
        run_counts: { pending: 2, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({
      data: results({
        grid_coverage: [
          {
            grid_date: "2026-09-01",
            runs: 2,
            done: 0,
            empty: 2,
            failed: 0,
            skipped: 0,
            pending: 0,
            mixed_knowledge: false,
          },
          {
            grid_date: "2026-10-01",
            runs: 2,
            done: 1,
            empty: 0,
            failed: 1,
            skipped: 0,
            pending: 0,
            mixed_knowledge: false,
          },
          {
            grid_date: null,
            runs: 2,
            done: 0,
            empty: 0,
            failed: 0,
            skipped: 0,
            pending: 2,
            mixed_knowledge: false,
          },
        ],
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    const rows = wrapper
      .find('[data-testid="experiment-grid-coverage"]')
      .findAll('[data-testid="grid-coverage-row"]');
    expect(
      rows.map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([
      ["2026-09-01", "0", "2", "0", "0", "0"],
      ["2026-10-01", "1", "0", "1", "0", "0"],
      ["HEAD", "0", "0", "0", "0", "2"],
    ]);
  });

  it("flags the grid dates analysed with mixed knowledge next to their coverage", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 2,
        grid_dates: ["2026-09-01", "2026-10-01"],
        run_counts: { pending: 0, done: 6, failed: 0, skipped: 0 },
      }),
    });
    const row = (
      grid_date: string | null,
      mixed_knowledge: boolean,
    ): GridCoverageRow => ({
      grid_date,
      runs: 2,
      done: 2,
      empty: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      mixed_knowledge,
    });
    getExperimentResults.mockResolvedValue({
      data: results({
        grid_coverage: [
          row("2026-09-01", false),
          row("2026-10-01", true),
          row(null, false),
        ],
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    const rows = wrapper.findAll('[data-testid="grid-coverage-row"]');
    expect(
      rows.map((r) => r.find('[data-testid="grid-mixed-knowledge"]').exists()),
    ).toEqual([false, true, false]);
    expect(
      wrapper.find('[data-testid="grid-mixed-knowledge-note"]').exists(),
    ).toBe(true);
  });

  it("shows no mixed-knowledge note when every grid date used one knowledge", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 1,
        grid_dates: ["2026-10-01"],
        run_counts: { pending: 0, done: 2, failed: 0, skipped: 0 },
      }),
    });
    const row = (grid_date: string | null): GridCoverageRow => ({
      grid_date,
      runs: 1,
      done: 1,
      empty: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      mixed_knowledge: false,
    });
    getExperimentResults.mockResolvedValue({
      data: results({ grid_coverage: [row("2026-10-01"), row(null)] }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="grid-mixed-knowledge"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.find('[data-testid="grid-mixed-knowledge-note"]').exists(),
    ).toBe(false);
  });

  it("labels the existing blocks as HEAD and shows no grid coverage for a HEAD-only experiment", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="experiment-grid-coverage"]').exists(),
    ).toBe(false);
    const head = wrapper.find('[data-testid="experiment-head-results"]');
    expect(head.find("h3").text()).toContain("HEAD");
    for (const block of [
      "experiment-headline",
      "experiment-coverage",
      "experiment-severity",
      "experiment-sweep",
      "experiment-rqd",
    ]) {
      expect(head.find(`[data-testid="${block}"]`).exists()).toBe(true);
    }
    expect(head.find('[data-testid="experiment-provenance"]').exists()).toBe(
      false,
    );
  });

  describe("share intervals and p-values", () => {
    const ci = (low: number, high: number): object => ({ low, high });
    const shareIntervals = {
      headline: {
        affected_share: ci(0.809, 0.936),
        high_critical_share: ci(0.425, 0.44),
        top10_pkg_share: ci(0.303, 0.317),
        top10_proj_share: ci(0.612, 0.628),
        high_critical_share_of_classed: ci(0.432, 0.448),
      },
      sweep: [
        {
          subset: "all",
          affected_share: ci(0.809, 0.936),
          high_critical_share: ci(0.425, 0.44),
          top10_pkg_share: null,
          top10_proj_share: null,
        },
        {
          subset: "match_correct_only",
          affected_share: ci(0.722, 0.881),
          high_critical_share: ci(0.411, 0.451),
          top10_pkg_share: null,
          top10_proj_share: null,
        },
      ],
      severity: {
        CRITICAL: ci(0.052, 0.059),
        HIGH: ci(0.369, 0.382),
        MEDIUM: ci(0.422, 0.437),
        LOW: ci(0.118, 0.128),
        NONE: null,
      },
    };

    async function mountWith(overrides: object): Promise<VueWrapper> {
      getExperiment.mockResolvedValue({
        data: experiment("RUNNING", {
          run_counts: { pending: 3, done: 1, failed: 0, skipped: 0 },
        }),
      });
      getExperimentResults.mockResolvedValue({ data: results(overrides) });
      const wrapper = mountDetail();
      await flushPromises();
      return wrapper;
    }

    it("shows intervals on the headline shares", async () => {
      const wrapper = await mountWith({ share_intervals: shareIntervals });
      const text = wrapper.find('[data-testid="experiment-headline"]').text();
      expect(text).toContain("88.8% (95% CI 80.9% to 93.6%)");
      expect(text).toContain("95% CI 42.5% to 44.0%");
      expect(text).toContain("of classed: 44.0% (95% CI 43.2% to 44.8%)");
      expect(text).toContain("top 10 packages: 31.0% (95% CI 30.3% to 31.7%)");
      expect(text).toContain("top 10 projects: 62.0% (95% CI 61.2% to 62.8%)");
    });

    it("shows an interval per severity, a dash when there is none", async () => {
      const wrapper = await mountWith({ share_intervals: shareIntervals });
      const rows = wrapper.findAll(
        '[data-testid="experiment-severity"] tbody tr',
      );
      expect(rows[1]?.text()).toContain("36.9% to 38.2%");
      expect(rows[4]?.findAll("td")[3]?.text()).toBe("-");
    });

    it("shows each sweep subset's own intervals", async () => {
      const wrapper = await mountWith({ share_intervals: shareIntervals });
      const rows = wrapper.findAll('[data-testid="experiment-sweep"] tbody tr');
      expect(rows[1]?.text()).toContain("95% CI 72.2% to 88.1%");
      expect(rows[1]?.text()).toContain("95% CI 41.1% to 45.1%");
    });

    it("shows plain shares when the results carry no intervals", async () => {
      const wrapper = await mountWith({});
      expect(
        wrapper.find('[data-testid="experiment-headline"]').text(),
      ).not.toContain("95% CI");
    });

    it("writes a p-value below 0.001 as p < 0.001", async () => {
      const wrapper = await mountWith({
        rqc: {
          spearman_rho: 0.4,
          p: 0.00001,
          n: 98,
          excluded_zero_dep_projects: 0,
        },
      });
      const text = wrapper.find('[data-testid="experiment-rqc"]').text();
      expect(text).toContain("p < 0.001");
      expect(text).not.toContain("0.000");
    });

    it("keeps three decimals from 0.001 up", async () => {
      const wrapper = await mountWith({
        rqc: {
          spearman_rho: 0.4,
          p: 0.001,
          n: 98,
          excluded_zero_dep_projects: 0,
        },
      });
      expect(wrapper.find('[data-testid="experiment-rqc"]').text()).toContain(
        "p = 0.001",
      );
    });
  });

  function lag(n: number, median: number, before = 0): object {
    return {
      n,
      median,
      p25: median - 10,
      p75: median + 10,
      min: median - 20,
      max: median + 20,
      before_disclosure: before,
    };
  }

  function gridResults(): object {
    return results({
      grid_coverage: [
        {
          grid_date: "2026-09-01",
          runs: 2,
          done: 2,
          empty: 0,
          failed: 0,
          skipped: 0,
          pending: 0,
        },
        {
          grid_date: null,
          runs: 2,
          done: 2,
          empty: 0,
          failed: 0,
          skipped: 0,
          pending: 0,
        },
      ],
      exposures: {
        exposures: 5,
        open: 2,
        fixed: 3,
        introductions: 1,
        present_at_first_observation: 4,
        fix_precision: { commit: 0, snapshot: 3 },
        introduction_precision: { commit: 0, snapshot: 1 },
      },
      fix_lag: {
        fixes: 3,
        snapshot_precision_share: 1,
        overall: lag(3, 46, 1),
        by_severity: [
          { key: "HIGH", ...lag(2, 80) },
          { key: "LOW", ...lag(1, -13, 1) },
        ],
        by_kind: [
          { key: "upgraded", ...lag(2, 16.5, 1) },
          { key: "removed_direct", ...lag(1, 114) },
        ],
        points: [
          {
            severity: "HIGH",
            kind: "upgraded",
            lag_days: 46,
            precision: "snapshot",
          },
          {
            severity: "HIGH",
            kind: "removed_direct",
            lag_days: 114,
            precision: "snapshot",
          },
          {
            severity: "LOW",
            kind: "upgraded",
            lag_days: -13,
            precision: "snapshot",
          },
        ],
      },
      exposure_survival: {
        censored_at: "2026-10-01",
        snapshot_precision_share: 1,
        overall: {
          key: "all",
          n: 4,
          fixed: 2,
          censored: 2,
          median_days: 50,
          curve: [
            {
              time: 24,
              survival: 0.75,
              lower: 0.25,
              upper: 0.95,
              at_risk: 4,
              events: 1,
              censored: 0,
            },
            {
              time: 50,
              survival: 0.5,
              lower: 0.1,
              upper: 0.75,
              at_risk: 3,
              events: 1,
              censored: 0,
            },
            {
              time: 90,
              survival: 0.5,
              lower: 0.1,
              upper: 0.75,
              at_risk: 2,
              events: 0,
              censored: 1,
            },
            {
              time: 104,
              survival: 0.5,
              lower: 0.1,
              upper: 0.75,
              at_risk: 1,
              events: 0,
              censored: 1,
            },
          ],
        },
        by_severity: [
          {
            key: "CRITICAL",
            n: 1,
            fixed: 1,
            censored: 0,
            median_days: 24,
            curve: [
              {
                time: 24,
                survival: 0,
                lower: 0,
                upper: 0,
                at_risk: 1,
                events: 1,
                censored: 0,
              },
            ],
          },
          {
            key: "MEDIUM",
            n: 3,
            fixed: 1,
            censored: 2,
            median_days: null,
            curve: [
              {
                time: 50,
                survival: 2 / 3,
                lower: 0.2,
                upper: 0.9,
                at_risk: 3,
                events: 1,
                censored: 0,
              },
              {
                time: 90,
                survival: 2 / 3,
                lower: 0.2,
                upper: 0.9,
                at_risk: 2,
                events: 0,
                censored: 1,
              },
              {
                time: 104,
                survival: 2 / 3,
                lower: 0.2,
                upper: 0.9,
                at_risk: 1,
                events: 0,
                censored: 1,
              },
            ],
          },
        ],
      },
    });
  }

  async function mountGrid(): Promise<ReturnType<typeof mountDetail>> {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 1,
        grid_dates: ["2026-09-01"],
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({ data: gridResults() });
    const wrapper = mountDetail();
    await flushPromises();
    return wrapper;
  }

  it("charts exposure survival as a step curve outside the HEAD blocks, censoring open exposures", async () => {
    const wrapper = await mountGrid();

    const block = wrapper.find('[data-testid="experiment-survival"]');
    expect(block.exists()).toBe(true);
    expect(
      wrapper
        .find(
          '[data-testid="experiment-head-results"] [data-testid="experiment-survival"]',
        )
        .exists(),
    ).toBe(false);
    expect(block.text()).toContain(
      "4 exposures, 2 fixed, 2 still open at HEAD (censored at 2026-10-01)",
    );
    expect(block.text()).toContain("Median 50 days");
    expect(block.text()).toContain(
      "100.0% of fixes dated only to a snapshot interval",
    );
    expect(
      block.find('[data-testid="survival-curve"]').attributes("d"),
    ).toMatch(/^M/);
    expect(block.findAll('[data-testid="survival-censor"]')).toHaveLength(2);
    expect(block.find('[data-testid="survival-median"]').exists()).toBe(true);
    expect(
      block.find('[data-testid="survival-chart"]').attributes("aria-label"),
    ).toBe(
      "Exposure survival, all severities: 4 exposures, 2 fixed, median 50 days",
    );
    expect(
      block
        .findAll('[data-testid="survival-table-row"]')
        .map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([
      ["All severities", "4", "2", "2", "50"],
      ["Critical", "1", "1", "0", "24"],
      ["Medium", "3", "1", "2", "-"],
    ]);
  });

  it("draws the confidence band and tables each step's bounds", async () => {
    const wrapper = await mountGrid();
    const block = wrapper.find('[data-testid="experiment-survival"]');

    const band = block.find('[data-testid="survival-band"]').attributes("d")!;
    // Upper edge out, lower edge back: closes at the start of the curve
    expect(band).toMatch(/^M44,\d+/);
    expect(band.endsWith("Z")).toBe(true);
    // Heights of 95%, 75%, 75%, 75%, then 10%, 10%, 10%, 25%, 100% on a 220px plot
    expect(
      [...band.matchAll(/V([\d.]+)/g)].map((m) =>
        Number(Number(m[1]).toFixed(6)),
      ),
    ).toEqual([31, 75, 75, 75, 218, 218, 218, 185, 20]);
    expect(
      block
        .findAll('[data-testid="survival-step-row"]')
        .map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([
      ["24", "75.0%", "25.0%", "95.0%", "4"],
      ["50", "50.0%", "10.0%", "75.0%", "3"],
      ["90", "50.0%", "10.0%", "75.0%", "2"],
      ["104", "50.0%", "10.0%", "75.0%", "1"],
    ]);

    await block.findAll('[data-testid="survival-group"]')[1]!.trigger("click");
    expect(
      block
        .findAll('[data-testid="survival-step-row"]')
        .map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([["24", "0.0%", "0.0%", "0.0%", "1"]]);
  });

  it("switches the survival curve to one severity", async () => {
    const wrapper = await mountGrid();
    const block = wrapper.find('[data-testid="experiment-survival"]');

    expect(
      block.findAll('[data-testid="survival-group"]').map((b) => b.text()),
    ).toEqual(["All severities", "Critical", "Medium"]);
    await block.findAll('[data-testid="survival-group"]')[2]!.trigger("click");

    expect(block.findAll('[data-testid="survival-censor"]')).toHaveLength(2);
    expect(block.find('[data-testid="survival-median"]').exists()).toBe(false);
    expect(block.text()).toContain("Survival stays above 50%: no median yet");
    expect(
      block
        .findAll('[data-testid="survival-group"]')[2]!
        .attributes("aria-pressed"),
    ).toBe("true");
  });

  it("shows the survival at a step on hover", async () => {
    const wrapper = await mountGrid();
    const block = wrapper.find('[data-testid="experiment-survival"]');

    await block
      .findAll('[data-testid="survival-hit"]')[1]!
      .trigger("pointerenter");

    expect(block.find('[data-testid="survival-tooltip"]').text()).toBe(
      "Day 50: 50.0% still exposed, 3 at risk, 1 fixed",
    );
  });

  function savedFile(): { blob: Blob; name: string } {
    const [blob, name] = saveBlob.mock.calls.at(-1) as [Blob, string];
    return { blob, name };
  }

  async function exportedSvg(
    wrapper: Awaited<ReturnType<typeof mountGrid>>,
  ): Promise<Element> {
    await wrapper
      .find('[data-testid="experiment-survival"] [data-testid="export-svg"]')
      .trigger("click");
    await flushPromises();
    const text = await savedFile().blob.text();
    return new DOMParser().parseFromString(text, "image/svg+xml")
      .documentElement;
  }

  it("downloads the survival chart as an SVG that needs no page styling", async () => {
    const wrapper = await mountGrid();

    const svg = await exportedSvg(wrapper);

    const { blob, name } = savedFile();
    expect(name).toBe("exposure-survival-all.svg");
    expect(blob.type).toContain("image/svg+xml");
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.getAttribute("width")).toBe("7in");
    expect(svg.getAttribute("font-family")).toContain("sans-serif");
    expect(svg.outerHTML).not.toContain("var(");
    expect(svg.outerHTML).not.toContain("class=");
    expect(svg.querySelector('path[fill="none"]')?.getAttribute("stroke")).toBe(
      "#0072b2",
    );
    expect(svg.firstElementChild?.getAttribute("fill")).toBe("#ffffff");
    const shaded = svg.querySelector('path[fill-opacity="0.18"]');
    expect(shaded?.getAttribute("fill")).toBe("#0072b2");
    expect(shaded?.getAttribute("d")).toBe(
      wrapper.find('[data-testid="survival-band"]').attributes("d"),
    );
  });

  it("leaves tooltips and interactive elements out of the SVG, even while hovering", async () => {
    const wrapper = await mountGrid();
    await wrapper
      .findAll('[data-testid="survival-hit"]')[1]!
      .trigger("pointerenter");

    const svg = await exportedSvg(wrapper);

    expect(svg.querySelector('rect[fill="transparent"]')).toBeNull();
    expect(svg.querySelector("circle")).toBeNull();
    expect(svg.hasAttribute("tabindex")).toBe(false);
    expect(svg.textContent).not.toContain("still exposed");
    expect(svg.outerHTML).not.toContain("<!--");
    // The chart on the page keeps its hover state
    expect(wrapper.find('[data-testid="survival-tooltip"]').exists()).toBe(
      true,
    );
  });

  it("downloads the plotted survival values as CSV for the selected group", async () => {
    const wrapper = await mountGrid();
    const block = wrapper.find('[data-testid="experiment-survival"]');

    await block.find('[data-testid="export-csv"]').trigger("click");

    expect(savedFile().name).toBe("exposure-survival-all.csv");
    expect(savedFile().blob.type).toContain("text/csv");
    expect(await savedFile().blob.text()).toBe(
      [
        "time_days,survival,lower_95,upper_95,at_risk,events,censored,median_days",
        "0,1,1,1,4,0,0,50",
        "24,0.75,0.25,0.95,4,1,0,50",
        "50,0.5,0.1,0.75,3,1,0,50",
        "90,0.5,0.1,0.75,2,0,1,50",
        "104,0.5,0.1,0.75,1,0,1,50",
        "",
      ].join("\n"),
    );

    await block.findAll('[data-testid="survival-group"]')[2]!.trigger("click");
    await block.find('[data-testid="export-csv"]').trigger("click");

    expect(savedFile().name).toBe("exposure-survival-medium.csv");
    expect(await savedFile().blob.text()).toBe(
      [
        "time_days,survival,lower_95,upper_95,at_risk,events,censored,median_days",
        "0,1,1,1,3,0,0,",
        "50,0.6666666666666666,0.2,0.9,3,1,0,",
        "90,0.6666666666666666,0.2,0.9,2,0,1,",
        "104,0.6666666666666666,0.2,0.9,1,0,1,",
        "",
      ].join("\n"),
    );
  });

  it("charts fix lag by severity and by fix kind outside the HEAD blocks, with a table view", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 1,
        grid_dates: ["2026-09-01"],
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({ data: gridResults() });
    const wrapper = mountDetail();
    await flushPromises();

    const block = wrapper.find('[data-testid="experiment-fix-lag"]');
    expect(block.exists()).toBe(true);
    expect(
      wrapper
        .find(
          '[data-testid="experiment-head-results"] [data-testid="experiment-fix-lag"]',
        )
        .exists(),
    ).toBe(false);
    expect(block.text()).toContain("3 fixes");
    expect(block.text()).toContain("1 before disclosure");
    expect(block.text()).toContain("100.0% dated only to a snapshot interval");

    const bySeverity = block.find('[data-testid="fix-lag-by-severity"]');
    const rows = bySeverity.findAll('[data-testid="lag-row"]');
    expect(rows.map((row) => row.attributes("data-key"))).toEqual([
      "HIGH",
      "LOW",
    ]);
    expect(
      rows.map((row) => row.findAll('[data-testid="lag-dot"]').length),
    ).toEqual([2, 1]);
    expect(bySeverity.find('[data-testid="lag-zero"]').exists()).toBe(true);
    expect(rows[0]!.attributes("aria-label")).toBe(
      "High: 2 fixes, median 80 days, 0 before disclosure",
    );

    const byKind = block.find('[data-testid="fix-lag-by-kind"]');
    expect(
      byKind.findAll('[data-testid="lag-row"]').map((row) => row.text()),
    ).toEqual([
      expect.stringContaining("Upgraded"),
      expect.stringContaining("Removed directly"),
    ]);
    expect(
      byKind
        .findAll('[data-testid="lag-table-row"]')
        .map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([
      ["Upgraded", "2", "16.5", "6.5", "26.5", "1"],
      ["Removed directly", "1", "114", "104", "124", "0"],
    ]);
  });

  it("shows fix probe outcomes and precision shares outside the HEAD blocks", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 1,
        grid_dates: ["2026-09-01"],
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({
      data: {
        ...gridResults(),
        probes: {
          fixes: { found: 0, ambiguous: 0, not_found: 3, not_probed: 0 },
          introductions: {
            found: 0,
            ambiguous: 0,
            not_found: 1,
            not_probed: 0,
          },
          not_found_reasons: {
            "no lockfile-touching commit in the interval": 4,
          },
        },
      },
    });
    const wrapper = mountDetail();
    await flushPromises();

    const block = wrapper.find('[data-testid="experiment-probes"]');
    expect(block.exists()).toBe(true);
    expect(
      wrapper
        .find(
          '[data-testid="experiment-head-results"] [data-testid="experiment-probes"]',
        )
        .exists(),
    ).toBe(false);
    expect(
      block.findAll('[data-testid="probe-outcome-row"]')[0]!.text(),
    ).toContain("100.0%");
    expect(block.text()).toContain(
      "no lockfile-touching commit in the interval: 4",
    );
  });

  it("shows a dot's fix lag on hover", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 1,
        grid_dates: ["2026-09-01"],
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({ data: gridResults() });
    const wrapper = mountDetail();
    await flushPromises();

    const chart = wrapper.find('[data-testid="fix-lag-by-severity"]');
    await chart.findAll('[data-testid="lag-hit"]')[2]!.trigger("pointerenter");

    expect(chart.find('[data-testid="lag-tooltip"]').text()).toBe(
      "Low: fixed 13 days before disclosure",
    );
  });

  it("shows no fix lag block for a HEAD-only experiment", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-fix-lag"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="experiment-survival"]').exists()).toBe(
      false,
    );
  });

  function loadResults(): object {
    return {
      ...gridResults(),
      load_over_time: [
        {
          grid_date: "2026-07-01",
          as_of_date: "2026-07-01",
          projects: 2,
          hindsight: 4,
          as_of: 1,
          undated: 0,
        },
        {
          grid_date: "2026-08-01",
          as_of_date: "2026-08-01",
          projects: 0,
          hindsight: null,
          as_of: null,
          undated: 0,
        },
        {
          grid_date: "2026-09-01",
          as_of_date: "2026-09-01",
          projects: 2,
          hindsight: 5,
          as_of: 3,
          undated: 1,
        },
        {
          grid_date: null,
          as_of_date: "2026-10-02",
          projects: 2,
          hindsight: 6,
          as_of: 6,
          undated: 1,
        },
      ],
    };
  }

  async function mountLoad(): Promise<VueWrapper> {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 3,
        grid_dates: ["2026-07-01", "2026-08-01", "2026-09-01"],
        run_counts: { pending: 0, done: 6, failed: 2, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({ data: loadResults() });
    const wrapper = mountDetail();
    await flushPromises();
    return wrapper;
  }

  it("charts load over time in the hindsight and as-of views on one chart, outside the HEAD blocks", async () => {
    const wrapper = await mountLoad();

    const block = wrapper.find('[data-testid="experiment-load"]');
    expect(block.exists()).toBe(true);
    expect(
      wrapper
        .find(
          '[data-testid="experiment-head-results"] [data-testid="experiment-load"]',
        )
        .exists(),
    ).toBe(false);
    expect(
      block
        .findAll('[data-testid="load-legend-item"]')
        .map((item) => item.text()),
    ).toEqual(["Hindsight", "As-of"]);
    const series = block.findAll('[data-testid="load-series"]');
    expect(series.map((s) => s.attributes("data-key"))).toEqual([
      "hindsight",
      "as_of",
    ]);
    // The grid date without a done snapshot is a gap: three points per series
    expect(
      series.map((s) => s.findAll('[data-testid="load-point"]').length),
    ).toEqual([3, 3]);
    expect(
      block
        .findAll('[data-testid="load-column"]')
        .map((c) => c.attributes("aria-label")),
    ).toEqual([
      "2026-07-01: hindsight 4, as-of 1, 2 projects",
      "2026-08-01: no done snapshot",
      "2026-09-01: hindsight 5, as-of 3, 2 projects",
      "HEAD: hindsight 6, as-of 6, 2 projects",
    ]);
  });

  it("lists every grid date's load in the table view", async () => {
    const wrapper = await mountLoad();

    const rows = wrapper
      .find('[data-testid="experiment-load"]')
      .findAll('[data-testid="load-table-row"]')
      .map((row) => row.findAll("td").map((cell) => cell.text()));
    expect(rows).toEqual([
      ["2026-07-01", "2", "4", "1", "0"],
      ["2026-08-01", "0", "-", "-", "0"],
      ["2026-09-01", "2", "5", "3", "1"],
      ["HEAD (as of 2026-10-02)", "2", "6", "6", "1"],
    ]);
  });

  it("shows both views' load for a grid date on hover", async () => {
    const wrapper = await mountLoad();

    const block = wrapper.find('[data-testid="experiment-load"]');
    await block
      .findAll('[data-testid="load-column"]')[2]!
      .trigger("pointerenter");

    expect(block.find('[data-testid="load-tooltip"]').text()).toBe(
      "2026-09-01: hindsight 5, as-of 3, 2 projects",
    );
  });

  it("shows no load block for a HEAD-only experiment", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({
      data: results({
        load_over_time: [
          {
            grid_date: null,
            as_of_date: null,
            projects: 98,
            hindsight: 10,
            as_of: 10,
            undated: 0,
          },
        ],
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-load"]').exists()).toBe(
      false,
    );
  });

  it("renders the pre-disclosure residence block outside the HEAD blocks", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 1,
        grid_dates: ["2026-09-01"],
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    const none = {
      n: 0,
      median: null,
      p25: null,
      p75: null,
      min: null,
      max: null,
    };
    getExperimentResults.mockResolvedValue({
      data: {
        ...gridResults(),
        residence: {
          introductions: 2,
          snapshot_precision_share: 0.5,
          present_at_first_observation: 4,
          undated: 0,
          overall: { n: 1, median: 88, p25: 88, p75: 88, min: 88, max: 88 },
          by_severity: [
            {
              key: "CRITICAL",
              n: 1,
              median: 88,
              p25: 88,
              p75: 88,
              min: 88,
              max: 88,
            },
          ],
          points: [
            { severity: "CRITICAL", residence_days: 88, precision: "snapshot" },
          ],
          after_disclosure: { ...none, n: 1, median: 99 },
          after_disclosure_by_severity: [
            { key: "HIGH", ...none, n: 1, median: 99 },
          ],
        },
      },
    });
    const wrapper = mountDetail();
    await flushPromises();

    const block = wrapper.find('[data-testid="experiment-residence"]');
    expect(block.exists()).toBe(true);
    expect(
      wrapper
        .find(
          '[data-testid="experiment-head-results"] [data-testid="experiment-residence"]',
        )
        .exists(),
    ).toBe(false);
    expect(block.text()).toContain("50.0% dated only to a snapshot interval");
    expect(block.findAll('[data-testid="lag-dot"]')).toHaveLength(1);
    expect(block.findAll('[data-testid="residence-after-row"]')).toHaveLength(
      1,
    );
  });

  function kinds(
    fixes: number,
    upgraded: number,
    transitive: number,
    unknown: number,
    share: number | null,
  ): object {
    return {
      fixes,
      upgraded,
      removed_direct: fixes - upgraded - transitive - unknown,
      removed_transitive: transitive,
      unknown,
      removed_transitive_share: share,
      snapshot_precision_share: fixes ? 1 : null,
    };
  }

  function leverageResults(): object {
    return results({
      grid_coverage: [
        {
          grid_date: "2026-08-01",
          runs: 2,
          done: 2,
          empty: 0,
          failed: 0,
          skipped: 0,
          pending: 0,
        },
        {
          grid_date: "2026-09-01",
          runs: 2,
          done: 0,
          empty: 0,
          failed: 2,
          skipped: 0,
          pending: 0,
        },
        {
          grid_date: null,
          runs: 2,
          done: 2,
          empty: 0,
          failed: 0,
          skipped: 0,
          pending: 0,
        },
      ],
      upstream_leverage: {
        packages_to_clear: [
          {
            grid_date: "2026-08-01",
            projects: 2,
            instances: 10,
            distinct_packages: 3,
            pkgs_clear_50: 1,
            pkgs_clear_80: 2,
          },
          {
            grid_date: "2026-09-01",
            projects: 0,
            instances: 0,
            distinct_packages: 0,
            pkgs_clear_50: null,
            pkgs_clear_80: null,
          },
          {
            grid_date: null,
            projects: 2,
            instances: 4,
            distinct_packages: 4,
            pkgs_clear_50: 2,
            pkgs_clear_80: 4,
          },
        ],
        fix_kinds: [
          {
            interval_from: "2026-08-01",
            interval_to: "2026-09-01",
            ...kinds(0, 0, 0, 0, null),
          },
          {
            interval_from: "2026-09-01",
            interval_to: null,
            ...kinds(3, 1, 1, 1, 0.5),
          },
        ],
        overall: kinds(3, 1, 1, 1, 0.5),
      },
    });
  }

  async function mountLeverage(): Promise<VueWrapper> {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 2,
        grid_dates: ["2026-08-01", "2026-09-01"],
        run_counts: { pending: 0, done: 4, failed: 2, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({ data: leverageResults() });
    const wrapper = mountDetail();
    await flushPromises();
    return wrapper;
  }

  function tableRows(chart: ReturnType<VueWrapper["find"]>): string[][] {
    return chart
      .findAll('[data-testid="line-table-row"]')
      .map((row) => row.findAll("td").map((cell) => cell.text()));
  }

  it("orders the grid blocks fix lag, probes, survival, residence, upstream leverage, then load", async () => {
    const none = {
      n: 0,
      median: null,
      p25: null,
      p75: null,
      min: null,
      max: null,
    };
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        grid_count: 1,
        grid_dates: ["2026-09-01"],
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({
      data: {
        ...loadResults(),
        upstream_leverage: (leverageResults() as { upstream_leverage: object })
          .upstream_leverage,
        probes: {
          fixes: { found: 0, ambiguous: 0, not_found: 3, not_probed: 0 },
          introductions: {
            found: 0,
            ambiguous: 0,
            not_found: 1,
            not_probed: 0,
          },
          not_found_reasons: {},
        },
        residence: {
          introductions: 0,
          snapshot_precision_share: null,
          present_at_first_observation: 0,
          undated: 0,
          overall: none,
          by_severity: [],
          points: [],
          after_disclosure: none,
          after_disclosure_by_severity: [],
        },
      },
    });
    const wrapper = mountDetail();
    await flushPromises();

    const blocks = [
      "experiment-fix-lag",
      "experiment-probes",
      "experiment-survival",
      "experiment-residence",
      "experiment-upstream-leverage",
      "experiment-load",
    ];
    const order = wrapper
      .findAll("[data-testid]")
      .map((el) => el.attributes("data-testid")!)
      .filter((id) => blocks.includes(id));
    expect(order).toEqual(blocks);
  });

  it("charts packages to clear 50% and 80% of instances per grid date outside the HEAD blocks", async () => {
    const wrapper = await mountLeverage();

    const block = wrapper.find('[data-testid="experiment-upstream-leverage"]');
    expect(block.exists()).toBe(true);
    expect(
      wrapper
        .find(
          '[data-testid="experiment-head-results"] [data-testid="experiment-upstream-leverage"]',
        )
        .exists(),
    ).toBe(false);

    const chart = block.find('[data-testid="leverage-packages-to-clear"]');
    expect(
      chart
        .findAll('[data-testid="line-legend-item"]')
        .map((item) => item.text()),
    ).toEqual(["Clear 50%", "Clear 80%"]);
    expect(chart.findAll('[data-testid="line-series"]')).toHaveLength(2);
    const columns = chart.findAll('[data-testid="line-column"]');
    expect(columns.map((column) => column.attributes("aria-label"))).toEqual([
      "2026-08-01: 50% of 10 instances in 1 package, 80% in 2 packages",
      "2026-09-01: no done snapshot",
      "HEAD: 50% of 4 instances in 2 packages, 80% in 4 packages",
    ]);
    expect(tableRows(chart)).toEqual([
      ["2026-08-01", "1", "2", "10"],
      ["2026-09-01", "-", "-", "0"],
      ["HEAD", "2", "4", "4"],
    ]);
  });

  it("shows every series of a grid date on hover", async () => {
    const wrapper = await mountLeverage();

    const chart = wrapper.find('[data-testid="leverage-packages-to-clear"]');
    await chart
      .findAll('[data-testid="line-column"]')[2]!
      .trigger("pointerenter");

    expect(chart.find('[data-testid="line-crosshair"]').exists()).toBe(true);
    expect(chart.find('[data-testid="line-tooltip"]').text()).toBe(
      "HEAD: 50% of 4 instances in 2 packages, 80% in 4 packages",
    );
  });

  it("charts the removed_transitive share per grid interval, with unknown fix kinds left out", async () => {
    const wrapper = await mountLeverage();

    const block = wrapper.find('[data-testid="experiment-upstream-leverage"]');
    expect(block.text()).toContain(
      "50.0% of 2 fixes of known kind removed transitively",
    );
    expect(block.text()).toContain("1 of 3 fixes has an unknown kind");

    const chart = block.find('[data-testid="leverage-transitive-share"]');
    expect(chart.findAll('[data-testid="line-legend-item"]')).toHaveLength(0);
    expect(
      chart
        .findAll('[data-testid="line-column"]')
        .map((column) => column.attributes("aria-label")),
    ).toEqual([
      "2026-08-01 to 2026-09-01: no fixes",
      "2026-09-01 to HEAD: 50.0% of 2 fixes of known kind removed transitively, 1 unknown",
    ]);
    expect(tableRows(chart)).toEqual([
      ["2026-09-01", "-", "0", "0"],
      ["HEAD", "50.0%", "3", "1"],
    ]);
  });

  it("shows no upstream leverage block for a HEAD-only experiment", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({
      data: results({
        upstream_leverage: {
          packages_to_clear: [
            {
              grid_date: null,
              projects: 2,
              instances: 4,
              distinct_packages: 4,
              pkgs_clear_50: 2,
              pkgs_clear_80: 4,
            },
          ],
          fix_kinds: [],
          overall: kinds(0, 0, 0, 0, null),
        },
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="experiment-upstream-leverage"]').exists(),
    ).toBe(false);
  });

  it("toasts a results failure once, not on every poll", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("RUNNING", {
        run_counts: { pending: 3, done: 1, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockRejectedValue(new Error("boom"));
    mountDetail();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(20_000);
    await flushPromises();

    expect(getExperimentResults).toHaveBeenCalledTimes(3);
    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(errorToast).toHaveBeenCalledWith(
      "Failed to load the experiment results",
    );
  });

  it("warns when the knowledge changed during the experiment", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentResults.mockResolvedValue({
      data: results({
        provenance: {
          ...(results() as { provenance: object }).provenance,
          knowledge_changed: true,
        },
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="experiment-knowledge-changed"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="experiment-provenance"]').text(),
    ).toContain("js-sbom v0.9.1");
  });

  it("does not warn when the knowledge stayed the same", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", {
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="experiment-knowledge-changed"]').exists(),
    ).toBe(false);
  });

  it.each([
    ["runs.csv", "top4-head-runs.csv"],
    ["vulnerabilities.csv", "top4-head-vulnerabilities.csv"],
    ["exposures.csv", "top4-head-exposures.csv"],
    ["fixes.csv", "top4-head-fixes.csv"],
    ["results.json", "top4-head-results.json"],
  ])("downloads %s with the bearer token and saves it", async (file, name) => {
    const blob = new Blob(["x"]);
    getExperiment.mockResolvedValue({ data: experiment("COMPLETED") });
    downloadExperimentExport.mockResolvedValue(blob);
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find(`[data-testid="export-${file}"]`).trigger("click");
    await flushPromises();

    expect(downloadExperimentExport).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "test-org-id",
        experimentId: "exp-1",
        file,
        bearerToken: "test-token",
      }),
    );
    expect(saveBlob).toHaveBeenCalledWith(blob, name);
  });

  it("says when an export fails", async () => {
    getExperiment.mockResolvedValue({ data: experiment("COMPLETED") });
    downloadExperimentExport.mockRejectedValue(new Error("boom"));
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find('[data-testid="export-runs.csv"]').trigger("click");
    await flushPromises();

    expect(saveBlob).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith("Failed to export runs.csv");
  });
});

describe("ExperimentDetail Figures tab", () => {
  const CATALOG = {
    metrics: [
      {
        id: "load_over_time",
        label: "Load over time",
        chart_forms: [{ id: "line", label: "Line" }],
        group_by: [],
        filters: [
          {
            id: "view",
            label: "View",
            options: [
              { id: "hindsight", label: "Hindsight" },
              { id: "as_of", label: "As-of" },
            ],
          },
        ],
      },
    ],
  };

  function figureData(label: string): { data: object } {
    return {
      data: {
        x_title: "Grid date",
        y_title: "Vulnerability instances",
        labels: ["2025-01-01", "HEAD"],
        series: [{ key: "as_of", label, values: [3, 5] }],
      },
    };
  }

  const AS_OF_DEFINITION = {
    metric: "load_over_time",
    chart_form: "line",
    group_by: null,
    filters: { view: "as_of" },
  };

  const NO_FILTER_DEFINITION = { ...AS_OF_DEFINITION, filters: {} };

  beforeEach(() => {
    getExperiment.mockReset().mockResolvedValue({
      data: experiment("COMPLETED", {
        run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 },
      }),
    });
    getExperimentRuns
      .mockReset()
      .mockResolvedValue({ data: [], total_pages: 0 });
    getExperimentResults.mockReset().mockResolvedValue({ data: results() });
    getFigureCatalog.mockReset().mockResolvedValue({ data: CATALOG });
    getFigures.mockReset().mockResolvedValue({ data: [] });
    computeFigureData.mockReset().mockResolvedValue(figureData("Both"));
    createFigure.mockReset().mockResolvedValue({ id: "fig-1" });
    updateFigure.mockReset().mockResolvedValue({});
    deleteFigure.mockReset().mockResolvedValue({});
    successToast.mockReset();
    errorToast.mockReset();
  });

  const SURVIVAL_METRIC = {
    id: "survival",
    label: "Survival",
    chart_forms: [{ id: "step", label: "Step" }],
    group_by: [{ id: "severity", label: "Severity" }],
    filters: [],
  };

  function survivalData(): { data: object } {
    return {
      data: {
        x_title: "Days exposed",
        y_title: "Share still exposed",
        labels: ["31", "104"],
        censored_at: "2025-04-15",
        series: [
          {
            key: "CRITICAL",
            label: "Critical",
            values: [0.5, 0.5],
            lower: [0.1, 0.1],
            upper: [0.9, 0.9],
            censored: [0, 1],
          },
          {
            key: "LOW",
            label: "Low",
            values: [1, null],
            lower: [1, null],
            upper: [1, null],
            censored: [0, 0],
          },
        ],
      },
    };
  }

  it("plots a survival Figure as curves with bands and censoring", async () => {
    getFigureCatalog.mockResolvedValue({
      data: { metrics: [...CATALOG.metrics, SURVIVAL_METRIC] },
    });
    computeFigureData.mockResolvedValue(survivalData());
    const wrapper = await openFiguresTab();

    await wrapper.find('[data-testid="figure-metric"]').setValue("survival");
    await flushPromises();

    expect(computeFigureData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: {
          definition: {
            metric: "survival",
            chart_form: "step",
            group_by: null,
            filters: {},
          },
        },
      }),
    );
    const preview = wrapper.find('[data-testid="figure-preview"]');
    expect(preview.findAll('[data-testid="step-curve"]')).toHaveLength(2);
    expect(preview.findAll('[data-testid="step-band"]')).toHaveLength(2);
    expect(preview.findAll('[data-testid="step-censor"]')).toHaveLength(1);
    expect(preview.text()).toContain("censored at HEAD (2025-04-15)");
    expect(preview.text()).toContain("Critical");
    // A severity keeps its colour whichever classes are present
    const strokes = preview
      .findAll('[data-testid="step-curve"]')
      .map((curve) => curve.attributes("stroke"));
    expect(strokes).toEqual(["var(--viz-series-1)", "var(--viz-series-4)"]);
    expect(preview.find('[data-testid="line-series"]').exists()).toBe(false);
    wrapper.unmount();
  });

  async function openFiguresTab(): Promise<VueWrapper> {
    const wrapper = mount(ExperimentDetail, {
      attachTo: document.body,
      global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
    });
    await flushPromises();
    await wrapper
      .find('[data-testid="experiment-tab-figures"]')
      .trigger("mousedown", { button: 0 });
    await flushPromises();
    return wrapper;
  }

  function optionsOf(wrapper: VueWrapper, testid: string): string[] {
    return wrapper
      .find(`[data-testid="${testid}"]`)
      .findAll("option")
      .map((option) => option.text());
  }

  it("offers the options of the API catalog", async () => {
    const wrapper = await openFiguresTab();

    expect(optionsOf(wrapper, "figure-metric")).toEqual(["Load over time"]);
    expect(optionsOf(wrapper, "figure-chart-form")).toEqual(["Line"]);
    expect(optionsOf(wrapper, "figure-filter-view")).toEqual([
      "No filter",
      "Hindsight",
      "As-of",
    ]);
    // The catalog offers no grouping for this metric
    expect(wrapper.find('[data-testid="figure-group-by"]').exists()).toBe(
      false,
    );
  });

  it("previews live as the definition changes", async () => {
    const wrapper = await openFiguresTab();
    expect(computeFigureData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        orgId: expect.any(String),
        experimentId: "exp-1",
        data: { definition: NO_FILTER_DEFINITION },
      }),
    );

    computeFigureData.mockResolvedValue(figureData("As-of only"));
    await wrapper.find('[data-testid="figure-filter-view"]').setValue("as_of");
    await flushPromises();

    expect(computeFigureData).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { definition: AS_OF_DEFINITION } }),
    );
    expect(wrapper.find('[data-testid="figure-preview"]').text()).toContain(
      "As-of only",
    );
  });

  it("shows only the latest preview when an earlier one answers late", async () => {
    const wrapper = await openFiguresTab();
    let answerSlow: (value: unknown) => void = () => undefined;
    computeFigureData.mockReturnValueOnce(
      new Promise((resolve) => {
        answerSlow = resolve;
      }),
    );
    await wrapper
      .find('[data-testid="figure-filter-view"]')
      .setValue("hindsight");
    computeFigureData.mockResolvedValueOnce(figureData("Latest"));
    await wrapper.find('[data-testid="figure-filter-view"]').setValue("as_of");
    await flushPromises();

    answerSlow(figureData("Stale"));
    await flushPromises();

    expect(wrapper.find('[data-testid="figure-preview"]').text()).toContain(
      "Latest",
    );
  });

  describe("exporting a Figure", () => {
    const CAPTIONED = {
      data: {
        ...figureData("As-of").data,
        caption: {
          n: "n = 3 projects with a done snapshot per grid date",
          exclusions: ["1 grid date without a done snapshot"],
        },
      },
    };

    const SAVED = {
      id: "fig-1",
      name: "Load, as-of view",
      definition: AS_OF_DEFINITION,
      created_on: "2026-11-01T10:00:00Z",
    };

    async function openSavedFigure(): Promise<VueWrapper> {
      getFigures.mockResolvedValue({ data: [SAVED] });
      computeFigureData.mockResolvedValue(CAPTIONED);
      const wrapper = await openFiguresTab();
      await wrapper.find('[data-testid="figure-open"]').trigger("click");
      await flushPromises();
      return wrapper;
    }

    function lastSaved(): { blob: Blob; name: string } {
      const [blob, name] = saveBlob.mock.calls.at(-1) as [Blob, string];
      return { blob, name };
    }

    async function exportAs(
      wrapper: VueWrapper,
      format: string,
    ): Promise<{ text: string; name: string }> {
      await wrapper
        .find(`[data-testid="figure-preview"] [data-testid="export-${format}"]`)
        .trigger("click");
      await flushPromises();
      const { blob, name } = lastSaved();
      return { text: await blob.text(), name };
    }

    beforeEach(() => {
      saveBlob.mockReset();
    });

    it("saves the plotted values as CSV under the Figure's name", async () => {
      const wrapper = await openSavedFigure();
      const { text, name } = await exportAs(wrapper, "csv");
      expect(name).toBe("load-as-of-view.csv");
      expect(text).toBe("Grid date,As-of\n2025-01-01,3\nHEAD,5\n");
      wrapper.unmount();
    });

    it("adds band and censored columns for a survival Figure", async () => {
      getFigureCatalog.mockResolvedValue({
        data: { metrics: [SURVIVAL_METRIC] },
      });
      computeFigureData.mockResolvedValue(survivalData());
      const wrapper = await openFiguresTab();
      const { text } = await exportAs(wrapper, "csv");
      expect(text.split("\n").slice(0, 3)).toEqual([
        "Days exposed,Critical,Critical lower 95,Critical upper 95,Critical censored,Low,Low lower 95,Low upper 95,Low censored",
        "31,0.5,0.1,0.9,0,1,1,1,0",
        "104,0.5,0.1,0.9,1,,,,0",
      ]);
      wrapper.unmount();
    });

    it("keeps negative day labels numeric in the CSV", async () => {
      getFigureCatalog.mockResolvedValue({
        data: { metrics: [SURVIVAL_METRIC] },
      });
      const data = survivalData().data as { labels: string[] };
      data.labels = ["-13", "104"];
      computeFigureData.mockResolvedValue({ data });
      const wrapper = await openFiguresTab();
      const { text } = await exportAs(wrapper, "csv");
      expect(text.split("\n")[1]!.startsWith("-13,")).toBe(true);
      wrapper.unmount();
    });

    it("captions the filters, sample and exclusions the Figure was drawn with", async () => {
      getExperimentResults.mockResolvedValue({
        data: results({
          grid_coverage: [
            {
              grid_date: "2025-01-01",
              runs: 4,
              done: 2,
              empty: 0,
              failed: 2,
              skipped: 0,
              pending: 0,
              mixed_knowledge: false,
            },
          ],
        }),
      });
      const wrapper = await openSavedFigure();
      const { text, name } = await exportAs(wrapper, "caption-file");
      expect(name).toBe("load-as-of-view-caption.txt");
      expect(text).toContain("Load over time");
      expect(text).toContain("View: As-of");
      expect(text).toContain(
        "n = 3 projects with a done snapshot per grid date.",
      );
      expect(text).toContain(
        "Excluded: 1 grid date without a done snapshot; 2 snapshots failed.",
      );
      wrapper.unmount();
    });

    it("marks every exported Figure as unpublished until it is tied to a version", async () => {
      const wrapper = await openSavedFigure();
      const { text: svg } = await exportAs(wrapper, "svg");
      expect(svg).toContain("Unpublished results");
      expect(svg).not.toContain("Metric version");
      const { text: caption } = await exportAs(wrapper, "caption-file");
      expect(caption).toContain("Unpublished results, not for citation.");
      wrapper.unmount();
    });

    it("lays a step Figure out at the single column width", async () => {
      getFigureCatalog.mockResolvedValue({
        data: { metrics: [SURVIVAL_METRIC] },
      });
      computeFigureData.mockResolvedValue(survivalData());
      const wrapper = await openFiguresTab();
      await wrapper
        .find('[data-testid="figure-preview"] [data-testid="export-preset"]')
        .setValue("single");
      const { text } = await exportAs(wrapper, "svg");
      const svg = new DOMParser().parseFromString(
        text,
        "image/svg+xml",
      ).documentElement;
      expect(svg.getAttribute("width")).toBe("3.5in");
      expect(svg.getAttribute("viewBox")?.split(" ")[2]).toBe("320");
      // The HTML legend is redrawn inside the file
      expect(text).toContain(">Critical<");
      expect(text).toContain(">Low<");
      wrapper.unmount();
    });

    it("gives every severity its own line pattern for grayscale print", async () => {
      getFigureCatalog.mockResolvedValue({
        data: { metrics: [SURVIVAL_METRIC] },
      });
      const data = survivalData().data as {
        series: { key: string; label: string }[];
      };
      const [critical] = data.series as [{ key: string; label: string }];
      data.series = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"].map(
        (key) => ({ ...critical, key, label: key }),
      );
      computeFigureData.mockResolvedValue({ data });
      const wrapper = await openFiguresTab();
      const { text } = await exportAs(wrapper, "svg");
      const svg = new DOMParser().parseFromString(text, "image/svg+xml");
      const patterns = [...svg.querySelectorAll("path[fill='none']")].map(
        (path) => path.getAttribute("stroke-dasharray"),
      );
      expect(new Set(patterns).size).toBe(5);
      expect(text).not.toContain("var(--");
      wrapper.unmount();
    });

    it("exports a PNG of a saved Figure at 300 dpi", async () => {
      vi.stubGlobal(
        "Image",
        class {
          onload?: () => void;
          set src(_: string) {
            this.onload?.();
          }
        },
      );
      const context = vi
        .spyOn(HTMLCanvasElement.prototype, "getContext")
        .mockReturnValue({ drawImage: () => undefined } as never);
      const encode = vi
        .spyOn(HTMLCanvasElement.prototype, "toBlob")
        .mockImplementation((callback) =>
          callback(new Blob([new Uint8Array(40)], { type: "image/png" })),
        );
      const wrapper = await openSavedFigure();
      await wrapper
        .find('[data-testid="figure-preview"] [data-testid="export-png"]')
        .trigger("click");
      await flushPromises();
      await vi.waitFor(() => expect(saveBlob).toHaveBeenCalled());
      const { blob, name } = lastSaved();
      expect(name).toBe("load-as-of-view.png");
      expect(blob.type).toBe("image/png");
      wrapper.unmount();
      context.mockRestore();
      encode.mockRestore();
      vi.unstubAllGlobals();
    });

    it("states the as-of approximation when as-of values are drawn", async () => {
      const wrapper = await openSavedFigure();
      const { text } = await exportAs(wrapper, "caption-file");
      expect(text).toContain("The as-of view approximates");
      wrapper.unmount();
    });

    it("states the approximation when an unfiltered Figure draws both views", async () => {
      computeFigureData.mockResolvedValue(figureData("Both"));
      const wrapper = await openFiguresTab();
      const { text } = await exportAs(wrapper, "caption-file");
      expect(text).toContain("The as-of view approximates");
      wrapper.unmount();
    });

    it("leaves the approximation out of a hindsight Figure", async () => {
      getFigures.mockResolvedValue({
        data: [
          {
            ...SAVED,
            definition: {
              ...AS_OF_DEFINITION,
              filters: { view: "hindsight" },
            },
          },
        ],
      });
      computeFigureData.mockResolvedValue({
        data: {
          ...figureData("Hindsight").data,
          series: [{ key: "hindsight", label: "Hindsight", values: [3, 5] }],
        },
      });
      const wrapper = await openFiguresTab();
      await wrapper.find('[data-testid="figure-open"]').trigger("click");
      await flushPromises();
      const { text } = await exportAs(wrapper, "caption-file");
      expect(text).not.toContain("approximates");
      wrapper.unmount();
    });
  });

  it("names and saves a Figure, then lists it", async () => {
    const wrapper = await openFiguresTab();
    await wrapper.find('[data-testid="figure-filter-view"]').setValue("as_of");
    await wrapper.find('[data-testid="figure-name"]').setValue("Load as-of");
    getFigures.mockResolvedValue({
      data: [{ id: "fig-1", name: "Load as-of", definition: AS_OF_DEFINITION }],
    });

    await wrapper.find('[data-testid="figure-save"]').trigger("click");
    await flushPromises();

    expect(createFigure).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "Load as-of", definition: AS_OF_DEFINITION },
      }),
    );
    expect(wrapper.find('[data-testid="figure-item"]').text()).toContain(
      "Load as-of",
    );
  });

  it("does not save a Figure without a name", async () => {
    const wrapper = await openFiguresTab();

    expect(
      wrapper.find('[data-testid="figure-save"]').attributes("disabled"),
    ).toBeDefined();
  });

  it("reopens a saved Figure with its definition and data", async () => {
    getFigures.mockResolvedValue({
      data: [{ id: "fig-1", name: "Load as-of", definition: AS_OF_DEFINITION }],
    });
    const wrapper = await openFiguresTab();
    computeFigureData.mockClear();

    await wrapper.find('[data-testid="figure-open"]').trigger("click");
    await flushPromises();

    expect(computeFigureData).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { definition: AS_OF_DEFINITION } }),
    );
    const view = wrapper.find('[data-testid="figure-filter-view"]')
      .element as HTMLSelectElement;
    expect(view.value).toBe("as_of");
    const name = wrapper.find('[data-testid="figure-name"]')
      .element as HTMLInputElement;
    expect(name.value).toBe("Load as-of");
  });

  it("renames an open Figure instead of creating another", async () => {
    getFigures.mockResolvedValue({
      data: [{ id: "fig-1", name: "Load as-of", definition: AS_OF_DEFINITION }],
    });
    const wrapper = await openFiguresTab();
    await wrapper.find('[data-testid="figure-open"]').trigger("click");
    await flushPromises();

    await wrapper.find('[data-testid="figure-name"]').setValue("Renamed");
    await wrapper.find('[data-testid="figure-save"]').trigger("click");
    await flushPromises();

    expect(createFigure).not.toHaveBeenCalled();
    expect(updateFigure).toHaveBeenCalledWith(
      expect.objectContaining({
        figureId: "fig-1",
        data: { name: "Renamed", definition: AS_OF_DEFINITION },
      }),
    );
  });

  it("deletes a Figure after confirmation", async () => {
    getFigures.mockResolvedValue({
      data: [{ id: "fig-1", name: "Load as-of", definition: AS_OF_DEFINITION }],
    });
    const wrapper = await openFiguresTab();

    await wrapper.find('[data-testid="figure-delete"]').trigger("click");
    expect(deleteFigure).not.toHaveBeenCalled();
    getFigures.mockResolvedValue({ data: [] });
    await wrapper
      .find('[data-testid="figure-delete-confirm"]')
      .trigger("click");
    await flushPromises();

    expect(deleteFigure).toHaveBeenCalledWith(
      expect.objectContaining({ figureId: "fig-1" }),
    );
    expect(wrapper.find('[data-testid="figure-item"]').exists()).toBe(false);
  });
});
