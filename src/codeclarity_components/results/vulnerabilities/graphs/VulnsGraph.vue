<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Chart, registerables, type ChartData } from 'chart.js';
import type { AnalysisStats } from '@/codeclarity_components/results/stats.entity';
import { Bar, Doughnut, Radar } from 'vue-chartjs';
import { Icon } from '@iconify/vue/dist/iconify.js';
import type { RadarChartData, RadarChartOptions } from '@/base_components/charts/radarChart';
import RadarChart from '@/base_components/charts/RadarChart.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import ErrorComponent from '@/base_components/ErrorComponent.vue';

const SecurityImpact = defineAsyncComponent({
    loader: () => import('./components/SecurityImpact.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

Chart.register(...registerables);

export interface Props {
    analysisID?: string;
    projectID?: string;
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
            backgroundColor: ['#008491']
        }
    ]
};

const owaspTopTotalCount = ref(0);
const severity_conf: Ref<object> = ref({});
const owasp_data: Ref<ChartData<'bar'>> = ref(initChartData as unknown as ChartData<'bar'>);
const owasp_conf: Ref<object> = ref({});
const severity_data: Ref<ChartData<'doughnut'>> = ref(
    initChartData as unknown as ChartData<'doughnut'>
);

function init() {
    createOwaspTop10DistChart();
    createSeverityDistChart();
}

init();

watch(props.stats, () => {
    init();
});

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

    const count =
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

    const possible_colors = ['#003532', '#1A4876', '#008491', '#40E0D0'];

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

    if (count < props.stats.number_of_vulnerabilities) {
        data.push(props.stats.number_of_vulnerabilities - count);
        labels.push('Uncategorized');
        colors.push('#D3D3D3');
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
        props.stats.number_of_critical,
        props.stats.number_of_high,
        props.stats.number_of_medium,
        props.stats.number_of_low,
        props.stats.number_of_none
    ];
    const colors = ['#4b4242', '#ae5e5e', '#cca067', '#9dae5e', '#397680'];

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
            }
        },
        layout: {
            padding: 20
        }
    };
}

</script>

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
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-severityCriticalLight"
                            ></Icon>
                            <div>Critical</div>
                            <div class="side-stats-text-value text-severityCriticalLight">
                                {{ stats.number_of_critical }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-severityHighLight"></Icon>
                            <div>High</div>
                            <div class="side-stats-text-value text-severityHighLight">
                                {{ stats.number_of_high }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-severityMediumLight"></Icon>
                            <div>Medium</div>
                            <div class="side-stats-text-value text-severityMediumLight">
                                {{ stats.number_of_medium }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-severityLowLight"></Icon>
                            <div>Low</div>
                            <div class="side-stats-text-value text-severityLowLight">
                                {{ stats.number_of_low }}
                            </div>
                        </div>
                        <div class="flex gap-2 items-center">
                            <Icon :icon="'ph:circle-fill'" class="text-severityNoneLight"></Icon>
                            <div>None</div>
                            <div class="side-stats-text-value text-severityNoneLight">
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
                <CardTitle class="flex gap-2">
                    <Icon :icon="'simple-icons:owasp'"></Icon> Owasp Top 10
                </CardTitle>
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
                                class="text-[#003532] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A01: Broken Access Control
                            </div>
                            <div class="text-sm text-[#003532]">
                                {{ stats.number_of_owasp_top_10_2021_a1 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a2 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#1A4876] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A02: Cryptographic Failures
                            </div>
                            <div class="text-sm text-[#1A4876]">
                                {{ stats.number_of_owasp_top_10_2021_a2 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a3 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#008491] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">A03: Injection</div>
                            <div class="text-sm" style="color: #008491">
                                {{ stats.number_of_owasp_top_10_2021_a3 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a4 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#40E0D0] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">A04: Insecure Design</div>
                            <div class="text-sm text-[#40E0D0]">
                                {{ stats.number_of_owasp_top_10_2021_a4 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a5 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#003532] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A05: Security Misconfiguration
                            </div>
                            <div class="text-sm text-[#003532]">
                                {{ stats.number_of_owasp_top_10_2021_a5 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a6 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#1A4876] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A06: Vulnerable and Outdated Components
                            </div>
                            <div class="text-sm text-[#1A4876]">
                                {{ stats.number_of_owasp_top_10_2021_a6 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a7 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#008491] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A07: Identification and Authentication Failures
                            </div>
                            <div class="text-sm" style="color: #008491">
                                {{ stats.number_of_owasp_top_10_2021_a7 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a8 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#40E0D0] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A08: Software and Data Integrity Failures
                            </div>
                            <div class="text-sm text-[#40E0D0]">
                                {{ stats.number_of_owasp_top_10_2021_a8 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a9 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#003532] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A09: Security Logging and Monitoring Failures
                            </div>
                            <div class="text-sm text-[#003532]">
                                {{ stats.number_of_owasp_top_10_2021_a9 }}
                            </div>
                        </div>
                        <div
                            v-if="stats.number_of_owasp_top_10_2021_a10 > 0"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#40E0D0] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">
                                A10: Server-Side Request Forgery
                            </div>
                            <div class="text-sm text-[#40E0D0]">
                                {{ stats.number_of_owasp_top_10_2021_a10 }}
                            </div>
                        </div>
                        <div
                            v-if="owaspTopTotalCount < stats.number_of_vulnerabilities"
                            class="flex flex-row gap-2 justify-between items-start"
                        >
                            <Icon
                                :icon="'ph:circle-fill'"
                                class="text-[#D3D3D3] flex-shrink-0"
                            ></Icon>
                            <div class="text-sm self-start flex-grow">Uncategorized</div>
                            <div class="text-sm text-[#D3D3D3]">
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
                <SecurityImpact :stats="stats" />
            </CardContent>
        </Card>
    </div>
</template>
