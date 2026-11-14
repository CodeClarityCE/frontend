import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Repository } from "@/codeclarity_components/projects/project.entity";

import RepoTable, { type RepoTableConfig } from "./RepoTable.vue";

// The real helpers, so the shadcn controls follow prop changes.
vi.mock("@vueuse/core", async () => await vi.importActual("@vueuse/core"));
vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError: class extends Error {},
}));

const popularConfig: RepoTableConfig = {
  languages: [
    { key: "language_all", label: "All" },
    { key: "language_php", label: "PHP" },
  ],
};

function repository(index: number, imported = false): Repository {
  return {
    id: `repo-${index}`,
    url: `https://github.com/org/repo-${index}`,
    default_branch: "main",
    visibility: "public",
    fully_qualified_name: `org/repo-${index}`,
    description: "",
    created_at: new Date("2026-01-01"),
    imported_already: imported,
    integration_id: "gh-1",
  };
}

describe("RepoTable", () => {
  const getRepos = vi.fn();

  beforeEach(() => {
    getRepos.mockReset();
    getRepos.mockImplementation(
      ({ pagination }: { pagination: { page: number } }) =>
        Promise.resolve({
          data: [
            repository(pagination.page * 2 + 1, pagination.page === 0),
            repository(pagination.page * 2 + 2),
          ],
          total_entries: 6,
          total_pages: 3,
        }),
    );
  });

  function renderTable(
    props: { config?: RepoTableConfig; disabled?: boolean } = {},
  ): ReturnType<typeof render> {
    return render(RepoTable, {
      props: { integration: "gh-1", getRepos, ...props },
    });
  }

  function requests(): { activeFilters: string[]; page: number }[] {
    return getRepos.mock.calls.map((call) => {
      const options = call[0] as {
        activeFilters: string[];
        pagination: { page: number };
      };
      return {
        activeFilters: options.activeFilters,
        page: options.pagination.page,
      };
    });
  }

  describe("loading", () => {
    it("loads every page with the default filters and lists every repository", async () => {
      renderTable({ config: popularConfig });

      expect(await screen.findByText("org/repo-6")).toBeTruthy();
      expect(requests()).toEqual([
        { activeFilters: ["only_non_imported", "language_all"], page: 0 },
        { activeFilters: ["only_non_imported", "language_all"], page: 1 },
        { activeFilters: ["only_non_imported", "language_all"], page: 2 },
      ]);
    });

    it("asks only for the import state when the source has no languages", async () => {
      renderTable();

      await screen.findByText("org/repo-6");
      expect(requests()[0]!.activeFilters).toEqual(["only_non_imported"]);
    });

    it("says when the repositories cannot be loaded and offers a retry", async () => {
      getRepos.mockRejectedValue(new Error("boom"));
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
