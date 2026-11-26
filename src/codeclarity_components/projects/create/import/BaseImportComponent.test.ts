import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import {
  type GetRepositoriesRequestOptions,
  IntegrationsRepository,
} from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";

import {
  createTestApp,
  org,
  type TestApp,
  withToaster,
} from "../../../../../tests/real-app";

import BaseImportComponent, {
  IMPORT_CONCURRENCY,
  stripGitSuffix,
} from "./BaseImportComponent.vue";

const reposPath = `/org/${org.id}/integrations/github/gh-1/repositories`;
const projectsPath = `/org/${org.id}/projects`;

function repo(index: number) {
  return {
    id: `repo-${index}`,
    url: `https://github.com/org/repo-${index}`,
    default_branch: "main",
    visibility: "public",
    fully_qualified_name: `org/repo-${index}`,
    description: "",
    created_at: "2026-01-01T00:00:00.000Z",
    imported_already: false,
    integration_id: "gh-1",
  };
}

const repos = Array.from({ length: 10 }, (_, i) => repo(i));

const reposPage = {
  data: repos,
  entry_count: repos.length,
  page: 0,
  entries_per_page: 100,
  total_entries: repos.length,
  total_pages: 1,
  status: "success",
  matching_count: repos.length,
  filter_count: {},
};

// The GitHub importer's own request for the repositories.
const getRepos = (options: GetRepositoriesRequestOptions) =>
  new IntegrationsRepository().getGithubRepositories(options);

// Holds every project import the page sends until the test releases it.
interface HeldImports {
  sent: string[];
  releaseNext: () => void;
  releaseAll: () => void;
}

function holdImports(): HeldImports {
  const fake = globalThis.fetch;
  const waiting: (() => void)[] = [];
  const sent: string[] = [];
  let holding = true;
  vi.stubGlobal("fetch", (input: string, init: RequestInit = {}) => {
    const isImport =
      init.method === "POST" &&
      new URL(String(input)).pathname.endsWith(projectsPath);
    if (!isImport) return fake(input, init);
    sent.push((JSON.parse(init.body as string) as { url: string }).url);
    if (!holding) return fake(input, init);
    return new Promise<Response>((resolve) =>
      waiting.push(() => resolve(fake(input, init))),
    );
  });
  return {
    sent,
    releaseNext: () => waiting.shift()?.(),
    releaseAll: () => {
      holding = false;
      waiting.splice(0).forEach((release) => release());
    },
  };
}

// The GitHub import page with every repository listed and the toaster shown.
async function openImporter(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", reposPath, reposPage);
  app.http.on("POST", projectsPath, { id: "project" }, 201);
  await app.visit("/projects/add");
  render(withToaster(BaseImportComponent, { integration: "gh-1", getRepos }), {
    global: app.global,
  });
  await screen.findByText("org/repo-9");
  return app;
}

async function selectEveryRepository(): Promise<void> {
  await userEvent.click(
    screen.getByRole("checkbox", {
      name: "Select every repository not imported yet",
    }),
  );
}

const importButton = (): HTMLElement =>
  screen.getByTestId("bulk-import-button");

describe("BaseImportComponent bulk import", () => {
  it("imports a bounded number of repositories at a time and reports progress", async () => {
    const app = await openImporter();
    const held = holdImports();
    await selectEveryRepository();

    expect(importButton().textContent).toContain("Import 10 Projects");
    await userEvent.click(importButton());

    await vi.waitFor(() => expect(held.sent).toHaveLength(IMPORT_CONCURRENCY));
    expect(importButton()).toBeDisabled();
    expect(screen.getByTestId("import-progress").textContent).toContain(
      "Importing 0 / 10",
    );

    held.releaseNext();
    await vi.waitFor(() =>
      expect(held.sent).toHaveLength(IMPORT_CONCURRENCY + 1),
    );
    const progress = within(screen.getByTestId("import-progress"));
    expect(progress.getByText(/Importing 1 \/\s+10/)).toBeInTheDocument();
    expect(progress.getByText("10%")).toBeInTheDocument();

    held.releaseAll();
    expect(
      await screen.findByText("Successfully imported 10 repositories"),
    ).toBeInTheDocument();
    expect(held.sent).toHaveLength(10);
    expect(held.sent).toContain("https://github.com/org/repo-7");
    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.fullPath).toBe("/projects"),
    );
    expect(screen.queryByTestId("import-progress")).toBeNull();
  });

  it("freezes the table and keeps the progress visible for the whole import", async () => {
    await openImporter();
    const held = holdImports();
    await selectEveryRepository();
    const checkbox = screen.getByRole("checkbox", {
      name: "Select org/repo-3",
    });
    expect(checkbox).toBeEnabled();

    await userEvent.click(importButton());
    await vi.waitFor(() => expect(checkbox).toBeDisabled());
    expect(screen.getByTestId("import-progress")).toBeInTheDocument();

    held.releaseAll();
    await screen.findByText("Successfully imported 10 repositories");
  });

  it("keeps the page open and lists failures when some imports fail", async () => {
    const app = await openImporter();
    const fake = globalThis.fetch;
    // The API refuses the repository that is already a project.
    vi.stubGlobal("fetch", (input: string, init: RequestInit = {}) => {
      if ((init.body as string).includes('/repo-2"')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status_code: 409,
              error_code: "AlreadyExists",
              error_message: "exists",
            }),
            { status: 409 },
          ),
        );
      }
      return fake(input, init);
    });
    await selectEveryRepository();

    await userEvent.click(importButton());

    expect(
      await screen.findByText("Successfully imported 9 repositories"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Failed to import 1 repositories"),
    ).toBeInTheDocument();
    const failures = await screen.findByRole("table", {
      name: "Failed imports",
    });
    const row = within(failures).getByText("org/repo-2").closest("tr")!;
    expect(within(row).getByText("Already imported")).toBeInTheDocument();
    expect(app.router.currentRoute.value.fullPath).toBe("/projects/add");
  });

  it("ignores a second click while an import is running", async () => {
    await openImporter();
    const held = holdImports();
    await selectEveryRepository();

    await userEvent.click(importButton());
    await vi.waitFor(() => expect(held.sent).toHaveLength(IMPORT_CONCURRENCY));
    await userEvent.click(importButton());

    expect(held.sent).toHaveLength(IMPORT_CONCURRENCY);
    held.releaseAll();
    await screen.findByText("Successfully imported 10 repositories");
    expect(held.sent).toHaveLength(10);
  });
});

