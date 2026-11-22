import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { beforeAll, describe, expect, it } from "vitest";

import {
  createTestApp,
  org,
  type TestApp,
  withToaster,
} from "../../../../tests/real-app";

import DatasetCreate from "./DatasetCreate.vue";

// jsdom lacks the pointer capture calls the Select makes.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => undefined;
});

const datasetsPath = `/org/${org.id}/datasets`;

const github = {
  id: "gh-1",
  added_on: "2026-01-01T00:00:00.000Z",
  integration_type: "VCS",
  integration_provider: "GITHUB",
  invalid: false,
  service_domain: "github.com",
  added_by: "John",
};

function page(data: object[]): object {
  return {
    data,
    entry_count: data.length,
    page: 0,
    entries_per_page: 100,
    total_entries: data.length,
    total_pages: 1,
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

// Opens the new Dataset page with the integrations the API answers.
async function openForm(integrations: object[] = [github]): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}/integrations/vcs`, page(integrations));
  await app.visit("/datasets/add");
  render(withToaster(DatasetCreate), { global: app.global });
  await screen.findByRole("combobox");
  return app;
}

const created = (app: TestApp) =>
  app.http.requests.filter(
    (r) => r.method === "POST" && r.path === datasetsPath,
  );

describe("DatasetCreate", () => {
  it("offers only valid GitHub integrations and preselects a single one", async () => {
    await openForm([
      github,
      { ...github, id: "gh-2", invalid: true, added_by: "Invalid" },
      {
        ...github,
        id: "gl-1",
        integration_provider: "GITLAB",
        added_by: "Gitlab",
      },
      {
        ...github,
        id: "gh-3",
        expiry_date: "2026-10-29T16:33:12Z",
        added_by: "Expired",
      },
    ]);

    const select = screen.getByRole("combobox");
    await waitFor(() =>
      expect(select).toHaveTextContent("github.com (added by John)"),
    );
    await userEvent.click(select);
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      "github.com (added by John)",
    ]);
  });

  it("links to the integrations page when there is no valid GitHub integration", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", `/org/${org.id}/integrations/vcs`, page([]));
    await app.visit("/datasets/add");
    render(DatasetCreate, { global: app.global });

    expect(
      await screen.findByRole("link", { name: "Add one" }),
    ).toHaveAttribute("href", `/orgs/manage/integrations/${org.id}/`);
  });

  it("shows the validation errors and does not submit an invalid form", async () => {
    const app = await openForm();
    const typist = userEvent.setup();
    await typist.clear(screen.getByLabelText("Repositories"));
    await typist.type(screen.getByLabelText("Repositories"), "0");

    await typist.click(screen.getByRole("button", { name: "Build Dataset" }));

    expect(screen.getByText("A name is required")).toBeInTheDocument();
    expect(
      screen.getByText("A whole number between 1 and 500"),
    ).toBeInTheDocument();
    expect(created(app)).toHaveLength(0);
  });

  it("requires at least one language", async () => {
    const app = await openForm();
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");
    await typist.click(screen.getByRole("checkbox", { name: "JavaScript" }));
    await typist.click(screen.getByRole("checkbox", { name: "TypeScript" }));

    await typist.click(screen.getByRole("button", { name: "Build Dataset" }));

    expect(screen.getByText("Pick at least one language")).toBeInTheDocument();
    expect(created(app)).toHaveLength(0);
  });

  it("creates the dataset and opens it", async () => {
    const app = await openForm();
    app.http.on("POST", datasetsPath, { id: "ds-1" }, 201);
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "  top50 ");
    await typist.clear(screen.getByLabelText("Repositories"));
    await typist.type(screen.getByLabelText("Repositories"), "50");
    await typist.clear(screen.getByLabelText("Search pages per language"));
    await typist.type(screen.getByLabelText("Search pages per language"), "2");
    await typist.click(screen.getByRole("checkbox", { name: "TypeScript" }));

    await typist.click(screen.getByRole("button", { name: "Build Dataset" }));

    expect(
      await screen.findByText("Dataset created, building in the background"),
    ).toBeInTheDocument();
    expect(created(app)[0]!.body).toEqual({
      name: "top50",
      integration_id: "gh-1",
      limit: 50,
      pages: 2,
      min_stars: 1000,
      languages: ["JavaScript"],
    });
    await waitFor(() =>
      expect(app.router.currentRoute.value.fullPath).toBe(
        "/datasets/detail?id=ds-1",
      ),
    );
  });

  it("explains a duplicate name", async () => {
    const app = await openForm();
    app.http.on("POST", datasetsPath, apiError("AlreadyExists"), 409);
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");

    await typist.click(screen.getByRole("button", { name: "Build Dataset" }));

    expect(
      await screen.findByText("A dataset with this name already exists"),
    ).toBeInTheDocument();
    expect(app.router.currentRoute.value.fullPath).toBe("/datasets/add");
  });

  it("tells a member that only admins create datasets", async () => {
    const app = await openForm();
    app.http.on("POST", datasetsPath, apiError("NotAuthorized"), 403);
    const typist = userEvent.setup();
    await typist.type(screen.getByLabelText("Name"), "top100");

    await typist.click(screen.getByRole("button", { name: "Build Dataset" }));

    expect(
      await screen.findByText("Only organization admins can create datasets"),
    ).toBeInTheDocument();
  });
});
