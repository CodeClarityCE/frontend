<script lang="ts" setup>
import { Icon } from "@iconify/vue";

import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import type { Repository } from "@/codeclarity_components/projects/project.entity";
import type { PaginatedResponse } from "@/utils/api/responses/PaginatedResponse";

import BaseImportComponent, {
  type GetReposOptions,
} from "./BaseImportComponent.vue";

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
  <BaseImportComponent
    :get-repos="getRepos"
    :integration="IntegrationProvider.GITLAB"
  >
    <template #icon>
      <Icon icon="devicon:gitlab" class="icon integration-icon"></Icon>
    </template>
    <template #integration_provider_name> GitLab </template>
  </BaseImportComponent>
</template>
