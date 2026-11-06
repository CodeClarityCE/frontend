import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import router from "@/router";

import ExperimentDetail from "./ExperimentDetail.vue";

const {
  getExperiment,
  getExperimentRuns,
  cancelExperiment,
  deleteExperiment,
  successToast,
  errorToast,
} = vi.hoisted(() => ({
  getExperiment: vi.fn(),
  getExperimentRuns: vi.fn(),
  cancelExperiment: vi.fn(),
  deleteExperiment: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock("../experiments.repository", () => ({
  ExperimentsRepository: class {
    getExperiment = getExperiment;
    getExperimentRuns = getExperimentRuns;
    cancelExperiment = cancelExperiment;
    deleteExperiment = deleteExperiment;
  },
}));

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
});
