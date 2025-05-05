<script lang="ts">
import { type GetRepositoriesRequestOptions } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import Button from '@/shadcn/ui/button/Button.vue';
import router from '@/router';
import Input from '@/shadcn/ui/input/Input.vue';
import { Separator } from '@/shadcn/ui/separator';
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
    await importProject(userStore.getDefaultOrg.id, authStore.getToken, values.repository.replace(".git", ""))
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
            url: repo,
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
    <div class="flex flex-col gap-8">
        <!--------------------------------------------------------------------------->
        <!--                                 Header                                -->
        <!--------------------------------------------------------------------------->
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

        <div class="flex flex-col items-center gap-16">

            <div class="flex flex-col gap-8">
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
                                    <Icon class="text-xl" icon="solar:danger-triangle-bold"></Icon>
                                    <div class="font-black">Some repository imports failed</div>
                                </div>
                                <div>Note: the other repository imports succeeded.</div>
                            </div>
                        </div>
                    </div>

                    <ImportErrorTable :repos-failed-to-import="reposFailedToImport">
                    </ImportErrorTable>
                </template>

                <div class="flex flex-col gap-2">
                    <Button
                        v-if="Object.keys(reposFailedToImport).length > 0"
                        class="cursor-pointer m-0 w-fit"
                        @click="clearImportErrors()"
                        >Clear errors</Button
                    >
                    <template v-else>
                        <Button
                            class="rounded bg-primary text-white py-3 px-5 cursor-pointer m-0 w-fit"
                            @click="importProjectsBulk()"
                        >
                            Import projects
                        </Button>
                        <div style="margin-bottom: 5px">
                            You have selected {{ selectedRepos.length }} repositories
                        </div>
                    </template>
                </div>
            </div>
            <Separator class="w-1/2" label="or"></Separator>
            <form @submit="onSubmit">
                <FormField v-slot="{ componentField }" name="repository">
                    <FormItem>
                        <FormLabel>Import manually</FormLabel>
                        <FormControl>
                            <Input type="text" placeholder="https://..." v-bind="componentField" />
                        </FormControl>
                        <FormDescription> URL of a repository </FormDescription>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <Button type="submit"> Submit </Button>
            </form>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                                   FAQ                                 -->
        <!--------------------------------------------------------------------------->
        <Faq> </Faq>
    </div>
</template>
