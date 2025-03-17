<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import TextLoader from '../../../base_components/TextLoader.vue';
import BoxLoader from '../../../base_components/BoxLoader.vue';
import DonutLoader from '../../../base_components/DonutLoader.vue';
// import { HttpError, BusinessLogicError } from '../../../repositories/BaseRepository.js';
// import { DataRepository } from '../../../repositories/DataRepository.js';

import { Doughnut, Radar, Bar } from 'vue-chartjs';
import { Chart, registerables, type ChartData } from 'chart.js';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { Icon } from '@iconify/vue';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { AnalysisStats } from '@/codeclarity_components/results/stats.entity';
import BubbleComponent from '@/base_components/bubbles/BubbleComponent.vue';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';

Chart.register(...registerables);

const props = defineProps({
    analysisID: {
        type: String,
        required: true
    },
    projectID: {
        type: String,
        required: true
    }
});

// Repositories
const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);

const render = ref(false);
const stats: Ref<AnalysisStats> = ref(new AnalysisStats());
const owaspTopTotalCount = ref(0);

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
const cia_data: Ref<ChartData<'radar'>> = ref(initChartData as unknown as ChartData<'radar'>);
const cia_conf: Ref<object> = ref({});
const owasp_data: Ref<ChartData<'bar'>> = ref(initChartData as unknown as ChartData<'bar'>);
const owasp_conf: Ref<object> = ref({});
const severity_data: Ref<ChartData<'doughnut'>> = ref(
    initChartData as unknown as ChartData<'doughnut'>
);
const severity_conf: Ref<object> = ref({});

const boxLoaderDimensions = {
    width: '100px',
    height: '40px'
};

const donutDimensions = {
    width: '180px',
    height: '180px'
};

getVulnerabilitiesStats();

