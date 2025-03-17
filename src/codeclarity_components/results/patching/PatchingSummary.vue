<script lang="ts" setup>
import { ref, type Ref, watch } from 'vue';
import TextLoader from '../../../base_components/TextLoader.vue';
import BoxLoader from '../../../base_components/BoxLoader.vue';

import { Radar, Bar } from 'vue-chartjs';
import { Icon } from '@iconify/vue';
import { Chart, registerables, type ChartData } from 'chart.js';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { PatchingStats } from '@/codeclarity_components/results/stats.entity';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';
Chart.register(...registerables);

type Props = {
    analysisID: string;
    projectID: string;
};
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

let colors = ['#7400B8', '#5E60CE', '#4EA8DE', '#56CFE1', '#80FFDB'];
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

let boxLoaderDimensions = {
    width: '100px',
    height: '40px'
};

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
    let labels = [];
    let colors: Array<string> = [];
    let data = [
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

    let dependency_dist_data = {
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
            // tooltip: {
            // 	// Disable the on-canvas tooltip
            // 	enabled: false,

            // 	external: function (context) {
            // 		// Tooltip Element
            // 		let tooltipEl = document.getElementById('chartjs-tooltip');

            // 		// Create element on first render
            // 		if (!tooltipEl) {
            // 			tooltipEl = document.createElement('div');
            // 			tooltipEl.id = 'chartjs-tooltip';
            // 			tooltipEl.innerHTML = '';
            // 			document.body.appendChild(tooltipEl);
            // 		}
            // 		tooltipEl.innerHTML = '';

            // 		// Hide if no tooltip
            // 		const tooltipModel = context.tooltip;
            // 		if (tooltipModel.opacity === 0) {
            // 			tooltipEl.style.opacity = 0;
            // 			return;
            // 		}

            // 		// Set caret Position
            // 		tooltipEl.classList.remove('above', 'below', 'no-transform');
            // 		if (tooltipModel.yAlign) {
            // 			tooltipEl.classList.add(tooltipModel.yAlign);
            // 		} else {
            // 			tooltipEl.classList.add('no-transform');
            // 		}

            // 		let innerHTML = "";
            // 		innerHTML += '<div class="chart-tool-tip">';
            // 		innerHTML += '<div class="chart-tool-tip-title">Issues</div>';
            // 		innerHTML += '<div class="chart-tool-tip-title-divider"></div>';
            // 		innerHTML += '<div class="chart-tool-tip-data">';
            // 		let index = 0;
            // 		for (let dataPoint of data) {
            // 			innerHTML +=
            // 				`<div class="chart-tool-tip-data-row">
            // 				<div>
            // 					<div><div class="chart-tool-tip-color-bubble" style="background-color:${colors[index]}"></div></div>
            // 					<div>${labels[index]}</div>
            // 				</div>
            // 				<div class="chart-tool-tip-data-value" style="color:${colors[index]}">${JSON.stringify(dataPoint)}</div>
            // 			</div>`;
            // 			index++;
            // 		}
            // 		innerHTML += '</div></div>';
            // 		tooltipEl.innerHTML = innerHTML;

            // 		const position = context.chart.canvas.getBoundingClientRect();
            // 		//const bodyFont = ChartJS.helpers.toFont(tooltipModel.options.bodyFont);

            // 		// Display, position, and set styles for font
            // 		tooltipEl.style.opacity = 1;
            // 		tooltipEl.style.position = 'absolute';
            // 		tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
            // 		tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
            // 		//tooltipEl.style.font = bodyFont.string;
            // 		tooltipEl.style.padding = tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
            // 		tooltipEl.style.pointerEvents = 'none';
            // 	}
            // }
        },
        layout: {
            padding: 20
        }
    };
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
                            (stats.after_patch_number_of_critical != 0 ||
                                stats.before_patch_number_of_critical != 0)
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
                            (stats.after_patch_number_of_high != 0 ||
                                stats.before_patch_number_of_high != 0)
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
                            (stats.after_patch_number_of_medium != 0 ||
                                stats.before_patch_number_of_medium != 0)
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
                            (stats.after_patch_number_of_low != 0 ||
                                stats.before_patch_number_of_low != 0)
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
                            (stats.after_patch_number_of_none != 0 ||
                                stats.before_patch_number_of_none != 0)
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
                        <Radar
                            :data="cia_data"
                            :options="cia_conf"
                            style="height: 212px !important; width: 212px !important"
                        />
                    </div>
                </div>
            </div>
            <div class="stats-divider hide-on-collpase"></div>
        </div>
        <div class="summary-container summary-container-quick-stats">
            <div class="summary-stacked-container-wrapper">
                <div v-if="stats != null" class="summary-container">
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
                <div v-if="stats != null" class="summary-container">
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
                <div v-if="stats != null" class="summary-container">
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
@use '@/assets/colors.scss';
@use '@/assets/common/summary.scss';
@use '@/assets/common/chart.scss';
</style>
