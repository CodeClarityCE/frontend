<script lang="ts" setup>
import PositionedModal from '@/base_components/PositionedModal.vue';
import CenteredModal from '@/base_components/CenteredModal.vue';
import { ref, type Ref } from 'vue';
import moment from 'moment';
import { Icon } from '@iconify/vue';
import type { Project } from '@/codeclarity_components/projects/project.entity';
import { useAuthStore } from '@/stores/auth';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { errorToast, successToast } from '@/utils/toasts';
import { APIErrors } from '@/utils/api/ApiErrors';
import { useProjectsMainStore } from '@/stores/StateStore';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Button } from '@/shadcn/ui/button';
import { Separator } from '@/shadcn/ui/separator';
import AnalysisList from './AnalysisList.vue';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';

// Props
const props = defineProps<{
    project: Project;
}>();

// Emits
const emit = defineEmits<{
    (e: 'onRefresh'): void;
}>();

// Store
const auth = useAuthStore();
const viewState = useProjectsMainStore();

// Repositories
const projectRepository: ProjectRepository = new ProjectRepository();

// State
const projectOptionsModalRef: Ref<typeof PositionedModal> = ref(PositionedModal);
const projectDeleteModalRef: Ref<typeof PositionedModal> = ref(PositionedModal);

// Methods
async function deleteProject() {
    if (!viewState.orgId) return;
    if (!auth.getAuthenticated || !auth.getToken) return;

    try {
        await projectRepository.deleteProject({
            orgId: viewState.orgId,
            projectId: props.project.id,
            bearerToken: auth.getToken,
            handleBusinessErrors: true
        });
        successToast('Project successfully deleted');
        emit('onRefresh');
    } catch (err) {
        if (err instanceof BusinessLogicError) {
            if (err.error_code == APIErrors.EntityNotFound) {
                successToast(`Successfully deleted project\n${props.project.url}`);
            } else {
                errorToast(`Failed to delete the project\n${props.project.url}`);
            }
        } else {
            errorToast(`Failed to delete the project\n${props.project.url}`);
        }
    } finally {
        if (projectDeleteModalRef.value) projectDeleteModalRef.value.toggle();
    }
}
</script>
<template>
    <Card class="flex flex-col">
        <CardHeader>
            <CardTitle class="flex flex-row items-center justify-between space-y-0 pb-2">
                <div class="flex flex-wrap items-center">
                    <Icon
                        v-if="project.type == IntegrationProvider.GITLAB"
                        icon="devicon:gitlab"
                        class="w-8 flex-shrink-0"
                    />
                    <Icon
                        v-else-if="project.type == IntegrationProvider.GITHUB"
                        icon="devicon:github"
                        class="w-8 flex-shrink-0"
                    />
                    <Icon v-else icon="fluent-mdl2:unknown-solid" class="w-8 flex-shrink-0" />
                    <span>{{ project.name.split('/')[0] }}/</span>
                    <span>{{ project.name.split('/').slice(-1)[0] }}</span>
                </div>
                <div class="relative">
                    <Button
                        :id="'dot-menu-' + project.id"
                        variant="secondary"
                        size="icon"
                        @click="projectOptionsModalRef.toggle()"
                    >
                        <Icon :id="'dot-menu-' + project.id" icon="bi:three-dots-vertical" />
                    </Button>
                    <PositionedModal
                        ref="projectOptionsModalRef"
                        :tracker="'dot-menu-' + project.id"
                        :position="'top-left'"
                        :show-title-divider="false"
                        :show-title="false"
                        :show-sub-title="false"
                        :padding="false"
                        :margin-target="5"
                    >
                        <template #content>
                            <div
                                class="max-h-96 overflow-y-auto flex flex-col font-normal text-sm whitespace-nowrap p-1"
                            >
                                <div
                                    class="flex flex-row gap-2 items-center w-full cursor-pointer p-2 hover:rounded hover:bg-gray-200"
                                >
                                    <Icon class="icon" icon="solar:graph-outline"></Icon>
                                    Project Dashboard
                                </div>
                                <div
                                    class="flex flex-row gap-2 items-center w-full cursor-pointer p-2 hover:rounded hover:bg-gray-200"
                                    title="Delete the project"
                                    @click="projectDeleteModalRef.toggle()"
                                >
                                    <Icon class="icon" icon="solar:trash-bin-trash-linear" />
                                    Delete
                                </div>
                            </div>
                        </template>
                    </PositionedModal>
                </div>
            </CardTitle>
            <CardDescription>
                Imported on: {{ moment(project.imported_on).format('LL') }}
            </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent class="flex flex-col items-center justify-center flex-grow">
            <div v-if="project.analyses && project.analyses.length > 0">
                <div class="flex flex-row items-center justify-between gap-2 py-4">
                    <div class="text-xl font-bold">Analyses - Most Recent</div>
                    <RouterLink :to="'/analyses/add?id=' + project.id">
                        <Button variant="outline" size="icon">
                            <Icon icon="material-symbols:add-sharp" class="text-xl" />
                        </Button>
                    </RouterLink>
                </div>
                <div class="flex flex-col gap-4 items-center">
                    <AnalysisList :analyses="project.analyses" :project-i-d="project.id" />
                </div>
            </div>
            <div v-else class="flex flex-col justify-center items-center">
                No analysis found
                <RouterLink
                    :to="'/analyses/add?id=' + project.id"
                    class="flex flex-row items-center"
                >
                    <Button> Create an analysis </Button>
                </RouterLink>
            </div>
        </CardContent>
    </Card>
    <CenteredModal ref="projectDeleteModalRef">
        <template #title>
            <div class="flex flex-row items-center justify-between w-full">
                <div>Delete {{ project.name }}?</div>
            </div>
        </template>
        <template #content>
            <div class="flex flex-col gap-6 max-w-96">
                <div>Are you sure you want to delete the project:</div>
                <div class="flex flex-col items-center justify-center">
                    <span style="font-weight: 900">{{ project.name }}</span>
                </div>
                <Alert variant="destructive">
                    <AlertDescription>
                        This action is permanent and cannot be reverted.
                    </AlertDescription>
                </Alert>
            </div>
        </template>
        <template #buttons>
            <Button
                variant="destructive"
                class="flex flex-row gap-2 items-center"
                @click="deleteProject()"
            >
                <Icon icon="oi:trash" />
                <div>Delete</div>
            </Button>
            <Button @click="projectDeleteModalRef.toggle()"> Cancel </Button>
        </template>
    </CenteredModal>
</template>
