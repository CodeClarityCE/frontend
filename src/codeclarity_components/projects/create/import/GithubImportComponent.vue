<script lang="ts" setup>
import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import type { Repository } from "@/codeclarity_components/projects/project.entity";
import type { PaginatedResponse } from "@/utils/api/responses/PaginatedResponse";
import { Icon } from "@iconify/vue";
import BaseImportComponent, {
  type GetReposOptions,
} from "./BaseImportComponent.vue";

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

function getRepos(
  options: GetReposOptions,
): Promise<PaginatedResponse<Repository>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return integrationRepo.getGithubRepositories(options);
}
</script>
<template>
  <BaseImportComponent
    :get-repos="getRepos"
    :integration="IntegrationProvider.GITHUB"
  >
    <template #icon>
      <Icon icon="devicon:github" class="w-8 h-8"></Icon>
    </template>
    <template #integration_provider_name> Github </template>
  </BaseImportComponent>
</template>
