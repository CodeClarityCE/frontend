import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../tests/real-app";

import { ExperimentRunStatus, ExperimentStatus } from "./experiment.entity";
import { ExperimentsRepository } from "./experiments.repository";

const base = "/org/org-1/experiments/exp-1";
const auth = { orgId: "org-1", experimentId: "exp-1", bearerToken: "token" };

const experiment = {
  id: "exp-1",
  name: "top100 head",
  status: ExperimentStatus.COMPLETED,
  retries: 2,
  grid_interval: "month",
  grid_count: 24,
  grid_dates: [],
  analysis_budget: null,
  error: null,
  dataset_id: "ds-1",
  dataset_name: "top100",
  analyzer_id: "an-1",
  analyzer_name: "JS",
  analyzer_steps: null,
  created_by_name: "John Doe",
  created_on: "2026-11-01T10:00:00.000Z",
  started_on: null,
  ended_on: null,
  run_count: 1,
  run_counts: { pending: 0, done: 1, failed: 0, skipped: 0 },
};

const run = {
  id: "run-1",
  status: ExperimentRunStatus.DONE,
  error: null,
  attempts: 1,
  branch: "main",
  commit_hash: "abc123",
  committed_at: "2026-10-01T00:00:00.000Z",
  grid_index: 0,
  grid_date: null,
  shared_from_run_id: null,
  submitted_on: null,
  ended_on: null,
  analysis_id: "a-1",
  project_id: "p-1",
  entry: {
    id: "e-1",
    rank: 1,
    full_name: "vuejs/core",
    git_url: "https://github.com/vuejs/core.git",
    stars: 45000,
  },
};

const page = <T>(data: T[]) => ({
  data,
  entry_count: data.length,
  page: 0,
  entries_per_page: 20,
  total_entries: data.length,
  total_pages: 1,
  status: "success",
  matching_count: data.length,
  filter_count: {},
});

const noData = { status_code: 200, status: "success" };

describe("ExperimentsRepository", () => {
  it("lists the experiments of an organization page by page", async () => {
    const app = createTestApp();
    app.http.on("GET", "/org/org-1/experiments", page([experiment]));

    const response = await new ExperimentsRepository().getExperiments({
      orgId: "org-1",
      pagination: { page: 1, entries_per_page: 20 },
      bearerToken: "token",
    });

    expect(response.data.map((e) => e.name)).toEqual(["top100 head"]);
    expect(response.data[0]!.created_on).toEqual(
      new Date("2026-11-01T10:00:00.000Z"),
    );
    const request = app.http.requests[0]!;
    expect(request.query.get("page")).toBe("1");
    expect(request.query.get("entries_per_page")).toBe("20");
    expect(request.headers.get("Authorization")).toBe("Bearer token");
  });

  it("gets one experiment", async () => {
    const app = createTestApp();
    app.http.on("GET", base, { data: experiment });

    const response = await new ExperimentsRepository().getExperiment(auth);

    expect(response.data.dataset_name).toBe("top100");
  });

  it("lists the runs of an experiment", async () => {
    const app = createTestApp();
    app.http.on("GET", `${base}/runs`, page([run]));

    const response = await new ExperimentsRepository().getExperimentRuns({
      ...auth,
      pagination: { page: 0, entries_per_page: 100 },
    });

    expect(response.data.map((r) => r.entry.full_name)).toEqual(["vuejs/core"]);
    expect(app.http.requests[0]!.query.get("entries_per_page")).toBe("100");
  });

  it("creates an experiment", async () => {
    const app = createTestApp();
    app.http.on("POST", "/org/org-1/experiments", { id: "exp-1" }, 201);
    const data = {
      name: "top100 head",
      dataset_id: "ds-1",
      analyzer_id: "an-1",
      retries: 2,
    };

    const response = await new ExperimentsRepository().createExperiment({
      orgId: "org-1",
      data,
      bearerToken: "token",
    });

    expect(response.id).toBe("exp-1");
    expect(app.http.requests[0]).toMatchObject({ method: "POST", body: data });
  });

  it("cancels an experiment", async () => {
    const app = createTestApp();
    app.http.on("POST", `${base}/cancel`, noData);

    await new ExperimentsRepository().cancelExperiment(auth);

    expect(app.http.requests[0]).toMatchObject({
      method: "POST",
      path: `${base}/cancel`,
    });
  });

  it("deletes an experiment", async () => {
    const app = createTestApp();
    app.http.on("DELETE", base, noData);

    await new ExperimentsRepository().deleteExperiment(auth);

    expect(app.http.requests[0]).toMatchObject({
      method: "DELETE",
      path: base,
    });
  });

  it("gets the dataset-level results of an experiment", async () => {
    const app = createTestApp();
    app.http.on("GET", `${base}/results`, { data: { coverage: {} } });

    const response = await new ExperimentsRepository().getExperimentResults(
      auth,
    );

    expect(response.data).toEqual({ coverage: {} });
  });

  it("publishes an experiment", async () => {
    const app = createTestApp();
    const stamp = {
      metric_version: 1,
      published_on: "2026-11-02T00:00:00.000Z",
      package_checksum: null,
    };
    app.http.on("POST", `${base}/publish`, { data: stamp });

    const response = await new ExperimentsRepository().publishExperiment(auth);

    expect(response.data.metric_version).toBe(1);
  });

  it("lists Published results versions and reads one", async () => {
    const app = createTestApp();
    const version = {
      metric_version: 2,
      published_on: "2026-11-02T00:00:00.000Z",
      package_checksum: null,
      published_by_name: "John Doe",
    };
    app.http.on("GET", `${base}/published`, { data: [version] });
    app.http.on("GET", `${base}/published/2`, { data: { coverage: {} } });
    app.http.on("GET", `${base}/metric-version`, {
      data: { metric_version: 3 },
    });
    const repository = new ExperimentsRepository();

    const versions = await repository.getPublishedVersions(auth);
    const results = await repository.getPublishedResults({
      ...auth,
      metricVersion: 2,
    });
    const current = await repository.getCurrentMetricVersion(auth);

    expect(versions.data.map((v) => v.metric_version)).toEqual([2]);
    expect(results.data).toEqual({ coverage: {} });
    expect(current.data.metric_version).toBe(3);
  });

  it("asks for one Published results version when given", async () => {
    const app = createTestApp();
    app.http.on("GET", `${base}/export/results.json`, { coverage: {} });

    await new ExperimentsRepository().downloadExperimentExport({
      ...auth,
      file: "results.json",
      metricVersion: 2,
    });

    expect(app.http.requests[0]!.query.get("metric_version")).toBe("2");
  });

  it.each(["runs.csv", "vulnerabilities.csv", "results.json"] as const)(
    "downloads the %s export as an authenticated blob",
    async (file) => {
      const app = createTestApp();
      app.http.on("GET", `${base}/export/${file}`, "contents");

      const blob = await new ExperimentsRepository().downloadExperimentExport({
        ...auth,
        file,
      });

      expect(await blob.text()).toBe('"contents"');
      const request = app.http.requests[0]!;
      expect(request.query.has("metric_version")).toBe(false);
      expect(request.headers.get("Authorization")).toBe("Bearer token");
    },
  );
});
