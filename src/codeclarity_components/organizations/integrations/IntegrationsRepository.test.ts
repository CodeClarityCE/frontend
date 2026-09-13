import { describe, expect, it, vi } from "vitest";

import { IntegrationsRepository } from "./IntegrationsRepository";

vi.mock("@/utils/api/BaseEntity", () => ({
  Entity: { unMarshal: vi.fn((plain: unknown) => plain) },
}));

describe("IntegrationsRepository.getPopularGithubRepositories", () => {
  it("calls the popular endpoint with the language selection and the usual list parameters", async () => {
    // BaseRepository is mocked globally; its request helpers are vi.fn instances.
    const repository = new IntegrationsRepository() as unknown as {
      buildUrl: ReturnType<typeof vi.fn>;
      getRequest: ReturnType<typeof vi.fn>;
      getPopularGithubRepositories: IntegrationsRepository["getPopularGithubRepositories"];
    };
    repository.buildUrl.mockImplementation(
      (url: string) => `https://api${url}`,
    );
    const page = { data: [], total_entries: 0, total_pages: 0 };
    repository.getRequest.mockResolvedValue(page);

    const result = await repository.getPopularGithubRepositories({
      orgId: "org-1",
      integrationId: "gh-1",
      forceRefresh: true,
      activeFilters: ["only_non_imported"],
      languages: ["TypeScript", "PHP"],
      pagination: { page: 0, entries_per_page: 100 },
      search: { searchKey: "vue" },
      bearerToken: "token",
      handleBusinessErrors: true,
      sort: { sortKey: "stars", sortDirection: "DESC" },
    });

    expect(result).toBe(page);
    expect(repository.getRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api/org/org-1/integrations/github/gh-1/repositories/popular",
        bearerToken: "token",
        handleBusinessErrors: true,
        queryParams: {
          page: 0,
          entries_per_page: 100,
          search_key: "vue",
          force_refresh: "true",
          active_filters: "[only_non_imported]",
          languages: "TypeScript,PHP",
          sort_key: "stars",
          sort_direction: "DESC",
        },
      }),
    );
  });
});
