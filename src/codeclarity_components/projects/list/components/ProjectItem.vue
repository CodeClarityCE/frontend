<script lang="ts" setup>
import CenteredModal from '@/base_components/ui/modals/CenteredModal.vue';
import PositionedModal from '@/base_components/ui/modals/PositionedModal.vue';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import type { Project } from '@/codeclarity_components/projects/project.entity';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';
import { Button } from '@/shadcn/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { useAuthStore } from '@/stores/auth';
import { useProjectsMainStore } from '@/stores/StateStore';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { formatDate } from '@/utils/dateUtils';
import { errorToast, successToast } from '@/utils/toasts';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';
import AnalysisList from './AnalysisList.vue';

// Props
const props = defineProps<{
    project: Project;
}>();

// Emits
const emit = defineEmits<(e: 'onRefresh') => void>();

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
            if (err.error_code === APIErrors.EntityNotFound) {
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
    <Card
        class="group relative overflow-hidden bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-theme-primary/30 transition-all duration-300 hover:-translate-y-0.5"
    >
        <!-- Subtle gradient overlay -->
        <div
            class="absolute inset-0 bg-gradient-to-br from-theme-primary/3 to-theme-primary/1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        ></div>

        <!-- Theme accent border -->
        <div
            class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-theme-primary to-theme-primary-light rounded-t-lg"
        ></div>

        <CardHeader class="pb-4 relative pt-6">
            <CardTitle class="flex flex-row items-start justify-between space-y-0">
                <div class="flex flex-col gap-3 flex-1 min-w-0">
                    <!-- Project provider and name -->
                    <div class="flex items-center gap-3">
                        <div
                            class="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-150 transition-all duration-300"
                        >
                            <Icon
                                v-if="project.type === IntegrationProvider.GITLAB"
                                icon="devicon:gitlab"
                                class="w-5 h-5"
                            />
                            <Icon
                                v-else-if="project.type === IntegrationProvider.GITHUB"
                                icon="devicon:github"
                                class="w-5 h-5"
                            />
                            <Icon
                                v-else
                                icon="fluent-mdl2:unknown-solid"
                                class="w-5 h-5 text-theme-gray"
                            />
                        </div>
                        <div class="flex flex-col min-w-0 flex-1">
                            <div
                                class="text-xs text-theme-gray/70 font-semibold uppercase tracking-wider"
                            >
                                {{ project.name.split('/')[0] }}
                            </div>
                            <div
                                class="text-lg font-bold text-theme-black truncate group-hover:text-theme-primary transition-colors duration-300"
                            >
                                {{ project.name.split('/').slice(-1)[0] }}
                            </div>
                        </div>
                    </div>

                    <!-- Import date with theme colors -->
                    <div class="flex items-center gap-2 text-xs text-theme-gray/60">
                        <Icon icon="solar:calendar-linear" class="h-3.5 w-3.5 text-theme-primary" />
                        <span>Imported {{ formatDate(project.added_on, 'MMM DD, YYYY') }}</span>
                    </div>
                </div>

                <!-- Options menu with theme styling -->
                <div class="relative flex-shrink-0">
                    <Button
                        :id="'dot-menu-' + project.id"
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0 text-theme-gray/50 hover:text-theme-primary hover:bg-theme-primary/10 transition-all duration-300"
                        @click="projectOptionsModalRef.toggle()"
                    >
                        <Icon
                            :id="'dot-menu-' + project.id"
                            icon="solar:menu-dots-linear"
                            class="h-4 w-4"
                        />
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
                                class="min-w-48 overflow-y-auto flex flex-col font-normal text-sm p-1 bg-white border border-theme-primary/20 rounded-lg shadow-lg"
                            >
                                <div
                                    class="flex flex-row gap-3 items-center w-full cursor-pointer p-3 hover:bg-theme-primary/5 rounded-md transition-colors duration-200"
                                >
                                    <Icon
                                        class="h-4 w-4 text-theme-primary"
                                        icon="solar:graph-outline"
                                    ></Icon>
                                    <span class="text-theme-black">Project Dashboard</span>
                                </div>
                                <div
                                    class="flex flex-row gap-3 items-center w-full cursor-pointer p-3 hover:bg-red-50 rounded-md transition-colors duration-200 text-red-600"
                                    title="Delete the project"
                                    @click="projectDeleteModalRef.toggle()"
                                >
                                    <Icon class="h-4 w-4" icon="solar:trash-bin-trash-linear" />
                                    <span>Delete Project</span>
                                </div>
                            </div>
                        </template>
                    </PositionedModal>
                </div>
            </CardTitle>
        </CardHeader>

        <CardContent class="relative pt-0 pb-6">
            <!-- Simplified Analysis section -->
            <div v-if="project.analyses && project.analyses.length > 0" class="space-y-3">
                <!-- Clean header with just count and action -->
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-theme-black">
                        {{ project.analyses.length }} Analysis
                    </span>
                    <RouterLink :to="'/analyses/add?id=' + project.id">
                        <Button
                            variant="ghost"
                            size="sm"
                            class="text-xs text-theme-primary hover:bg-theme-primary/5"
                        >
                            + New
                        </Button>
                    </RouterLink>
                </div>

                <!-- Clean analysis list -->
                <AnalysisList :analyses="project.analyses" :project-i-d="project.id" />
            </div>

            <!-- Simplified empty state -->
            <div v-else class="text-center py-6">
                <div class="text-sm text-theme-gray/60 mb-3">No analyses yet</div>
                <RouterLink :to="'/analyses/add?id=' + project.id">
                    <Button
                        size="sm"
                        class="bg-theme-primary hover:bg-theme-primary-dark text-white"
                    >
                        Create Analysis
                    </Button>
                </RouterLink>
            </div>
        </CardContent>
    </Card>

    <!-- Enhanced delete modal with theme consistency -->
    <CenteredModal ref="projectDeleteModalRef">
        <template #title>
            <div class="flex flex-row items-center gap-3">
                <div class="p-2 bg-red-100 rounded-lg ring-1 ring-red-200">
                    <Icon icon="solar:trash-bin-trash-bold" class="h-5 w-5 text-red-600" />
                </div>
                <div class="text-lg font-semibold text-theme-black">Delete Project</div>
            </div>
        </template>
        <template #content>
            <div class="space-y-4 max-w-md">
                <div class="text-sm text-theme-gray">
                    Are you sure you want to permanently delete this project?
                </div>
                <div class="p-4 bg-theme-primary/5 rounded-lg border border-theme-primary/20">
                    <div class="text-sm font-medium text-theme-black">{{ project.name }}</div>
                    <div class="text-xs text-theme-gray/60 mt-1">
                        Imported {{ formatDate(project.added_on, 'MMM DD, YYYY') }}
                    </div>
                </div>
                <Alert variant="destructive">
                    <Icon icon="solar:danger-triangle-bold" class="h-4 w-4" />
                    <AlertDescription>
                        This action cannot be undone. All analyses and data associated with this
                        project will be permanently deleted.
                    </AlertDescription>
                </Alert>
            </div>
        </template>
        <template #buttons>
            <Button variant="outline" @click="projectDeleteModalRef.toggle()"> Cancel </Button>
            <Button
                variant="destructive"
                class="flex flex-row gap-2 items-center"
                @click="deleteProject()"
            >
                <Icon icon="solar:trash-bin-trash-linear" class="h-4 w-4" />
                Delete Project
            </Button>
        </template>
    </CenteredModal>
</template>
