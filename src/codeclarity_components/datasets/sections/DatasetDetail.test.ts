import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IMPORT_CONCURRENCY } from "@/codeclarity_components/projects/create/import/projectImport";
import router from "@/router";

import DatasetDetail from "./DatasetDetail.vue";

const {
  getDataset,
  getDatasetEntries,
  deleteDataset,
  createProject,
  successToast,
  errorToast,
} = vi.hoisted(() => ({
  getDataset: vi.fn(),
  getDatasetEntries: vi.fn(),
  deleteDataset: vi.fn(),
  createProject: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock("../datasets.repository", () => ({
  DatasetsRepository: class {
    getDataset = getDataset;
    getDatasetEntries = getDatasetEntries;
    deleteDataset = deleteDataset;
  },
}));

vi.mock("@/codeclarity_components/projects/project.repository", () => ({
  ProjectRepository: class {
    createProject = createProject;
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
  useRoute: () => ({ query: { id: "ds-1" } }),
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

const params = {
  languages: ["JavaScript"],
  pages: 3,
  min_stars: 1000,
  limit: 3,
  lockfiles: ["yarn.lock"],
};

function dataset(status: string, overrides: object = {}): object {
  return {
    id: "ds-1",
    name: "top3",
    status,
    params,
    stats:
      status === "READY"
        ? {
            search_results: 10,
            candidates: 8,
            probed: 5,
            selected: 3,
            rejected: {
              repo_gone: 0,
              duplicate_canonical: 0,
              fork_or_archived: 0,
              no_branch: 0,
              no_package_json: 1,
              no_lockfile: 1,
            },
          }
        : null,
    error: null,
    entry_count: status === "READY" ? 3 : 0,
    integration_id: "gh-1",
    created_by_name: "John Doe",
    created_on: new Date("2026-10-30T10:00:00Z"),
    built_on: null,
    ...overrides,
  };
}

function entry(rank: number): object {
  return {
    id: `e-${rank}`,
    rank,
    full_name: `org/repo-${rank}`,
    owner: "org",
    repo: `repo-${rank}`,
    git_url: `https://github.com/org/repo-${rank}`,
    default_branch: "main",
    stars: 1000 - rank,
    language: "JavaScript",
    lockfiles: ["yarn.lock"],
  };
}

const entries = [entry(0), entry(1), entry(2)];

function mountDetail(): VueWrapper {
  return mount(DatasetDetail, {
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });
}

describe("DatasetDetail", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getDataset.mockReset();
    getDatasetEntries
      .mockReset()
      .mockResolvedValue({ data: entries, total_pages: 1 });
    createProject.mockReset().mockResolvedValue({ id: "p" });
    successToast.mockReset();
    errorToast.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls while building, then shows the entries once READY", async () => {
    getDataset
      .mockResolvedValueOnce({ data: dataset("BUILDING") })
      .mockResolvedValueOnce({ data: dataset("READY") });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="dataset-status"]').text()).toBe(
      "Building",
    );
    expect(getDatasetEntries).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();

    expect(wrapper.find('[data-testid="dataset-status"]').text()).toBe("Ready");
    expect(wrapper.findAll('[data-testid="dataset-entry"]')).toHaveLength(3);
    expect(wrapper.find('[data-testid="dataset-stats"]').text()).toContain(
      "No root lockfile: 1",
    );

    // Ready datasets are not polled any more
    await vi.advanceTimersByTimeAsync(20_000);
    expect(getDataset).toHaveBeenCalledTimes(2);
  });

  it("stops polling when unmounted", async () => {
    getDataset.mockResolvedValue({ data: dataset("BUILDING") });
    const wrapper = mountDetail();
    await flushPromises();

    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(20_000);

    expect(getDataset).toHaveBeenCalledTimes(1);
  });

  it("shows why a build failed", async () => {
    getDataset.mockResolvedValue({
      data: dataset("FAILED", { error: "Bad credentials" }),
    });
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="dataset-error"]').text()).toContain(
      "Bad credentials",
    );
    expect(wrapper.find('[data-testid="dataset-import"]').exists()).toBe(false);
  });

  it("imports every entry as a project, counting already imported ones", async () => {
    const { BusinessLogicError } = await import("@/utils/api/BaseRepository");
    const Err = BusinessLogicError as unknown as new (code: string) => Error;
    getDataset.mockResolvedValue({ data: dataset("READY") });
    createProject
      .mockResolvedValueOnce({ id: "p0" })
      .mockRejectedValueOnce(new Err("AlreadyExists"))
      .mockRejectedValueOnce(new Err("FailedToRetrieveReposFromProvider"));
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find('[data-testid="dataset-import"]').trigger("click");
    await flushPromises();

    expect(createProject).toHaveBeenCalledTimes(3);
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "test-org-id",
        data: { integration_id: "gh-1", url: "https://github.com/org/repo-0" },
      }),
    );
    expect(successToast).toHaveBeenCalledWith(
      "Imported 1 projects, 1 already imported",
    );
    const failures = wrapper.find('[data-testid="dataset-import-failures"]');
    expect(failures.text()).toContain("org/repo-2");
    expect(failures.text()).not.toContain("org/repo-1");
  });

  it("keeps at most IMPORT_CONCURRENCY imports in flight", async () => {
    const many = Array.from({ length: 10 }, (_, i) => entry(i));
    getDataset.mockResolvedValue({
      data: dataset("READY", { entry_count: 10 }),
    });
    getDatasetEntries.mockResolvedValue({ data: many, total_pages: 1 });
    const pending: (() => void)[] = [];
    createProject.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          pending.push(resolve);
        }),
    );
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find('[data-testid="dataset-import"]').trigger("click");
    await flushPromises();

    expect(createProject).toHaveBeenCalledTimes(IMPORT_CONCURRENCY);
    pending.forEach((resolve) => resolve());
  });

  it("asks for confirmation before deleting", async () => {
    getDataset.mockResolvedValue({ data: dataset("READY") });
    deleteDataset.mockResolvedValue({});
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper.find('[data-testid="dataset-delete"]').trigger("click");
    expect(deleteDataset).not.toHaveBeenCalled();
    await wrapper
      .find('[data-testid="dataset-delete-confirm"]')
      .trigger("click");
    await flushPromises();

    expect(deleteDataset).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "test-org-id", datasetId: "ds-1" }),
    );
  });
  it("runs an experiment on a READY dataset, preselecting it", async () => {
    getDataset.mockResolvedValue({ data: dataset("READY") });
    vi.mocked(router.push).mockClear();
    const wrapper = mountDetail();
    await flushPromises();

    await wrapper
      .find('[data-testid="dataset-run-experiment"]')
      .trigger("click");

    expect(router.push).toHaveBeenCalledWith({
      name: "experiments",
      params: { page: "add" },
      query: { dataset: "ds-1" },
    });
  });

  it("does not offer an experiment before the dataset is READY", async () => {
    getDataset.mockResolvedValue({ data: dataset("BUILDING") });
    const wrapper = mountDetail();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="dataset-run-experiment"]').exists(),
    ).toBe(false);
  });
});
