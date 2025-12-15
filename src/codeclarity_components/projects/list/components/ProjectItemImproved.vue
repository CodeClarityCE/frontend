<script lang="ts" setup>
import VerticalCard from '@/base_components/ui/cards/VerticalCard.vue';
import { AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import ProjectLanguageDetection from '@/codeclarity_components/projects/components/ProjectLanguageDetection.vue';
import type { Project } from '@/codeclarity_components/projects/project.entity';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import router from '@/router';
import { Button } from '@/shadcn/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/shadcn/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/shadcn/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth';
import { useProjectsMainStore } from '@/stores/StateStore';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { formatDate } from '@/utils/dateUtils';
import { errorToast, successToast } from '@/utils/toasts';
import { Icon } from '@iconify/vue';
import { ref, computed } from 'vue';
import AnalysisListImproved from './AnalysisListImproved.vue';

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
const projectRepository = new ProjectRepository();

// State
const showDeleteModal = ref(false);
const isDeletingProject = ref(false);

// Computed
const projectOwner = computed(() => props.project.name.split('/')[0]);
const projectName = computed(() => props.project.name.split('/').slice(-1)[0]);

const analysisStats = computed(() => {
    if (!props.project.analyses || props.project.analyses.length === 0) {
        return { total: 0, completed: 0, failed: 0, running: 0, scheduled: 0 };
    }

    const stats = {
        total: props.project.analyses.length,
        completed: 0,
        failed: 0,
        running: 0,
        scheduled: 0
    };

    props.project.analyses.forEach((analysis) => {
        if (
            (analysis.status) === AnalysisStatus.COMPLETED ||
            (analysis.status) === AnalysisStatus.FINISHED
        ) {
            stats.completed++;
        } else if (
            (analysis.status) === AnalysisStatus.FAILED ||
            (analysis.status) === AnalysisStatus.FAILURE
        ) {
            stats.failed++;
        } else if ((analysis.status) === AnalysisStatus.STARTED) {
            stats.running++;
        }

        if (analysis.schedule_type && analysis.schedule_type !== 'once') {
            stats.scheduled++;
        }
    });
    return stats;
});

const hasActiveAnalysis = computed(() => analysisStats.value.running > 0);
const latestAnalysis = computed(() => {
    if (!props.project.analyses || props.project.analyses.length === 0) return null;
    return [...props.project.analyses].sort(
        (a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
    )[0];
});

const cardVariant = computed(() => {
    if (analysisStats.value.failed > 0) return 'danger';
    if (analysisStats.value.completed > 0) return 'success';
    if (hasActiveAnalysis.value) return 'primary';
    return 'default';
});

// Methods
async function deleteProject(): Promise<void> {
    if (!viewState.orgId) return;
    if (!auth.getAuthenticated || !auth.getToken) return;

    isDeletingProject.value = true;
    try {
        await projectRepository.deleteProject({
            orgId: viewState.orgId,
            projectId: props.project.id,
            bearerToken: auth.getToken,
            handleBusinessErrors: true
        });
        successToast('Project successfully deleted');
        void emit('onRefresh');
    } catch (err) {
        if (err instanceof BusinessLogicError) {
            if ((err.error_code as APIErrors) === APIErrors.EntityNotFound) {
                successToast(`Successfully deleted project\n${props.project.url}`);
            } else {
                errorToast(`Failed to delete the project\n${props.project.url}`);
            }
        } else {
            errorToast(`Failed to delete the project\n${props.project.url}`);
        }
    } finally {
        isDeletingProject.value = false;
        showDeleteModal.value = false;
    }
}

function navigateToNewAnalysis(): void {
    void router.push(`/analyses/add?id=${props.project.id}`);
}

function getProjectIcon(): string {
    if (props.project.type === IntegrationProvider.GITLAB) return 'devicon:gitlab';
    if (props.project.type === IntegrationProvider.GITHUB) return 'devicon:github';
    return 'solar:folder-bold';
}
</script>

<template>
    <VerticalCard
        :title="projectName"
        :subtitle="projectOwner"
        :icon="getProjectIcon()"
        :variant="cardVariant"
        container-class="group relative overflow-hidden transition-all duration-300"
    >
        <template #actions>
            <!-- Actions dropdown -->
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Icon icon="solar:menu-dots-bold" class="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-56">
                    <DropdownMenuItem class="text-red-600" @click="showDeleteModal = true">
                        <Icon icon="solar:trash-bin-trash-bold" class="mr-2 h-4 w-4" />
                        Delete Project
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </template>

        <template #header>
            <!-- Project metadata -->
            <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-4 text-xs text-gray-400">
                    <span class="flex items-center gap-1">
                        <Icon icon="solar:calendar-linear" class="w-3.5 h-3.5" />
                        {{ formatDate(project.added_on, 'MMM DD, YYYY') }}
                    </span>
                    <span v-if="latestAnalysis" class="flex items-center gap-1">
                        <Icon icon="solar:refresh-linear" class="w-3.5 h-3.5" />
                        Last: {{ formatDate(latestAnalysis.created_on, 'MMM DD') }}
                    </span>
                </div>
                <!-- Language detection -->
                <ProjectLanguageDetection :project="project" size="sm" variant="minimal" />
            </div>
        </template>

        <!-- Main content -->
        <!-- Analysis stats -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                    <Icon icon="solar:shield-check-bold" class="w-4 h-4 text-gray-600" />
                    <span class="text-sm font-medium"
                        >{{ analysisStats.total }}
                        {{ analysisStats.total === 1 ? 'Analysis' : 'Analyses' }}</span
                    >
                </div>

                <div
                    v-if="analysisStats.completed > 0"
                    class="flex items-center gap-1 text-green-600"
                >
                    <div class="w-2 h-2 rounded-full bg-green-600" />
                    <span class="text-xs">{{ analysisStats.completed }} completed</span>
                </div>

                <div v-if="analysisStats.failed > 0" class="flex items-center gap-1 text-red-600">
                    <div class="w-2 h-2 rounded-full bg-red-600" />
                    <span class="text-xs">{{ analysisStats.failed }} failed</span>
                </div>

                <div v-if="analysisStats.running > 0" class="flex items-center gap-1 text-blue-600">
                    <div class="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span class="text-xs">{{ analysisStats.running }} running</span>
                </div>
            </div>

            <Button
                size="sm"
                variant="default"
                class="bg-theme-primary hover:bg-theme-primary-dark"
                @click="navigateToNewAnalysis"
            >
                <Icon icon="solar:add-circle-bold" class="w-4 h-4 mr-1" />
                New Analysis
            </Button>
        </div>

        <!-- Analysis list -->
        <div v-if="project.analyses && project.analyses.length > 0">
            <AnalysisListImproved :analyses="project.analyses" :project-i-d="project.id" />
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-8 px-4 bg-gray-50 rounded-lg">
            <Icon
                icon="solar:shield-minimalistic-linear"
                class="w-12 h-12 text-gray-300 mx-auto mb-3"
            />
            <p class="text-sm text-gray-600 mb-3">No analyses yet</p>
            <Button size="sm" @click="navigateToNewAnalysis">
                <Icon icon="solar:add-circle-bold" class="w-4 h-4 mr-1" />
                Start First Analysis
            </Button>
        </div>

        <!-- Delete project modal -->
        <Dialog v-model:open="showDeleteModal">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{{ projectName }}"? This action cannot be
                        undone and will permanently delete all analyses and results.
                    </DialogDescription>
                </DialogHeader>

                <div class="my-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div class="flex items-start gap-3">
                        <Icon
                            icon="solar:danger-triangle-bold"
                            class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                        />
                        <div class="text-sm text-red-800">
                            <p class="font-medium mb-1">This will permanently delete:</p>
                            <ul class="list-disc list-inside space-y-1 text-red-700">
                                <li>
                                    {{ analysisStats.total }}
                                    {{ analysisStats.total === 1 ? 'analysis' : 'analyses' }}
                                </li>
                                <li>All vulnerability reports</li>
                                <li>All SBOM data</li>
                                <li>All historical results</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        :disabled="isDeletingProject"
                        @click="showDeleteModal = false"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        :disabled="isDeletingProject"
                        @click="deleteProject"
                    >
                        <Icon
                            v-if="isDeletingProject"
                            icon="solar:refresh-linear"
                            class="w-4 h-4 mr-1 animate-spin"
                        />
                        {{ isDeletingProject ? 'Deleting...' : 'Delete Project' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </VerticalCard>
</template>
