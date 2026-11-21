import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IMPORT_CONCURRENCY } from "@/codeclarity_components/projects/create/import/projectImport";

import {
  createTestApp,
  org,
  type TestApp,
  withToaster,
} from "../../../../tests/real-app";

import DatasetDetail from "./DatasetDetail.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const datasetPath = `/org/${org.id}/datasets/ds-1`;
const projectsPath = `/org/${org.id}/projects`;

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
    created_on: "2026-10-30T10:00:00.000Z",
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

function page(data: object[]): object {
  return {
    data,
    entry_count: data.length,
    page: 0,
    entries_per_page: 500,
    total_entries: data.length,
    total_pages: 1,
    status: "success",
    matching_count: data.length,
    filter_count: {},
  };
}

const apiError = (error_code: string, status_code = 409): object => ({
  status_code,
  status: "failure",
  error_code,
  error_message: error_code,
});

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Answers each project import by the repository it names, still recording the request.
function answerImports(
  answer: (url: string) => Response | Promise<Response>,
): void {
  const fake = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    async (input: string | URL, init: RequestInit = {}): Promise<Response> => {
      const response = fake(input, init);
      const path = new URL(String(input)).pathname;
      if (init.method === "POST" && path.endsWith(projectsPath)) {
        const body = JSON.parse(init.body as string) as { url: string };
        return answer(body.url);
      }
      return response;
    },
  );
}

// Opens the dataset's page with the dataset and entries the API answers.
async function openDetail(
  answer: object,
  entries: object[] = [entry(0), entry(1), entry(2)],
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", datasetPath, { data: answer });
  app.http.on("GET", `${datasetPath}/entries`, page(entries));
  await app.visit("/datasets/detail?id=ds-1");
  render(withToaster(DatasetDetail), { global: app.global });
  await flushPromises();
  return app;
}

const datasetRequests = (app: TestApp) =>
  app.http.requests.filter((r) => r.method === "GET" && r.path === datasetPath);

const importRequests = (app: TestApp) =>
  app.http.requests.filter(
    (r) => r.method === "POST" && r.path === projectsPath,
  );

