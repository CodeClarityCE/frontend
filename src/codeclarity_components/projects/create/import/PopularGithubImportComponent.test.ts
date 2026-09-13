import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterType } from "@/base_components/filters/filterTypes";
import { GetRepositoriesSortInterface } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";

import PopularGithubImportComponent from "./PopularGithubImportComponent.vue";

const { getPopularGithubRepositories } = vi.hoisted(() => ({
  getPopularGithubRepositories: vi.fn(),
}));

vi.mock(
  "@/codeclarity_components/organizations/integrations/IntegrationsRepository",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/codeclarity_components/organizations/integrations/IntegrationsRepository")
      >();
    return {
      ...actual,
      IntegrationsRepository: class {
        getPopularGithubRepositories = getPopularGithubRepositories;
      },
    };
  },
);

vi.mock("./BaseImportComponent.vue", () => ({
  default: {
    name: "BaseImportComponent",
    props: ["getRepos", "integration", "tableConfig"],
    template: '<div data-testid="base-import" />',
  },
}));

const baseOptions = {
  orgId: "test-org-id",
  integrationId: "gh-1",
  forceRefresh: false,
  pagination: { page: 0, entries_per_page: 100 },
  search: { searchKey: "" },
  bearerToken: "test-token",
  handleBusinessErrors: true,
  sort: { sortKey: "stars", sortDirection: "DESC" },
};

describe("PopularGithubImportComponent", () => {
  beforeEach(() => {
    getPopularGithubRepositories.mockReset();
    getPopularGithubRepositories.mockResolvedValue({
      data: [],
      total_entries: 0,
      total_pages: 0,
    });
  });

  function mountWithBase(): {
    props: Record<string, any>;
  } {
    const wrapper = mount(PopularGithubImportComponent, {
      props: { integration: "gh-1" },
    });
    const base = wrapper.findComponent({ name: "BaseImportComponent" });
    expect(base.exists()).toBe(true);
    return { props: base.props() };
  }

  it("renders the base importer with the integration and a stars-first, single-page table", () => {
    const { props } = mountWithBase();

    expect(props.integration).toBe("gh-1");
    expect(props.tableConfig).toMatchObject({
      defaultSortKey: GetRepositoriesSortInterface.STARS,
      defaultEntriesPerPage: 100,
      showStars: true,
    });
    const language = props.tableConfig.extraFilters.Language;
    expect(language.type).toBe(FilterType.RADIO);
    expect(Object.keys(language.data)).toEqual([
      "language_all",
      "language_javascript",
      "language_typescript",
      "language_php",
    ]);
    expect(language.data.language_all.value).toBe(true);
  });

  it("turns a selected language filter into the languages parameter and strips it from the filters", async () => {
    const { props } = mountWithBase();

    await props.getRepos({
      ...baseOptions,
      activeFilters: ["only_non_imported", "language_php"],
    });

    expect(getPopularGithubRepositories).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "test-org-id",
        integrationId: "gh-1",
        languages: ["PHP"],
        activeFilters: ["only_non_imported"],
        bearerToken: "test-token",
      }),
    );
  });

  it("requests every language when the 'all' option is active", async () => {
    const { props } = mountWithBase();

    await props.getRepos({
      ...baseOptions,
      activeFilters: ["imported_and_non_imported", "language_all"],
    });

    expect(getPopularGithubRepositories).toHaveBeenCalledWith(
      expect.objectContaining({
        languages: [],
        activeFilters: ["imported_and_non_imported"],
      }),
    );
  });
});
