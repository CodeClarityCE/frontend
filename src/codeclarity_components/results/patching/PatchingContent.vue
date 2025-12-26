<script lang="ts" setup>
import type { GroupedBarChartData } from '@/base_components/data-display/charts/groupedBarChart';
import GroupedBarChart from '@/base_components/data-display/charts/GroupedBarChart.vue';
import type { RadarChartData } from '@/base_components/data-display/charts/radarChart';
import RadarChart from '@/base_components/data-display/charts/RadarChart.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import TextLoader from '@/base_components/ui/loaders/TextLoader.vue';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { PatchingStats } from '@/codeclarity_components/results/stats.entity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { Icon } from '@iconify/vue';
import { ref, type Ref, watch } from 'vue';
import SelectWorkspace from '../SelectWorkspace.vue';
import Patches from './PatchingPatches.vue';
import PatchesTable from './PatchingTable.vue';

// Chart.js imports removed - using d3 components
// Chart.js registration removed

export interface Props {
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
const selected_workspace: Ref<string> = ref('.');

// Chart initialization data removed - using d3 components
const stats: Ref<PatchingStats> = ref(new PatchingStats());
const severity_data: Ref<GroupedBarChartData> = ref({ categories: [], groups: [] });
const cia_data: Ref<RadarChartData> = ref([]);

void getPatchesStats();

watch(selected_workspace, () => getPatchesStats());

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
            workspace: selected_workspace.value,
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
    <SelectWorkspace
        v-model:error="error"
        v-model:selected_workspace="selected_workspace"
        :project-i-d="projectID"
        :analysis-i-d="analysisID"
    ></SelectWorkspace>
    <div value="sbom" class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card class="col-span-2">
                <CardHeader>
                    <CardTitle>Severities</CardTitle>
                    <CardDescription> (before > after) </CardDescription>
                </CardHeader>
                <CardContent class="flex justify-between items-center">
                    <div>
                        <TextLoader v-if="!render" />
                        <div
                            v-if="
                                render &&
                                (stats.after_patch_number_of_critical !== 0 ||
                                    stats.before_patch_number_of_critical !== 0)
                            "
                            class="flex gap-2 items-center"
                        >
                            <Icon :icon="'ph:circle-fill'" class="text-[#7400b8]"></Icon>
                            <div class="flex flex-row justify-between gap-2">
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
                            class="flex gap-2 items-center"
                        >
                            <Icon :icon="'ph:circle-fill'" class="text-[#6930c3]"></Icon>
                            <div class="flex flex-row justify-between gap-2">
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
                            class="flex gap-2 items-center"
                        >
                            <Icon :icon="'ph:circle-fill'" class="text-[#5e60ce]"></Icon>
                            <div class="flex flex-row justify-between gap-2">
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
                            class="flex gap-2 items-center"
                        >
                            <Icon :icon="'ph:circle-fill'" class="text-[#5390d9]"></Icon>
                            <div class="flex flex-row justify-between gap-2">
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
                            class="flex gap-2 items-center"
                        >
                            <Icon :icon="'ph:circle-fill'" class="text-[#19a7ce]"></Icon>
                            <div class="flex flex-row justify-between gap-2">
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

