<script lang="ts" setup>
import { FilterType } from "@/base_components/filters/filterTypes";
import {
  type GetRepositoriesRequestOptions,
  GetRepositoriesSortInterface,
  IntegrationsRepository,
} from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import type { Repository } from "@/codeclarity_components/projects/project.entity";
import type { PaginatedResponse } from "@/utils/api/responses/PaginatedResponse";

import BaseImportComponent from "./BaseImportComponent.vue";
import type { RepoTableConfig } from "./components/RepoTable.vue";

defineProps<{
  /** Id of the organization's GitHub integration, whose token ranks and clones. */
  integration: string;
}>();

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

/** Filter option keys of the Language category and the GitHub language they select. */
const LANGUAGE_FILTER_PREFIX = "language_";
const LANGUAGE_BY_FILTER: Record<string, string> = {
  language_javascript: "JavaScript",
  language_typescript: "TypeScript",
  language_php: "PHP",
};

// The list is at most 100 entries, so one page holds all of them and
// "Select All" selects the whole ranking.
const tableConfig: RepoTableConfig = {
  defaultSortKey: GetRepositoriesSortInterface.STARS,
  defaultEntriesPerPage: 100,
  showStars: true,
  extraFilters: {
    Language: {
      name: "Language",
      icon: "solar:code-bold",
      type: FilterType.RADIO,
      data: {
        language_all: {
          title: "All (JavaScript, TypeScript, PHP)",
          value: true,
        },
        language_javascript: { title: "JavaScript", value: false },
        language_typescript: { title: "TypeScript", value: false },
        language_php: { title: "PHP", value: false },
      },
    },
  },
};

function getRepos(
  options: GetRepositoriesRequestOptions,
): Promise<PaginatedResponse<Repository>> {
  const languages = options.activeFilters
    .map((filter) => LANGUAGE_BY_FILTER[filter])
    .filter((language): language is string => language !== undefined);

  return integrationRepo.getPopularGithubRepositories({
    ...options,
    languages,
    activeFilters: options.activeFilters.filter(
      (filter) => !filter.startsWith(LANGUAGE_FILTER_PREFIX),
    ),
  });
}
</script>
<template>
  <BaseImportComponent
    :get-repos="getRepos"
    :integration="integration"
    :table-config="tableConfig"
  />
</template>