describe("DatasetDetail", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls while building, then shows the entries once READY", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const app = await openDetail(dataset("BUILDING"));

    expect(screen.getByTestId("dataset-status")).toHaveTextContent("Building");
    expect(screen.queryAllByTestId("dataset-entry")).toHaveLength(0);

    app.http.on("GET", datasetPath, { data: dataset("READY") });
    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();

    expect(screen.getByTestId("dataset-status")).toHaveTextContent("Ready");
    expect(screen.getAllByTestId("dataset-entry")).toHaveLength(3);
    expect(screen.getByTestId("dataset-stats")).toHaveTextContent(
      "No root lockfile: 1",
    );

    // Ready datasets are not polled any more
    await vi.advanceTimersByTimeAsync(20_000);
    expect(datasetRequests(app)).toHaveLength(2);
  });

  it("stops polling when the page closes", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", datasetPath, { data: dataset("BUILDING") });
    await app.visit("/datasets/detail?id=ds-1");
    const { unmount } = render(DatasetDetail, { global: app.global });
    await flushPromises();

    unmount();
    await vi.advanceTimersByTimeAsync(20_000);

    expect(datasetRequests(app)).toHaveLength(1);
  });

  it("shows why a build failed", async () => {
    await openDetail(dataset("FAILED", { error: "Bad credentials" }));

    expect(screen.getByTestId("dataset-error")).toHaveTextContent(
      "Bad credentials",
    );
    expect(
      screen.queryByRole("button", { name: "Import as projects" }),
    ).not.toBeInTheDocument();
  });

  it("says so when the dataset does not exist", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", datasetPath, apiError("EntityNotFound", 404), 404);
    await app.visit("/datasets/detail?id=ds-1");
    render(DatasetDetail, { global: app.global });

    expect(
      await screen.findByRole("heading", { name: "Dataset not found" }),
    ).toBeInTheDocument();
  });

  it("imports every entry as a project, counting already imported ones", async () => {
    const app = await openDetail(dataset("READY"));
    answerImports((url) => {
      if (url.endsWith("repo-0")) return json({ id: "p0" }, 201);
      if (url.endsWith("repo-1")) return json(apiError("AlreadyExists"), 409);
      return json(apiError("FailedToRetrieveReposFromProvider", 400), 400);
    });
    const typist = userEvent.setup();

    await typist.click(
      screen.getByRole("button", { name: "Import as projects" }),
    );
    await typist.click(
      screen.getByRole("button", { name: "Import 3 projects" }),
    );

    expect(
      await screen.findByText("Imported 1 projects, 1 already imported"),
    ).toBeInTheDocument();
    expect(importRequests(app).map((r) => r.body)).toContainEqual({
      integration_id: "gh-1",
      url: "https://github.com/org/repo-0",
    });
    expect(importRequests(app)).toHaveLength(3);
    const failures = screen.getByTestId("dataset-import-failures");
    expect(failures).toHaveTextContent("org/repo-2");
    expect(failures).not.toHaveTextContent("org/repo-1");
    expect(
      screen.getByText("Failed to import 1 repositories"),
    ).toBeInTheDocument();
  });

  it(`keeps at most ${IMPORT_CONCURRENCY} imports in flight`, async () => {
    const many = Array.from({ length: 10 }, (_, i) => entry(i));
    const app = await openDetail(dataset("READY", { entry_count: 10 }), many);
    const pending: (() => void)[] = [];
    answerImports(
      () =>
        new Promise<Response>((resolve) => {
          pending.push(() => resolve(json({ id: "p" }, 201)));
        }),
    );
    const typist = userEvent.setup();

    await typist.click(
      screen.getByRole("button", { name: "Import as projects" }),
    );
    await typist.click(
      screen.getByRole("button", { name: "Import 10 projects" }),
    );
    await waitFor(() =>
      expect(importRequests(app)).toHaveLength(IMPORT_CONCURRENCY),
    );
    await flushPromises();

    expect(importRequests(app)).toHaveLength(IMPORT_CONCURRENCY);
    expect(screen.getByText("Importing projects")).toBeInTheDocument();
    await waitFor(() => {
      while (pending.length) pending.shift()!();
      expect(screen.getByText("Import finished")).toBeInTheDocument();
    });
    expect(importRequests(app)).toHaveLength(10);
  });

  it("asks for confirmation before deleting", async () => {
    const app = await openDetail(dataset("READY"));
    app.http.on("DELETE", datasetPath, {
      status_code: 200,
      status: "success",
    });
    const typist = userEvent.setup();

    await typist.click(screen.getByRole("button", { name: "Delete" }));
    expect(app.http.requests.some((r) => r.method === "DELETE")).toBe(false);
    await typist.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(await screen.findByText("Dataset deleted")).toBeInTheDocument();
    expect(
      app.http.requests.filter((r) => r.method === "DELETE"),
    ).toMatchObject([{ path: datasetPath }]);
    await waitFor(() =>
      expect(app.router.currentRoute.value.path).toBe("/datasets"),
    );
  });

  it("tells a member that only admins delete datasets", async () => {
    const app = await openDetail(dataset("READY"));
    app.http.on("DELETE", datasetPath, apiError("NotAuthorized", 403), 403);
    const typist = userEvent.setup();

    await typist.click(screen.getByRole("button", { name: "Delete" }));
    await typist.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(
      await screen.findByText("Only organization admins can delete datasets"),
    ).toBeInTheDocument();
  });

  it("runs an experiment on a READY dataset, preselecting it", async () => {
    const app = await openDetail(dataset("READY"));

    await userEvent.click(
      screen.getByRole("button", { name: "Run Experiment" }),
    );

    await waitFor(() =>
      expect(app.router.currentRoute.value.fullPath).toBe(
        "/experiments/add?dataset=ds-1",
      ),
    );
  });

  it("does not offer an experiment before the dataset is READY", async () => {
    await openDetail(dataset("BUILDING"));

    expect(
      screen.queryByRole("button", { name: "Run Experiment" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel build" }),
    ).toBeInTheDocument();
  });
});