                    <div v-if="render" class="chart-wrapper">
                        <GroupedBarChart
                            id="patching-content-severity-bar-chart"
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
                </CardContent>
            </Card>
            <Card class="col-span-2">
                <CardHeader>
                    <CardTitle>Security Impact</CardTitle>
                    <CardDescription> (before > after) </CardDescription>
                </CardHeader>
                <CardContent class="flex justify-between items-center">
                    <div class="flex flex-wrap gap-2 items-center justify-center">
                        <div class="flex gap-2 items-center justify-center">
                            <div class="">
                                <TextLoader v-if="!render" />
                                <div v-if="render" class="flex gap-2 items-center">
                                    <Icon :icon="'ph:circle-fill'" class="text-[#b5b5b5]"></Icon>
                                    <div class="flex flex-row justify-between gap-2">
                                        <div>Confidentiality</div>
                                        <div class="flex flex-row items-center" style="">
                                            {{
                                                stats.before_patch_overall_confidentiality_impact?.toFixed(
                                                    1
                                                ) ?? 0
                                            }}
                                            <Icon
                                                :icon="'ic:twotone-chevron-right'"
                                                style="color: #b5b5b5"
                                            ></Icon>
                                            {{
                                                stats.after_patch_overall_confidentiality_impact?.toFixed(
                                                    1
                                                ) ?? 0
                                            }}
                                        </div>
                                    </div>
                                </div>
                                <TextLoader v-if="!render" />
                                <div v-if="render" class="flex gap-2 items-center">
                                    <Icon :icon="'ph:circle-fill'" class="text-[#b5b5b5]"></Icon>
                                    <div class="flex flex-row justify-between gap-2">
                                        <div>Availability</div>
                                        <div class="flex flex-row items-center" style="">
                                            {{
                                                stats.before_patch_overall_availability_impact?.toFixed(
                                                    1
                                                ) ?? 0
                                            }}
                                            <Icon
                                                :icon="'ic:twotone-chevron-right'"
                                                style="color: #b5b5b5"
                                            ></Icon>
                                            {{
                                                stats.after_patch_overall_availability_impact?.toFixed(
                                                    1
                                                ) ?? 0
                                            }}
                                        </div>
                                    </div>
                                </div>
                                <TextLoader v-if="!render" />
                                <div v-if="render" class="flex gap-2 items-center">
                                    <Icon :icon="'ph:circle-fill'" class="text-[#b5b5b5]"></Icon>
                                    <div class="flex flex-row justify-between gap-2">
                                        <div>Integrity</div>
                                        <div class="flex flex-row items-center">
                                            {{
                                                stats.before_patch_overall_integrity_impact?.toFixed(
                                                    1
                                                ) ?? 0
                                            }}
                                            <Icon
                                                :icon="'ic:twotone-chevron-right'"
                                                style="color: #b5b5b5"
                                            ></Icon>
                                            {{
                                                stats.after_patch_overall_integrity_impact?.toFixed(
                                                    1
                                                ) ?? 0
                                            }}
                                        </div>
                                    </div>
                                </div>
                                <TextLoader v-if="!render" />
                            </div>
                        </div>
                        <div>
                            <div
                                style="
                                    position: relative;
                                    width: 200px;
                                    height: 200px;
                                    margin-right: 10px;
                                "
                            >
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
                                        id="patching-content-cia-radar-chart"
                                        :data="cia_data"
                                        :options="{
                                            w: 212,
                                            h: 212,
                                            margin: { top: 20, right: 20, bottom: 20, left: 20 },
                                            levels: 5,
                                            maxValue: 100,
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
                    </div>
                </CardContent>
            </Card>
            <Card class="flex flex-col">
                <CardHeader>
                    <CardTitle> Issues </CardTitle>
                </CardHeader>
                <CardContent class="flex flex-col items-center justify-center flex-grow">
                    <div class="text-4xl font-bold flex gap-1 items-baseline">
                        {{ stats.after_patch_number_of_issues }}
                        <p class="text-sm text-muted-foreground">after patch</p>
                    </div>
                    <div class="text-2xl font-bold flex gap-1 items-baseline">
                        {{ stats.before_patch_number_of_issues }}
                        <p class="text-sm text-muted-foreground">before patch</p>
                    </div>
                </CardContent>
            </Card>
            <Card class="flex flex-col">
                <CardHeader>
                    <CardTitle> Vulnerabilities </CardTitle>
                </CardHeader>
                <CardContent class="flex flex-col items-center justify-center flex-grow">
                    <div class="text-4xl font-bold flex gap-1 items-baseline">
                        {{ stats.after_patch_number_of_vulnerabilities }}
                        <p class="text-sm text-muted-foreground">after patch</p>
                    </div>
                    <div class="text-2xl font-bold flex gap-1 items-baseline">
                        {{ stats.before_patch_number_of_vulnerabilities }}
                        <p class="text-sm text-muted-foreground">before patch</p>
                    </div>
                </CardContent>
            </Card>
            <Card class="flex flex-col">
                <CardHeader>
                    <CardTitle> Vulnerable Dependencies </CardTitle>
                </CardHeader>
                <CardContent class="flex flex-col items-center justify-center flex-grow">
                    <div class="text-4xl font-bold flex gap-1 items-baseline">
                        {{ stats.after_patch_number_of_vulnerable_dependencies }}
                        <p class="text-sm text-muted-foreground">after patch</p>
                    </div>
                    <div class="text-2xl font-bold flex gap-1 items-baseline">
                        {{ stats.before_patch_number_of_vulnerable_dependencies }}
                        <p class="text-sm text-muted-foreground">before patch</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card class="col-span-4">
                <CardHeader>
                    <CardTitle>Patches List</CardTitle>
                </CardHeader>
                <CardContent class="pl-2">
                    <PatchesTable
                        ref="patches_ref"
                        :analysis-i-d="analysisID"
                        :project-i-d="projectID"
                    />
                </CardContent>
            </Card>
            <Card class="col-span-3">
                <CardHeader>
                    <CardTitle>Patches</CardTitle>
                </CardHeader>
                <CardContent class="pl-2">
                    <Patches
                        ref="patches_ref"
                        :analysis-i-d="analysisID"
                        :project-i-d="projectID"
                    />
                </CardContent>
            </Card>
        </div>
    </div>
</template>
