import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../tests/real-app";

import { DatasetStatus } from "./dataset.entity";
import { DatasetsRepository } from "./datasets.repository";

const dataset = {
  id: "ds-1",
  name: "top100",
  status: DatasetStatus.READY,
  params: {
    languages: [],
    pages: 3,
    min_stars: 1000,
    limit: 100,
    lockfiles: [],
  },
  stats: null,
  error: null,
  entry_count: 1,
  integration_id: "gh-1",
  created_by_name: "John Doe",
  created_on: "2026-01-01T00:00:00.000Z",
  built_on: "2026-01-02T00:00:00.000Z",
};

const entry = {
  id: "e-1",
  rank: 1,
  full_name: "vuejs/core",
  owner: "vuejs",
  repo: "core",
  git_url: "https://github.com/vuejs/core.git",
  default_branch: "main",
  stars: 45000,
  language: "TypeScript",
  lockfiles: ["pnpm-lock.yaml"],
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

describe("DatasetsRepository", () => {
  it("lists the datasets of an organization page by page", async () => {
    const app = createTestApp();
    app.http.on("GET", "/org/org-1/datasets", page([dataset]));

    const response = await new DatasetsRepository().getDatasets({
      orgId: "org-1",
      pagination: { page: 2, entries_per_page: 20 },
      bearerToken: "token",
    });

    expect(response.data.map((d) => d.name)).toEqual(["top100"]);
    expect(response.data[0]!.created_on).toEqual(
      new Date("2026-01-01T00:00:00.000Z"),
    );
    const request = app.http.requests[0]!;
    expect(request.query.get("page")).toBe("2");
    expect(request.query.get("entries_per_page")).toBe("20");
    expect(request.headers.get("Authorization")).toBe("Bearer token");
  });

  it("drops a dataset the API sent without its required fields", async () => {
    const app = createTestApp();
    app.http.on(
      "GET",
      "/org/org-1/datasets",
      page([dataset, { ...dataset, id: "ds-2", name: "" }]),
    );

    const response = await new DatasetsRepository().getDatasets({
      orgId: "org-1",
      pagination: { page: 0, entries_per_page: 20 },
      bearerToken: "token",
    });

    expect(response.data.map((d) => d.id)).toEqual(["ds-1"]);
  });

  it("gets one dataset", async () => {
    const app = createTestApp();
    app.http.on("GET", "/org/org-1/datasets/ds-1", { data: dataset });

    const response = await new DatasetsRepository().getDataset({
      orgId: "org-1",
      datasetId: "ds-1",
      bearerToken: "token",
    });

    expect(response.data.name).toBe("top100");
  });

  it("lists the entries of a dataset", async () => {
    const app = createTestApp();
    app.http.on("GET", "/org/org-1/datasets/ds-1/entries", page([entry]));

    const response = await new DatasetsRepository().getDatasetEntries({
      orgId: "org-1",
      datasetId: "ds-1",
      pagination: { page: 0, entries_per_page: 500 },
      bearerToken: "token",
    });

    expect(response.data.map((e) => e.full_name)).toEqual(["vuejs/core"]);
    expect(app.http.requests[0]!.query.get("entries_per_page")).toBe("500");
  });

  it("creates a dataset with the build parameters", async () => {
    const app = createTestApp();
    app.http.on("POST", "/org/org-1/datasets", { id: "ds-1" }, 201);
    const data = {
      name: "top100",
      integration_id: "gh-1",
      limit: 100,
      pages: 3,
      min_stars: 1000,
    };

    const response = await new DatasetsRepository().createDataset({
      orgId: "org-1",
      data,
      bearerToken: "token",
    });

    expect(response.id).toBe("ds-1");
    expect(app.http.requests[0]).toMatchObject({ method: "POST", body: data });
  });

  it("deletes a dataset", async () => {
    const app = createTestApp();
    app.http.on("DELETE", "/org/org-1/datasets/ds-1", {
      status_code: 200,
      status: "success",
    });

    await new DatasetsRepository().deleteDataset({
      orgId: "org-1",
      datasetId: "ds-1",
      bearerToken: "token",
    });

    expect(app.http.requests[0]).toMatchObject({
      method: "DELETE",
      path: "/org/org-1/datasets/ds-1",
    });
  });
});
