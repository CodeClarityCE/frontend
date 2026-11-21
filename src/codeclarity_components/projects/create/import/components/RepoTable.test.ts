import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type GetRepositoriesRequestOptions,
  IntegrationsRepository,
} from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import type { Repository } from "@/codeclarity_components/projects/project.entity";

import {
  createTestApp,
  org,
  type TestApp,
} from "../../../../../../tests/real-app";

import RepoTable, { type RepoTableConfig } from "./RepoTable.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const reposPath = `/org/${org.id}/integrations/github/gh-1/repositories`;

// The GitHub importer's own request for the repositories.
const getRepos = (options: GetRepositoriesRequestOptions) =>
  new IntegrationsRepository().getGithubRepositories(options);

const popularConfig: RepoTableConfig = {
  languages: [
    { key: "language_all", label: "All" },
    { key: "language_php", label: "PHP" },
  ],
};

function repository(index: number, imported = false) {
  return {
    id: `repo-${index}`,
    url: `https://github.com/org/repo-${index}`,
    default_branch: "main",
    visibility: "public",
    fully_qualified_name: `org/repo-${index}`,
    description: "",
    created_at: "2026-01-01T00:00:00.000Z",
    imported_already: imported,
    integration_id: "gh-1",
  };
}

// Page `page` of three, two repositories each; the very first is imported already.
function reposPage(page: number) {
  return {
    data: [repository(page * 2 + 1, page === 0), repository(page * 2 + 2)],
    entry_count: 2,
    page,
    entries_per_page: 100,
    total_entries: 6,
    total_pages: 3,
    status: "success",
    matching_count: 6,
    filter_count: {},
  };
}

describe("RepoTable", () => {
  let app: TestApp;

  beforeEach(async () => {
    app = createTestApp({ signedIn: true });
    // Answers each request with the page it asks for.
    const fake = globalThis.fetch;
    vi.stubGlobal("fetch", (input: string, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith(reposPath)) {
        app.http.on(
          "GET",
          reposPath,
          reposPage(Number(url.searchParams.get("page"))),
        );
      }
      return fake(input, init);
    });
    await app.visit("/projects/add");
  });

  function renderTable(
    props: { config?: RepoTableConfig; disabled?: boolean } = {},
  ): ReturnType<typeof render> {
    return render(RepoTable, {
      props: { integration: "gh-1", getRepos, ...props },
      global: app.global,
    });
  }

  function requests(): { activeFilters: string | null; page: number }[] {
    return app.http.requests
      .filter((r) => r.path === reposPath)
      .map((r) => ({
        activeFilters: r.query.get("active_filters"),
        page: Number(r.query.get("page")),
      }));
  }

  describe("loading", () => {
    it("loads every page with the default filters and lists every repository", async () => {
      renderTable({ config: popularConfig });

      expect(await screen.findByText("org/repo-6")).toBeTruthy();
      expect(requests()).toEqual([
        { activeFilters: "[only_non_imported,language_all]", page: 0 },
        { activeFilters: "[only_non_imported,language_all]", page: 1 },
        { activeFilters: "[only_non_imported,language_all]", page: 2 },
      ]);
    });

    it("asks only for the import state when the source has no languages", async () => {
      renderTable();

      await screen.findByText("org/repo-6");
      expect(requests()[0]!.activeFilters).toBe("[only_non_imported]");
    });

    it("says when the repositories cannot be loaded and offers a retry", async () => {
      vi.stubGlobal("fetch", async () => new Response(null, { status: 500 }));
      renderTable();

      expect(
        await screen.findByText(/could not be loaded from the integration/),
      ).toBeTruthy();
      expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    });
  });

  describe("selection", () => {
    it("selects every repository not imported yet with one checkbox", async () => {
      const { emitted } = renderTable();
      await screen.findByText("org/repo-6");

      await fireEvent.click(
        screen.getByRole("checkbox", {
          name: "Select every repository not imported yet",
        }),
      );

      const selections = emitted<Repository[][]>("onSelectedReposChange");
      expect(selections.at(-1)![0]!.map((repo) => repo.id)).toEqual([
        "repo-2",
        "repo-3",
        "repo-4",
        "repo-5",
        "repo-6",
      ]);
      expect(screen.getByText(/5\s+repositories\s+selected/)).toBeTruthy();
    });

    it("keeps an imported repository out of reach", async () => {
      renderTable();
      await screen.findByText("org/repo-6");

      const imported = screen.getByRole("checkbox", {
        name: "Select org/repo-1",
      });
      expect(imported.hasAttribute("disabled")).toBe(true);
    });

    it("freezes the selection controls while disabled", async () => {
      const { emitted, rerender } = renderTable();
      await screen.findByText("org/repo-6");

      await fireEvent.click(
        screen.getByRole("checkbox", { name: "Select org/repo-2" }),
      );
      expect(emitted("onSelectedReposChange")).toHaveLength(1);

      await rerender({ disabled: true });

      await waitFor(() => {
        for (const checkbox of screen.getAllByRole("checkbox")) {
          expect(checkbox.hasAttribute("disabled")).toBe(true);
        }
      });
      await fireEvent.click(
        screen.getByRole("checkbox", { name: "Select org/repo-3" }),
      );
      expect(emitted("onSelectedReposChange")).toHaveLength(1);
    });
  });
});
