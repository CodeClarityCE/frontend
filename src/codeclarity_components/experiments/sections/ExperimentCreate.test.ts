import userEvent, { type UserEvent } from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  createTestApp,
  org,
  type TestApp,
  withToaster,
} from "../../../../tests/real-app";

import ExperimentCreate from "./ExperimentCreate.vue";

// jsdom lacks the pointer capture calls the Select makes.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => undefined;
});

const experimentsPath = `/org/${org.id}/experiments`;
const datasetsPath = `/org/${org.id}/datasets`;

function dataset(id: string, status: string): object {
  return {
    id,
    name: `dataset ${id}`,
    status,
    params: {
      languages: ["JavaScript"],
      pages: 1,
      min_stars: 0,
      limit: 3,
      lockfiles: [],
    },
    stats: null,
    error: null,
    entry_count: 3,
    integration_id: "gh-1",
    created_by_name: null,
    created_on: "2026-10-30T10:00:00.000Z",
    built_on: null,
  };
}

function analyzer(id: string, plugins: string[][]): object {
  return {
    id,
    name: `analyzer ${id}`,
    description: "",
    created_on: "2026-10-30T10:00:00.000Z",
    steps: plugins.map((stage) =>
      stage.map((name) => ({ name, version: "v1", config: {} })),
    ),
  };
}

function page(data: object[], total_pages = 1, pageIndex = 0): object {
  return {
    data,
    entry_count: data.length,
    page: pageIndex,
    entries_per_page: 100,
    total_entries: data.length,
    total_pages,
    status: "success",
    matching_count: data.length,
    filter_count: {},
  };
}

const apiError = (error_code: string): object => ({
  status_code: 409,
  status: "failure",
  error_code,
  error_message: error_code,
});

interface FormOptions {
  // The dataset the page was opened from (?dataset=).
  from?: string;
  probesPerEntryInterval?: number | null;
}

// Opens the new Experiment page with datasets, analyzers and the estimate basis answered.
async function openForm(options: FormOptions = {}): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on(
    "GET",
    datasetsPath,
    page([
      dataset("ds-1", "READY"),
      dataset("ds-2", "BUILDING"),
      dataset("ds-3", "FAILED"),
      dataset("ds-4", "READY"),
    ]),
  );
  app.http.on(
    "GET",
    `/org/${org.id}/analyzers`,
    page([
      analyzer("an-js", [["js-sbom"], ["vuln-finder", "license-finder"]]),
      analyzer("an-sbom-only", [["js-sbom"]]),
      analyzer("an-other", [["license-finder"]]),
    ]),
  );
  const probes = options.probesPerEntryInterval;
  if (probes !== null) {
    app.http.on("GET", `${experimentsPath}/estimate`, {
      data: { probes_per_entry_interval: probes ?? 2 },
    });
  }
  app.http.on("POST", experimentsPath, { id: "exp-1" }, 201);
  const query = options.from ? `?dataset=${options.from}` : "";
  await app.visit(`/experiments/add${query}`);
  render(withToaster(ExperimentCreate), { global: app.global });
  await flushPromises();
  return app;
}

// Opens a Select by its label and returns the names of its options.
async function optionsOf(typist: UserEvent, label: string): Promise<string[]> {
  await typist.click(screen.getByRole("combobox", { name: label }));
  const options = await screen.findAllByRole("option");
  const names = options.map((option) => option.textContent?.trim() ?? "");
  await typist.keyboard("{Escape}");
  return names;
}

// Picks an option of a Select by its label.
async function choose(
  typist: UserEvent,
  label: string,
  option: string,
): Promise<void> {
  await typist.click(screen.getByRole("combobox", { name: label }));
  await typist.click(await screen.findByRole("option", { name: option }));
}

async function retype(
  typist: UserEvent,
  label: string,
  value: string,
): Promise<void> {
  await typist.clear(screen.getByLabelText(label));
  if (value) await typist.type(screen.getByLabelText(label), value);
}

async function submit(typist: UserEvent): Promise<void> {
  await typist.click(screen.getByRole("button", { name: "Start Experiment" }));
  await flushPromises();
}

const createdBodies = (app: TestApp) =>
  app.http.requests
    .filter((r) => r.method === "POST" && r.path === experimentsPath)
    .map((r) => r.body as Record<string, unknown>);

const estimate = () => screen.queryByTestId("experiment-estimate");

