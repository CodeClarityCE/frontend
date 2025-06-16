<script setup lang="ts">
import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import type { AnalysisStats } from '@/codeclarity_components/results/stats.entity';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue';
import { Chart, registerables, type ChartData } from 'chart.js';
import type { Ref } from 'vue';
import { defineAsyncComponent, ref, watch } from 'vue';

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

const VulnerabilitiesInfo = defineAsyncComponent({
    loader: () => import('./components/VulnerabilitiesInfo.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OwaspTopTen = defineAsyncComponent({
    loader: () => import('./components/OwaspTopTen.vue'),
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
const owasp_data: Ref<ChartData<'bar'>> = ref(initChartData as unknown as ChartData<'bar'>);
const owasp_conf: Ref<object> = ref({});

function init() {
    createOwaspTop10DistChart();
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
</script>

<template>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card class="col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle>{{ stats.number_of_vulnerabilities }} Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent class="flex items-center justify-center flex-grow">
                <VulnerabilitiesInfo :stats="stats" />
            </CardContent>
        </Card>

        <Card class="col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle class="flex gap-2">
                    <Icon :icon="'simple-icons:owasp'"></Icon> Owasp Top 10
                </CardTitle>
            </CardHeader>
            <CardContent class="flex items-center justify-center flex-grow">
                <OwaspTopTen :stats="stats" />
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
