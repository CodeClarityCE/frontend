<script lang="ts" setup>
// Chart.js imports removed - using d3 components
// Chart.js registration removed
import type { GroupedBarChartData } from '@/base_components/data-display/charts/groupedBarChart';
import GroupedBarChart from '@/base_components/data-display/charts/GroupedBarChart.vue';
import type { RadarChartData } from '@/base_components/data-display/charts/radarChart';
import RadarChart from '@/base_components/data-display/charts/RadarChart.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import TextLoader from '@/base_components/ui/loaders/TextLoader.vue';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { PatchingStats } from '@/codeclarity_components/results/stats.entity';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { Icon } from '@iconify/vue';
import { ref, type Ref, watch } from 'vue';
// Chart.js registration removed

interface Props {
    analysisID?: string;
    projectID?: string;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

watch(
    () => props.projectID,
    () => {
        void getPatchesStats();
    }
);
watch(
    () => props.analysisID,
    () => {
        void getPatchesStats();
    }
);

// Repositories
const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const render: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);

// Chart initialization data removed - using d3 components
const stats: Ref<PatchingStats> = ref(new PatchingStats());
const severity_data: Ref<GroupedBarChartData> = ref({ categories: [], groups: [] });
const cia_data: Ref<RadarChartData> = ref([]);

const boxLoaderDimensions = {
    width: '100px',
    height: '40px'
};

void getPatchesStats();

