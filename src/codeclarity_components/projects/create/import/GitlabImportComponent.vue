<script lang="ts" setup>
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import type { Repository } from "@/codeclarity_components/projects/project.entity";
import type { PaginatedResponse } from "@/utils/api/responses/PaginatedResponse";

import BaseImportComponent, {
  type GetReposOptions,
} from "./BaseImportComponent.vue";

defineProps<{
  /** Id of the organization's GitLab integration. */
  integration: string;
}>();

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

function getRepos(
  options: GetReposOptions,
): Promise<PaginatedResponse<Repository>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return integrationRepo.getGitlabRepositories(options);
}
</script>
<template>
  <BaseImportComponent :get-repos="getRepos" :integration="integration" />
</template>
