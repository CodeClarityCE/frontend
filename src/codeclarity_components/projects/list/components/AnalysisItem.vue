<template>
    <div v-if="props.analysis != null">
        <div class="flex gap-2 w-full">
            <Icon v-if="true" :icon="'devicon:javascript'" class="text-3xl rounded-lg"></Icon>
            <div
                :id="'finished-button-' + props.analysis.id"
                v-if="
                    props.analysis.status == AnalysisStatus.COMPLETED ||
                    props.analysis.status == AnalysisStatus.FINISHED
                "
                class="flex flex-grow gap-2 justify-between items-center cursor-pointer text-severityLow"
                title="Get details about the analysis execution"
                @click="finished_modal_ref.toggle()"
            >
                Finished
            </div>
            <div
                v-else-if="
                    props.analysis.status == AnalysisStatus.STARTED ||
                    props.analysis.status == AnalysisStatus.REQUESTED ||
                    props.analysis.status == AnalysisStatus.ONGOING ||
                    props.analysis.status == AnalysisStatus.UPDATING_DB
                "
                :id="'finished-button-' + props.analysis.id"
                class="flex flex-grow gap-2 justify-between items-center cursor-pointer text-primary"
                @click="finished_modal_ref.toggle()"
            >
                Running
                <Progress
                    :model-value="
                        (getStepsDone(props.analysis.steps) / getTotalSteps(props.analysis.steps)) *
                        100
                    "
                    class="w-full"
                ></Progress>
                <Icon icon="fluent:circle-hint-20-regular" class="animate-spin text-2xl"> </Icon>
            </div>

            <div
                v-else
                :id="'finished-button-' + props.analysis.id"
                class="flex flex-grow gap-2 justify-between items-center cursor-pointer text-severityHigh"
                title="Get details about the analysis execution"
                @click="finished_modal_ref.toggle()"
            >
                Failed
            </div>
            <PositionedModal
                ref="finished_modal_ref"
                :tracker="'finished-button-' + props.analysis.id"
                :position="'top'"
                :show-title-divider="false"
                :show-title="false"
                :show-sub-title="false"
                :margin-target="15"
            >
                <template #content>
                    <div class="flex flex-col gap-4 min-w-96">
                        <div v-for="(stage, index) in getAllStages(analysis.steps)" :key="index">
                            <div class="flex flex-row gap-2 items-center justify-between w-full">
                                <div class="flex flex-row gap-2 items-center">
                                    <div
                                        class="flex-shrink-0 bg-gray-300 text-gray-500 rounded-full w-6 h-6 pl-2 pt-[0.2px]"
                                    >
                                        {{ index + 1 }}
                                    </div>
                                    <div class="uppercase">
                                        {{ stage.Name }}
                                    </div>
                                </div>
                                <div v-if="stage.Status == AnalysisStatus.STARTED">
                                    <div class="flex gap-2 items-center">
                                        <div>running</div>
                                        <Icon
                                            icon="fluent:circle-hint-20-regular"
                                            class="text-primary animate-spin text-2xl"
                                        ></Icon>
                                    </div>
                                </div>
                                <div v-else-if="stage.Status == AnalysisStatus.SUCCESS">
                                    <div class="flex gap-2 items-center">
                                        took
                                        {{ getTimeDiff(stage) }}
                                        <Icon
                                            icon="bi:check-circle-fill"
                                            class="text-severityLow text-xl"
                                        />
                                    </div>
                                </div>
                                <div v-else>
                                    <div class="flex gap-2 items-center">
                                        Waiting to start
                                        <Icon
                                            icon="ph:hourglass"
                                            class="text-severityLow text-2xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </PositionedModal>
        </div>
        <!-- Status -->
        <div class="flex gap-2 pt-2">
            <span>Start date:</span>
            <span class="font-semibold text-muted-foreground">
                {{ moment(props.analysis.created_on).format('LL') }}
                @
                {{ moment(props.analysis.created_on).format('HH:mm:ss') }}
            </span>
        </div>
        <!-- BUTONS -->
        <div class="flex gap-2 items-center justify-center pt-4">
            <RouterLink
                v-if="
                    props.analysis.status == AnalysisStatus.FINISHED ||
                    props.analysis.status == AnalysisStatus.COMPLETED ||
                    (props.analysis.status == AnalysisStatus.STARTED &&
                        props.analysis.steps.length > 0)
                "
                :to="{
                    name: 'results',
                    query: { analysis_id: props.analysis.id, project_id: props.projectID }
                }"
            >
                <Button>
                    <div class="whitespace-nowrap">
                        {{
                            props.analysis.status == AnalysisStatus.FINISHED ||
                            props.analysis.status == AnalysisStatus.COMPLETED
                                ? 'View Report'
                                : 'View Partial Report'
                        }}
                    </div>
                </Button>
            </RouterLink>
            <Button :variant="'destructive'" @click="analysis_delete_modal_ref.toggle()">
                <Icon icon="oi:trash" class="mr-2" /> Delete
            </Button>
        </div>

        <!-- <div class="w-full flex flex-col items-center">
            <HeatMapChart
                :chart-data="chartData"
                :chart-options="chartOptions"
                :id="'heatmap-chart-' + props.analysis.id"
                :hideAxis="true"
            ></HeatMapChart>
        </div> -->
    </div>
    <CenteredModal ref="analysis_delete_modal_ref">
        <template #title>
            <div class="flex items-center gap-2 justify-between">
                <div>Delete analysis?</div>
            </div>
        </template>
        <template #content>
            <div class="flex flex-col gap-6 max-w-96 w-screen">
                <div>Are you sure you want to delete the analysis?</div>
                <InfoBoxRed>
                    <template #content>
                        <div class="content flex gap-2 items-center">
                            <div>
                                <Icon icon="ic:twotone-warning" scale="1.25" />
                            </div>
                            <div>This action is permanent and cannot be reverted.</div>
                        </div>
                    </template>
                </InfoBoxRed>
            </div>
        </template>
        <template #buttons>
            <AlertButton
                @click="
                    deleteAnalysis();
                    analysis_delete_modal_ref.toggle();
                "
            >
                <template #icon>
                    <Icon icon="oi:trash" />
                </template>
                <template #text>Delete</template>
            </AlertButton>
            <NormalButton @click="analysis_delete_modal_ref.toggle()">
                <template #text>Cancel</template>
            </NormalButton>
        </template>
    </CenteredModal>