describe("BaseImportComponent manual import", () => {
  it("imports the typed url without its trailing .git", async () => {
    const app = await openImporter();

    await userEvent.type(
      screen.getByLabelText("Repository URL"),
      "https://github.com/octo/octo.github.io.git",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Import repository" }),
    );

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.fullPath).toBe("/projects"),
    );
    const imports = app.http.requests.filter(
      (r) => r.method === "POST" && r.path === projectsPath,
    );
    expect(imports.map((r) => r.body)).toEqual([
      { integration_id: "gh-1", url: "https://github.com/octo/octo.github.io" },
    ]);
  });
});

describe("BaseImportComponent import from a refused address", () => {
  const gitlabReposPath = `/org/${org.id}/integrations/gitlab/gl-1/repositories`;

  it.each([
    [
      "IntegrationInstanceUrlNotAllowed",
      "This GitLab is on a private network or uses http. Ask your CodeClarity operator to allow its host (GITLAB_ALLOWED_PRIVATE_HOSTS).",
    ],
    [
      "IntegrationInstanceUnreachable",
      "The GitLab host name could not be resolved. Check the instance URL.",
    ],
    [
      "ImportTargetNotAllowed",
      "The repository URL points at an internal or reserved address.",
    ],
  ])("explains %s", async (code, message) => {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", gitlabReposPath, { ...reposPage, data: [] });
    app.http.on(
      "POST",
      projectsPath,
      { status_code: 400, error_code: code, error_message: code },
      400,
    );
    await app.visit("/projects/add");
    render(
      withToaster(BaseImportComponent, {
        integration: "gl-1",
        getRepos: (options: GetRepositoriesRequestOptions) =>
          new IntegrationsRepository().getGitlabRepositories(options),
      }),
      { global: app.global },
    );

    await userEvent.type(
      await screen.findByLabelText("Repository URL"),
      "https://gitlab.internal/group/project",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Import repository" }),
    );

    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});

describe("BaseImportComponent manual import validation", () => {
  const submit = (): Promise<void> =>
    userEvent.click(screen.getByRole("button", { name: "Import repository" }));

  it("asks for a URL when the field is untouched or blank", async () => {
    await openImporter();

    await submit();
    expect(
      await screen.findByText("A repository URL is required"),
    ).toBeVisible();

    await userEvent.type(screen.getByLabelText("Repository URL"), "   ");
    await submit();
    expect(
      await screen.findByText("A repository URL is required"),
    ).toBeVisible();
  });

  it("asks for a full URL and sends nothing", async () => {
    const app = await openImporter();

    await userEvent.type(
      screen.getByLabelText("Repository URL"),
      "github.com/octo/octo",
    );
    await submit();

    expect(
      await screen.findByText(
        "Enter the full URL, like https://github.com/owner/repository",
      ),
    ).toBeVisible();
    expect(
      app.http.requests.filter(
        (r) => r.method === "POST" && r.path === projectsPath,
      ),
    ).toEqual([]);
  });

  it("rejects a URL over 150 characters", async () => {
    await openImporter();

    await userEvent.click(screen.getByLabelText("Repository URL"));
    await userEvent.paste(`https://github.com/octo/${"a".repeat(130)}`);
    await submit();

    expect(await screen.findByText("At most 150 characters")).toBeVisible();
  });
});

describe("stripGitSuffix", () => {
  it.each([
    ["https://github.com/octo/legacy.git", "https://github.com/octo/legacy"],
    ["https://github.com/octo/legacy", "https://github.com/octo/legacy"],
    [
      "https://github.com/torvalds/torvalds.github.io",
      "https://github.com/torvalds/torvalds.github.io",
    ],
    [
      "https://github.com/octo/octo.github.io.git",
      "https://github.com/octo/octo.github.io",
    ],
  ])("turns %s into %s", (url, expected) => {
    expect(stripGitSuffix(url)).toBe(expected);
  });
});
