import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExperimentsList from "./ExperimentsList.vue";

const { getExperiments, errorToast } = vi.hoisted(() => ({
  getExperiments: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock("../experiments.repository", () => ({
  ExperimentsRepository: class {
    getExperiments = getExperiments;
  },
}));

vi.mock("@/utils/toasts", () => ({ errorToast }));

function experiment(id: string, status: string, done = 0): object {
  return {
    id,
    name: `experiment ${id}`,
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
    run_counts: { pending: 4 - done, done, failed: 0, skipped: 0 },
  };
}

function mountList(): VueWrapper {
  return mount(ExperimentsList, {
    global: {
      stubs: {
        RouterLink: {
          props: ["to"],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  });
}

describe("ExperimentsList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getExperiments.mockReset();
    errorToast.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows each experiment with its status and finished runs", async () => {
    getExperiments.mockResolvedValue({
      data: [experiment("exp-1", "COMPLETED", 4)],
      total_pages: 1,
    });
    const wrapper = mountList();
    await flushPromises();

    const row = wrapper.find('[data-testid="experiment-row"]');
    expect(row.text()).toContain("experiment exp-1");
    expect(row.text()).toContain("top4");
    expect(row.text()).toContain("Completed");
    expect(row.text()).toContain("4 / 4");
  });

  it("refreshes every 10s while an experiment is pending or running", async () => {
    getExperiments
      .mockResolvedValueOnce({
        data: [experiment("exp-1", "RUNNING", 1)],
        total_pages: 1,
      })
      .mockResolvedValueOnce({
        data: [experiment("exp-1", "COMPLETED", 4)],
        total_pages: 1,
      });
    const wrapper = mountList();
    await flushPromises();

    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();

    expect(wrapper.find('[data-testid="experiment-row"]').text()).toContain(
      "Completed",
    );
    await vi.advanceTimersByTimeAsync(60_000);
    expect(getExperiments).toHaveBeenCalledTimes(2);
  });

  it("links each experiment to its page", async () => {
    getExperiments.mockResolvedValue({
      data: [experiment("exp-1", "COMPLETED", 4)],
      total_pages: 1,
    });
    const wrapper = mountList();
    await flushPromises();

    const link = wrapper
      .findAll("a")
      .find((a) => a.text() === "experiment exp-1");
    expect(JSON.parse(link?.attributes("data-to") ?? "null")).toEqual({
      name: "experiments",
      params: { page: "detail" },
      query: { id: "exp-1" },
    });
  });

  it("explains what an experiment is when there is none", async () => {
    getExperiments.mockResolvedValue({ data: [], total_pages: 0 });
    const wrapper = mountList();
    await flushPromises();

    expect(wrapper.text()).toContain("No Experiments yet");
  });
});
