<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatDate, formatDistanceToNow } from '@/utils/dateUtils';
import { Icon } from '@iconify/vue';
import type {
    Analysis,
    AnalysisStatus as AnalysisStatusType
} from '@/codeclarity_components/analyses/analysis.entity';
import { AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';
import { Button } from '@/shadcn/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/shadcn/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/shadcn/ui/dialog';
import { Progress } from '@/shadcn/ui/progress';
import router from '@/router';
import { AnalysisRepository } from '@/codeclarity_components/analyses/analysis.repository';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { errorToast, successToast } from '@/utils/toasts';
import AnalysisRuns from './AnalysisRuns.vue';

const props = defineProps({
    analyses: {
        type: Array<Analysis>,
        required: true
    },
    projectID: {
        type: String,
        required: true
    }
});

// Repositories
const analysisRepository = new AnalysisRepository();

// Stores
const authStore = useAuthStore();
const userStore = useUserStore();

// State
const expandedAnalysisId = ref<string | null>(null);
const showDeleteModal = ref(false);
const analysisToDelete = ref<Analysis | null>(null);
const isDeletingAnalysis = ref(false);
const showRunsModal = ref(false);
const selectedAnalysis = ref<Analysis | null>(null);
const showScheduledHistoryModal = ref(false);
const showOneTimeHistoryModal = ref(false);

// Computed
const groupedAnalyses = computed(() => {
    const groups: {
        scheduled: Analysis[];
        oneTime: Analysis[];
    } = {
        scheduled: [],
        oneTime: []
    };

    // Separate analyses by type
    props.analyses.forEach((analysis) => {
        if (analysis.schedule_type && analysis.schedule_type !== 'once') {
            groups.scheduled.push(analysis);
        } else {
            groups.oneTime.push(analysis);
        }
    });

    // Sort each group by creation date (newest first)
    groups.scheduled.sort(
        (a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
    );
    groups.oneTime.sort(
        (a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
    );

    return groups;
});

// Get latest analyses for simplified display
const latestAnalyses = computed(() => {
    const latest = {
        scheduled: groupedAnalyses.value.scheduled[0] || null,
        oneTime: groupedAnalyses.value.oneTime[0] || null
    };

    return latest;
});

// Count remaining analyses for history dialog
const remainingCounts = computed(() => {
    return {
        scheduled: Math.max(0, groupedAnalyses.value.scheduled.length - 1),
        oneTime: Math.max(0, groupedAnalyses.value.oneTime.length - 1)
    };
});

// Format execution time for display
const formatExecutionTime = (startTime: string, endTime: string): string => {
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationSeconds = durationMs / 1000;

    if (durationSeconds < 1) {
        // Show milliseconds for sub-second durations
        return `${Math.round(durationMs)}ms`;
    } else if (durationSeconds < 60) {
        // Show seconds with one decimal place for durations under 1 minute
        return `${durationSeconds.toFixed(1)}s`;
    } else {
        // Show whole seconds for longer durations
        return `${Math.round(durationSeconds)}s`;
    }
};

// Check if analysis steps should be displayed
const shouldShowSteps = (analysis: Analysis): boolean => {
    // Don't show steps if analysis is in pending state (not started yet)
    const pendingStates = [AnalysisStatus.REQUESTED, AnalysisStatus.TRIGGERED];

    if (pendingStates.includes(analysis.status as AnalysisStatus)) {
        return false;
    }

    // Don't show steps if they don't exist or are empty
    if (!analysis.steps || Object.keys(analysis.steps).length === 0) {
        return false;
    }

    // Don't show if all steps are "Unknown Step" or have no meaningful name
    const allSteps = Object.values(analysis.steps).flat();
    const hasValidSteps = allSteps.some(
        (step) => step.Name && step.Name !== 'Unknown Step' && step.Name
    );

    return hasValidSteps;
};

// Get frequency display text
const getFrequencyText = (scheduleType: string): string => {
    const frequencies: Record<string, string> = {
        daily: 'daily',
        weekly: 'weekly'
    };
    return frequencies[scheduleType] || scheduleType;
};

// Methods
function toggleAnalysis(analysisId: string) {
    expandedAnalysisId.value = expandedAnalysisId.value === analysisId ? null : analysisId;
}

function getStatusIcon(status: AnalysisStatusType) {
    switch (status) {
        case AnalysisStatus.COMPLETED:
        case AnalysisStatus.FINISHED:
            return 'solar:check-circle-bold';
        case AnalysisStatus.FAILED:
        case AnalysisStatus.FAILURE:
            return 'solar:close-circle-bold';
        case AnalysisStatus.STARTED:
            return 'solar:refresh-bold';
        default:
            return 'solar:clock-circle-bold';
    }
}

function getStatusColor(status: AnalysisStatusType) {
    switch (status) {
        case AnalysisStatus.COMPLETED:
        case AnalysisStatus.FINISHED:
            return 'text-green-600 bg-green-50 border-green-200';
        case AnalysisStatus.FAILED:
        case AnalysisStatus.FAILURE:
            return 'text-red-600 bg-red-50 border-red-200';
        case AnalysisStatus.STARTED:
            return 'text-blue-600 bg-blue-50 border-blue-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
}

function getAnalysisProgress(analysis: Analysis): number {
    if (!analysis.steps) return 0;

    const totalSteps = Object.values(analysis.steps).flat().length;
    if (totalSteps === 0) return 0;

    const completedSteps = Object.values(analysis.steps)
        .flat()
        .filter((step) => step.Status === AnalysisStatus.SUCCESS).length;

    return Math.round((completedSteps / totalSteps) * 100);
}

function viewResults(analysis: Analysis, runIndex?: number) {
    const query: any = {
        analysis_id: analysis.id,
        project_id: props.projectID
    };

    // For scheduled analyses, add run_index (default to 0 for latest)
    if (analysis.schedule_type && analysis.schedule_type !== 'once') {
        query.run_index = runIndex !== undefined ? runIndex : 0;
    }

    router.push({
        name: 'results',
        query
    });
}

function viewHistory(analysis: Analysis) {
    selectedAnalysis.value = analysis;
    showRunsModal.value = true;
}

function confirmDelete(analysis: Analysis) {
    analysisToDelete.value = analysis;
    showDeleteModal.value = true;
}

async function deleteAnalysis() {
    if (!analysisToDelete.value || !userStore.getUser?.default_org?.id) return;

    isDeletingAnalysis.value = true;
    try {
        await analysisRepository.deleteAnalysis({
            orgId: userStore.getUser.default_org.id,
            projectId: props.projectID,
            analysisId: analysisToDelete.value.id,
            bearerToken: authStore.getToken!,
            handleBusinessErrors: true
        });
        successToast('Analysis deleted successfully');
        window.location.reload(); // Refresh to update the list
    } catch {
        errorToast('Failed to delete analysis');
    } finally {
        isDeletingAnalysis.value = false;
        showDeleteModal.value = false;
        analysisToDelete.value = null;
    }
}

function showScheduledHistory() {
    showScheduledHistoryModal.value = true;
}

function showOneTimeHistory() {
    showOneTimeHistoryModal.value = true;
}
</script>

<template>
    <div class="space-y-3">
        <!-- Latest Scheduled Analysis (without title) -->
        <div v-if="latestAnalyses.scheduled">
            <div
                class="border-l-4 border-l-green-500 border border-gray-300 rounded-lg bg-green-50/30 shadow-sm hover:shadow-md transition-shadow"
            >
                <div class="hover:bg-gray-50/40 transition-all duration-200 rounded-r-lg">
                    <!-- Analysis header -->
                    <div
                        class="p-3 cursor-pointer"
                        @click="toggleAnalysis(latestAnalyses.scheduled.id)"
                    >
                        <!-- Top row: Status, frequency, and actions -->
                        <div class="flex items-start justify-between mb-2 pr-6">
                            <div class="flex items-center gap-3">
                                <!-- Status icon -->
                                <div
                                    class="p-1 rounded-full border flex-shrink-0"
                                    :class="getStatusColor(latestAnalyses.scheduled.status)"
                                >
                                    <Icon
                                        :icon="getStatusIcon(latestAnalyses.scheduled.status)"
                                        class="w-3.5 h-3.5"
                                        :class="{
                                            'animate-spin':
                                                latestAnalyses.scheduled.status ===
                                                AnalysisStatus.STARTED
                                        }"
                                    />
                                </div>

                                <!-- Status and frequency -->
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center gap-1">
                                        <Icon
                                            icon="solar:calendar-linear"
                                            class="w-3.5 h-3.5 text-green-600"
                                        />
                                        <span class="text-sm font-semibold text-gray-900">
                                            {{
                                                latestAnalyses.scheduled.status ===
                                                AnalysisStatus.STARTED
                                                    ? 'Running'
                                                    : latestAnalyses.scheduled.status ===
                                                            AnalysisStatus.COMPLETED ||
                                                        latestAnalyses.scheduled.status ===
                                                            AnalysisStatus.FINISHED
                                                      ? 'Completed'
                                                      : latestAnalyses.scheduled.status ===
                                                              AnalysisStatus.FAILED ||
                                                          latestAnalyses.scheduled.status ===
                                                              AnalysisStatus.FAILURE
                                                        ? 'Failed'
                                                        : 'Pending'
                                            }}
                                        </span>
                                    </div>
                                    <!-- Frequency badge -->
                                    <span
                                        class="text-xs px-2 py-0.5 rounded-md font-medium text-green-700 bg-green-100"
                                    >
                                        {{
                                            getFrequencyText(
                                                latestAnalyses.scheduled.schedule_type || ''
                                            )
                                        }}
                                    </span>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center gap-0.5 flex-shrink-0">
                                <TooltipProvider>
                                    <!-- View Results -->
                                    <Tooltip
                                        v-if="
                                            latestAnalyses.scheduled.status ===
                                                AnalysisStatus.COMPLETED ||
                                            latestAnalyses.scheduled.status ===
                                                AnalysisStatus.FINISHED
                                        "
                                    >
                                        <TooltipTrigger as-child>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                @click.stop="viewResults(latestAnalyses.scheduled)"
                                            >
                                                <Icon icon="solar:eye-bold" class="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View Results</TooltipContent>
                                    </Tooltip>

                                    <!-- View History -->
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                @click.stop="viewHistory(latestAnalyses.scheduled)"
                                            >
                                                <Icon icon="solar:history-bold" class="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View History</TooltipContent>
                                    </Tooltip>

                                    <!-- More options -->
                                    <DropdownMenu>
                                        <DropdownMenuTrigger as-child @click.stop>
                                            <Button variant="ghost" size="sm">
                                                <Icon icon="solar:menu-dots-bold" class="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                class="text-red-600"
                                                @click="confirmDelete(latestAnalyses.scheduled)"
                                            >
                                                <Icon
                                                    icon="solar:trash-bin-trash-bold"
                                                    class="mr-2 h-4 w-4"
                                                />
                                                Delete Analysis
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TooltipProvider>

                                <!-- Expand/collapse icon -->
                                <Icon
                                    icon="solar:alt-arrow-down-linear"
                                    class="w-4 h-4 text-gray-400 transition-transform ml-1"
                                    :class="{
                                        'rotate-180':
                                            expandedAnalysisId === latestAnalyses.scheduled.id
                                    }"
                                />
                            </div>
                        </div>

                        <!-- Bottom row: Timing information -->
                        <div class="flex items-start justify-between text-xs">
                            <!-- Left side: Created time with relative time below -->
                            <div class="flex flex-col gap-0.5">
                                <div class="flex items-center gap-1.5 text-gray-600">
                                    <Icon icon="solar:calendar-add-linear" class="w-3.5 h-3.5" />
                                    <span>{{
                                        formatDate(
                                            latestAnalyses.scheduled.created_on,
                                            'MMM DD, HH:mm'
                                        )
                                    }}</span>
                                </div>
                                <div class="text-gray-500 text-xs ml-4.5">
                                    {{
                                        formatDistanceToNow(
                                            new Date(latestAnalyses.scheduled.created_on)
                                        )
                                    }}
                                    ago
                                </div>
                            </div>

                            <!-- Next run (for scheduled analyses) -->
                            <div
                                v-if="latestAnalyses.scheduled.next_scheduled_run"
                                class="flex items-center gap-1"
                            >
                                <!-- Show if it's pending/overdue -->
                                <div
                                    v-if="
                                        new Date(latestAnalyses.scheduled.next_scheduled_run) <=
                                            new Date() &&
                                        latestAnalyses.scheduled.status !== AnalysisStatus.STARTED
                                    "
                                    class="flex items-center gap-1 px-2 py-0.5 rounded-md text-orange-600 bg-orange-100"
                                >
                                    <Icon icon="solar:bell-linear" class="w-3.5 h-3.5" />
                                    <span class="text-xs font-medium">Pending execution</span>
                                </div>
                                <!-- Show next scheduled run -->
                                <div
                                    v-else
                                    class="flex items-center gap-1 px-2 py-0.5 rounded-md"
                                    style="
                                        color: #1dce79;
                                        background-color: rgba(29, 206, 121, 0.1);
                                    "
                                >
                                    <Icon icon="solar:clock-circle-linear" class="w-3.5 h-3.5" />
                                    <span class="text-xs font-medium">
                                        Next:
                                        {{
                                            formatDate(
                                                latestAnalyses.scheduled.next_scheduled_run,
                                                'MMM DD, HH:mm'
                                            )
                                        }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Progress bar for running analyses -->
                        <div
                            v-if="latestAnalyses.scheduled.status === AnalysisStatus.STARTED"
                            class="mt-2"
                        >
                            <Progress
                                :value="getAnalysisProgress(latestAnalyses.scheduled)"
                                class="h-1"
                            />
                        </div>
                    </div>

                    <!-- Expanded content -->
                    <div
                        v-if="expandedAnalysisId === latestAnalyses.scheduled.id"
                        class="px-3 pr-4 pb-3 border-t"
                    >
                        <div class="pt-3 space-y-2">
                            <!-- Analysis steps -->
                            <div v-if="shouldShowSteps(latestAnalyses.scheduled)" class="space-y-1">
                                <p class="text-xs font-medium text-gray-600 mb-2">
                                    Analysis Steps:
                                </p>
                                <div
                                    v-for="(stages, key) in latestAnalyses.scheduled.steps"
                                    :key="key"
                                    class="space-y-1"
                                >
                                    <div
                                        v-for="stage in stages"
                                        :key="stage.Name"
                                        class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                                    >
                                        <div class="flex items-center gap-2">
                                            <Icon
                                                :icon="
                                                    stage.Status === AnalysisStatus.SUCCESS
                                                        ? 'solar:check-circle-bold'
                                                        : stage.Status === AnalysisStatus.FAILED ||
                                                            stage.Status === AnalysisStatus.FAILURE
                                                          ? 'solar:close-circle-bold'
                                                          : stage.Status === AnalysisStatus.STARTED
                                                            ? 'solar:refresh-bold'
                                                            : 'solar:clock-circle-bold'
                                                "
                                                class="w-3.5 h-3.5"
                                                :class="{
                                                    'text-green-600':
                                                        stage.Status === AnalysisStatus.SUCCESS,
                                                    'text-red-600':
                                                        stage.Status === AnalysisStatus.FAILED ||
                                                        stage.Status === AnalysisStatus.FAILURE,
                                                    'text-blue-600 animate-spin':
                                                        stage.Status === AnalysisStatus.STARTED,
                                                    'text-gray-400':
                                                        !stage.Status ||
                                                        stage.Status === AnalysisStatus.PENDING
                                                }"
                                            />
                                            <span class="text-gray-700">{{
                                                stage.Name || 'Unknown Step'
                                            }}</span>
                                        </div>
                                        <span
                                            v-if="stage.Started_on && stage.Ended_on"
                                            class="text-gray-500"
                                        >
                                            {{
                                                formatExecutionTime(
                                                    stage.Started_on,
                                                    stage.Ended_on
                                                )
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Action buttons -->
                            <div class="flex items-center gap-2 pt-2">
                                <Button
                                    v-if="
                                        latestAnalyses.scheduled.status ===
                                            AnalysisStatus.COMPLETED ||
                                        latestAnalyses.scheduled.status === AnalysisStatus.FINISHED
                                    "
                                    size="sm"
                                    @click="viewResults(latestAnalyses.scheduled)"
                                >
                                    <Icon icon="solar:eye-bold" class="w-4 h-4 mr-1" />
                                    View Full Report
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    @click="viewHistory(latestAnalyses.scheduled)"
                                >
                                    <Icon icon="solar:history-bold" class="w-4 h-4 mr-1" />
                                    View History
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Latest One-Time Analysis (without title) -->
        <div v-if="latestAnalyses.oneTime">
            <div
                class="border-l-4 border-l-blue-500 border border-gray-300 rounded-lg bg-blue-50/20 shadow-sm hover:shadow-md transition-shadow"
            >
                <div class="hover:bg-gray-50/40 transition-all duration-200 rounded-r-lg">
                    <!-- Analysis header -->
                    <div
                        class="p-3 cursor-pointer"
                        @click="toggleAnalysis(latestAnalyses.oneTime.id)"
                    >
                        <!-- Top row: Status and actions -->
                        <div class="flex items-start justify-between mb-2 pr-6">
                            <div class="flex items-center gap-3">
                                <!-- Status icon -->
                                <div
                                    class="p-1 rounded-full border flex-shrink-0"
                                    :class="getStatusColor(latestAnalyses.oneTime.status)"
                                >
                                    <Icon
                                        :icon="getStatusIcon(latestAnalyses.oneTime.status)"
                                        class="w-3.5 h-3.5"
                                        :class="{
                                            'animate-spin':
                                                latestAnalyses.oneTime.status ===
                                                AnalysisStatus.STARTED
                                        }"
                                    />
                                </div>

                                <!-- Status -->
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center gap-1">
                                        <Icon
                                            icon="solar:play-bold"
                                            class="w-3.5 h-3.5 text-blue-600"
                                        />
                                        <span class="text-sm font-semibold text-gray-900">
                                            {{
                                                latestAnalyses.oneTime.status ===
                                                AnalysisStatus.STARTED
                                                    ? 'Running'
                                                    : latestAnalyses.oneTime.status ===
                                                            AnalysisStatus.COMPLETED ||
                                                        latestAnalyses.oneTime.status ===
                                                            AnalysisStatus.FINISHED
                                                      ? 'Completed'
                                                      : latestAnalyses.oneTime.status ===
                                                              AnalysisStatus.FAILED ||
                                                          latestAnalyses.oneTime.status ===
                                                              AnalysisStatus.FAILURE
                                                        ? 'Failed'
                                                        : 'Pending'
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center gap-0.5 flex-shrink-0">
                                <TooltipProvider>
                                    <!-- View Results -->
                                    <Tooltip
                                        v-if="
                                            latestAnalyses.oneTime.status ===
                                                AnalysisStatus.COMPLETED ||
                                            latestAnalyses.oneTime.status ===
                                                AnalysisStatus.FINISHED
                                        "
                                    >
                                        <TooltipTrigger as-child>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                @click.stop="viewResults(latestAnalyses.oneTime)"
                                            >
                                                <Icon icon="solar:eye-bold" class="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View Results</TooltipContent>
                                    </Tooltip>

                                    <!-- More options -->
                                    <DropdownMenu>
                                        <DropdownMenuTrigger as-child @click.stop>
                                            <Button variant="ghost" size="sm">
                                                <Icon icon="solar:menu-dots-bold" class="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                class="text-red-600"
                                                @click="confirmDelete(latestAnalyses.oneTime)"
                                            >
                                                <Icon
                                                    icon="solar:trash-bin-trash-bold"
                                                    class="mr-2 h-4 w-4"
                                                />
                                                Delete Analysis
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TooltipProvider>

                                <!-- Expand/collapse icon -->
                                <Icon
                                    icon="solar:alt-arrow-down-linear"
                                    class="w-4 h-4 text-gray-400 transition-transform ml-1"
                                    :class="{
                                        'rotate-180':
                                            expandedAnalysisId === latestAnalyses.oneTime.id
                                    }"
                                />
                            </div>
                        </div>

                        <!-- Bottom row: Timing information -->
                        <div class="flex items-start justify-between text-xs">
                            <!-- Left side: Created time with relative time below -->
                            <div class="flex flex-col gap-0.5">
                                <div class="flex items-center gap-1.5 text-gray-600">
                                    <Icon icon="solar:calendar-add-linear" class="w-3.5 h-3.5" />
                                    <span>{{
                                        formatDate(
                                            latestAnalyses.oneTime.created_on,
                                            'MMM DD, HH:mm'
                                        )
                                    }}</span>
                                </div>
                                <div class="text-gray-500 text-xs ml-4.5">
                                    {{
                                        formatDistanceToNow(
                                            new Date(latestAnalyses.oneTime.created_on)
                                        )
                                    }}
                                    ago
                                </div>
                            </div>
                        </div>

                        <!-- Progress bar for running analyses -->
                        <div
                            v-if="latestAnalyses.oneTime.status === AnalysisStatus.STARTED"
                            class="mt-2"
                        >
                            <Progress
                                :value="getAnalysisProgress(latestAnalyses.oneTime)"
                                class="h-1"
                            />
                        </div>
                    </div>

                    <!-- Expanded content -->
                    <div
                        v-if="expandedAnalysisId === latestAnalyses.oneTime.id"
                        class="px-3 pr-4 pb-3 border-t"
                    >
                        <div class="pt-3 space-y-2">
                            <!-- Analysis steps -->
                            <div v-if="shouldShowSteps(latestAnalyses.oneTime)" class="space-y-1">
                                <p class="text-xs font-medium text-gray-600 mb-2">
                                    Analysis Steps:
                                </p>
                                <div
                                    v-for="(stages, key) in latestAnalyses.oneTime.steps"
                                    :key="key"
                                    class="space-y-1"
                                >
                                    <div
                                        v-for="stage in stages"
                                        :key="stage.Name"
                                        class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                                    >
                                        <div class="flex items-center gap-2">
                                            <Icon
                                                :icon="
                                                    stage.Status === AnalysisStatus.SUCCESS
                                                        ? 'solar:check-circle-bold'
                                                        : stage.Status === AnalysisStatus.FAILED ||
                                                            stage.Status === AnalysisStatus.FAILURE
                                                          ? 'solar:close-circle-bold'
                                                          : stage.Status === AnalysisStatus.STARTED
                                                            ? 'solar:refresh-bold'
                                                            : 'solar:clock-circle-bold'
                                                "
                                                class="w-3.5 h-3.5"
                                                :class="{
                                                    'text-green-600':
                                                        stage.Status === AnalysisStatus.SUCCESS,
                                                    'text-red-600':
                                                        stage.Status === AnalysisStatus.FAILED ||
                                                        stage.Status === AnalysisStatus.FAILURE,
                                                    'text-blue-600 animate-spin':
                                                        stage.Status === AnalysisStatus.STARTED,
                                                    'text-gray-400':
                                                        !stage.Status ||
                                                        stage.Status === AnalysisStatus.PENDING
                                                }"
                                            />
                                            <span class="text-gray-700">{{
                                                stage.Name || 'Unknown Step'
                                            }}</span>
                                        </div>
                                        <span
                                            v-if="stage.Started_on && stage.Ended_on"
                                            class="text-gray-500"
                                        >
                                            {{
                                                formatExecutionTime(
                                                    stage.Started_on,
                                                    stage.Ended_on
                                                )
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Action buttons -->
                            <div class="flex items-center gap-2 pt-2">
                                <Button
                                    v-if="
                                        latestAnalyses.oneTime.status ===
                                            AnalysisStatus.COMPLETED ||
                                        latestAnalyses.oneTime.status === AnalysisStatus.FINISHED
                                    "
                                    size="sm"
                                    @click="viewResults(latestAnalyses.oneTime)"
                                >
                                    <Icon icon="solar:eye-bold" class="w-4 h-4 mr-1" />
                                    View Full Report
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- History Links -->
        <div
            v-if="remainingCounts.scheduled > 0 || remainingCounts.oneTime > 0"
            class="flex justify-center gap-1 pt-2"
        >
            <TooltipProvider>
                <Tooltip v-if="remainingCounts.scheduled > 0">
                    <TooltipTrigger as-child>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
                            @click="showScheduledHistory"
                        >
                            <Icon icon="solar:calendar-linear" class="w-3 h-3 mr-1" />
                            +{{ remainingCounts.scheduled }}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        View {{ remainingCounts.scheduled }} more scheduled
                        {{ remainingCounts.scheduled === 1 ? 'analysis' : 'analyses' }}
                    </TooltipContent>
                </Tooltip>

                <Tooltip v-if="remainingCounts.oneTime > 0">
                    <TooltipTrigger as-child>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
                            @click="showOneTimeHistory"
                        >
                            <Icon icon="solar:play-bold" class="w-3 h-3 mr-1" />
                            +{{ remainingCounts.oneTime }}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        View {{ remainingCounts.oneTime }} more one-time
                        {{ remainingCounts.oneTime === 1 ? 'analysis' : 'analyses' }}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>

        <!-- Scheduled Analyses History Modal -->
        <Dialog v-model:open="showScheduledHistoryModal">
            <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Scheduled Analyses History</DialogTitle>
                    <DialogDescription> All scheduled analyses for this project </DialogDescription>
                </DialogHeader>

                <div class="space-y-2 mt-4">
                    <div
                        v-for="analysis in groupedAnalyses.scheduled"
                        :key="analysis.id"
                        class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="p-1 rounded-full border flex-shrink-0"
                                :class="getStatusColor(analysis.status)"
                            >
                                <Icon
                                    :icon="getStatusIcon(analysis.status)"
                                    class="w-3 h-3"
                                    :class="{
                                        'animate-spin': analysis.status === AnalysisStatus.STARTED
                                    }"
                                />
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-medium">
                                        {{
                                            analysis.status === AnalysisStatus.STARTED
                                                ? 'Running'
                                                : analysis.status === AnalysisStatus.COMPLETED ||
                                                    analysis.status === AnalysisStatus.FINISHED
                                                  ? 'Completed'
                                                  : analysis.status === AnalysisStatus.FAILED ||
                                                      analysis.status === AnalysisStatus.FAILURE
                                                    ? 'Failed'
                                                    : 'Pending'
                                        }}
                                    </span>
                                    <span
                                        class="text-xs px-2 py-0.5 rounded-md font-medium"
                                        style="
                                            color: #1dce79;
                                            background-color: rgba(29, 206, 121, 0.1);
                                        "
                                    >
                                        {{ getFrequencyText(analysis.schedule_type || '') }}
                                    </span>
                                </div>
                                <div class="text-xs text-gray-500">
                                    {{ formatDate(analysis.created_on, 'MMM DD, HH:mm') }} •
                                    {{ formatDistanceToNow(new Date(analysis.created_on)) }} ago
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            <Button
                                v-if="
                                    analysis.status === AnalysisStatus.COMPLETED ||
                                    analysis.status === AnalysisStatus.FINISHED
                                "
                                variant="ghost"
                                size="sm"
                                @click="viewResults(analysis)"
                            >
                                <Icon icon="solar:eye-bold" class="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" @click="viewHistory(analysis)">
                                <Icon icon="solar:history-bold" class="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <!-- One-Time Analyses History Modal -->
        <Dialog v-model:open="showOneTimeHistoryModal">
            <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>One-Time Analyses History</DialogTitle>
                    <DialogDescription> All one-time analyses for this project </DialogDescription>
                </DialogHeader>

                <div class="space-y-2 mt-4">
                    <div
                        v-for="analysis in groupedAnalyses.oneTime"
                        :key="analysis.id"
                        class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="p-1 rounded-full border flex-shrink-0"
                                :class="getStatusColor(analysis.status)"
                            >
                                <Icon
                                    :icon="getStatusIcon(analysis.status)"
                                    class="w-3 h-3"
                                    :class="{
                                        'animate-spin': analysis.status === AnalysisStatus.STARTED
                                    }"
                                />
                            </div>
                            <div>
                                <div class="text-sm font-medium">
                                    {{
                                        analysis.status === AnalysisStatus.STARTED
                                            ? 'Running'
                                            : analysis.status === AnalysisStatus.COMPLETED ||
                                                analysis.status === AnalysisStatus.FINISHED
                                              ? 'Completed'
                                              : analysis.status === AnalysisStatus.FAILED ||
                                                  analysis.status === AnalysisStatus.FAILURE
                                                ? 'Failed'
                                                : 'Pending'
                                    }}
                                </div>
                                <div class="text-xs text-gray-500">
                                    {{ formatDate(analysis.created_on, 'MMM DD, HH:mm') }} •
                                    {{ formatDistanceToNow(new Date(analysis.created_on)) }} ago
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            <Button
                                v-if="
                                    analysis.status === AnalysisStatus.COMPLETED ||
                                    analysis.status === AnalysisStatus.FINISHED
                                "
                                variant="ghost"
                                size="sm"
                                @click="viewResults(analysis)"
                            >
                                <Icon icon="solar:eye-bold" class="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <!-- Delete confirmation modal -->
        <Dialog v-model:open="showDeleteModal">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Analysis</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this analysis? This action cannot be undone
                        and will permanently delete all results.
                    </DialogDescription>
                </DialogHeader>

                <div v-if="analysisToDelete" class="my-4 p-3 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">Created:</span>
                        {{ formatDate(analysisToDelete.created_on, 'MMM DD, YYYY HH:mm') }}
                    </p>
                    <p
                        v-if="
                            analysisToDelete.schedule_type &&
                            analysisToDelete.schedule_type !== 'once'
                        "
                        class="text-sm text-gray-600 mt-1"
                    >
                        <span class="font-medium">Schedule:</span>
                        {{ analysisToDelete.schedule_type }}
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        :disabled="isDeletingAnalysis"
                        @click="showDeleteModal = false"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        :disabled="isDeletingAnalysis"
                        @click="deleteAnalysis"
                    >
                        <Icon
                            v-if="isDeletingAnalysis"
                            icon="solar:refresh-linear"
                            class="w-4 h-4 mr-1 animate-spin"
                        />
                        {{ isDeletingAnalysis ? 'Deleting...' : 'Delete Analysis' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Analysis Runs Modal -->
        <AnalysisRuns
            v-if="showRunsModal && selectedAnalysis"
            :analysis="selectedAnalysis"
            :project-i-d="projectID"
            @close="showRunsModal = false"
        />
    </div>
</template>
