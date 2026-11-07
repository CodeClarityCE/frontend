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

function experiment(status: string, overrides: object = {}): object {
  return {
    id: "exp-1",
    name: "top4 head",
    status,
    retries: 2,
    grid_interval: "month",
    grid_count: 0,
    grid_dates: [],
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

  function lag(n: number, median: number, before = 0): object {
    return { n, median, p25: median - 10, p75: median + 10, min: median - 20, max: median + 20, before_disclosure: before };
  }

  function gridResults(): object {
    return results({
      grid_coverage: [
        { grid_date: "2026-09-01", runs: 2, done: 2, empty: 0, failed: 0, skipped: 0, pending: 0 },
        { grid_date: null, runs: 2, done: 2, empty: 0, failed: 0, skipped: 0, pending: 0 },
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
          { severity: "HIGH", kind: "upgraded", lag_days: 46, precision: "snapshot" },
          { severity: "HIGH", kind: "removed_direct", lag_days: 114, precision: "snapshot" },
          { severity: "LOW", kind: "upgraded", lag_days: -13, precision: "snapshot" },
        ],
      },
    });
  }

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
      wrapper.find('[data-testid="experiment-head-results"] [data-testid="experiment-fix-lag"]').exists(),
    ).toBe(false);
    expect(block.text()).toContain("3 fixes");
    expect(block.text()).toContain("1 before disclosure");
    expect(block.text()).toContain("100.0% dated only to a snapshot interval");

    const bySeverity = block.find('[data-testid="fix-lag-by-severity"]');
    const rows = bySeverity.findAll('[data-testid="lag-row"]');
    expect(rows.map((row) => row.attributes("data-key"))).toEqual(["HIGH", "LOW"]);
    expect(rows.map((row) => row.findAll('[data-testid="lag-dot"]').length)).toEqual([2, 1]);
    expect(bySeverity.find('[data-testid="lag-zero"]').exists()).toBe(true);
    expect(rows[0]!.attributes("aria-label")).toBe("High: 2 fixes, median 80 days, 0 before disclosure");

    const byKind = block.find('[data-testid="fix-lag-by-kind"]');
    expect(byKind.findAll('[data-testid="lag-row"]').map((row) => row.text())).toEqual([
      expect.stringContaining("Upgraded"),
      expect.stringContaining("Removed directly"),
    ]);
    expect(
      byKind.findAll('[data-testid="lag-table-row"]').map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([
      ["Upgraded", "2", "16.5", "6.5", "26.5", "1"],
      ["Removed directly", "1", "114", "104", "124", "0"],
    ]);
  });

  it("shows a dot's fix lag on hover", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", { grid_count: 1, grid_dates: ["2026-09-01"], run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 } }),
    });
    getExperimentResults.mockResolvedValue({ data: gridResults() });
    const wrapper = mountDetail();
    await flushPromises();

    const chart = wrapper.find('[data-testid="fix-lag-by-severity"]');
    await chart.findAll('[data-testid="lag-hit"]')[2]!.trigger("pointerenter");

    expect(chart.find('[data-testid="lag-tooltip"]').text()).toBe("Low: fixed 13 days before disclosure");
  });

  it("shows no fix lag block for a HEAD-only experiment", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", { run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 } }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-fix-lag"]').exists()).toBe(false);
  });

  it("renders the pre-disclosure residence block outside the HEAD blocks", async () => {
    getExperiment.mockResolvedValue({
      data: experiment("COMPLETED", { grid_count: 1, grid_dates: ["2026-09-01"], run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 } }),
    });
    const none = { n: 0, median: null, p25: null, p75: null, min: null, max: null };
    getExperimentResults.mockResolvedValue({
      data: {
        ...gridResults(),
        residence: {
          introductions: 2,
          snapshot_precision_share: 0.5,
          present_at_first_observation: 4,
          undated: 0,
          overall: { n: 1, median: 88, p25: 88, p75: 88, min: 88, max: 88 },
          by_severity: [{ key: "CRITICAL", n: 1, median: 88, p25: 88, p75: 88, min: 88, max: 88 }],
          points: [{ severity: "CRITICAL", residence_days: 88, precision: "snapshot" }],
          after_disclosure: { ...none, n: 1, median: 99 },
          after_disclosure_by_severity: [{ key: "HIGH", ...none, n: 1, median: 99 }],
        },
      },
    });
    const wrapper = mountDetail();
    await flushPromises();

    const block = wrapper.find('[data-testid="experiment-residence"]');
    expect(block.exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="experiment-head-results"] [data-testid="experiment-residence"]').exists(),
    ).toBe(false);
    expect(block.text()).toContain("50.0% dated only to a snapshot interval");
    expect(block.findAll('[data-testid="lag-dot"]')).toHaveLength(1);
    expect(block.findAll('[data-testid="residence-after-row"]')).toHaveLength(1);
  });

  function kinds(fixes: number, upgraded: number, transitive: number, unknown: number, share: number | null): object {
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
        { grid_date: "2026-08-01", runs: 2, done: 2, empty: 0, failed: 0, skipped: 0, pending: 0 },
        { grid_date: "2026-09-01", runs: 2, done: 0, empty: 0, failed: 2, skipped: 0, pending: 0 },
        { grid_date: null, runs: 2, done: 2, empty: 0, failed: 0, skipped: 0, pending: 0 },
      ],
      upstream_leverage: {
        packages_to_clear: [
          { grid_date: "2026-08-01", projects: 2, instances: 10, distinct_packages: 3, pkgs_clear_50: 1, pkgs_clear_80: 2 },
          { grid_date: "2026-09-01", projects: 0, instances: 0, distinct_packages: 0, pkgs_clear_50: null, pkgs_clear_80: null },
          { grid_date: null, projects: 2, instances: 4, distinct_packages: 4, pkgs_clear_50: 2, pkgs_clear_80: 4 },
        ],
        fix_kinds: [
          { interval_from: "2026-08-01", interval_to: "2026-09-01", ...kinds(0, 0, 0, 0, null) },
          { interval_from: "2026-09-01", interval_to: null, ...kinds(3, 1, 1, 1, 0.5) },
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

  it("charts packages to clear 50% and 80% of instances per grid date outside the HEAD blocks", async () => {
    const wrapper = await mountLeverage();

    const block = wrapper.find('[data-testid="experiment-upstream-leverage"]');
    expect(block.exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="experiment-head-results"] [data-testid="experiment-upstream-leverage"]').exists(),
    ).toBe(false);

    const chart = block.find('[data-testid="leverage-packages-to-clear"]');
    expect(chart.findAll('[data-testid="line-legend-item"]').map((item) => item.text())).toEqual([
      "Clear 50%",
      "Clear 80%",
    ]);
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
    await chart.findAll('[data-testid="line-column"]')[2]!.trigger("pointerenter");

    expect(chart.find('[data-testid="line-crosshair"]').exists()).toBe(true);
    expect(chart.find('[data-testid="line-tooltip"]').text()).toBe(
      "HEAD: 50% of 4 instances in 2 packages, 80% in 4 packages",
    );
  });

  it("charts the removed_transitive share per grid interval, with unknown fix kinds left out", async () => {
    const wrapper = await mountLeverage();

    const block = wrapper.find('[data-testid="experiment-upstream-leverage"]');
    expect(block.text()).toContain("50.0% of 2 fixes of known kind removed transitively");
    expect(block.text()).toContain("1 of 3 fixes has an unknown kind");

    const chart = block.find('[data-testid="leverage-transitive-share"]');
    expect(chart.findAll('[data-testid="line-legend-item"]')).toHaveLength(0);
    expect(chart.findAll('[data-testid="line-column"]').map((column) => column.attributes("aria-label"))).toEqual([
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
      data: experiment("COMPLETED", { run_counts: { pending: 0, done: 4, failed: 0, skipped: 0 } }),
    });
    getExperimentResults.mockResolvedValue({
      data: results({
        upstream_leverage: {
          packages_to_clear: [
            { grid_date: null, projects: 2, instances: 4, distinct_packages: 4, pkgs_clear_50: 2, pkgs_clear_80: 4 },
          ],
          fix_kinds: [],
          overall: kinds(0, 0, 0, 0, null),
        },
      }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-upstream-leverage"]').exists()).toBe(false);
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