async function getVulnerabilitiesStats(refresh: boolean = false) {
    if (!userStore.getDefaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    if (!props.projectID || !props.analysisID) return;
    if (props.projectID == '' || props.analysisID == '') return;

    let res: DataResponse<any>;
    try {
        res = await resultsRepository.getVulnerabilitiesStat({
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
        loading.value = false;
        createOwaspTop10DistChart();
        createSeverityDistChart();
        createRadarChart();
    }
}

function createOwaspTop10DistChart() {
    const possible_labels = [
        'A01: Broken Access Control',
        'A02: Cryptographic Failures',
        'A03: Injection',
        'A04: Insecure Design',
        'A05: Security Misconfiguration',
        'A06: Vulnerable and Outdated Components',
        'A07: Identification and Authentication Failures',
        'A08: Software and Data Integrity Failures',
        'A09: Security Logging and Monitoring Failures',
        'A10: Server-Side Request Forgery'
    ];

    const possible_values = [
        stats.value.number_of_owasp_top_10_2021_a1,
        stats.value.number_of_owasp_top_10_2021_a2,
        stats.value.number_of_owasp_top_10_2021_a3,
        stats.value.number_of_owasp_top_10_2021_a4,
        stats.value.number_of_owasp_top_10_2021_a5,
        stats.value.number_of_owasp_top_10_2021_a6,
        stats.value.number_of_owasp_top_10_2021_a7,
        stats.value.number_of_owasp_top_10_2021_a8,
        stats.value.number_of_owasp_top_10_2021_a9,
        stats.value.number_of_owasp_top_10_2021_a10
    ];

    const count =
        stats.value.number_of_owasp_top_10_2021_a1 +
        stats.value.number_of_owasp_top_10_2021_a2 +
        stats.value.number_of_owasp_top_10_2021_a3 +
        stats.value.number_of_owasp_top_10_2021_a4 +
        stats.value.number_of_owasp_top_10_2021_a5 +
        stats.value.number_of_owasp_top_10_2021_a6 +
        stats.value.number_of_owasp_top_10_2021_a7 +
        stats.value.number_of_owasp_top_10_2021_a8 +
        stats.value.number_of_owasp_top_10_2021_a9 +
        stats.value.number_of_owasp_top_10_2021_a10;

    owaspTopTotalCount.value = count;

    const possible_colors = [
        '#7400B8',
        '#6930C3',
        '#5E60CE',
        '#5390D9',
        '#4EA8DE',
        '#48BFE3',
        '#56CFE1',
        '#64DFDF',
        '#72EFDD',
        '#80FFDB'
    ];

    const data: Array<any> = [];
    const colors: Array<any> = [];
    const labels: Array<any> = [];

    let index = 0;
    for (const value of possible_values) {
        if (value > 0) {
            data.push(value);
            labels.push(possible_labels[index]);
            colors.push(possible_colors[index]);
        }
        index++;
    }

    if (count < stats.value.number_of_vulnerabilities) {
        data.push(stats.value.number_of_vulnerabilities - count);
        labels.push('Uncategorized');
        colors.push('#AFD3E2');
    }

    const dependency_dist_data = {
        labels: labels,
        datasets: [
            {
                borderColor: 'transparent',
                spacing: 3,
                borderRadius: 3,
                data: data,
                backgroundColor: colors
            }
        ]
    };

    owasp_data.value = dependency_dist_data;
    owasp_conf.value = {
        maintainAspectRatio: true,
        responsive: true,
        scales: {
            y: {
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
            },
            tooltip: {
                // Disable the on-canvas tooltip
                enabled: false,

                external: function (context: any) {
                    // Tooltip Element
                    let tooltipEl = document.getElementById('chartjs-tooltip');

                    // Create element on first render
                    if (!tooltipEl) {
                        tooltipEl = document.createElement('div');
                        tooltipEl.id = 'chartjs-tooltip';
                        tooltipEl.innerHTML = '';
                        document.body.appendChild(tooltipEl);
                    }
                    tooltipEl.innerHTML = '';

                    // Hide if no tooltip
                    const tooltipModel = context.tooltip;
                    if (tooltipModel.opacity === 0) {
                        tooltipEl.style.opacity = '0';
                        return;
                    }

                    // Set caret Position
                    tooltipEl.classList.remove('above', 'below', 'no-transform');
                    if (tooltipModel.yAlign) {
                        tooltipEl.classList.add(tooltipModel.yAlign);
                    } else {
                        tooltipEl.classList.add('no-transform');
                    }

                    let innerHTML = '';
                    innerHTML += '<div class="chart-tool-tip">';
                    innerHTML += '<div class="chart-tool-tip-title">Owasp Top 10</div>';
                    innerHTML += '<div class="chart-tool-tip-title-divider"></div>';
                    innerHTML += '<div class="chart-tool-tip-data">';
                    let index = 0;
                    for (const dataPoint of data) {
                        innerHTML += `<div class="chart-tool-tip-data-row">
							<div>
								<div><div class="chart-tool-tip-color-bubble" style="background-color:${colors[index]}"></div></div>
								<div>${labels[index]}</div>
							</div>
							<div class="chart-tool-tip-data-value" style="color:${colors[index]}">${dataPoint}</div>
						</div>`;
                        index++;
                    }
                    innerHTML += '</div></div>';
                    tooltipEl.innerHTML = innerHTML;

                    const position = context.chart.canvas.getBoundingClientRect();
                    //const bodyFont = ChartJS.helpers.toFont(tooltipModel.options.bodyFont);

                    // Display, position, and set styles for font
                    tooltipEl.style.opacity = '1';
                    tooltipEl.style.position = 'absolute';
                    tooltipEl.style.left =
                        position.left + window.screenX - tooltipModel.caretX + 'px';
                    tooltipEl.style.top =
                        position.top + window.screenY - tooltipModel.caretY + 'px';
                    //tooltipEl.style.font = bodyFont.string;
                    tooltipEl.style.padding =
                        tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
                    tooltipEl.style.pointerEvents = 'none';
                }
            }
        },
        layout: {
            padding: 20
        }
    };
}

function createSeverityDistChart() {
    const labels = ['Critical', 'High', 'Medium', 'Low', 'None'];
    const data = [
        stats.value.number_of_critical,
        stats.value.number_of_high,
        stats.value.number_of_medium,
        stats.value.number_of_low,
        stats.value.number_of_none
    ];
    const colors = ['#7400B8', '#5E60CE', '#4EA8DE', '#56CFE1', '#80FFDB'];

    const dependency_dist_data = {
        labels: labels,
        datasets: [
            {
                borderColor: 'transparent',
                spacing: 3,
                borderRadius: 3,
                data: data,
                backgroundColor: colors
            }
        ]
    };

    severity_data.value = dependency_dist_data;
    severity_conf.value = {
        maintainAspectRatio: true,
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                // Disable the on-canvas tooltip
                enabled: false,

                external: function (context: any) {
                    // Tooltip Element
                    let tooltipEl = document.getElementById('chartjs-tooltip');

                    // Create element on first render
                    if (!tooltipEl) {
                        tooltipEl = document.createElement('div');
                        tooltipEl.id = 'chartjs-tooltip';
                        tooltipEl.innerHTML = '';
                        document.body.appendChild(tooltipEl);
                    }
                    tooltipEl.innerHTML = '';

                    // Hide if no tooltip
                    const tooltipModel = context.tooltip;
                    if (tooltipModel.opacity === 0) {
                        tooltipEl.style.opacity = '0';
                        return;
                    }

                    // Set caret Position
                    tooltipEl.classList.remove('above', 'below', 'no-transform');
                    if (tooltipModel.yAlign) {
                        tooltipEl.classList.add(tooltipModel.yAlign);
                    } else {
                        tooltipEl.classList.add('no-transform');
                    }

                    let innerHTML = '';
                    innerHTML += '<div class="chart-tool-tip">';
                    innerHTML += '<div class="chart-tool-tip-title">Severities</div>';
                    innerHTML += '<div class="chart-tool-tip-title-divider"></div>';
                    innerHTML += '<div class="chart-tool-tip-data">';
                    let index = 0;
                    for (const dataPoint of data) {
                        innerHTML += `<div class="chart-tool-tip-data-row">
							<div>
								<div><div class="chart-tool-tip-color-bubble" style="background-color:${colors[index]}"></div></div>
								<div>${labels[index]}</div>
							</div>
							<div class="chart-tool-tip-data-value" style="color:${colors[index]}">${dataPoint}</div>
						</div>`;
                        index++;
                    }
                    innerHTML += '</div></div>';
                    tooltipEl.innerHTML = innerHTML;

                    const position = context.chart.canvas.getBoundingClientRect();
                    //const bodyFont = ChartJS.helpers.toFont(tooltipModel.options.bodyFont);

                    // Display, position, and set styles for font
                    tooltipEl.style.opacity = '1';
                    tooltipEl.style.position = 'absolute';
                    tooltipEl.style.left =
                        position.left + window.scrollX + tooltipModel.caretX + 'px';
                    tooltipEl.style.top =
                        position.top + window.scrollY + tooltipModel.caretY + 'px';
                    //tooltipEl.style.font = bodyFont.string;
                    tooltipEl.style.padding =
                        tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
                    tooltipEl.style.pointerEvents = 'none';
                }
            }
        },
        layout: {
            padding: 20
        }
    };
}

function createRadarChart() {
    function getRadarChartData() {
        const data = [
            stats.value.mean_confidentiality_impact,
            stats.value.mean_integrity_impact,
            stats.value.mean_availability_impact
        ];
        const chart_data = {
            labels: [
                'Mean Confidentiality Impact',
                'Mean Integrity Impact',
                'Mean Availability Impact'
            ],
            datasets: [
                {
                    data: data,
                    fill: true,
                    backgroundColor: 'rgb(116, 0, 184, 0.4)',
                    borderColor: 'rgb(116, 0, 184)',
                    pointBackgroundColor: 'rgb(0116, 0, 184, 0.4)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(116, 0, 184, 0.4)',
                    pointRadius: 0.0
                }
            ]
        };
        return chart_data;
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
                max: 1.0,
                min: 0,
                stepSize: 0.5
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
</script>

<template>
    <div class="summary-wrapper findings-summary-wrapper" style="font-size: 1rem; flex-wrap: wrap">
        <div class="summary-container summary-container-chart">
            <div class="summary-container-chart-text-wrapper">
                <div class="summary-container-chart-inner-text-wrapper">
                    <div v-if="render" class="summary-container-chart-text-header-wrapper">
                        <span class="summary-container-chart-text-header-data">
                            {{ stats.number_of_vulnerabilities ?? 0 }}
                        </span>
                        <span class="summary-container-chart-text-header-title">
                            Vulnerabilities
                            <!-- <span class="text-gray-400">({{ stats.number_of_issues ?? 0 }} issues)</span> -->
                        </span>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: #7400b8"></div>
                        <div class="side-stats-text-wrapper justified-space-between">
                            <div>Critical</div>
                            <div class="side-stats-text-value" style="color: #7400b8">
                                {{ stats.number_of_critical }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: #5e60ce"></div>
                        <div class="side-stats-text-wrapper justified-space-between">
                            <div>High</div>
                            <div class="side-stats-text-value" style="color: #5e60ce">
                                {{ stats.number_of_high }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: #4ea8de"></div>
                        <div class="side-stats-text-wrapper justified-space-between">
                            <div>Medium</div>
                            <div class="side-stats-text-value" style="color: #4ea8de">
                                {{ stats.number_of_medium }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: #56cfe1"></div>
                        <div class="side-stats-text-wrapper justified-space-between">
                            <div>Low</div>
                            <div class="side-stats-text-value" style="color: #56cfe1">
                                {{ stats.number_of_low }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: #80ffdb"></div>
                        <div class="side-stats-text-wrapper justified-space-between">
                            <div>None</div>
                            <div class="side-stats-text-value" style="color: #80ffdb">
                                {{ stats.number_of_none }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                </div>
            </div>
            <div>
                <div v-if="render" class="chart-wrapper">
                    <Doughnut
                        :data="severity_data"
                        :options="severity_conf"
                        style="height: 200px; width: 200px"
                    />
                </div>
                <div>
                    <DonutLoader v-if="!render" :dimensions="donutDimensions" />
                </div>
            </div>
            <div class="stats-divider hide-on-collpase"></div>
        </div>
        <div class="summary-container summary-container-chart">
            <div class="summary-container-chart-text-wrapper">
                <div class="summary-container-chart-inner-text-wrapper">
                    <div
                        v-if="render"
                        class="flex flex-row gap-2 items-center font-semibold text-lg"
                    >
                        <span>
                            <Icon :icon="'simple-icons:owasp'"></Icon>
                        </span>
                        <span class="summary-container-chart-text-header-title">Owasp Top 10</span>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a1 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #7400b8"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">A01: Broken Access Control</div>
                            <div class="text-sm" style="color: #7400b8">
                                {{ stats.number_of_owasp_top_10_2021_a1 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a2 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #6930c3"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">A02: Cryptographic Failures</div>
                            <div class="text-sm" style="color: #6930c3">
                                {{ stats.number_of_owasp_top_10_2021_a2 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a3 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #5e60ce"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">A03: Injection</div>
                            <div class="text-sm" style="color: #5e60ce">
                                {{ stats.number_of_owasp_top_10_2021_a3 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a4 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #5390d9"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">A04: Insecure Design</div>
                            <div class="text-sm" style="color: #5390d9">
                                {{ stats.number_of_owasp_top_10_2021_a4 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a5 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #19a7ce"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">
                                A05: Security Misconfiguration
                            </div>
                            <div class="text-sm">
                                {{ stats.number_of_owasp_top_10_2021_a5 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a6 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #4ea8de"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">
                                A06: Vulnerable and Outdated Components
                            </div>
                            <div class="text-sm" style="color: #4ea8de">
                                {{ stats.number_of_owasp_top_10_2021_a6 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a7 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #56cfe1"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">
                                A07: Identification and Authentication Failures
                            </div>
                            <div class="text-sm" style="color: #56cfe1">
                                {{ stats.number_of_owasp_top_10_2021_a7 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a8 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #64dfdf"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">
                                A08: Software and Data Integrity Failures
                            </div>
                            <div class="text-sm" style="color: #64dfdf">
                                {{ stats.number_of_owasp_top_10_2021_a8 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a9 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #72efdd"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">
                                A09: Security Logging and Monitoring Failures
                            </div>
                            <div class="text-sm" style="color: #72efdd">
                                {{ stats.number_of_owasp_top_10_2021_a9 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && stats.number_of_owasp_top_10_2021_a10 > 0"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #80ffdb"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">
                                A10: Server-Side Request Forgery
                            </div>
                            <div class="text-sm" style="color: #80ffdb">
                                {{ stats.number_of_owasp_top_10_2021_a10 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div
                        v-if="render && owaspTopTotalCount < stats.number_of_vulnerabilities"
                        class="flex flex-row gap-2 justify-between items-center"
                    >
                        <div class="side-stats-circle" style="background-color: #afd3e2"></div>
                        <div class="flex flex-row gap-2 justify-between max-h-52">
                            <div class="whitespace-nowrap text-sm">Uncategorized</div>
                            <div class="text-sm" style="color: #afd3e2">
                                {{ stats.number_of_vulnerabilities - owaspTopTotalCount }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                </div>
            </div>
            <div>
                <div v-if="render" class="chart-wrapper">
                    <Bar
                        :data="owasp_data"
                        :options="owasp_conf"
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
                        <span class="summary-container-chart-text-header-title"
                            >Security Impact</span
                        >
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: #7400b8"></div>
                        <div class="side-stats-text-wrapper justified-space-between">
                            <div>Confidentiality</div>
                            <div class="side-stats-text-value" style="color: #7400b8">
                                {{ stats.mean_confidentiality_impact?.toFixed(2) ?? 0 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: #6930c3"></div>
                        <div class="side-stats-text-wrapper justified-space-between">
                            <div>Availability</div>
                            <div class="side-stats-text-value" style="color: #6930c3">
                                {{ stats.mean_availability_impact?.toFixed(2) ?? 0 }}
                            </div>
                        </div>
                    </div>
                    <TextLoader v-if="!render" />
                    <div v-if="render" class="side-stats">
                        <div class="side-stats-circle" style="background-color: #5e60ce"></div>
                        <div class="side-stats-text-wrapper justified-space-between">
                            <div>Integrity</div>
                            <div class="side-stats-text-value" style="color: #5e60ce">
                                {{ stats.mean_integrity_impact?.toFixed(2) ?? 0 }}
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
                            left: 100px;
                            top: 10px;
                            transform: translate(-50%, -50%);
                            font-weight: 500;
                            color: rgb(70, 70, 70);
                            background-color: rgb(255, 255, 255);
                        "
                    >
                        <span style="font-weight: 900; color: var(--accent)" class="ng-binding">{{
                            stats.mean_confidentiality_impact?.toFixed(2) ?? 0
                        }}</span>
                    </div>
                    <div
                        style="
                            position: absolute;
                            bottom: 0px;
                            right: 0px;
                            font-weight: 500;
                            color: rgb(70, 70, 70);
                            background-color: rgb(255, 255, 255);
                        "
                    >
                        <span style="font-weight: 900; color: var(--accent)" class="ng-binding">{{
                            stats.mean_integrity_impact?.toFixed(2) ?? 0
                        }}</span>
                    </div>
                    <div
                        style="
                            position: absolute;
                            bottom: 0px;
                            left: 0px;
                            font-weight: 500;
                            color: rgb(70, 70, 70);
                            background-color: rgb(255, 255, 255);
                        "
                    >
                        <span style="font-weight: 900; color: var(--accent)" class="ng-binding">{{
                            stats.mean_availability_impact?.toFixed(2) ?? 0
                        }}</span>
                    </div>
                    <div
                        style="
                            position: absolute;
                            left: 0px;
                            top: 65px;
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
                            bottom: 54px;
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
                            left: 35px;
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
                <div
                    v-if="stats != null"
                    class="summary-container single-value-summary-column-gap-20"
                >
                    <div class="title">Vulnerable Libraries</div>
                    <div class="text-gray-400">
                        Libraries can be present multiple times. Check the patching tab to view
                        them.
                    </div>
                    <div class="single-value-summary single-value-summary-column-gap-20">
                        <div v-if="render">
                            {{ stats.number_of_vulnerable_dependencies ?? 0 }}
                        </div>
                        <BubbleComponent
                            v-if="render && stats.number_of_vulnerable_dependencies > 0"
                            :slim="true"
                            :bad="true"
                        >
                            <template #content>
                                {{ stats.number_of_vulnerable_dependencies?.toFixed(2) ?? 0 }}
                                <Icon :icon="'material-symbols:trending-up'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.number_of_vulnerable_dependencies < 0"
                            :slim="true"
                            :positive="true"
                        >
                            <template #content>
                                {{ stats.number_of_vulnerable_dependencies?.toFixed(2) ?? 0 }}
                                <Icon :icon="'material-symbols:trending-down'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.number_of_vulnerable_dependencies == 0"
                            :slim="true"
                            :neutral="true"
                        >
                            <template #content>
                                {{ stats.number_of_vulnerable_dependencies?.toFixed(2) ?? 0 }}
                                <span style="font-weight: 900">-</span>
                            </template>
                        </BubbleComponent>
                        <BoxLoader v-if="!render" :dimensions="boxLoaderDimensions" />
                    </div>
                </div>
            </div>
            <div class="summary-stacked-container-wrapper hide-before-collapse-2320">
                <div v-if="stats != null" class="summary-container">
                    <div class="title">Mean Severity</div>
                    <div class="single-value-summary single-value-summary-column-gap-20">
                        <div v-if="render">
                            {{ stats.mean_severity?.toFixed(2) ?? 0 }}
                        </div>
                        <BubbleComponent
                            v-if="render && stats.mean_severity_diff > 0"
                            :slim="true"
                            :bad="true"
                        >
                            <template #content>
                                {{ stats.mean_severity_diff?.toFixed(2) ?? 0 }}
                                <Icon :icon="'material-symbols:trending-up'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.mean_severity_diff < 0"
                            :slim="true"
                            :positive="true"
                        >
                            <template #content>
                                {{ stats.mean_severity_diff?.toFixed(2) ?? 0 }}
                                <Icon :icon="'material-symbols:trending-down'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.mean_severity_diff == 0"
                            :slim="true"
                            :neutral="true"
                        >
                            <template #content>
                                {{ stats.mean_severity_diff?.toFixed(2) ?? 0 }}
                                <span style="font-weight: 900">-</span>
                            </template>
                        </BubbleComponent>
                        <BoxLoader v-if="!render" :dimensions="boxLoaderDimensions" />
                    </div>
                </div>
                <div
                    v-if="stats != null"
                    class="summary-container single-value-summary-column-gap-20"
                >
                    <div class="title">Max Severity</div>
                    <div class="single-value-summary single-value-summary-column-gap-20">
                        <div v-if="render">
                            {{ stats.max_severity ?? 0 }}
                        </div>
                        <BubbleComponent
                            v-if="render && stats.max_severity_diff > 0"
                            :slim="true"
                            :bad="true"
                        >
                            <template #content>
                                {{ stats.max_severity_diff?.toFixed(2) ?? 0 }}
                                <Icon :icon="'material-symbols:trending-up'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.max_severity_diff < 0"
                            :slim="true"
                            :positive="true"
                        >
                            <template #content>
                                {{ stats.max_severity_diff?.toFixed(2) ?? 0 }}
                                <Icon :icon="'material-symbols:trending-down'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.max_severity_diff == 0"
                            :slim="true"
                            :neutral="true"
                        >
                            <template #content>
                                {{ stats.max_severity_diff?.toFixed(2) ?? 0 }}
                                <span style="font-weight: 900">-</span>
                            </template>
                        </BubbleComponent>
                        <BoxLoader v-if="!render" :dimensions="boxLoaderDimensions" />
                    </div>
                </div>
            </div>
            <div class="summary-stacked-container-wrapper hide-before-collapse-2570">
                <div v-if="stats != null" class="summary-container">
                    <div class="title">Direct Dependencies Impacted</div>
                    <div class="single-value-summary single-value-summary-column-gap-20">
                        <div v-if="render">
                            {{ stats.number_of_direct_vulnerabilities ?? 0 }}
                        </div>
                        <BubbleComponent
                            v-if="render && stats.number_of_direct_vulnerabilities_diff > 0"
                            :slim="true"
                            :bad="true"
                        >
                            <template #content>
                                {{ stats.number_of_direct_vulnerabilities_diff?.toFixed(2) ?? 0 }}
                                <Icon :icon="'material-symbols:trending-up'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.number_of_direct_vulnerabilities_diff < 0"
                            :slim="true"
                            :positive="true"
                        >
                            <template #content>
                                {{ stats.number_of_direct_vulnerabilities_diff?.toFixed(2) ?? 0 }}
                                <Icon :icon="'material-symbols:trending-down'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.number_of_direct_vulnerabilities_diff == 0"
                            :slim="true"
                            :neutral="true"
                        >
                            <template #content>
                                {{ stats.number_of_direct_vulnerabilities_diff?.toFixed(2) ?? 0 }}
                                <span style="font-weight: 900">-</span>
                            </template>
                        </BubbleComponent>
                        <BoxLoader v-if="!render" :dimensions="boxLoaderDimensions" />
                    </div>
                </div>
                <div
                    v-if="stats != null"
                    class="summary-container single-value-summary-column-gap-20"
                >
                    <div class="title">Transitive Dependencies Impacted</div>
                    <div class="single-value-summary single-value-summary-column-gap-20">
                        <div v-if="render">
                            {{ stats.number_of_transitive_vulnerabilities ?? 0 }}
                        </div>
                        <BubbleComponent
                            v-if="render && stats.number_of_transitive_vulnerabilities_diff > 0"
                            :slim="true"
                            :bad="true"
                        >
                            <template #content>
                                {{
                                    stats.number_of_transitive_vulnerabilities_diff?.toFixed(2) ?? 0
                                }}
                                <Icon :icon="'material-symbols:trending-up'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.number_of_transitive_vulnerabilities_diff < 0"
                            :slim="true"
                            :positive="true"
                        >
                            <template #content>
                                {{
                                    stats.number_of_transitive_vulnerabilities_diff?.toFixed(2) ?? 0
                                }}
                                <Icon :icon="'material-symbols:trending-down'"></Icon>
                            </template>
                        </BubbleComponent>
                        <BubbleComponent
                            v-if="render && stats.number_of_transitive_vulnerabilities_diff == 0"
                            :slim="true"
                            :neutral="true"
                        >
                            <template #content>
                                {{
                                    stats.number_of_transitive_vulnerabilities_diff?.toFixed(2) ?? 0
                                }}
                                <span style="font-weight: 900">-</span>
                            </template>
                        </BubbleComponent>
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
@use '@/assets/common/chart.scss';
@use '@/assets/colors.scss';
@use '@/assets/common/summary.scss';
</style>