</template>
<script lang="ts" setup>
import { RouterLink } from 'vue-router';
import moment from 'moment';
import PositionedModal from '@/base_components/PositionedModal.vue';
import { ref, type Ref } from 'vue';
import { Analysis, AnalysisStage, AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';
import { Icon } from '@iconify/vue';
import CenteredModal from '@/base_components/CenteredModal.vue';
import AlertButton from '@/base_components/buttons/AlertButton.vue';
import NormalButton from '@/base_components/buttons/NormalButton.vue';
import InfoBoxRed from '@/base_components/info_box/InfoBoxRed.vue';
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

const analysis_delete_modal_ref: Ref<typeof CenteredModal> = ref(CenteredModal);
const finished_modal_ref: Ref<typeof PositionedModal> = ref(PositionedModal);

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
    for (let step of steps) {
        stages = stages.concat(step);
    }
    return stages;
}

function getTotalSteps(steps: AnalysisStage[][]) {
    let count = 0;
    for (let step of steps) {
        count += step.length;
    }
    return count;
}

function getStepsDone(steps: AnalysisStage[][]) {
    let count = 0;
    for (let step of steps) {
        count += step.filter((stage) => stage.Status == AnalysisStatus.SUCCESS).length;
    }
    return count;
}

function getTimeDiff(stage: AnalysisStage) {
    let t1 = moment(stage.Ended_on),
        t2 = moment(stage.Started_on),
        time = '';

    if (t1.diff(t2, 'hours') > 0) time += t1.diff(t2, 'hours') + 'h ';
    if (t1.diff(t2, 'minutes') > 0) time += t1.diff(t2, 'minutes') + 'm ';
    if (t1.diff(t2, 'seconds') > 0) time += t1.diff(t2, 'seconds') + 's ';
    if (time == '' && t1.diff(t2, 'milliseconds') > 0) time += t1.diff(t2, 'milliseconds') + 'ms ';
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
