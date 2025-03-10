<script lang="ts" setup>
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import BaseImportComponent, { type GetReposOptions } from './BaseImportComponent.vue';
import { Icon } from '@iconify/vue';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import type { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import type { Repository } from '@/codeclarity_components/projects/project.entity';

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

function getRepos(options: GetReposOptions): Promise<PaginatedResponse<Repository>> {
    return integrationRepo.getGithubRepositories({
        orgId: options.orgId,
        integrationId: options.integrationId,
        forceRefresh: options.forceRefresh,
        activeFilters: options.activeFilters,
        pagination: {
            page: options.pagination.page,
            entries_per_page: options.pagination.entries_per_page
        },
        search: {
            searchKey: options.search.searchKey
        },
        sort: {
            sortKey: options.sort.sortKey,
            sortDirection: options.sort.sortDirection
        },
        bearerToken: options.bearerToken,
        handleBusinessErrors: true
    });
}
</script>
<template>
    <BaseImportComponent :getRepos="getRepos" :integration="IntegrationProvider.GITHUB">
        <template #icon>
            <Icon icon="devicon:github" class="w-8 h-8"></Icon>
        </template>
        <template #integration_provider_name> Github </template>
    </BaseImportComponent>
</template>
