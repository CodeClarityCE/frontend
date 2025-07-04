<script lang="ts" setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue';

import { ref, watch, computed } from 'vue';
import type { Ref } from 'vue';
import TextLoader from '../../../base_components/TextLoader.vue';
import DonutLoader from '../../../base_components/DonutLoader.vue';
import { SbomStats } from '@/codeclarity_components/results/stats.entity';
import { Doughnut } from 'vue-chartjs';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import SbomTable from './SbomTable.vue';
import SelectWorkspace from '../SelectWorkspace.vue';

export interface Props {
    analysisID?: string;
    projectID?: string;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

// Repositories
const sbomRepo: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);

const render: Ref<boolean> = ref(false);
const stats: Ref<SbomStats> = ref(new SbomStats());
const selected_workspace: Ref<string> = ref('.');

watch(
    () => props.projectID,
    () => {
        getSbomStats();
    }
);
watch(
    () => props.analysisID,
    () => {
        getSbomStats();
    }
);

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
const donut_data = ref(initChartData);
const donut_config = ref({});
const bar_data = ref(initChartData);
const bar_config = ref({});

const donutDimensions = {
    width: '180px',
    height: '180px'
};

watch(selected_workspace, () => getSbomStats());

// Computed properties for enhanced metrics
const healthScore = computed(() => {
    const total = stats.value.number_of_dependencies || 1;
    const outdated = stats.value.number_of_outdated_dependencies || 0;
    const deprecated = stats.value.number_of_deprecated_dependencies || 0;
    const unlicensed = stats.value.number_of_unlicensed_dependencies || 0;

    const issues = outdated + deprecated + unlicensed;
    const score = Math.max(0, Math.round(((total - issues) / total) * 100));
    return score;
});

const securityIssues = computed(() => {
    return (
        (stats.value.number_of_deprecated_dependencies || 0) +
        (stats.value.number_of_unlicensed_dependencies || 0)
    );
});

const outdatedPercentage = computed(() => {
    const total = stats.value.number_of_dependencies || 1;
    const outdated = stats.value.number_of_outdated_dependencies || 0;
    return Math.round((outdated / total) * 100);
});
const dependencyRatio = computed(() => {
    const direct = stats.value.number_of_direct_dependencies || 1;
    const transitive = stats.value.number_of_transitive_dependencies || 0;
    return Math.round((transitive / direct) * 10) / 10;
});

// Action handlers
function handleUpdateOutdated() {
    console.log('Handle update outdated dependencies');
    // Implement update logic here
}

function handleFixSecurity() {
    console.log('Handle fix security issues');
    // Implement security fix logic here
}

function handleExportReport() {
    console.log('Handle export report');
    // Implement export logic here
}