async function getPatchesStats(refresh = false): Promise<void> {
    if (!userStore.getDefaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    if (!authStore.getAuthenticated || !props.analysisID) return;
    if (props.projectID === '' || props.analysisID === '') return;

    let res: DataResponse<PatchingStats>;
    try {
        res = await resultsRepository.getPatchesStat({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: '.',
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        stats.value = res.data;
        render.value = true;
    } catch (_err) {
        console.error(_err);

        error.value = true;
        render.value = false;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    } finally {
        // loading.value = false;
        void createSeverityDistChart();
        void createRadarChart();
    }
}

function createRadarChart(): void {
    // Convert to d3 RadarChart format with multiple datasets
    const d3_data: RadarChartData = [
        {
            name: 'Before Patch',
            axes: [
                {
                    axis: 'Confidentiality',
                    value: parseFloat(
                        stats.value.before_patch_overall_confidentiality_impact.toFixed(1)
                    )
                },
                {
                    axis: 'Integrity',
                    value: parseFloat(stats.value.before_patch_overall_integrity_impact.toFixed(1))
                },
                {
                    axis: 'Availability',
                    value: parseFloat(
                        stats.value.before_patch_overall_availability_impact.toFixed(1)
                    )
                }
            ]
        },
        {
            name: 'After Patch',
            axes: [
                {
                    axis: 'Confidentiality',
                    value: parseFloat(
                        stats.value.after_patch_overall_confidentiality_impact.toFixed(1)
                    )
                },
                {
                    axis: 'Integrity',
                    value: parseFloat(stats.value.after_patch_overall_integrity_impact.toFixed(1))
                },
                {
                    axis: 'Availability',
                    value: parseFloat(
                        stats.value.after_patch_overall_availability_impact.toFixed(1)
                    )
                }
            ]
        }
    ];

    cia_data.value = d3_data;
}

function createSeverityDistChart(): void {
    const categories: string[] = [];
    const beforeData: number[] = [];
    const afterData: number[] = [];

    // Build data arrays for categories that have non-zero values
    if (
        stats.value.after_patch_number_of_critical !== 0 ||
        stats.value.before_patch_number_of_critical !== 0
    ) {
        categories.push('Critical');
        beforeData.push(stats.value.before_patch_number_of_critical);
        afterData.push(stats.value.after_patch_number_of_critical);
    }

    if (
        stats.value.after_patch_number_of_high !== 0 ||
        stats.value.before_patch_number_of_high !== 0
    ) {
        categories.push('High');
        beforeData.push(stats.value.before_patch_number_of_high);
        afterData.push(stats.value.after_patch_number_of_high);
    }

    if (
        stats.value.after_patch_number_of_medium !== 0 ||
        stats.value.before_patch_number_of_medium !== 0
    ) {
        categories.push('Medium');
        beforeData.push(stats.value.before_patch_number_of_medium);
        afterData.push(stats.value.after_patch_number_of_medium);
    }

    if (
        stats.value.after_patch_number_of_low !== 0 ||
        stats.value.before_patch_number_of_low !== 0
    ) {
        categories.push('Low');
        beforeData.push(stats.value.before_patch_number_of_low);
        afterData.push(stats.value.after_patch_number_of_low);
    }

    if (
        stats.value.after_patch_number_of_none !== 0 ||
        stats.value.before_patch_number_of_none !== 0
    ) {
        categories.push('None');
        beforeData.push(stats.value.before_patch_number_of_none);
        afterData.push(stats.value.after_patch_number_of_none);
    }

    // Convert to d3 GroupedBarChart format
    const d3_data: GroupedBarChartData = {
        categories: categories,
        groups: [
            {
                name: 'Before Patch',
                color: '#19A7CE',
                data: beforeData
            },
            {
                name: 'After Patch',
                color: '#146C94',
                data: afterData
            }
        ]
    };

    severity_data.value = d3_data;
}
</script>

<template>
    <div class="summary-wrapper findings-summary-wrapper" style="font-size: 1rem; flex-wrap: wrap">
        <div class="summary-container summary-container-chart">
            <div class="summary-container-chart-text-wrapper">
                <div class="summary-container-chart-inner-text-wrapper">
                    <div
                        v-if="render"
                        class="summary-container-chart-text-header-wrapper align-center"
                    >
                        <span
                            class="summary-container-chart-text-header-title flex flex-row gap-2 items-center"
                        >
                            Severities
                            <span
                                class="flex flex-row items-center"
                                style="font-size: 0.9em; color: #b5b5b5"
                                >(before
                                <Icon :icon="'ic:twotone-chevron-right'"></Icon>
                                after)
                            </span></span
                        >
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="
                            render &&
                            (stats.after_patch_number_of_critical !== 0 ||
                                stats.before_patch_number_of_critical !== 0)
                        "
                        class="side-stats"
                    >
                        <div class="side-stats-circle" style="background-color: #7400b8"></div>
                        <div class="side-stats-text-wrapper flex flex-row justify-between">
                            <div>Critical</div>
                            <div
                                class="side-stats-text-value flex flex-row items-center w-fit"
                                style="color: #7400b8"
                            >
                                {{ stats.before_patch_number_of_critical }}
                                <Icon
                                    :icon="'ic:twotone-chevron-right'"
                                    style="color: #b5b5b5"
                                ></Icon>
                                {{ stats.after_patch_number_of_critical }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="
                            render &&
                            (stats.after_patch_number_of_high !== 0 ||
                                stats.before_patch_number_of_high !== 0)
                        "
                        class="side-stats"
                    >
                        <div class="side-stats-circle" style="background-color: #6930c3"></div>
                        <div
                            class="side-stats-text-wrapper flex flex-row justify-between items-center"
                        >
                            <div>High</div>
                            <div
                                class="side-stats-text-value flex flex-row items-center w-fit"
                                style="color: #6930c3"
                            >
                                {{ stats.before_patch_number_of_high }}
                                <Icon
                                    :icon="'ic:twotone-chevron-right'"
                                    style="color: #b5b5b5"
                                ></Icon>
                                {{ stats.after_patch_number_of_high }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="
                            render &&
                            (stats.after_patch_number_of_medium !== 0 ||
                                stats.before_patch_number_of_medium !== 0)
                        "
                        class="side-stats"
                    >
                        <div class="side-stats-circle" style="background-color: #5e60ce"></div>
                        <div
                            class="side-stats-text-wrapper flex flex-row justify-between items-center"
                        >
                            <div>Medium</div>
                            <div
                                class="side-stats-text-value flex flex-row items-center w-fit"
                                style="color: #5e60ce"
                            >
                                {{ stats.before_patch_number_of_medium }}
                                <Icon
                                    :icon="'ic:twotone-chevron-right'"
                                    style="color: #b5b5b5"
                                ></Icon>
                                {{ stats.after_patch_number_of_medium }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="
                            render &&
                            (stats.after_patch_number_of_low !== 0 ||
                                stats.before_patch_number_of_low !== 0)
                        "
                        class="side-stats"
                    >
                        <div class="side-stats-circle" style="background-color: #5390d9"></div>
                        <div
                            class="side-stats-text-wrapper flex flex-row justify-between items-center"
                        >
                            <div>Low</div>
                            <div
                                class="side-stats-text-value flex flex-row items-center w-fit"
                                style="color: #5390d9"
                            >
                                {{ stats.before_patch_number_of_low }}
                                <Icon
                                    :icon="'ic:twotone-chevron-right'"
                                    style="color: #b5b5b5"
                                ></Icon>
                                {{ stats.after_patch_number_of_low }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="
                            render &&
                            (stats.after_patch_number_of_none !== 0 ||
                                stats.before_patch_number_of_none !== 0)
                        "
                        class="side-stats"
                    >
                        <div class="side-stats-circle" style="background-color: #19a7ce"></div>
                        <div
                            class="side-stats-text-wrapper flex flex-row justify-between items-center"
                        >
                            <div>None</div>
                            <div class="side-stats-text-value flex flex-row items-center w-fit">
                                {{ stats.before_patch_number_of_none }}
                                <Icon
                                    :icon="'ic:twotone-chevron-right'"
                                    style="color: #b5b5b5"
                                ></Icon>
                                {{ stats.after_patch_number_of_none }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div v-if="render" class="chart-wrapper">
                    <GroupedBarChart
                        id="patching-severity-bar-chart"
                        :data="severity_data"
                        :options="{
                            w: 200,
                            h: 200,
                            padding: 0.1,
                            groupPadding: 0.2,
                            rounded: true,
                            showLabels: false,
                            shadow: false
                        }"
                    />
                </div>
                <div v-if="!render" style="max-height: 200px; max-width: 200px">
                    <div
                        style="
                            display: flex;
                            flex-direction: row;
                            column-gap: 1em;
                            align-items: flex-end;
                        "
                    >
                        <BoxLoader :dimensions="{ height: '30px', width: '40px' }" />
                        <BoxLoader :dimensions="{ height: '60px', width: '40px' }" />
                        <BoxLoader :dimensions="{ height: '150px', width: '40px' }" />
                    </div>
                </div>
            </div>
            <div class="stats-divider hide-on-collpase"></div>
        </div>
        <div class="summary-container summary-container-chart">
            <div class="summary-container-chart-text-wrapper">
                <div class="summary-container-chart-inner-text-wrapper">
                    <div v-if="render" class="summary-container-chart-text-header-wrapper">
                        <span class="summary-container-chart-text-header-title flex flex-row gap-2"
                            >Security Impact
                            <span
                                class="flex flex-row items-center"
                                style="font-size: 0.9em; color: #b5b5b5"
                                >(before
                                <Icon :icon="'ic:twotone-chevron-right'"></Icon>
                                after)
                            </span></span
                        >
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: gray"></div>
                        <div class="side-stats-text-wrapper flex flex-row justify-between">
                            <div>Confidentiality</div>
                            <div
                                class="side-stats-text-value flex flex-row items-center w-fit"
                                style=""
                            >
                                {{
                                    stats.before_patch_overall_confidentiality_impact?.toFixed(1) ??
                                    0
                                }}
                                <Icon
                                    :icon="'ic:twotone-chevron-right'"
                                    style="color: #b5b5b5"
                                ></Icon>
                                {{
                                    stats.after_patch_overall_confidentiality_impact?.toFixed(1) ??
                                    0
                                }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: gray"></div>
                        <div class="side-stats-text-wrapper flex flex-row justify-between">
                            <div>Availability</div>
                            <div
                                class="side-stats-text-value flex flex-row items-center w-fit"
                                style=""
                            >
                                {{
                                    stats.before_patch_overall_availability_impact?.toFixed(1) ?? 0
                                }}
                                <Icon
                                    :icon="'ic:twotone-chevron-right'"
                                    style="color: #b5b5b5"
                                ></Icon>
                                {{ stats.after_patch_overall_availability_impact?.toFixed(1) ?? 0 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: gray"></div>
                        <div class="side-stats-text-wrapper flex flex-row justify-between">
                            <div>Integrity</div>
                            <div
                                class="side-stats-text-value flex flex-row items-center w-fit"
                                style=""
                            >
                                {{ stats.before_patch_overall_integrity_impact?.toFixed(1) ?? 0 }}
                                <Icon
                                    :icon="'ic:twotone-chevron-right'"
                                    style="color: #b5b5b5"
                                ></Icon>
                                {{ stats.after_patch_overall_integrity_impact?.toFixed(1) ?? 0 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                </div>
            </div>
            <div>
                <div style="position: relative; width: 200px; height: 200px; margin-right: 10px">
                    <div style="position: absolute">
                        <svg height="200" width="200">
                            <line
                                style="stroke: rgb(206, 206, 206); stroke-width: 2px"
                                x1="100"
                                x2="200"
                                y1="130"
                                y2="185"
                            />
                            <line
                                style="stroke: rgb(206, 206, 206); stroke-width: 2px"
                                x1="100"
                                x2="0"
                                y2="185"
                                y1="130"
                            />
                            <line
                                style="stroke: rgb(206, 206, 206); stroke-width: 2px"
                                x1="100"
                                x2="100"
                                y1="30"
                                y2="130"
                            />
                        </svg>
                    </div>
                    <div
                        style="
                            position: absolute;
                            left: 10px;
                            top: 45px;
                            transform: rotate(-60deg);
                            font-weight: 500;
                            color: rgb(70, 70, 70);
                        "
                    >
                        Confidentiality
                    </div>
                    <div
                        style="
                            position: absolute;
                            bottom: 44px;
                            right: -15px;
                            font-weight: 500;
                            color: rgb(70, 70, 70);
                            font-family: roboto;
                            transform: rotate(60deg);
                        "
                    >
                        Integrity
                    </div>
                    <div
                        style="
                            position: absolute;
                            bottom: 0px;
                            left: 10px;
                            font-weight: 500;
                            color: rgb(70, 70, 70);
                        "
                    >
                        Availability
                    </div>
                    <div
                        v-if="render"
                        style="
                            position: absolute;
                            height: 212px !important;
                            width: 212px !important;
                            margin-top: 20px;
                            margin-left: -6px;
                        "
                    >
                        <RadarChart
                            id="patching-cia-radar-chart"
                            :data="cia_data"
                            :options="{
                                w: 212,
                                h: 212,
                                margin: { top: 20, right: 20, bottom: 20, left: 20 },
                                levels: 5,
                                maxValue: Math.ceil(
                                    Math.max(
                                        stats.before_patch_overall_confidentiality_impact,
                                        stats.before_patch_overall_integrity_impact,
                                        stats.before_patch_overall_availability_impact,
                                        stats.after_patch_overall_confidentiality_impact,
                                        stats.after_patch_overall_integrity_impact,
                                        stats.after_patch_overall_availability_impact
                                    ) || 1
                                ),
                                labelFactor: 1.15,
                                wrapWidth: 40,
                                opacityArea: 0.35,
                                dotRadius: 3,
                                opacityCircles: 0.1,
                                strokeWidth: 2,
                                roundStrokes: false,
                                legend: false
                            }"
                        />
                    </div>
                </div>
            </div>
            <div class="stats-divider hide-on-collpase"></div>
        </div>
        <div class="summary-container summary-container-quick-stats">
            <div class="summary-stacked-container-wrapper">
                <div v-if="stats !== null" class="summary-container">
                    <div class="title">Number of issues</div>
                    <div
                        class="single-value-summary single-value-summary-column-gap-20"
                        style="height: fit-content"
                    >
                        <div v-if="render" class="flex flex-row gap-2 items-center w-fit">
                            <span>{{ stats.before_patch_number_of_issues }} </span>
                            <Icon :icon="'ic:twotone-chevron-right'" style="color: #b5b5b5"></Icon>
                            <span>{{ stats.after_patch_number_of_issues }}</span>
                        </div>
                        <BoxLoader v-if="!render" :dimensions="boxLoaderDimensions" />
                    </div>
                </div>
                <div v-if="stats !== null" class="summary-container">
                    <div class="title">Number of vulnerabilities</div>
                    <div
                        class="single-value-summary single-value-summary-column-gap-20"
                        style="height: fit-content"
                    >
                        <div v-if="render" class="flex flex-row gap-2 items-center w-fit">
                            <span>{{ stats.before_patch_number_of_vulnerabilities ?? 0 }} </span>
                            <Icon :icon="'ic:twotone-chevron-right'" style="color: #b5b5b5"></Icon>
                            <span>{{ stats.after_patch_number_of_vulnerabilities }}</span>
                        </div>
                        <BoxLoader v-if="!render" :dimensions="boxLoaderDimensions" />
                    </div>
                </div>
            </div>
            <div class="summary-stacked-container-wrapper">
                <div v-if="stats !== null" class="summary-container">
                    <div class="title">Number of vulnerable dependencies</div>
                    <div
                        class="single-value-summary single-value-summary-column-gap-20"
                        style="height: fit-content"
                    >
                        <div v-if="render" class="flex flex-row gap-2 items-center w-fit">
                            <span
                                >{{ stats.before_patch_number_of_vulnerable_dependencies ?? 0 }}
                            </span>
                            <Icon :icon="'ic:twotone-chevron-right'" style="color: #b5b5b5"></Icon>
                            <span>{{
                                stats.after_patch_number_of_vulnerable_dependencies ?? 0
                            }}</span>
                        </div>
                        <BoxLoader v-if="!render" :dimensions="boxLoaderDimensions" />
                    </div>
                </div>
            </div>
        </div>

        <Alert v-if="error" variant="destructive">
            <Icon :icon="'ic:twotone-warning'"></Icon>
            <AlertDescription>
                Encountered Error during the rendering of the stats.
            </AlertDescription>
        </Alert>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/common/summary.scss';
@use '@/assets/common/chart.scss';
</style>
