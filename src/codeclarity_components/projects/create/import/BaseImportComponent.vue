<script lang="ts">
import { type GetRepositoriesRequestOptions } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import Button from '@/shadcn/ui/button/Button.vue';
import router from '@/router';
import Input from '@/shadcn/ui/input/Input.vue';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/shadcn/ui/form';

// Types
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
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { Repository } from '@/codeclarity_components/projects/project.entity';
import { Icon } from '@iconify/vue';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import { APIErrors } from '@/utils/api/ApiErrors';
import { errorToast, successToast } from '@/utils/toasts';
import type { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import Faq from './components/FaqComponent.vue';
import RepoTable from './components/RepoTable.vue';
import ImportErrorTable from './components/ImportErrorTable.vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

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
const repoTableRef: any = ref(null);
const reposFailedToImportPage: Ref<number> = ref(0);
const reposFailedToImport: Ref<{ [key: string]: FailedProjectImport }> = ref({});
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
async function importProject(orgId: string, token: string, repo: string) {
    await projectsRepo.createProject({
        orgId: orgId,
        data: {
            integration_id: props.integration,
            url: repo
        },
        bearerToken: token,
        handleBusinessErrors: true
    });

    router.push({ name: 'projects' });
}

/**
 * Import the selected repos in bulk
 */
async function importProjectsBulk() {
    if (!userStore.getDefaultOrg) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    const _reposFailedToImport: { [key: string]: FailedProjectImport } = {};
    reposFailedToImport.value = {};

    for (const repo of selectedRepos.value) {
        try {
            await importProject(userStore.getDefaultOrg.id, authStore.getToken, repo.url);
        } catch (err) {
            let errorMessage = '';

            if (err instanceof BusinessLogicError) {
                if (err.error_code == APIErrors.AlreadyExists) {
                    errorMessage = 'Already imported';
                    // continue;
                } else if (
                    err.error_code == APIErrors.InternalError ||
                    err.error_code == APIErrors.EntityNotFound
                ) {
                    errorMessage = 'An error occured during the project import.';
                } else if (err.error_code == APIErrors.NotAuthorized) {
                    errorMessage = 'You do not have permission to import this repository';
                } else {
                    errorMessage = 'An error occured during the project import.';
                }
            } else {
                errorMessage = 'An error occured during the project import.';
            }

            _reposFailedToImport[repo.id] = {
                repo: repo,
                reason: errorMessage
            };
        }
    }

    reposFailedToImport.value = { ..._reposFailedToImport };

    const nmbFailedImports = Object.keys(reposFailedToImport.value).length;
    if (nmbFailedImports != selectedRepos.value.length) {
        successToast(
            `Succesfully imported ${selectedRepos.value.length - nmbFailedImports} repositories`
        );
    }
    if (nmbFailedImports > 0) {
        errorToast(`Failed to import ${nmbFailedImports} repositories`);
    }

    if (repoTableRef.value) repoTableRef.value.clearSelection();
    selectedRepos.value = [];

    refreshRepos();
}

async function clearImportErrors() {
    reposFailedToImportPage.value = 0;
    reposFailedToImport.value = {};
    await forceRefreshRepos();
}

async function forceRefreshRepos() {
    if (repoTableRef.value) await repoTableRef.value.fetchRepos(false, true);
}

async function refreshRepos() {
    if (repoTableRef.value) await repoTableRef.value.fetchRepos(true);
}

// Emit Listeners
async function onSelectedReposChange(repos: Repository[]) {
    selectedRepos.value = repos;
}
</script>
<template>
    <div class="flex flex-col gap-8 min-h-screen py-8">
        <!--------------------------------------------------------------------------->
        <!--                                 Header                                -->
        <!--------------------------------------------------------------------------->
        <div class="bg-white shadow-sm border-b border-gray-200 px-8 py-6 -m-8 mb-8">
            <div class="max-w-6xl mx-auto">
                <div class="flex flex-row gap-4 items-center">
                    <div style="font-size: 2rem">
                        <slot name="icon"></slot>
                    </div>
                    <div style="font-size: 2rem; font-weight: 700">
                        <slot name="integration_provider_name"></slot>
                    </div>
                    <Button
                        class="w-fit cursor-pointer gap-1"
                        variant="outline"
                        title="Force refresh repositories"
                        @click="forceRefreshRepos()"
                    >
                        <Icon class="icon" icon="solar:refresh-bold"></Icon>
                        <div>Force refresh</div>
                    </Button>
                </div>
            </div>
        </div>

        <div class="px-8">
            <div class="flex flex-col items-center gap-8 max-w-6xl mx-auto">
                <div class="flex flex-col gap-6 w-full">
                    <RepoTable
                        v-if="Object.keys(reposFailedToImport).length == 0"
                        ref="repoTableRef"
                        :integration="integration"
                        :get-repos="getRepos"
                        @on-selected-repos-change="onSelectedReposChange($event)"
                    >
                    </RepoTable>

                    <!--------------------------------------------------------------------------->
                    <!--                              Import Error                             -->
                    <!--------------------------------------------------------------------------->
                    <template v-else>
                        <div class="">
                            <div class="text-destructive font-light">
                                <div class="flex flex-col gap-1">
                                    <div class="flex flex-row gap-1 items-center">
                                        <Icon
                                            class="text-xl"
                                            icon="solar:danger-triangle-bold"
                                        ></Icon>
                                        <div class="font-black">Some repository imports failed</div>
                                    </div>
                                    <div>Note: the other repository imports succeeded.</div>
                                </div>
                            </div>
                        </div>

                        <ImportErrorTable :repos-failed-to-import="reposFailedToImport">
                        </ImportErrorTable>
                    </template>

                    <div class="mt-6">
                        <Button
                            v-if="Object.keys(reposFailedToImport).length > 0"
                            class="cursor-pointer m-0 w-fit"
                            @click="clearImportErrors()"
                            >Clear errors</Button
                        >
                        <div
                            v-else-if="selectedRepos.length > 0"
                            class="flex flex-col gap-3 p-6 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                            <div class="flex items-center gap-2">
                                <Icon icon="lucide:info" class="text-blue-600" />
                                <span class="font-medium text-blue-900">Ready to import</span>
                            </div>
                            <p class="text-sm text-blue-700">
                                You have selected <strong>{{ selectedRepos.length }}</strong>
                                {{ selectedRepos.length === 1 ? 'repository' : 'repositories' }} for
                                import. Click the button below to start the import process.
                            </p>
                            <Button
                                class="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 cursor-pointer m-0 w-fit transition-colors duration-200"
                                @click="importProjectsBulk()"
                            >
                                <Icon icon="lucide:download" class="w-4 h-4 mr-2" />
                                Import {{ selectedRepos.length }}
                                {{ selectedRepos.length === 1 ? 'project' : 'projects' }}
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- Divider Section -->
                <div class="flex items-center justify-center my-12">
                    <div class="flex-1 border-t border-gray-300"></div>
                    <div class="px-6 text-gray-500 font-medium text-sm uppercase tracking-wide">
                        Or
                    </div>
                    <div class="flex-1 border-t border-gray-300"></div>
                </div>

                <!-- Manual Import Section -->
                <div class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="p-3 bg-gray-100 rounded-lg">
                            <Icon icon="lucide:link" class="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                Import manually
                            </h3>
                            <p class="text-gray-600 text-sm">
                                Can't find your repository in the list above? Import it directly
                                using its URL.
                            </p>
                        </div>
                    </div>

                    <form class="space-y-4" @submit="onSubmit">
                        <FormField v-slot="{ componentField }" name="repository">
                            <FormItem>
                                <FormLabel class="text-gray-700 font-medium"
                                    >Repository URL</FormLabel
                                >
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="https://github.com/username/repository"
                                        v-bind="componentField"
                                        class="h-12 text-base"
                                    />
                                </FormControl>
                                <FormDescription class="text-gray-500">
                                    Enter the complete URL of the repository you want to import
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <div class="pt-2">
                            <Button
                                type="submit"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium transition-colors duration-200"
                            >
                                <Icon icon="lucide:plus" class="w-4 h-4 mr-2" />
                                Import Repository
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                                   FAQ                                 -->
        <!--------------------------------------------------------------------------->
        <div class="px-8">
            <div class="max-w-6xl mx-auto">
                <Faq> </Faq>
            </div>
        </div>
    </div>
</template>
