<script lang="ts">
/* eslint-disable import/order */
import { InfoCard } from '@/base_components';
import { type GetRepositoriesRequestOptions } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { type Repository } from '@/codeclarity_components/projects/project.entity';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import router from '@/router';
import Button from '@/shadcn/ui/button/Button.vue';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/shadcn/ui/form';
import Input from '@/shadcn/ui/input/Input.vue';
/* eslint-enable import/order */
export interface GetReposOptions extends GetRepositoriesRequestOptions {
    forceRefresh: boolean;
    activeFilters: string[];
}

export interface FailedProjectImport {
    repo: Repository;
    reason: string;
}
</script>
<script lang="ts" setup>
/* eslint-disable import/order */
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { ref, type Ref } from 'vue';
import * as z from 'zod';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import type { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import { errorToast, successToast } from '@/utils/toasts';
import Faq from './components/FaqComponent.vue';
import ImportErrorTable from './components/ImportErrorTable.vue';
import RepoTable from './components/RepoTable.vue';
/* eslint-enable import/order */
// Repositories
const projectsRepo: ProjectRepository = new ProjectRepository();

const authStore = useAuthStore();
const userStore = useUserStore();

// Props
const props = defineProps<{
    integration: string;
    getRepos: (options: GetRepositoriesRequestOptions) => Promise<PaginatedResponse<Repository>>;
}>();

// State
const repoTableRef: Ref<{ clearSelection: () => void; fetchRepos: (refresh: boolean, forceRefresh?: boolean) => Promise<void> } | null> = ref(null);
const reposFailedToImportPage: Ref<number> = ref(0);
const reposFailedToImport: Ref<Record<string, FailedProjectImport>> = ref({});
const selectedRepos: Ref<Repository[]> = ref([]);

const formSchema = toTypedSchema(
    z.object({
        repository: z.string().min(2).max(150)
    })
);

const form = useForm({
    validationSchema: formSchema
});

const onSubmit = form.handleSubmit(async (values) => {
    if (!userStore.getDefaultOrg) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;
    await importProject(
        userStore.getDefaultOrg.id,
        authStore.getToken,
        values.repository.replace('.git', '')
    );
});

// Methods
/**
 * Import a repo and create a project
 * @param orgId the org to which to import the repo
 * @param token the user's authentication token
 * @param repo the repo to import
 */
async function importProject(orgId: string, token: string, repo: string): Promise<void> {
    await projectsRepo.createProject({
        orgId: orgId,
        data: {
            integration_id: props.integration,
            url: repo
        },
        bearerToken: token,
        handleBusinessErrors: true
    });

    void router.push({ name: 'projects' });
}

/**
 * Get error message from import error
 */
function getImportErrorMessage(err: unknown): string {
    if (!(err instanceof BusinessLogicError)) {
        return 'An error occured during the project import.';
    }

    if ((err.error_code as APIErrors) === APIErrors.AlreadyExists) {
        return 'Already imported';
    }

    if ((err.error_code as APIErrors) === APIErrors.InternalError || (err.error_code as APIErrors) === APIErrors.EntityNotFound) {
        return 'An error occured during the project import.';
    }

    if ((err.error_code as APIErrors) === APIErrors.NotAuthorized) {
        return 'You do not have permission to import this repository';
    }

    return 'An error occured during the project import.';
}

/**
 * Import the selected repos in bulk
 */
async function importProjectsBulk(): Promise<void> {
    if (!userStore.getDefaultOrg) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    const _reposFailedToImport: Record<string, FailedProjectImport> = {};
    reposFailedToImport.value = {};

    for (const repo of selectedRepos.value) {
        try {
            await importProject(userStore.getDefaultOrg.id, authStore.getToken, repo.url);
        } catch (err) {
            const errorMessage = getImportErrorMessage(err);
            _reposFailedToImport[repo.id] = {
                repo: repo,
                reason: errorMessage
            };
        }
    }

    reposFailedToImport.value = { ..._reposFailedToImport };

    const nmbFailedImports = Object.keys(reposFailedToImport.value).length;
    if (nmbFailedImports !== selectedRepos.value.length) {
        successToast(
            `Succesfully imported ${selectedRepos.value.length - nmbFailedImports} repositories`
        );
    }
    if (nmbFailedImports > 0) {
        void errorToast(`Failed to import ${nmbFailedImports} repositories`);
    }

    if (repoTableRef.value) {
        repoTableRef.value.clearSelection();
    }
    selectedRepos.value = [];

    void refreshRepos();
}

async function clearImportErrors(): Promise<void> {
    reposFailedToImportPage.value = 0;
    reposFailedToImport.value = {};
    await forceRefreshRepos();
}

async function forceRefreshRepos(): Promise<void> {
    if (repoTableRef.value) {
        await repoTableRef.value.fetchRepos(false, true);
    }
}

async function refreshRepos(): Promise<void> {
    if (repoTableRef.value) {
        await repoTableRef.value.fetchRepos(true);
    }
}

// Emit Listeners
function onSelectedReposChange(repos: Repository[]): void {
    selectedRepos.value = repos;
}
</script>
<template>
    <main class="min-h-screen bg-white p-6">
        <div class="space-y-8">
            <!-- Repository Selection -->
            <div v-if="Object.keys(reposFailedToImport).length === 0">
                <InfoCard
                    title="Select Repositories"
                    description="Browse available repositories and select the ones you want to import"
                    icon="solar:folder-bold"
                    variant="default"
                >
                    <template #actions>
                        <Button
                            variant="outline"
                            size="sm"
                            class="border-gray-300 text-gray-700 hover:border-theme-primary hover:text-theme-primary"
                            @click="forceRefreshRepos()"
                        >
                            <Icon icon="solar:refresh-bold" class="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </template>
                    <RepoTable
                        ref="repoTableRef"
                        :integration="integration"
                        :get-repos="getRepos"
                        @on-selected-repos-change="onSelectedReposChange($event)"
                    />
                </InfoCard>
            </div>

            <!-- Import Errors -->
            <div v-else>
                <InfoCard
                    title="Import Results"
                    description="Some repositories failed to import"
                    icon="solar:danger-triangle-bold"
                    variant="danger"
                >
                    <div class="space-y-4">
                        <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div class="flex items-start gap-3">
                                <Icon
                                    icon="solar:danger-triangle-bold"
                                    class="h-5 w-5 text-red-600 mt-0.5"
                                />
                                <div>
                                    <p class="font-medium text-red-800">
                                        Some repository imports failed
                                    </p>
                                    <p class="text-sm text-red-700 mt-1">
                                        Note: other repository imports succeeded.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <ImportErrorTable :repos-failed-to-import="reposFailedToImport" />

                        <div class="pt-4">
                            <Button
                                class="bg-theme-primary hover:bg-theme-primary/90 text-white"
                                @click="clearImportErrors()"
                            >
                                <Icon icon="solar:refresh-bold" class="h-4 w-4 mr-2" />
                                Clear Errors & Retry
                            </Button>
                        </div>
                    </div>
                </InfoCard>
            </div>

            <!-- Bulk Import Action -->
            <div v-if="(selectedRepos.length as number) > 0 && (Object.keys(reposFailedToImport).length as number) === 0">
                <InfoCard
                    title="Ready to Import"
                    description="You have selected repositories for import"
                    icon="solar:download-bold"
                    variant="success"
                >
                    <div class="space-y-4">
                        <div
                            class="p-4 bg-theme-primary/5 rounded-lg border border-theme-primary/20"
                        >
                            <div class="flex items-center gap-3 mb-3">
                                <Icon
                                    icon="solar:check-circle-bold"
                                    class="h-5 w-5 text-theme-primary"
                                />
                                <span class="font-medium text-theme-black">
                                    {{ selectedRepos.length }}
                                    {{ selectedRepos.length === 1 ? 'repository' : 'repositories' }}
                                    selected
                                </span>
                            </div>
                            <p class="text-sm text-theme-gray mb-4">
                                Click the button below to start importing the selected repositories
                                for security analysis.
                            </p>
                            <Button
                                class="bg-theme-primary hover:bg-theme-primary/90 text-white font-medium"
                                @click="importProjectsBulk()"
                            >
                                <Icon icon="solar:download-bold" class="w-4 h-4 mr-2" />
                                Import {{ selectedRepos.length }}
                                {{ selectedRepos.length === 1 ? 'Project' : 'Projects' }}
                            </Button>
                        </div>
                    </div>
                </InfoCard>
            </div>

            <!-- Manual Import -->
            <InfoCard
                title="Manual Import"
                description="Can't find your repository? Import it directly using its URL"
                icon="solar:link-bold"
                variant="default"
            >
                <form class="space-y-4" @submit="onSubmit">
                    <FormField v-slot="{ componentField }" name="repository">
                        <FormItem>
                            <FormLabel class="text-sm font-medium text-theme-black"
                                >Repository URL</FormLabel
                            >
                            <FormControl>
                                <Input
                                    type="text"
                                    placeholder="https://github.com/username/repository"
                                    v-bind="componentField"
                                    class="border-gray-300 focus:ring-1 focus:ring-theme-primary focus:border-theme-primary"
                                />
                            </FormControl>
                            <FormDescription class="text-xs text-theme-gray">
                                Enter the complete URL of the repository you want to import
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <div class="pt-2">
                        <Button
                            type="submit"
                            class="bg-theme-black hover:bg-theme-black/90 text-white"
                        >
                            <Icon icon="solar:add-circle-bold" class="w-4 h-4 mr-2" />
                            Import Repository
                        </Button>
                    </div>
                </form>
            </InfoCard>

            <!-- FAQ Section -->
            <div class="pt-8">
                <Faq />
            </div>
        </div>
    </main>
</template>
