import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterType } from "@/base_components/filters/filterTypes";
import type { Repository } from "@/codeclarity_components/projects/project.entity";

import RepoTable, { type RepoTableConfig } from "./RepoTable.vue";

// Mirrors the real Filters popover: it flips the options of one radio category
// in place on the filter state it is given and emits nothing.
vi.mock("@/base_components/filters/UtilitiesFilters.vue", async () => {
  const { getActiveState } = await vi.importActual<
    typeof import("@/base_components/filters/filterTypes")
  >("@/base_components/filters/filterTypes");
  return {
    default: {
      name: "UtilitiesFilters",
      props: ["filterState"],
      setup(props: {
        filterState: import("@/base_components/filters/filterTypes").FilterState;
      }) {
        function pick(category: string, option: string): void {
          const options = props.filterState.filterConfig[category]!.data;
          for (const key of Object.keys(options)) {
            options[key]!.value = key === option;
          }
          props.filterState.activeFilters = getActiveState(
            props.filterState.filterConfig,
          );
        }
        return { pick };
      },
      template: `
        <div>
          <button data-testid="pick-php" @click="pick('Language', 'language_php')" />
          <button data-testid="pick-both" @click="pick('ImportState', 'imported_and_non_imported')" />
        </div>`,
    },
  };
});

vi.mock("@/base_components/filters/ActiveFilterBar.vue", () => ({
  default: {
    name: "ActiveFilterBar",
    props: ["filterState"],
    template: "<div />",
  },
}));

vi.mock("@/base_components/filters/SearchBar.vue", () => ({
  default: {
    name: "SearchBar",
    props: ["searchKey", "placeholder"],
    template: "<div />",
  },
}));

vi.mock("@/base_components/utilities/PaginationComponent.vue", () => ({
  default: {
    name: "PaginationComponent",
    props: ["page", "nmbEntriesShowing", "nmbEntriesTotal", "totalPages"],
    emits: ["update:page"],
    template: `
      <div>
        <button data-testid="go-to-page-2" @click="$emit('update:page', 2)" />
        <slot name="content" />
      </div>`,
  },
}));

vi.mock("@/base_components/data-display/tables/SortableTable.vue", () => ({
  default: {
    name: "SortableTable",
    props: ["headers", "sortKey", "sortDirection"],
    template: '<table><tbody><slot name="data" /></tbody></table>',
  },
}));

vi.mock("@/base_components/ui/loaders/BoxLoader.vue", () => ({
  default: { name: "BoxLoader", props: ["dimensions"], template: "<div />" },
}));

vi.mock("@/shadcn/ui/badge", () => ({
  Badge: { name: "Badge", template: "<span><slot /></span>" },
}));

vi.mock("@/shadcn/ui/button/Button.vue", () => ({
  default: {
    name: "Button",
    props: ["variant", "size", "disabled"],
    emits: ["click"],
    template:
      '<button :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
  },
}));

const popularConfig: RepoTableConfig = {
  extraFilters: {
    Language: {
      name: "Language",
      type: FilterType.RADIO,
      data: {
        language_all: { title: "All", value: true },
        language_php: { title: "PHP", value: false },
      },
    },
  },
};

function repository(index: number): Repository {
  return {
    id: `repo-${index}`,
    url: `https://github.com/org/repo-${index}`,
    default_branch: "main",
    visibility: "public",
    fully_qualified_name: `org/repo-${index}`,
    description: "",
    created_at: new Date("2026-01-01"),
    imported_already: false,
    integration_id: "gh-1",
  };
}

describe("RepoTable", () => {
  const getRepos = vi.fn();

  beforeEach(() => {
    getRepos.mockReset();
    getRepos.mockResolvedValue({
      data: [repository(1), repository(2)],
      total_entries: 60,
      total_pages: 3,
    });
  });

  async function mountTable(config?: RepoTableConfig): Promise<VueWrapper> {
    const wrapper = mount(RepoTable, {
      props: { integration: "gh-1", getRepos, config },
    });
    await flushPromises();
    return wrapper;
  }

  function lastRequest(): {
    activeFilters: string[];
    pagination: { page: number };
  } {
    return getRepos.mock.lastCall![0];
  }

  describe("filters", () => {
    it("requests the default filters on mount", async () => {
      await mountTable(popularConfig);

      expect(getRepos).toHaveBeenCalledTimes(1);
      expect(lastRequest().activeFilters).toEqual([
        "only_non_imported",
        "language_all",
      ]);
    });

    it("fetches again with the language picked in the Filters popover", async () => {
      const wrapper = await mountTable(popularConfig);

      await wrapper.find('[data-testid="pick-php"]').trigger("click");
      await flushPromises();

      expect(getRepos).toHaveBeenCalledTimes(2);
      expect(lastRequest().activeFilters).toEqual([
        "only_non_imported",
        "language_php",
      ]);
    });

    it("fetches again when the import state filter changes", async () => {
      const wrapper = await mountTable();

      await wrapper.find('[data-testid="pick-both"]').trigger("click");
      await flushPromises();

      expect(getRepos).toHaveBeenCalledTimes(2);
      expect(lastRequest().activeFilters).toEqual([
        "imported_and_non_imported",
      ]);
    });

    it("returns to the first page with a single request when a filter changes", async () => {
      const wrapper = await mountTable(popularConfig);
      await wrapper.find('[data-testid="go-to-page-2"]').trigger("click");
      await flushPromises();
      expect(lastRequest().pagination.page).toBe(2);

      await wrapper.find('[data-testid="pick-php"]').trigger("click");
      await flushPromises();

      expect(getRepos).toHaveBeenCalledTimes(3);
      expect(lastRequest().pagination.page).toBe(0);
      expect(lastRequest().activeFilters).toContain("language_php");
    });
  });
});
