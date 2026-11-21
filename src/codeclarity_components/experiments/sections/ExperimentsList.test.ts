import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";

import ExperimentsList from "./ExperimentsList.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const listPath = `/org/${org.id}/experiments`;

function experiment(id: string, status: string, done = 0): object {
  return {
    id,
    name: `experiment ${id}`,
    status,
    retries: 2,
    grid_interval: "month",
    grid_count: 24,
    grid_dates: [],
    analysis_budget: null,
    error: null,
    dataset_id: "ds-1",
    dataset_name: "top4",
    analyzer_id: "an-1",
    analyzer_name: "JS",
    analyzer_steps: null,
    created_by_name: "John Doe",
    created_on: "2026-11-01T10:00:00.000Z",
    started_on: null,
    ended_on: null,
    run_count: 4,
    run_counts: { pending: 4 - done, done, failed: 0, skipped: 0 },
  };
}

function page(data: object[]): object {
  return {
    data,
    entry_count: data.length,
    page: 0,
    entries_per_page: 100,
    total_entries: data.length,
    total_pages: data.length ? 1 : 0,
    status: "success",
    matching_count: data.length,
    filter_count: {},
  };
}

// Opens the Experiments page with the list the API answers.
async function openList(experiments: object[]): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", listPath, page(experiments));
  await app.visit("/experiments");
  render(ExperimentsList, { global: app.global });
  await flushPromises();
  return app;
}

const listRequests = (app: TestApp) =>
  app.http.requests.filter((r) => r.path === listPath);

describe("ExperimentsList", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows each experiment with its status and finished runs", async () => {
    await openList([experiment("exp-1", "COMPLETED", 4)]);

    const row = await screen.findByTestId("experiment-row");
    expect(row).toHaveTextContent("experiment exp-1");
    expect(row).toHaveTextContent("top4");
    expect(row).toHaveTextContent("Completed");
    expect(row).toHaveTextContent("4 / 4");
  });

  it("refreshes every 10s while an experiment is pending or running", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const app = await openList([experiment("exp-1", "RUNNING", 1)]);
    app.http.on("GET", listPath, page([experiment("exp-1", "COMPLETED", 4)]));

    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();

    expect(screen.getByTestId("experiment-row")).toHaveTextContent("Completed");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(listRequests(app)).toHaveLength(2);
  });

  it("links each experiment to its page", async () => {
    await openList([experiment("exp-1", "COMPLETED", 4)]);

    const row = await screen.findByTestId("experiment-row");
    expect(
      within(row).getByRole("link", { name: "experiment exp-1" }),
    ).toHaveAttribute("href", "/experiments/detail?id=exp-1");
  });

  it("explains what an experiment is when there is none", async () => {
    await openList([]);

    expect(await screen.findByText("No Experiments yet")).toBeInTheDocument();
  });

  it("says so when the Experiments can't be loaded", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", listPath, { error_code: "InternalError" }, 500);
    await app.visit("/experiments");
    render(ExperimentsList, { global: app.global });

    expect(
      await screen.findByText("The Experiments could not be loaded."),
    ).toBeInTheDocument();
  });
});