describe("ExperimentCreate", () => {
  it("offers only READY datasets and analyzers that run js-sbom and vuln-finder", async () => {
    await openForm();
    const typist = userEvent.setup();

    expect(await optionsOf(typist, "Dataset")).toEqual([
      "dataset ds-1 (3 repositories)",
      "dataset ds-4 (3 repositories)",
    ]);
    // A single eligible analyzer is preselected
    expect(
      screen.getByRole("combobox", { name: "Analyzer" }),
    ).toHaveTextContent("analyzer an-js");
    expect(await optionsOf(typist, "Analyzer")).toEqual(["analyzer an-js"]);
  });

  it("defaults the grid to monthly x 24 and estimates entries x grid dates plus HEAD", async () => {
    await openForm();
    const typist = userEvent.setup();

    expect(
      screen.getByRole("combobox", { name: "Grid interval" }),
    ).toHaveTextContent("Monthly");
    expect(screen.getByLabelText("Grid dates before HEAD")).toHaveValue(24);
    expect(estimate()).not.toBeInTheDocument();

    await choose(typist, "Dataset", "dataset ds-1 (3 repositories)");
    expect(estimate()).toHaveTextContent("75 snapshots");

    await retype(typist, "Grid dates before HEAD", "2");
    expect(estimate()).toHaveTextContent("9 snapshots");

    await retype(typist, "Grid dates before HEAD", "0");
    expect(estimate()).toHaveTextContent("3 snapshots");
  });

  it("estimates fix probes per repository per grid interval as the API says", async () => {
    await openForm({ from: "ds-1", probesPerEntryInterval: 3 });

    // 3 repositories: 75 snapshots and 3 x 24 x 3 probes
    expect(estimate()).toHaveTextContent(
      "Estimated 291 analyses: 75 snapshots (25 grid dates including HEAD) and about 216 fix probes",
    );
  });

  it("still estimates the snapshots when the probe estimate cannot be loaded", async () => {
    await openForm({ from: "ds-1", probesPerEntryInterval: null });

    expect(estimate()).toHaveTextContent(
      "Estimated at least 75 analyses: 75 snapshots (25 grid dates including HEAD) and fix probes not estimated",
    );
  });

  it("adds about two fix probes per repository per grid interval to the estimate", async () => {
    await openForm({ from: "ds-1" });
    const typist = userEvent.setup();

    // 3 repositories: 75 snapshots and 3 x 24 x 2 probes
    expect(estimate()).toHaveTextContent(
      "Estimated 219 analyses: 75 snapshots (25 grid dates including HEAD) and about 144 fix probes",
    );

    await retype(typist, "Grid dates before HEAD", "0");
    expect(estimate()).toHaveTextContent(
      "Estimated 3 analyses: 3 snapshots (1 grid date including HEAD) and no fix probes",
    );
  });

  it("has no analysis budget by default and does not send one", async () => {
    const app = await openForm({ from: "ds-1" });
    const typist = userEvent.setup();
    expect(screen.getByLabelText("Analysis budget (optional)")).toHaveValue(
      null,
    );
    await typist.type(screen.getByLabelText("Name"), "top100");

    await submit(typist);

    expect(createdBodies(app)[0]).not.toHaveProperty("analysis_budget");
  });

  it("sends the analysis budget and says what it caps", async () => {
    const app = await openForm({ from: "ds-1" });
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");
    await typist.type(
      screen.getByLabelText("Analysis budget (optional)"),
      "100",
    );

    expect(screen.getByTestId("experiment-budget-note")).toHaveTextContent(
      "Fix probes stop once 100 analyses are submitted",
    );

    await submit(typist);

    expect(createdBodies(app)[0]).toMatchObject({ analysis_budget: 100 });
  });

  it("warns when the budget does not cover the snapshots, which still all run", async () => {
    await openForm({ from: "ds-1" });

    await userEvent.type(
      screen.getByLabelText("Analysis budget (optional)"),
      "50",
    );

    expect(screen.getByTestId("experiment-budget-note")).toHaveTextContent(
      "below the 75 snapshots: every snapshot still runs and no fix probe will",
    );
  });

  it("rejects a budget that is not a whole number of at least 1", async () => {
    const app = await openForm({ from: "ds-1" });
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");
    await typist.type(screen.getByLabelText("Analysis budget (optional)"), "0");

    await submit(typist);

    expect(createdBodies(app)).toHaveLength(0);
    expect(
      screen.getByText(
        "Leave empty for no budget, or a whole number of at least 1",
      ),
    ).toBeInTheDocument();
  });

  it("rejects a grid count outside 0 to 120", async () => {
    const app = await openForm({ from: "ds-1" });
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");
    await retype(typist, "Grid dates before HEAD", "121");

    await submit(typist);

    expect(createdBodies(app)).toHaveLength(0);
    expect(
      screen.getByText("A whole number between 0 and 120"),
    ).toBeInTheDocument();
    expect(estimate()).not.toBeInTheDocument();
  });

  it("preselects the dataset it was opened from", async () => {
    const app = await openForm({ from: "ds-4" });
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");

    await submit(typist);

    expect(createdBodies(app)[0]).toMatchObject({ dataset_id: "ds-4" });
  });

  it("offers the READY datasets of every page, and preselects one past the first", async () => {
    const app = createTestApp({ signedIn: true });
    const firstPage = Array.from({ length: 100 }, (_, i) =>
      dataset(`ds-p0-${i}`, "BUILDING"),
    );
    // Answers each page of datasets by its page number.
    const fake = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      async (input: string | URL, init?: RequestInit): Promise<Response> => {
        const response = await fake(input, init);
        const url = new URL(String(input));
        if (!url.pathname.endsWith(datasetsPath)) return response;
        const index = Number(url.searchParams.get("page"));
        const body =
          index === 0
            ? page(firstPage, 2, 0)
            : page([dataset("ds-late", "READY")], 2, 1);
        return new Response(JSON.stringify(body), {
          headers: { "Content-Type": "application/json" },
        });
      },
    );
    app.http.on(
      "GET",
      `/org/${org.id}/analyzers`,
      page([analyzer("an-js", [["js-sbom", "vuln-finder"]])]),
    );
    app.http.on("POST", experimentsPath, { id: "exp-1" }, 201);
    await app.visit("/experiments/add?dataset=ds-late");
    render(ExperimentCreate, { global: app.global });
    await flushPromises();
    const typist = userEvent.setup();

    expect(await optionsOf(typist, "Dataset")).toEqual([
      "dataset ds-late (3 repositories)",
    ]);
    await typist.type(screen.getByLabelText("Name"), "top100");
    await submit(typist);

    expect(createdBodies(app)[0]).toMatchObject({ dataset_id: "ds-late" });
  });

  it("ignores a preselected dataset that is not ready", async () => {
    const app = await openForm({ from: "ds-2" });
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");

    await submit(typist);

    expect(createdBodies(app)).toHaveLength(0);
    expect(screen.getByText("Pick a ready dataset")).toBeInTheDocument();
  });

  it("shows the validation errors and does not submit an invalid form", async () => {
    const app = await openForm();
    const typist = userEvent.setup();
    await retype(typist, "Retries per failed run", "11");

    await submit(typist);

    expect(createdBodies(app)).toHaveLength(0);
    expect(screen.getByText("A name is required")).toBeInTheDocument();
    expect(screen.getByText("Pick a ready dataset")).toBeInTheDocument();
    expect(
      screen.getByText("A whole number between 0 and 10"),
    ).toBeInTheDocument();
  });

  it("creates the experiment and opens it", async () => {
    const app = await openForm({ from: "ds-1" });
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "  top100 head ");
    await retype(typist, "Retries per failed run", "1");
    await choose(typist, "Grid interval", "Weekly");
    await retype(typist, "Grid dates before HEAD", "12");

    await submit(typist);

    expect(await screen.findByText("Experiment created")).toBeInTheDocument();
    expect(createdBodies(app)).toEqual([
      {
        name: "top100 head",
        dataset_id: "ds-1",
        analyzer_id: "an-js",
        retries: 1,
        grid_interval: "week",
        grid_count: 12,
      },
    ]);
    await waitFor(() =>
      expect(app.router.currentRoute.value.fullPath).toBe(
        "/experiments/detail?id=exp-1",
      ),
    );
  });

  it.each([
    ["AlreadyExists", "An experiment with this name already exists"],
    ["DatasetNotReady", "The dataset is not ready"],
    [
      "AnalyzerMissingRequiredPlugins",
      "The analyzer must run js-sbom and vuln-finder",
    ],
    ["NotAuthorized", "Only organization admins can create experiments"],
  ])("explains a %s rejection", async (code, message) => {
    const app = await openForm({ from: "ds-1" });
    app.http.on("POST", experimentsPath, apiError(code), 409);
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");

    await submit(typist);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(app.router.currentRoute.value.path).toBe("/experiments/add");
  });
});