// Methods
getSbomStats();
async function getSbomStats(refresh: boolean = false) {
    if (!userStore.getDefaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    if (!props.projectID || !props.analysisID) return;

    let res: DataResponse<SbomStats>;
    try {
        res = await sbomRepo.getSbomStat({
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
        loading.value = false;
        createDepTypeChart();
        createDepStatusDistChart();
    }
}

// Create charts
function createDepStatusDistChart() {
    const labels = ['Deprecated', 'Unlicensed', 'Outdated'];
    const data = [
        stats.value.number_of_deprecated_dependencies,
        stats.value.number_of_unlicensed_dependencies,
        stats.value.number_of_outdated_dependencies
    ];
    const colors = ['#146C94', '#19A7CE', '#AFD3E2'];

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

    bar_data.value = dependency_dist_data;
    bar_config.value = {
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

function createDepTypeChart() {
    const labels = ['Direct', 'Transitive', 'Both'];
    const data = [
        stats.value.number_of_direct_dependencies,
        stats.value.number_of_transitive_dependencies,
        stats.value.number_of_both_direct_transitive_dependencies
    ];
    const colors = ['#146C94', '#19A7CE', '#008491'];

    const dependency_dist_data = {
        labels: labels,
        datasets: [
            {
                borderColor: 'transparent',
                spacing: 4,
                borderRadius: 8,
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                hoverBackgroundColor: colors.map((color) => color + 'DD'),
                hoverBorderColor: colors,
                hoverBorderWidth: 3
            }
        ]
    };

    donut_data.value = dependency_dist_data;
    donut_config.value = {
        maintainAspectRatio: true,
        responsive: true,
        cutout: '60%',
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                cornerRadius: 8,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function (context: any) {
                        const total = context.dataset.data.reduce(
                            (a: number, b: number) => a + b,
                            0
                        );
                        const percentage = Math.round((context.parsed / total) * 100);
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                    }
                }
            }
        },
        layout: {
            padding: 10
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000
        }
    };
}
</script>

<template>
    <div value="sbom" class="space-y-4">
        <SelectWorkspace
            v-model:error="error"
            v-model:selected_workspace="selected_workspace"
            :project-i-d="projectID"
            :analysis-i-d="analysisID"
        ></SelectWorkspace>

        <!-- Enhanced Stats Dashboard -->
        <div class="grid gap-6 lg:grid-cols-12">
            <!-- Main Composition Card with Interactive Chart -->
            <Card
                class="lg:col-span-5 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800"
            >
                <CardHeader class="pb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <CardTitle class="text-xl font-bold text-blue-900 dark:text-blue-100">
                                Dependency Composition
                            </CardTitle>
                            <CardDescription class="text-blue-700 dark:text-blue-300">
                                {{ stats.number_of_dependencies ?? 0 }} dependencies in your project
                            </CardDescription>
                        </div>
                        <div class="bg-blue-500 p-3 rounded-xl">
                            <Icon icon="tabler:chart-donut" class="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="flex items-center justify-between gap-6">
                        <!-- Chart -->
                        <div class="flex-shrink-0">
                            <div v-if="render" class="relative">
                                <Doughnut :data="donut_data" :options="donut_config" />
                                <!-- Center text overlay -->
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="text-center">
                                        <div
                                            class="text-2xl font-bold text-gray-900 dark:text-gray-100"
                                        >
                                            {{ stats.number_of_dependencies ?? 0 }}
                                        </div>
                                        <div class="text-xs text-gray-600 dark:text-gray-400">
                                            Total
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DonutLoader v-if="!render" :dimensions="donutDimensions" />
                        </div>

                        <!-- Legend with improved styling -->
                        <div class="flex-1 space-y-3">
                            <div v-if="render" class="space-y-2">
                                <div
                                    class="flex items-center justify-between p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg"
                                >
                                    <div class="flex items-center gap-2">
                                        <div class="w-3 h-3 rounded-full bg-[#146c94]"></div>
                                        <span class="text-sm font-medium">Direct</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg font-bold text-[#146c94]">
                                            {{ stats?.number_of_direct_dependencies }}
                                        </span>
                                        <span class="text-xs text-gray-500">
                                            ({{
                                                Math.round(
                                                    (stats?.number_of_direct_dependencies /
                                                        stats?.number_of_dependencies) *
                                                        100
                                                )
                                            }}%)
                                        </span>
                                    </div>
                                </div>

                                <div
                                    class="flex items-center justify-between p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg"
                                >
                                    <div class="flex items-center gap-2">
                                        <div class="w-3 h-3 rounded-full bg-[#19a7ce]"></div>
                                        <span class="text-sm font-medium">Transitive</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg font-bold text-[#19a7ce]">
                                            {{ stats?.number_of_transitive_dependencies }}
                                        </span>
                                        <span class="text-xs text-gray-500">
                                            ({{
                                                Math.round(
                                                    (stats?.number_of_transitive_dependencies /
                                                        stats?.number_of_dependencies) *
                                                        100
                                                )
                                            }}%)
                                        </span>
                                    </div>
                                </div>

                                <div
                                    class="flex items-center justify-between p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg"
                                >
                                    <div class="flex items-center gap-2">
                                        <div class="w-3 h-3 rounded-full bg-[#008491]"></div>
                                        <span class="text-sm font-medium">Both</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg font-bold text-[#008491]">
                                            {{
                                                stats?.number_of_both_direct_transitive_dependencies
                                            }}
                                        </span>
                                        <span class="text-xs text-gray-500">
                                            ({{
                                                Math.round(
                                                    (stats?.number_of_both_direct_transitive_dependencies /
                                                        stats?.number_of_dependencies) *
                                                        100
                                                )
                                            }}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="space-y-2">
                                <TextLoader v-for="i in 3" :key="i" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Key Metrics Grid -->
            <div class="lg:col-span-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Direct Dependencies Card -->
                <Card
                    class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-950/50 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-purple-500 p-2 rounded-lg">
                                <Icon icon="tabler:target" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="stats.number_of_direct_dependencies_diff !== undefined"
                                :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    stats.number_of_direct_dependencies_diff > 0
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : stats.number_of_direct_dependencies_diff < 0
                                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                ]"
                            >
                                {{ stats.number_of_direct_dependencies_diff > 0 ? '+' : ''
                                }}{{ stats.number_of_direct_dependencies_diff }}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {{ stats.number_of_non_dev_dependencies ?? 0 }}
                        </div>
                        <div class="text-sm text-purple-700 dark:text-purple-300 mt-1">
                            Direct Dependencies
                        </div>
                        <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            Dependencies you explicitly added
                        </div>
                    </CardContent>
                </Card>

                <!-- Dev Dependencies Card -->
                <Card
                    class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-950/50 border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-emerald-500 p-2 rounded-lg">
                                <Icon icon="tabler:code" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="stats.number_of_dev_dependencies_diff !== undefined"
                                :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    stats.number_of_dev_dependencies_diff > 0
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : stats.number_of_dev_dependencies_diff < 0
                                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                ]"
                            >
                                {{ stats.number_of_dev_dependencies_diff > 0 ? '+' : ''
                                }}{{ stats.number_of_dev_dependencies_diff }}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {{ stats.number_of_dev_dependencies ?? 0 }}
                        </div>
                        <div class="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                            Dev Dependencies
                        </div>
                        <div class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Development & testing tools
                        </div>
                    </CardContent>
                </Card>

                <!-- Health Score Card -->
                <Card
                    class="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/50 border-amber-200 dark:border-amber-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-amber-500 p-2 rounded-lg">
                                <Icon icon="tabler:heart-rate-monitor" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    healthScore >= 80
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : healthScore >= 60
                                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                ]"
                            >
                                {{
                                    healthScore >= 80
                                        ? 'Excellent'
                                        : healthScore >= 60
                                          ? 'Good'
                                          : 'Needs Attention'
                                }}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            {{ healthScore }}%
                        </div>
                        <div class="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Health Score
                        </div>
                        <div class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Based on outdated & security
                        </div>
                    </CardContent>
                </Card>

                <!-- Security Issues Card -->
                <Card
                    class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-950/50 border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-red-500 p-2 rounded-lg">
                                <Icon icon="tabler:shield-exclamation" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="securityIssues > 0"
                                class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium"
                            >
                                Action Needed
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-red-900 dark:text-red-100">
                            {{ securityIssues }}
                        </div>
                        <div class="text-sm text-red-700 dark:text-red-300 mt-1">
                            Security Issues
                        </div>
                        <div class="text-xs text-red-600 dark:text-red-400 mt-1">
                            Deprecated & unlicensed deps
                        </div>
                    </CardContent>
                </Card>

                <!-- Outdated Dependencies Card -->
                <Card
                    class="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-950/50 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-yellow-500 p-2 rounded-lg">
                                <Icon icon="tabler:clock-exclamation" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="outdatedPercentage > 20"
                                class="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium"
                            >
                                {{ outdatedPercentage }}%
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                            {{ stats.number_of_outdated_dependencies ?? 0 }}
                        </div>
                        <div class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Outdated Deps
                        </div>
                        <div class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Dependencies with updates
                        </div>
                    </CardContent>
                </Card>

                <!-- Dependencies Trend Card -->
                <Card
                    class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-950/50 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-indigo-500 p-2 rounded-lg">
                                <Icon icon="tabler:trending-up" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                class="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-full text-xs font-medium"
                            >
                                Ratio
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                            {{ dependencyRatio }}:1
                        </div>
                        <div class="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                            Dependency Ratio
                        </div>
                        <div class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                            Transitive per direct
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <!-- Quick Actions Section -->
        <div
            class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-lg p-6 border"
        >
            <div
                class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Quick Actions
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Common tasks for dependency management
                    </p>
                </div>

                <div class="flex flex-wrap gap-3">
                    <button
                        v-if="stats.number_of_outdated_dependencies > 0"
                        class="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                        @click="handleUpdateOutdated"
                    >
                        <Icon icon="tabler:refresh" class="w-4 h-4" />
                        Update {{ stats.number_of_outdated_dependencies }} Outdated
                    </button>

                    <button
                        v-if="securityIssues > 0"
                        class="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        @click="handleFixSecurity"
                    >
                        <Icon icon="tabler:shield-check" class="w-4 h-4" />
                        Fix {{ securityIssues }} Security Issues
                    </button>

                    <button
                        class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                        @click="handleExportReport"
                    >
                        <Icon icon="tabler:download" class="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>
        </div>

        <!-- Insights and Recommendations -->
        <div
            v-if="render"
            class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800"
        >
            <div class="flex items-start gap-4">
                <div class="bg-indigo-500 p-3 rounded-xl flex-shrink-0">
                    <Icon icon="tabler:bulb" class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                        Project Insights
                    </h3>
                    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div
                            v-if="healthScore < 70"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:alert-triangle" class="w-4 h-4 text-amber-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Health Warning</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                Your project health score is {{ healthScore }}%. Consider updating
                                outdated dependencies.
                            </p>
                        </div>

                        <div
                            v-if="dependencyRatio > 5"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:network" class="w-4 h-4 text-blue-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >High Dependency Ratio</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                You have {{ dependencyRatio }} transitive dependencies per direct
                                dependency. Consider reviewing your dependency choices.
                            </p>
                        </div>

                        <div
                            v-if="securityIssues === 0 && outdatedPercentage < 10"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:check-circle" class="w-4 h-4 text-green-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Great Job!</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                Your dependencies are well-maintained with no security issues and
                                minimal outdated packages.
                            </p>
                        </div>

                        <div
                            v-if="
                                stats.number_of_dev_dependencies >
                                stats.number_of_non_dev_dependencies
                            "
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:code" class="w-4 h-4 text-purple-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Dev-Heavy Project</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                You have more dev dependencies than production dependencies. This is
                                common for tooling-heavy projects.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card class="col-span-4 lg:col-start-2">
                <CardHeader>
                    <CardTitle>Table</CardTitle>
                </CardHeader>
                <CardContent class="pl-2">
                    <SbomTable v-model:selected_workspace="selected_workspace" />
                </CardContent>
            </Card>
        </div>
    </div>
</template>
