<script lang="ts" setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue/dist/iconify.js';
import Patches from './PatchingPatches.vue';
import PatchesTable from './PatchingTable.vue';
import { ref, type Ref, watch } from 'vue';
import TextLoader from '../../../base_components/TextLoader.vue';
import BoxLoader from '../../../base_components/BoxLoader.vue';

import { Radar, Bar } from 'vue-chartjs';
import { Chart, registerables, type ChartData } from 'chart.js';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { PatchingStats } from '@/codeclarity_components/results/stats.entity';
Chart.register(...registerables);

export interface Props {
    analysisID: string;
    projectID: string;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

watch(
    () => props.projectID,
    () => {
        getPatchesStats();
    }
);
watch(
    () => props.analysisID,
    () => {
        getPatchesStats();
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

const colors = ['#7400B8', '#5E60CE', '#4EA8DE', '#56CFE1', '#80FFDB'];
const initChartData = {
    labels: [],
    datasets: [
        {
            borderColor: 'transparent',
            spacing: 3,
            borderRadius: 3,
            data: [],
            backgroundColor: colors
        }
    ]
};
const stats: Ref<PatchingStats> = ref(new PatchingStats());
const severity_data: Ref<ChartData<'bar'>> = ref(initChartData as ChartData<'bar'>);
const severity_conf: Ref<object> = ref({});
const cia_data: Ref<ChartData<'radar'>> = ref(initChartData as ChartData<'radar'>);
const cia_conf: Ref<object> = ref({});

getPatchesStats();

async function getPatchesStats(refresh: boolean = false) {
    if (!userStore.getDefaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    if (!props.projectID || !props.analysisID) return;
    if (props.projectID == '' || props.analysisID == '') return;

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
        error.value = true;
        render.value = false;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    } finally {
        // loading.value = false;
        createSeverityDistChart();
        createRadarChart();
    }
}

function createRadarChart() {
    let maxImpact = 0;

    function getRadarChartData() {
        maxImpact = Math.max(
            stats.value.before_patch_overall_confidentiality_impact,
            stats.value.before_patch_overall_integrity_impact,
            stats.value.before_patch_overall_availability_impact,
            stats.value.after_patch_overall_confidentiality_impact,
            stats.value.after_patch_overall_integrity_impact,
            stats.value.after_patch_overall_availability_impact
        );

        const dataBefore = [
            stats.value.before_patch_overall_confidentiality_impact.toFixed(1),
            stats.value.before_patch_overall_integrity_impact.toFixed(1),
            stats.value.before_patch_overall_availability_impact.toFixed(1)
        ];
        const dataAfter = [
            stats.value.after_patch_overall_confidentiality_impact.toFixed(1),
            stats.value.after_patch_overall_integrity_impact.toFixed(1),
            stats.value.after_patch_overall_availability_impact.toFixed(1)
        ];

        const chart_data = {
            labels: [
                'Mean Confidentiality Impact',
                'Mean Integrity Impact',
                'Mean Availability Impact'
            ],
            datasets: [
                {
                    data: dataBefore,
                    fill: true,
                    backgroundColor: 'rgb(25, 167, 206, 0.4)',
                    borderColor: 'rgb(25, 167, 206)',
                    pointBackgroundColor: 'rgb(25, 167, 2064, 0.4)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(25, 167, 206, 0.4)',
                    pointRadius: 0.0
                },
                {
                    data: dataAfter,
                    fill: true,
                    backgroundColor: 'rgb(20, 108, 148, 0.8)',
                    borderColor: 'rgb(20, 108, 148)',
                    pointBackgroundColor: 'rgb(20, 108, 148, 0.8)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(20, 108, 148, 0.8)',
                    pointRadius: 0.0
                }
            ]
        };
        return chart_data as unknown as ChartData<'radar'>;
    }

    function getRadarChartConfig() {
        return {
            elements: {
                line: {
                    borderWidth: 0
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: false
                }
            },
            scale: {
                beginAtZero: true,
                min: 0,
                stepSize: maxImpact / 3
            },
            scales: {
                r: {
                    pointLabels: {
                        display: false
                    },
                    ticks: {
                        display: false
                    }
                }
            }
        };
    }

    cia_data.value = getRadarChartData();
    cia_conf.value = getRadarChartConfig();
}

function createSeverityDistChart() {
    const labels = [];
    const colors: Array<string> = [];
    const data = [
        {
            borderColor: 'transparent',
            backgroundColor: colors,
            spacing: 3,
            borderRadius: 3,
            label: 'Before Patch',
            data: [],
            yAxisID: 'y-axis-before'
        },
        {
            borderColor: 'transparent',
            backgroundColor: colors,
            spacing: 3,
            borderRadius: 3,
            label: 'After Patch',
            data: [],
            yAxisID: 'y-axis-before'
        }
    ];

    if (
        stats.value.after_patch_number_of_critical != 0 ||
        stats.value.before_patch_number_of_critical != 0
    ) {
        labels.push('Critical');
        colors.push('#7400B8');
        (data[0].data as Array<number>).push(stats.value.before_patch_number_of_critical);
        (data[1].data as Array<number>).push(stats.value.after_patch_number_of_critical);
    }

    if (
        stats.value.after_patch_number_of_high != 0 ||
        stats.value.before_patch_number_of_high != 0
    ) {
        labels.push('High');
        colors.push('#6930C3');
        (data[0].data as Array<number>).push(stats.value.before_patch_number_of_high);
        (data[1].data as Array<number>).push(stats.value.after_patch_number_of_high);
    }

    if (
        stats.value.after_patch_number_of_medium != 0 ||
        stats.value.before_patch_number_of_medium != 0
    ) {
        labels.push('Medium');
        colors.push('#5E60CE');
        (data[0].data as Array<number>).push(stats.value.before_patch_number_of_medium);
        (data[1].data as Array<number>).push(stats.value.after_patch_number_of_medium);
    }

    if (stats.value.after_patch_number_of_low != 0 || stats.value.before_patch_number_of_low != 0) {
        labels.push('Low');
        colors.push('#5390D9');
        (data[0].data as Array<number>).push(stats.value.before_patch_number_of_low);
        (data[1].data as Array<number>).push(stats.value.after_patch_number_of_low);
    }

    if (
        stats.value.after_patch_number_of_none != 0 ||
        stats.value.before_patch_number_of_none != 0
    ) {
        labels.push('None');
        colors.push('#19A7CE');
        (data[0].data as Array<number>).push(stats.value.before_patch_number_of_none);
        (data[1].data as Array<number>).push(stats.value.after_patch_number_of_none);
    }

    const dependency_dist_data = {
        labels: labels,
        datasets: data
    };

    severity_data.value = dependency_dist_data;
    severity_conf.value = {
        skipNull: true,
        indexAxis: 'x',
        maintainAspectRatio: true,
        responsive: true,
        scales: {
            'y-axis-before': {
                display: false,
                grid: {
                    drawBorder: false,
                    display: false
                }
            },
            'y-axis-after': {
                display: false,
                grid: {
                    drawBorder: false,
                    display: false
                }
            },
            x: {
                display: false,
                grid: {
                    drawBorder: false,
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        },
        layout: {
            padding: 20
        }
    };
}
</script>

<template>
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
                                (stats.after_patch_number_of_critical != 0 ||
                                    stats.before_patch_number_of_critical != 0)
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
                                (stats.after_patch_number_of_high != 0 ||
                                    stats.before_patch_number_of_high != 0)
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
                                (stats.after_patch_number_of_medium != 0 ||
                                    stats.before_patch_number_of_medium != 0)
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
                                (stats.after_patch_number_of_low != 0 ||
                                    stats.before_patch_number_of_low != 0)
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
                                (stats.after_patch_number_of_none != 0 ||
                                    stats.before_patch_number_of_none != 0)
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
                        <Bar
                            :data="severity_data"
                            :options="severity_conf"
                            style="height: 200px; width: 200px"
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
                                    <Radar
                                        :data="cia_data"
                                        :options="cia_conf"
                                        style="height: 212px !important; width: 212px !important"
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
                    <Patches ref="patches_ref" :analysis-i-d="analysisID" :project-i-d="projectID" />
                </CardContent>
            </Card>
        </div>
    </div>
</template>
