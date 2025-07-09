<script lang="ts" setup>
import { RouterLink } from 'vue-router';
import { formatDate, calculateDateDifference } from '@/utils/dateUtils';
import { ref, type Ref } from 'vue';
import {
    Analysis,
    AnalysisStage,
    AnalysisStatus
} from '@/codeclarity_components/analyses/analysis.entity';
import { Icon } from '@iconify/vue';
import { AnalysisRepository } from '@/codeclarity_components/analyses/analysis.repository';
import { errorToast, successToast } from '@/utils/toasts';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { APIErrors } from '@/utils/api/ApiErrors';
import { useUserStore } from '@/stores/user';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { Progress } from '@/shadcn/ui/progress';
import { Button } from '@/shadcn/ui/button';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shadcn/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/shadcn/ui/popover';

// State for modals
const showDeleteModal = ref(false);

const analysisRepository: AnalysisRepository = new AnalysisRepository();
// Stores
const authStore = useAuthStore();
const userStore = useUserStore();

const chartData: Ref<any | undefined> = ref();
const chartOptions: Ref<any | undefined> = ref();

const props = defineProps({
    analysis: {
        type: Object as () => Analysis,
        default: new Analysis()
    },
    projectID: {
        type: String,
        default: ''
    }
});

chartData.value = {
    datasets: [
        {
            data: []
        }
    ]
};
chartOptions.value = {
    h: 50,
    w: 300,
    margin: { top: 0, right: 0, bottom: 120, left: 50 }
};

