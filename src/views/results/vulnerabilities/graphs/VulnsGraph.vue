<template>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card class="col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle>{{ stats.number_of_vulnerabilities }} Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent class="flex items-center justify-center flex-grow">
                <div class="flex items-center justify-evenly">
                    <div class="flex flex-col">
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-[#7400b8]"></Icon>
                            <div>Critical</div>
                            <div class="side-stats-text-value" style="color: #7400b8">
                                {{ stats.number_of_critical }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-[#5e60ce]"></Icon>
                            <div>High</div>
                            <div class="side-stats-text-value" style="color: #5e60ce">
                                {{ stats.number_of_high }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-[#4ea8de]"></Icon>
                            <div>Medium</div>
                            <div class="side-stats-text-value" style="color: #4ea8de">
                                {{ stats.number_of_medium }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-[#56cfe1]"></Icon>
                            <div>Low</div>
                            <div class="side-stats-text-value" style="color: #56cfe1">
                                {{ stats.number_of_low }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-[#80ffdb]"></Icon>
                            <div>None</div>
                            <div class="side-stats-text-value" style="color: #80ffdb">
                                {{ stats.number_of_none }}
                            </div>
                        </div>
                    </div>
                    <div>
                        <Doughnut :data="severity_data" :options="severity_conf" />
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card class="col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle class="flex gap-2"
                    ><Icon :icon="'simple-icons:owasp'"></Icon> Owasp Top 10</CardTitle
                >
            </CardHeader>
            <CardContent class="flex items-center justify-center flex-grow">
                <div class="flex flex-wrap gap-2 items-center justify-center">
                    <div class="flex flex-col gap-2">
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a1 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#7400b8] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A01: Broken Access Control
                            </div>
                            <div class="text-sm" style="color: #7400b8">
                                {{ stats.number_of_owasp_top_10_2021_a1 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a2 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#6930c3] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A02: Cryptographic Failures
                            </div>
                            <div class="text-sm" style="color: #6930c3">
                                {{ stats.number_of_owasp_top_10_2021_a2 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a3 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#5e60ce] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">A03: Injection</div>
                            <div class="text-sm" style="color: #5e60ce">
                                {{ stats.number_of_owasp_top_10_2021_a3 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a4 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#5390d9] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">A04: Insecure Design</div>
                            <div class="text-sm" style="color: #5390d9">
                                {{ stats.number_of_owasp_top_10_2021_a4 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a5 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#19a7ce] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A05: Security Misconfiguration
                            </div>
                            <div class="text-sm">
                                {{ stats.number_of_owasp_top_10_2021_a5 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a6 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#4ea8de] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A06: Vulnerable and Outdated Components
                            </div>
                            <div class="text-sm" style="color: #4ea8de">
                                {{ stats.number_of_owasp_top_10_2021_a6 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a7 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#56cfe1] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A07: Identification and Authentication Failures
                            </div>
                            <div class="text-sm" style="color: #56cfe1">
                                {{ stats.number_of_owasp_top_10_2021_a7 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a8 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#64dfdf] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A08: Software and Data Integrity Failures
                            </div>
                            <div class="text-sm" style="color: #64dfdf">
                                {{ stats.number_of_owasp_top_10_2021_a8 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a9 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#72efdd] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A09: Security Logging and Monitoring Failures
                            </div>
                            <div class="text-sm" style="color: #72efdd">
                                {{ stats.number_of_owasp_top_10_2021_a9 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a10 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#80ffdb] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A10: Server-Side Request Forgery
                            </div>
                            <div class="text-sm" style="color: #80ffdb">
                                {{ stats.number_of_owasp_top_10_2021_a10 }}
                            </div>
                        </div>
                        <div
                            v-if="owaspTopTotalCount < stats.number_of_vulnerabilities"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#afd3e2] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">Uncategorized</div>
                            <div class="text-sm" style="color: #afd3e2">
                                {{ stats.number_of_vulnerabilities - owaspTopTotalCount }}
                            </div>
                        </div>
                    </div>

                    <div>
                        <Bar
                            :data="owasp_data"
                            :options="owasp_conf"
                            style="height: 200px; width: 200px"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card class="col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle>Security Impact</CardTitle>
            </CardHeader>
            <CardContent class="flex items-center justify-center flex-grow">
                <div class="flex items-center justify-evenly">
                    <div class="flex flex-col">
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-[#7400b8]"></Icon>
                            <div>Confidentiality</div>
                            <div class="side-stats-text-value" style="color: #7400b8">
                                {{ stats.mean_confidentiality_impact?.toFixed(2) ?? 0 }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-[#6930c3]"></Icon>

                            <div>Availability</div>
                            <div class="side-stats-text-value" style="color: #6930c3">
                                {{ stats.mean_availability_impact?.toFixed(2) ?? 0 }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-[#5e60ce]"></Icon>

                            <div>Integrity</div>
                            <div class="side-stats-text-value" style="color: #5e60ce">
                                {{ stats.mean_integrity_impact?.toFixed(2) ?? 0 }}
                            </div>
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
                                    left: 100px;
                                    top: 10px;
                                    transform: translate(-50%, -50%);
                                    font-weight: 500;
                                    color: rgb(70, 70, 70);
                                    background-color: rgb(255, 255, 255);
                                "
                            >
                                <span
                                    style="font-weight: 900; color: var(--accent)"
                                    class="ng-binding"
                                    >{{ stats.mean_confidentiality_impact?.toFixed(2) ?? 0 }}</span
                                >
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
                                <span
                                    style="font-weight: 900; color: var(--accent)"
                                    class="ng-binding"
                                    >{{ stats.mean_integrity_impact?.toFixed(2) ?? 0 }}</span
                                >
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
                                <span
                                    style="font-weight: 900; color: var(--accent)"
                                    class="ng-binding"
                                    >{{ stats.mean_availability_impact?.toFixed(2) ?? 0 }}</span
                                >
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
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Chart, registerables, type ChartData } from 'chart.js';
import type { AnalysisStats } from '@/repositories/types/entities/Stats';
import { Bar, Doughnut, Radar } from 'vue-chartjs';
import { Icon } from '@iconify/vue/dist/iconify.js';
Chart.register(...registerables);

export interface Props {
    analysisID: string;
    projectID: string;
    stats: AnalysisStats;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

const initChartData = {
    labels: ['Label'],
    datasets: [
        {
            borderColor: 'transparent',
            spacing: 3,
            borderRadius: 3,
            data: [0],
            backgroundColor: ['#146C94']
        }
    ]
};

const owaspTopTotalCount = ref(0);
const severity_conf: Ref<object> = ref({});

const cia_data: Ref<ChartData<'radar'>> = ref(initChartData as unknown as ChartData<'radar'>);
const cia_conf: Ref<object> = ref({});
const owasp_data: Ref<ChartData<'bar'>> = ref(initChartData as unknown as ChartData<'bar'>);
const owasp_conf: Ref<object> = ref({});
const severity_data: Ref<ChartData<'doughnut'>> = ref(
    initChartData as unknown as ChartData<'doughnut'>
);

createOwaspTop10DistChart();
createSeverityDistChart();
createRadarChart();

function createOwaspTop10DistChart() {
    let possible_labels = [
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

    let possible_values = [
        props.stats.number_of_owasp_top_10_2021_a1,
        props.stats.number_of_owasp_top_10_2021_a2,
        props.stats.number_of_owasp_top_10_2021_a3,
        props.stats.number_of_owasp_top_10_2021_a4,
        props.stats.number_of_owasp_top_10_2021_a5,
        props.stats.number_of_owasp_top_10_2021_a6,
        props.stats.number_of_owasp_top_10_2021_a7,
        props.stats.number_of_owasp_top_10_2021_a8,
        props.stats.number_of_owasp_top_10_2021_a9,
        props.stats.number_of_owasp_top_10_2021_a10
    ];

    let count =
        props.stats.number_of_owasp_top_10_2021_a1 +
        props.stats.number_of_owasp_top_10_2021_a2 +
        props.stats.number_of_owasp_top_10_2021_a3 +
        props.stats.number_of_owasp_top_10_2021_a4 +
        props.stats.number_of_owasp_top_10_2021_a5 +
        props.stats.number_of_owasp_top_10_2021_a6 +
        props.stats.number_of_owasp_top_10_2021_a7 +
        props.stats.number_of_owasp_top_10_2021_a8 +
        props.stats.number_of_owasp_top_10_2021_a9 +
        props.stats.number_of_owasp_top_10_2021_a10;

    owaspTopTotalCount.value = count;

    let possible_colors = [
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

    let data: Array<any> = [];
    let colors: Array<any> = [];
    let labels: Array<any> = [];

    let index = 0;
    for (let value of possible_values) {
        if (value > 0) {
            data.push(value);
            labels.push(possible_labels[index]);
            colors.push(possible_colors[index]);
        }
        index++;
    }

    if (count < props.stats.number_of_vulnerabilities) {
        data.push(props.stats.number_of_vulnerabilities - count);
        labels.push('Uncategorized');
        colors.push('#AFD3E2');
    }

    let dependency_dist_data = {
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
            }
        },
        layout: {
            padding: 20
        }
    };
}

function createSeverityDistChart() {
    let labels = ['Critical', 'High', 'Medium', 'Low', 'None'];
    let data = [
        props.stats.number_of_critical,
        props.stats.number_of_high,
        props.stats.number_of_medium,
        props.stats.number_of_low,
        props.stats.number_of_none
    ];
    let colors = ['#7400B8', '#5E60CE', '#4EA8DE', '#56CFE1', '#80FFDB'];

    let dependency_dist_data = {
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
            props.stats.mean_confidentiality_impact,
            props.stats.mean_integrity_impact,
            props.stats.mean_availability_impact
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
