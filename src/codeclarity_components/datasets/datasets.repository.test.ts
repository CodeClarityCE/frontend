import { beforeEach, describe, expect, it, vi } from "vitest";

import { DatasetsRepository } from "./datasets.repository";

vi.mock("@/utils/api/BaseEntity", () => ({
  Entity: {
    unMarshal: vi.fn((plain: unknown) => plain),
    unMarshalMany: vi.fn((plain: unknown) => plain),
  },
}));

// BaseRepository is mocked globally; its request helpers are vi.fn instances.
type MockedRepository = DatasetsRepository & {
  buildUrl: ReturnType<typeof vi.fn>;
  getRequest: ReturnType<typeof vi.fn>;
  postRequest: ReturnType<typeof vi.fn>;
  deleteRequest: ReturnType<typeof vi.fn>;
};

describe("DatasetsRepository", () => {
  let repository: MockedRepository;

  beforeEach(() => {
    repository = new DatasetsRepository() as MockedRepository;
    repository.buildUrl.mockImplementation((url: string) => `https://api${url}`);
  });

  it("lists the datasets of an organization page by page", async () => {
    repository.getRequest.mockResolvedValue({ data: [], total_pages: 0 });

    await repository.getDatasets({
      orgId: "org-1",
      pagination: { page: 2, entries_per_page: 20 },
      bearerToken: "token",
      handleBusinessErrors: true,
    });

    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/datasets",
        bearerToken: "token",
        handleBusinessErrors: true,
        queryParams: { page: 2, entries_per_page: 20 },
      }),
    );
  });

  it("gets one dataset", async () => {
    repository.getRequest.mockResolvedValue({ data: { id: "ds-1" } });

    const response = await repository.getDataset({
      orgId: "org-1",
      datasetId: "ds-1",
      bearerToken: "token",
    });

    expect(response.data).toEqual({ id: "ds-1" });
    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api/org/org-1/datasets/ds-1" }),
    );
  });

  it("lists the entries of a dataset", async () => {
    repository.getRequest.mockResolvedValue({ data: [], total_pages: 0 });

    await repository.getDatasetEntries({
      orgId: "org-1",
      datasetId: "ds-1",
      pagination: { page: 0, entries_per_page: 500 },
      bearerToken: "token",
    });

    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/datasets/ds-1/entries",
        queryParams: { page: 0, entries_per_page: 500 },
      }),
    );
  });

  it("creates a dataset with the build parameters", async () => {
    repository.postRequest.mockResolvedValue({ id: "ds-1" });
    const data = {
      name: "top100",
      integration_id: "gh-1",
      limit: 100,
      pages: 3,
      min_stars: 1000,
    };

    const response = await repository.createDataset({
      orgId: "org-1",
      data,
      bearerToken: "token",
    });

    expect(response).toEqual({ id: "ds-1" });
    expect(repository.postRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/datasets",
        data,
      }),
    );
  });

  it("deletes a dataset", async () => {
    repository.deleteRequest.mockResolvedValue({});

    await repository.deleteDataset({
      orgId: "org-1",
      datasetId: "ds-1",
      bearerToken: "token",
    });

    expect(repository.deleteRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api/org/org-1/datasets/ds-1" }),
    );
  });
});
