import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExperimentsRepository } from "./experiments.repository";

vi.mock("@/utils/api/BaseEntity", () => ({
  Entity: {
    unMarshal: vi.fn((plain: unknown) => plain),
    unMarshalMany: vi.fn((plain: unknown) => plain),
  },
}));

// BaseRepository is mocked globally; its request helpers are vi.fn instances.
type MockedRepository = ExperimentsRepository & {
  buildUrl: ReturnType<typeof vi.fn>;
  getRequest: ReturnType<typeof vi.fn>;
  postRequest: ReturnType<typeof vi.fn>;
  deleteRequest: ReturnType<typeof vi.fn>;
};

describe("ExperimentsRepository", () => {
  let repository: MockedRepository;
  const getBlobRequest = vi.fn();

  beforeEach(() => {
    repository = new ExperimentsRepository() as MockedRepository;
    // Not part of the global BaseRepository mock
    Object.assign(repository, { getBlobRequest });
    repository.buildUrl.mockImplementation(
      (url: string) => `https://api${url}`,
    );
  });

  it("lists the experiments of an organization page by page", async () => {
    repository.getRequest.mockResolvedValue({ data: [], total_pages: 0 });

    await repository.getExperiments({
      orgId: "org-1",
      pagination: { page: 1, entries_per_page: 20 },
      bearerToken: "token",
      handleBusinessErrors: true,
    });

    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments",
        bearerToken: "token",
        handleBusinessErrors: true,
        queryParams: { page: 1, entries_per_page: 20 },
      }),
    );
  });
  it("gets one experiment", async () => {
    repository.getRequest.mockResolvedValue({ data: { id: "exp-1" } });

    const response = await repository.getExperiment({
      orgId: "org-1",
      experimentId: "exp-1",
      bearerToken: "token",
    });

    expect(response.data).toEqual({ id: "exp-1" });
    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1",
      }),
    );
  });

  it("lists the runs of an experiment by entry rank", async () => {
    repository.getRequest.mockResolvedValue({ data: [], total_pages: 0 });

    await repository.getExperimentRuns({
      orgId: "org-1",
      experimentId: "exp-1",
      pagination: { page: 0, entries_per_page: 100 },
      bearerToken: "token",
    });

    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1/runs",
        queryParams: { page: 0, entries_per_page: 100 },
      }),
    );
  });

  it("creates an experiment", async () => {
    repository.postRequest.mockResolvedValue({ id: "exp-1" });
    const data = {
      name: "top100 head",
      dataset_id: "ds-1",
      analyzer_id: "an-1",
      retries: 2,
    };

    const response = await repository.createExperiment({
      orgId: "org-1",
      data,
      bearerToken: "token",
    });

    expect(response).toEqual({ id: "exp-1" });
    expect(repository.postRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments",
        data,
      }),
    );
  });

  it("cancels an experiment", async () => {
    repository.postRequest.mockResolvedValue({});

    await repository.cancelExperiment({
      orgId: "org-1",
      experimentId: "exp-1",
      bearerToken: "token",
    });

    expect(repository.postRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1/cancel",
      }),
    );
  });

  it("deletes an experiment", async () => {
    repository.deleteRequest.mockResolvedValue({});

    await repository.deleteExperiment({
      orgId: "org-1",
      experimentId: "exp-1",
      bearerToken: "token",
    });

    expect(repository.deleteRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1",
      }),
    );
  });
  it("gets the dataset-level results of an experiment", async () => {
    repository.getRequest.mockResolvedValue({ data: { coverage: {} } });

    const response = await repository.getExperimentResults({
      orgId: "org-1",
      experimentId: "exp-1",
      bearerToken: "token",
    });

    expect(response.data).toEqual({ coverage: {} });
    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1/results",
      }),
    );
  });

  it("publishes an experiment", async () => {
    repository.postRequest.mockResolvedValue({ data: { metric_version: 1 } });

    await repository.publishExperiment({
      orgId: "org-1",
      experimentId: "exp-1",
      bearerToken: "token",
    });

    expect(repository.postRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1/publish",
      }),
    );
  });

  it("lists Published results versions and reads one", async () => {
    repository.getRequest.mockResolvedValue({ data: [] });
    const request = {
      orgId: "org-1",
      experimentId: "exp-1",
      bearerToken: "token",
    };

    await repository.getPublishedVersions(request);
    await repository.getPublishedResults({ ...request, metricVersion: 2 });
    await repository.getCurrentMetricVersion(request);

    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1/published",
      }),
    );
    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1/published/2",
      }),
    );
    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/experiments/exp-1/metric-version",
      }),
    );
  });

  it.each(["runs.csv", "vulnerabilities.csv", "results.json"] as const)(
    "downloads the %s export as an authenticated blob",
    async (file) => {
      const blob = new Blob(["x"]);
      getBlobRequest.mockResolvedValue(blob);

      const response = await repository.downloadExperimentExport({
        orgId: "org-1",
        experimentId: "exp-1",
        file,
        bearerToken: "token",
      });

      expect(response).toBe(blob);
      expect(getBlobRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `https://api/org/org-1/experiments/exp-1/export/${file}`,
          bearerToken: "token",
        }),
      );
    },
  );
});
