import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

import { IntegrationsRepository } from "./IntegrationsRepository";

const popularPath = "/org/org-1/integrations/github/gh-1/repositories/popular";

describe("IntegrationsRepository.getPopularGithubRepositories", () => {
  it("asks for popular repositories with the language selection and the usual list parameters", async () => {
    const app = createTestApp();
    const page = {
      data: [],
      entry_count: 0,
      page: 0,
      entries_per_page: 100,
      total_entries: 0,
      total_pages: 0,
      matching_count: 0,
      filter_count: {},
      status: "success",
    };
    app.http.on("GET", popularPath, page);

    const result =
      await new IntegrationsRepository().getPopularGithubRepositories({
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

    expect(result.total_entries).toBe(0);
    const request = app.http.requests.find((r) => r.path === popularPath);
    expect(request?.headers.get("Authorization")).toBe("Bearer token");
    expect(Object.fromEntries(request!.query)).toEqual({
      page: "0",
      entries_per_page: "100",
      search_key: "vue",
      force_refresh: "true",
      active_filters: "[only_non_imported]",
      languages: "TypeScript,PHP",
      sort_key: "stars",
      sort_direction: "DESC",
    });
  });
});
