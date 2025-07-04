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
    <div class="space-y-6">
        <!-- Enhanced Vulnerability Analysis Section -->
        <div
            class="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-lg p-6 border"
        >
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-slate-600 p-3 rounded-xl">
                    <Icon icon="tabler:chart-bar" class="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Detailed Vulnerability Analysis
                    </h2>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        In-depth breakdown of security vulnerabilities and their impact
                    </p>
                </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-3">
                <!-- Vulnerability Distribution Card -->
                <Card
                    class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800"
                >
                    <CardHeader class="pb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <CardTitle
                                    class="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2"
                                >
                                    <Icon icon="tabler:chart-donut" class="w-5 h-5" />
                                    {{ stats.number_of_vulnerabilities }} Vulnerabilities
                                </CardTitle>
                                <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Severity distribution breakdown
                                </p>
                            </div>
                            <div class="bg-blue-500 p-2 rounded-lg">
                                <Icon icon="tabler:bug" class="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent class="flex items-center justify-center flex-grow min-h-[200px]">
                        <VulnerabilitiesInfo :stats="stats" />
                    </CardContent>
                </Card>

                <!-- OWASP Top 10 Card -->
                <Card
                    class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-950/30 border-purple-200 dark:border-purple-800"
                >
                    <CardHeader class="pb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <CardTitle
                                    class="text-lg font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2"
                                >
                                    <Icon icon="simple-icons:owasp" class="w-5 h-5" />
                                    OWASP Top 10
                                </CardTitle>
                                <p class="text-sm text-purple-700 dark:text-purple-300 mt-1">
                                    {{ owaspTopTotalCount }} categorized vulnerabilities
                                </p>
                            </div>
                            <div class="bg-purple-500 p-2 rounded-lg">
                                <Icon icon="tabler:list-check" class="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent class="flex items-center justify-center flex-grow min-h-[200px]">
                        <OwaspTopTen :stats="stats" />
                    </CardContent>
                </Card>

                <!-- Security Impact Card -->
                <Card
                    class="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800"
                >
                    <CardHeader class="pb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <CardTitle
                                    class="text-lg font-bold text-red-900 dark:text-red-100 flex items-center gap-2"
                                >
                                    <Icon icon="tabler:radar-2" class="w-5 h-5" />
                                    Security Impact
                                </CardTitle>
                                <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                                    CIA triad impact assessment
                                </p>
                            </div>
                            <div class="bg-red-500 p-2 rounded-lg">
                                <Icon icon="tabler:shield-exclamation" class="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent class="flex items-center justify-center flex-grow min-h-[200px]">
                        <SecurityImpact :stats="stats" />
                    </CardContent>
                </Card>
            </div>

            <!-- Additional Analysis Metrics -->
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                <!-- Direct vs Transitive Vulnerabilities -->
                <div
                    class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                    <div class="flex items-center gap-3 mb-3">
                        <div class="bg-indigo-500 p-2 rounded-lg">
                            <Icon icon="tabler:git-branch" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                Vulnerability Sources
                            </h4>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400"
                                >Direct Dependencies</span
                            >
                            <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{
                                stats.number_of_direct_vulnerabilities ?? 0
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400"
                                >Transitive Dependencies</span
                            >
                            <span class="font-semibold text-blue-600 dark:text-blue-400">{{
                                stats.number_of_transitive_vulnerabilities ?? 0
                            }}</span>
                        </div>
                        <div
                            class="text-xs text-gray-500 dark:text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600"
                        >
                            {{
                                Math.round(
                                    ((stats.number_of_transitive_vulnerabilities ?? 0) /
                                        Math.max(
                                            (stats.number_of_direct_vulnerabilities ?? 0) +
                                                (stats.number_of_transitive_vulnerabilities ?? 0),
                                            1
                                        )) *
                                        100
                                )
                            }}% from transitive deps
                        </div>
                    </div>
                </div>

                <!-- CIA Impact Analysis -->
                <div
                    class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                    <div class="flex items-center gap-3 mb-3">
                        <div class="bg-purple-500 p-2 rounded-lg">
                            <Icon icon="tabler:shield-half" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                CIA Impact Analysis
                            </h4>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400"
                                >Confidentiality</span
                            >
                            <span class="font-semibold text-purple-600 dark:text-purple-400">{{
                                stats.mean_confidentiality_impact?.toFixed(1) ?? '0.0'
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Integrity</span>
                            <span class="font-semibold text-purple-600 dark:text-purple-400">{{
                                stats.mean_integrity_impact?.toFixed(1) ?? '0.0'
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400"
                                >Availability</span
                            >
                            <span class="font-semibold text-purple-600 dark:text-purple-400">{{
                                stats.mean_availability_impact?.toFixed(1) ?? '0.0'
                            }}</span>
                        </div>
                    </div>
                </div>

                <!-- OWASP Coverage -->
                <div
                    class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                    <div class="flex items-center gap-3 mb-3">
                        <div class="bg-emerald-500 p-2 rounded-lg">
                            <Icon icon="simple-icons:owasp" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                OWASP Coverage
                            </h4>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400"
                                >Categorized</span
                            >
                            <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{
                                owaspTopTotalCount
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400"
                                >Uncategorized</span
                            >
                            <span class="font-semibold text-gray-600 dark:text-gray-400">{{
                                (stats.number_of_vulnerabilities ?? 0) - owaspTopTotalCount
                            }}</span>
                        </div>
                        <div
                            class="text-xs text-gray-500 dark:text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600"
                        >
                            {{
                                Math.round(
                                    (owaspTopTotalCount /
                                        Math.max(stats.number_of_vulnerabilities ?? 1, 1)) *
                                        100
                                )
                            }}% coverage
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