async function deleteAnalysis() {
    if (!userStore.defaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    try {
        await analysisRepository.deleteAnalysis({
            orgId: userStore.defaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysis.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });

        successToast('Succesfully deleted the integration');
    } catch (_err) {
        if (_err instanceof BusinessLogicError) {
            if (_err.error_code == APIErrors.NotAuthorized) {
                errorToast('You are not authorized to perform this action.');
            } else if (_err.error_code == APIErrors.EntityNotFound) {
                errorToast('Succesfully deleted the integration');
            } else if (_err.error_code == APIErrors.InternalError) {
                errorToast('Failed to delete the integration.');
            } else {
                errorToast('Failed to delete the integration.');
            }
        } else {
            errorToast('Failed to delete the integration.');
        }
    } finally {
        router.go(0);
    }
}

function getAllStages(steps: AnalysisStage[][]): AnalysisStage[] {
    let stages: AnalysisStage[] = [];
    for (const step of steps) {
        stages = stages.concat(step);
    }
    return stages;
}

function getTotalSteps(steps: AnalysisStage[][]) {
    let count = 0;
    for (const step of steps) {
        count += step.length;
    }
    return count;
}

function getStepsDone(steps: AnalysisStage[][]) {
    let count = 0;
    for (const step of steps) {
        count += step.filter((stage) => stage.Status == AnalysisStatus.SUCCESS).length;
    }
    return count;
}

function getTimeDiff(stage: AnalysisStage) {
    if (!stage.Ended_on || !stage.Started_on) return '';

    let time = '';

    const hours = calculateDateDifference(stage.Ended_on, stage.Started_on, 'hours');
    const minutes = calculateDateDifference(stage.Ended_on, stage.Started_on, 'minutes') % 60;
    const seconds = calculateDateDifference(stage.Ended_on, stage.Started_on, 'seconds') % 60;
    const milliseconds =
        calculateDateDifference(stage.Ended_on, stage.Started_on, 'milliseconds') % 1000;

    if (hours > 0) time += hours + 'h ';
    if (minutes > 0) time += minutes + 'm ';
    if (seconds > 0) time += seconds + 's ';
    if (time == '' && milliseconds > 0) time += milliseconds + 'ms ';
    return time;
}

async function getChart(projectID: string, analysisID: string) {
    let res: DataResponse<Array<object>>;
    try {
        if (userStore.getDefaultOrg == null) {
            throw new Error('No default org');
        }

        if (authStore.getToken == null) {
            throw new Error('No token');
        }

        res = await analysisRepository.getAnalysisChartById({
            orgId: userStore.getDefaultOrg.id,
            projectId: projectID,
            analysisId: analysisID,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        chartData.value.datasets[0].data = res.data;
    } catch (_err) {
        console.error(_err);

        // error.value = true;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    } finally {
        // loading.value = false;
        // createDepTypeChart();
        // createDepStatusDistChart();
    }
}
getChart(props.projectID, props.analysis.id);
</script>
<template>
    <div v-if="props.analysis != null" class="w-full">
        <div
            class="flex gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-200"
        >
            <!-- Language/Tech icon with better styling -->
            <div class="flex-shrink-0 p-1.5 bg-amber-100 rounded-lg">
                <Icon icon="devicon:javascript" class="h-5 w-5" />
            </div>

            <!-- Analysis status and progress - takes available space -->
            <div class="flex-1 min-w-0 pr-3">
                <!-- Status indicator with enhanced design -->
                <div
                    v-if="
                        props.analysis.status == AnalysisStatus.COMPLETED ||
                        props.analysis.status == AnalysisStatus.FINISHED
                    "
                    class="space-y-2"
                >
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span class="text-sm font-medium text-slate-900">Completed</span>
                    </div>
                    <div class="text-xs text-slate-500">
                        {{ formatDate(props.analysis.created_on, 'MMM DD, YYYY [at] h:mm A') }}
                    </div>
                    <Popover>
                        <PopoverTrigger as-child>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                            >
                                View Details
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-96" align="end">
                            <div class="space-y-3">
                                <div class="flex items-center gap-3 pb-2 border-b border-slate-200">
                                    <div class="p-2 bg-blue-100 rounded-lg">
                                        <Icon
                                            icon="solar:document-text-bold"
                                            class="h-4 w-4 text-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <div class="font-semibold text-slate-900 text-sm">
                                            Analysis Details
                                        </div>
                                        <div class="text-xs text-slate-500">Execution overview</div>
                                    </div>
                                </div>
                                <div class="max-h-64 overflow-y-auto space-y-2">
                                    <div v-if="getAllStages(analysis.steps).length > 0">
                                        <div
                                            v-for="(stage, index) in getAllStages(analysis.steps)"
                                            :key="index"
                                            class="flex items-center justify-between p-2 rounded bg-slate-50"
                                        >
                                            <div class="flex items-center gap-2">
                                                <div
                                                    class="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium flex items-center justify-center"
                                                >
                                                    {{ index + 1 }}
                                                </div>
                                                <div
                                                    class="text-xs font-medium text-slate-900 uppercase"
                                                >
                                                    {{ stage.Name }}
                                                </div>
                                            </div>

                                            <div
                                                v-if="stage.Status == AnalysisStatus.STARTED"
                                                class="flex items-center gap-1 text-blue-600"
                                            >
                                                <span class="text-xs">Running</span>
                                                <Icon
                                                    icon="solar:refresh-linear"
                                                    class="h-3 w-3 animate-spin"
                                                />
                                            </div>

                                            <div
                                                v-else-if="stage.Status == AnalysisStatus.SUCCESS"
                                                class="flex items-center gap-1 text-emerald-600"
                                            >
                                                <span class="text-xs">{{
                                                    getTimeDiff(stage)
                                                }}</span>
                                                <Icon
                                                    icon="solar:check-circle-bold"
                                                    class="h-3 w-3"
                                                />
                                            </div>

                                            <div
                                                v-else
                                                class="flex items-center gap-1 text-red-600"
                                            >
                                                <span class="text-xs">Failed</span>
                                                <Icon
                                                    icon="solar:close-circle-bold"
                                                    class="h-3 w-3"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="text-center py-6">
                                        <div
                                            class="p-3 bg-slate-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center"
                                        >
                                            <Icon
                                                icon="solar:document-text-linear"
                                                class="h-6 w-6 text-slate-400"
                                            />
                                        </div>
                                        <div class="text-xs text-slate-600">
                                            No detailed steps available
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div
                    v-else-if="
                        props.analysis.status == AnalysisStatus.STARTED ||
                        props.analysis.status == AnalysisStatus.REQUESTED ||
                        props.analysis.status == AnalysisStatus.ONGOING ||
                        props.analysis.status == AnalysisStatus.UPDATING_DB
                    "
                    class="space-y-2"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span class="text-sm font-medium text-slate-900">Running</span>
                            <Icon
                                icon="solar:refresh-linear"
                                class="h-3 w-3 text-blue-500 animate-spin"
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger as-child>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                                >
                                    View Progress
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent class="w-96" align="end">
                                <div class="space-y-3">
                                    <div
                                        class="flex items-center gap-3 pb-2 border-b border-slate-200"
                                    >
                                        <div class="p-2 bg-blue-100 rounded-lg">
                                            <Icon
                                                icon="solar:hourglass-line"
                                                class="h-4 w-4 text-blue-600"
                                            />
                                        </div>
                                        <div>
                                            <div class="font-semibold text-slate-900 text-sm">
                                                Analysis Progress
                                            </div>
                                            <div class="text-xs text-slate-500">
                                                {{ getStepsDone(analysis.steps) }} of
                                                {{ getTotalSteps(analysis.steps) }} steps completed
                                            </div>
                                        </div>
                                    </div>
                                    <div class="max-h-64 overflow-y-auto space-y-2">
                                        <div v-if="getAllStages(analysis.steps).length > 0">
                                            <div
                                                v-for="(stage, index) in getAllStages(
                                                    analysis.steps
                                                )"
                                                :key="index"
                                                class="flex items-center justify-between p-2 rounded bg-slate-50"
                                            >
                                                <div class="flex items-center gap-2">
                                                    <div
                                                        class="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium flex items-center justify-center"
                                                    >
                                                        {{ index + 1 }}
                                                    </div>
                                                    <div
                                                        class="text-xs font-medium text-slate-900 uppercase"
                                                    >
                                                        {{ stage.Name }}
                                                    </div>
                                                </div>

                                                <div
                                                    v-if="stage.Status == AnalysisStatus.STARTED"
                                                    class="flex items-center gap-1 text-blue-600"
                                                >
                                                    <span class="text-xs">Running</span>
                                                    <Icon
                                                        icon="solar:refresh-linear"
                                                        class="h-3 w-3 animate-spin"
                                                    />
                                                </div>

                                                <div
                                                    v-else-if="
                                                        stage.Status == AnalysisStatus.SUCCESS
                                                    "
                                                    class="flex items-center gap-1 text-emerald-600"
                                                >
                                                    <span class="text-xs">{{
                                                        getTimeDiff(stage)
                                                    }}</span>
                                                    <Icon
                                                        icon="solar:check-circle-bold"
                                                        class="h-3 w-3"
                                                    />
                                                </div>

                                                <div
                                                    v-else
                                                    class="flex items-center gap-1 text-red-600"
                                                >
                                                    <span class="text-xs">Failed</span>
                                                    <Icon
                                                        icon="solar:close-circle-bold"
                                                        class="h-3 w-3"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="text-center py-6">
                                            <div
                                                class="p-3 bg-slate-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center"
                                            >
                                                <Icon
                                                    icon="solar:hourglass-line"
                                                    class="h-6 w-6 text-slate-400"
                                                />
                                            </div>
                                            <div class="text-xs text-slate-600">
                                                Analysis is starting up...
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div class="space-y-1">
                        <Progress
                            :model-value="
                                getTotalSteps(props.analysis.steps) > 0
                                    ? (getStepsDone(props.analysis.steps) /
                                          getTotalSteps(props.analysis.steps)) *
                                      100
                                    : 0
                            "
                            class="h-2"
                        />
                        <div class="text-xs text-slate-500">
                            {{ getStepsDone(props.analysis.steps) }} of
                            {{ getTotalSteps(props.analysis.steps) }} steps completed
                        </div>
                    </div>
                </div>

                <div v-else class="space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span class="text-sm font-medium text-red-700">Failed</span>
                        </div>
                        <Popover>
                            <PopoverTrigger as-child>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                                >
                                    View Error
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent class="w-96" align="end">
                                <div class="space-y-3">
                                    <div
                                        class="flex items-center gap-3 pb-2 border-b border-slate-200"
                                    >
                                        <div class="p-2 bg-red-100 rounded-lg">
                                            <Icon
                                                icon="solar:danger-triangle-bold"
                                                class="h-4 w-4 text-red-600"
                                            />
                                        </div>
                                        <div>
                                            <div class="font-semibold text-slate-900 text-sm">
                                                Analysis Failed
                                            </div>
                                            <div class="text-xs text-slate-500">
                                                Error details and logs
                                            </div>
                                        </div>
                                    </div>
                                    <div class="max-h-64 overflow-y-auto space-y-2">
                                        <div v-if="getAllStages(analysis.steps).length > 0">
                                            <div
                                                v-for="(stage, index) in getAllStages(
                                                    analysis.steps
                                                )"
                                                :key="index"
                                                class="flex items-center justify-between p-2 rounded bg-slate-50"
                                            >
                                                <div class="flex items-center gap-2">
                                                    <div
                                                        class="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium flex items-center justify-center"
                                                    >
                                                        {{ index + 1 }}
                                                    </div>
                                                    <div
                                                        class="text-xs font-medium text-slate-900 uppercase"
                                                    >
                                                        {{ stage.Name }}
                                                    </div>
                                                </div>

                                                <div
                                                    v-if="stage.Status == AnalysisStatus.STARTED"
                                                    class="flex items-center gap-1 text-blue-600"
                                                >
                                                    <span class="text-xs">Running</span>
                                                    <Icon
                                                        icon="solar:refresh-linear"
                                                        class="h-3 w-3 animate-spin"
                                                    />
                                                </div>

                                                <div
                                                    v-else-if="
                                                        stage.Status == AnalysisStatus.SUCCESS
                                                    "
                                                    class="flex items-center gap-1 text-emerald-600"
                                                >
                                                    <span class="text-xs">{{
                                                        getTimeDiff(stage)
                                                    }}</span>
                                                    <Icon
                                                        icon="solar:check-circle-bold"
                                                        class="h-3 w-3"
                                                    />
                                                </div>

                                                <div
                                                    v-else
                                                    class="flex items-center gap-1 text-red-600"
                                                >
                                                    <span class="text-xs">Failed</span>
                                                    <Icon
                                                        icon="solar:close-circle-bold"
                                                        class="h-3 w-3"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="text-center py-6">
                                            <div
                                                class="p-3 bg-red-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center"
                                            >
                                                <Icon
                                                    icon="solar:danger-triangle-bold"
                                                    class="h-6 w-6 text-red-500"
                                                />
                                            </div>
                                            <div class="text-xs text-slate-600">
                                                Analysis failed without detailed logs
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div class="text-xs text-slate-500">
                        {{ formatDate(props.analysis.created_on, 'MMM DD, YYYY [at] h:mm A') }}
                    </div>
                </div>
            </div>

            <!-- Quick actions positioned to the right -->
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
                <Button
                    v-if="
                        props.analysis.status == AnalysisStatus.COMPLETED ||
                        props.analysis.status == AnalysisStatus.FINISHED
                    "
                    variant="outline"
                    size="sm"
                    class="h-8 px-3 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    as-child
                >
                    <RouterLink
                        :to="{
                            name: 'results',
                            query: { analysis_id: props.analysis.id, project_id: props.projectID }
                        }"
                        class="inline-flex items-center gap-1"
                    >
                        <Icon icon="solar:eye-linear" class="h-3 w-3" />
                        View Report
                    </RouterLink>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                    @click="showDeleteModal = true"
                >
                    <Icon icon="solar:trash-bin-trash-linear" class="h-3 w-3" />
                </Button>
            </div>
        </div>

        <!-- Enhanced delete modal -->
        <Dialog v-model:open="showDeleteModal">
            <DialogContent class="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle class="flex items-center gap-3">
                        <div class="p-2 bg-red-100 rounded-lg">
                            <Icon icon="solar:trash-bin-trash-bold" class="h-5 w-5 text-red-600" />
                        </div>
                        <div class="text-lg font-semibold text-slate-900">Delete Analysis</div>
                    </DialogTitle>
                </DialogHeader>
                <div class="space-y-4">
                    <div class="text-sm text-slate-600">
                        Are you sure you want to permanently delete this analysis?
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="text-sm font-medium text-slate-900">Analysis Details</div>
                        <div class="text-xs text-slate-500 mt-1">
                            Started
                            {{ formatDate(props.analysis.created_on, 'MMM DD, YYYY [at] h:mm A') }}
                        </div>
                    </div>
                    <Alert variant="destructive">
                        <Icon icon="solar:danger-triangle-bold" class="h-4 w-4" />
                        <AlertDescription>
                            This action cannot be undone. All analysis data and results will be
                            permanently deleted.
                        </AlertDescription>
                    </Alert>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                    <Button variant="outline" @click="showDeleteModal = false"> Cancel </Button>
                    <Button
                        variant="destructive"
                        @click="
                            deleteAnalysis();
                            showDeleteModal = false;
                        "
                    >
                        <Icon icon="solar:trash-bin-trash-linear" class="h-4 w-4 mr-2" />
                        Delete Analysis
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
