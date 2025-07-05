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
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Button } from '@/shadcn/ui/button';
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
    <Card
        class="group relative overflow-hidden bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
    >
        <!-- Gradient overlay that appears on hover -->
        <div
            class="absolute inset-0 bg-gradient-to-br from-theme-primary/5 to-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        ></div>

        <CardHeader class="pb-4 relative">
            <CardTitle class="flex flex-row items-start justify-between space-y-0">
                <div class="flex flex-col gap-3 flex-1 min-w-0">
                    <!-- Project provider and name -->
                    <div class="flex items-center gap-3">
                        <div
                            class="p-2 rounded-lg bg-black/10 group-hover:bg-black/20 transition-colors duration-300"
                        >
                            <Icon
                                v-if="project.type == IntegrationProvider.GITLAB"
                                icon="devicon:gitlab"
                                class="w-5 h-5"
                            />
                            <Icon
                                v-else-if="project.type == IntegrationProvider.GITHUB"
                                icon="devicon:github"
                                class="w-5 h-5"
                            />
                            <Icon
                                v-else
                                icon="fluent-mdl2:unknown-solid"
                                class="w-5 h-5 text-slate-500"
                            />
                        </div>
                        <div class="flex flex-col min-w-0 flex-1">
                            <div class="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                {{ project.name.split('/')[0] }}
                            </div>
                            <div class="text-lg font-bold text-slate-900 truncate">
                                {{ project.name.split('/').slice(-1)[0] }}
                            </div>
                        </div>
                    </div>

                    <!-- Import date with better styling -->
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <Icon icon="solar:calendar-linear" class="h-3 w-3" />
                        <span>Imported {{ moment(project.added_on).format('MMM DD, YYYY') }}</span>
                    </div>
                </div>

                <!-- Options menu with better positioning -->
                <div class="relative flex-shrink-0">
                    <Button
                        :id="'dot-menu-' + project.id"
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0 text-slate-400 hover:text-theme-primary hover:bg-theme-primary/10"
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
                                class="min-w-48 overflow-y-auto flex flex-col font-normal text-sm p-1 bg-white border border-slate-200 rounded-lg shadow-lg"
                            >
                                <div
                                    class="flex flex-row gap-3 items-center w-full cursor-pointer p-3 hover:bg-slate-50 rounded-md transition-colors duration-200"
                                >
                                    <Icon
                                        class="h-4 w-4 text-blue-500"
                                        icon="solar:graph-outline"
                                    ></Icon>
                                    <span class="text-slate-700">Project Dashboard</span>
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

        <CardContent class="relative pt-0">
            <!-- Analysis section with better visual hierarchy -->
            <div v-if="project.analyses && project.analyses.length > 0" class="space-y-4">
                <!-- Header with analysis count and add button -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="p-1.5 bg-theme-primary/10 rounded-md">
                            <Icon
                                icon="solar:document-text-bold"
                                class="h-4 w-4 text-theme-primary"
                            />
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-black">Recent Analysis</div>
                            <div class="text-xs text-slate-500">
                                {{ project.analyses.length }} total
                            </div>
                        </div>
                    </div>
                    <RouterLink :to="'/analyses/add?id=' + project.id">
                        <Button
                            variant="outline"
                            size="sm"
                            class="h-8 w-8 p-0 border-slate-200 hover:bg-theme-primary/10 hover:border-theme-primary"
                        >
                            <Icon icon="solar:add-circle-linear" class="h-4 w-4 text-slate-600" />
                        </Button>
                    </RouterLink>
                </div>

                <!-- Analysis list with enhanced styling -->
                <div class="bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                    <AnalysisList :analyses="project.analyses" :project-i-d="project.id" />
                </div>
            </div>

            <!-- Empty state with better design -->
            <div v-else class="flex flex-col items-center justify-center py-8 text-center">
                <div class="p-4 bg-slate-100 rounded-full mb-4">
                    <Icon icon="solar:file-text-linear" class="h-8 w-8 text-slate-400" />
                </div>
                <div class="space-y-2 mb-4">
                    <div class="text-sm font-medium text-slate-900">No Analysis Found</div>
                    <div class="text-xs text-slate-500 max-w-48">
                        Start your first security analysis to identify vulnerabilities and licensing
                        issues
                    </div>
                </div>
                <RouterLink :to="'/analyses/add?id=' + project.id">
                    <Button
                        size="sm"
                        class="bg-theme-primary hover:bg-theme-primary-dark text-white"
                    >
                        <Icon icon="solar:play-circle-linear" class="h-4 w-4 mr-2" />
                        Create Analysis
                    </Button>
                </RouterLink>
            </div>
        </CardContent>
    </Card>

    <!-- Enhanced delete modal -->
    <CenteredModal ref="projectDeleteModalRef">
        <template #title>
            <div class="flex flex-row items-center gap-3">
                <div class="p-2 bg-red-100 rounded-lg">
                    <Icon icon="solar:trash-bin-trash-bold" class="h-5 w-5 text-red-600" />
                </div>
                <div class="text-lg font-semibold text-slate-900">Delete Project</div>
            </div>
        </template>
        <template #content>
            <div class="space-y-4 max-w-md">
                <div class="text-sm text-slate-600">
                    Are you sure you want to permanently delete this project?
                </div>
                <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div class="text-sm font-medium text-slate-900">{{ project.name }}</div>
                    <div class="text-xs text-slate-500 mt-1">
                        Imported {{ moment(project.added_on).format('MMM DD, YYYY') }}
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
