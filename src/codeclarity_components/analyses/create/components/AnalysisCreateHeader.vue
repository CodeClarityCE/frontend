<script setup lang="ts">
import { ref, type Ref } from 'vue';
import { Icon } from '@iconify/vue';

// Type imports
import type { Project } from '@/codeclarity_components/projects/project.entity';

import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
const user = useUserStore();
const auth = useAuthStore();

import LoadingContainer from '@/base_components/LoadingContainer.vue';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import TitleAndSubtitle from '@/base_components/headers/TitleAndSubtitle.vue';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';

const project: Ref<Project | undefined> = ref();

const upload_loading_ref: Ref<typeof LoadingContainer | undefined> = ref();
const upload_loading_error: Ref<any> = ref(null);

const projectRepository: ProjectRepository = new ProjectRepository();

// Fetch projects
async function getProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (projectId === null) {
        throw new Error('Project id not found');
    }

    if (auth.getAuthenticated && auth.getToken) {
        if (user.getDefaultOrg?.id === undefined) {
            return;
        }
        let res: DataResponse<Project>;
        try {
            res = await projectRepository.getProjectById({
                orgId: user.getDefaultOrg?.id,
                projectId: projectId,
                bearerToken: auth.getToken,
                handleBusinessErrors: true
            });
            project.value = res.data;
        } catch (err) {
            upload_loading_error.value = err;
            upload_loading_ref.value?.showError();
        } finally {
            upload_loading_ref.value?.showContent();
        }
    }
}
getProject();
</script>

<template>
    <div class="flex flex-row justify-between">
        <!-- Header -->
        <TitleAndSubtitle>
            <template #title>Analyze your project</template>
            <template #description>Analyze your project using our analyzers.</template>
        </TitleAndSubtitle>
        <div>
            <LoadingContainer ref="upload_loading_ref">
                <template #content>
                    <div class="flex flex-row gap-5 mt-2">
                        <div
                            class="flex flex-row justify-center items-center bg-gray-100 rounded-lg text-gray-400 text-4xl h-14 w-14 p-4">
                            <Icon v-if="project?.type == IntegrationProvider.GITHUB" icon="simple-icons:github" />
                            <Icon v-else-if="project?.type == IntegrationProvider.GITLAB" icon="simple-icons:gitlab" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="font-bold text-gray-600 text-lg">
                                {{ project?.name }}
                            </div>
                            <div class="font-medium text-gray-500">
                                {{ project?.type }} :
                                {{ project?.url }}
                            </div>
                        </div>
                    </div>
                </template>

                <template #error>
                    {{ upload_loading_error }}
                </template>
            </LoadingContainer>
        </div>
    </div>
</template>
