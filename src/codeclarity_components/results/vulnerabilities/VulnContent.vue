<script lang="ts" setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue';

import { ref, watch, computed } from 'vue';
import type { Ref } from 'vue';
import TextLoader from '../../../base_components/TextLoader.vue';
import { AnalysisStats } from '@/codeclarity_components/results/stats.entity';
import VulnsGraph from './graphs/VulnsGraph.vue';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
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
const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const selected_workspace = defineModel<string>('selected_workspace', { default: '.' });

watch(
    () => props.projectID,
    () => {
        getVulnerabilitiesStats();
    }
);
watch(
    () => props.analysisID,
    () => {
        getVulnerabilitiesStats();
    }
);

const render: Ref<boolean> = ref(false);
// const error = ref(false);
const stats: Ref<AnalysisStats> = ref(new AnalysisStats());

// let boxLoaderDimensions = {
//     width: '100px',
//     height: '40px'
// };

getVulnerabilitiesStats();

// Methods
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
    } finally {
        loading.value = false;
    }
}

watch(selected_workspace, async () => getVulnerabilitiesStats());

// Computed properties for enhanced vulnerability metrics
const securityRiskScore = computed(() => {
    const totalVulns = stats.value.number_of_vulnerabilities || 0;
    const criticalVulns = stats.value.number_of_critical || 0;
    const highVulns = stats.value.number_of_high || 0;

    if (totalVulns === 0) return 100;

    const criticalWeight = 10;
    const highWeight = 5;
    const weightedIssues = criticalVulns * criticalWeight + highVulns * highWeight;
    const maxPossibleWeight = totalVulns * criticalWeight;

    const riskPercentage = (weightedIssues / Math.max(maxPossibleWeight, 1)) * 100;
    return Math.max(0, Math.round(100 - riskPercentage));
});

const criticalAndHighCount = computed(() => {
    return (stats.value.number_of_critical || 0) + (stats.value.number_of_high || 0);
});

const vulnerabilityTrend = computed(() => {
    const diff = stats.value.number_of_vulnerabilities_diff || 0;
    if (diff > 0) return 'increased';
    if (diff < 0) return 'decreased';
    return 'stable';
});

const severityDistribution = computed(() => {
    const total = stats.value.number_of_vulnerabilities || 1;
    return {
        critical: Math.round(((stats.value.number_of_critical || 0) / total) * 100),
        high: Math.round(((stats.value.number_of_high || 0) / total) * 100),
        medium: Math.round(((stats.value.number_of_medium || 0) / total) * 100),
        low: Math.round(((stats.value.number_of_low || 0) / total) * 100)
    };
});

const topOwaspCategories = computed(() => {
    const categories = [
        {
            name: 'A01: Broken Access Control',
            count: stats.value.number_of_owasp_top_10_2021_a1 || 0
        },
        {
            name: 'A02: Cryptographic Failures',
            count: stats.value.number_of_owasp_top_10_2021_a2 || 0
        },
        { name: 'A03: Injection', count: stats.value.number_of_owasp_top_10_2021_a3 || 0 },
        { name: 'A04: Insecure Design', count: stats.value.number_of_owasp_top_10_2021_a4 || 0 },
        {
            name: 'A05: Security Misconfiguration',
            count: stats.value.number_of_owasp_top_10_2021_a5 || 0
        }
    ];
    return categories
        .filter((cat) => cat.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
});

// Action handlers
function handleFixCritical() {
    console.log('Handle fix critical vulnerabilities');
    // Implement critical vulnerability fix logic here
}

function handleUpdateVulnerable() {
    console.log('Handle update vulnerable dependencies');
    // Implement vulnerable dependency update logic here
}

function handleExportSecurityReport() {
    console.log('Handle export security report');
    // Implement security report export logic here
}
</script>

<template>
    <div value="vulnerabilities" class="space-y-4">
        <SelectWorkspace
            v-model:error="error"
            v-model:selected_workspace="selected_workspace"
            :project-i-d="projectID"
            :analysis-i-d="analysisID"
        ></SelectWorkspace>

        <!-- Enhanced Vulnerability Dashboard -->
        <div class="grid gap-6 lg:grid-cols-12">
            <!-- Main Vulnerability Overview Card -->
            <Card
                class="lg:col-span-5 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800"
            >
                <CardHeader class="pb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <CardTitle class="text-xl font-bold text-red-900 dark:text-red-100">
                                Security Overview
                            </CardTitle>
                            <CardDescription class="text-red-700 dark:text-red-300">
                                {{ stats.number_of_vulnerabilities ?? 0 }} vulnerabilities in
                                {{ stats.number_of_vulnerable_dependencies ?? 0 }} dependencies
                            </CardDescription>
                        </div>
                        <div class="bg-red-500 p-3 rounded-xl">
                            <Icon icon="tabler:shield-exclamation" class="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="space-y-4">
                        <!-- Severity breakdown -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium text-red-900 dark:text-red-100"
                                        >Critical</span
                                    >
                                    <span
                                        class="text-lg font-bold text-red-900 dark:text-red-100"
                                        >{{ stats.number_of_critical ?? 0 }}</span
                                    >
                                </div>
                                <div
                                    class="w-full bg-red-200 dark:bg-red-800 rounded-full h-2 mt-2"
                                >
                                    <div
                                        class="bg-red-600 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${severityDistribution.critical}%` }"
                                    ></div>
                                </div>
                            </div>
                            <div class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span
                                        class="text-sm font-medium text-orange-900 dark:text-orange-100"
                                        >High</span
                                    >
                                    <span
                                        class="text-lg font-bold text-orange-900 dark:text-orange-100"
                                        >{{ stats.number_of_high ?? 0 }}</span
                                    >
                                </div>
                                <div
                                    class="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2 mt-2"
                                >
                                    <div
                                        class="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${severityDistribution.high}%` }"
                                    ></div>
                                </div>
                            </div>
                            <div class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span
                                        class="text-sm font-medium text-yellow-900 dark:text-yellow-100"
                                        >Medium</span
                                    >
                                    <span
                                        class="text-lg font-bold text-yellow-900 dark:text-yellow-100"
                                        >{{ stats.number_of_medium ?? 0 }}</span
                                    >
                                </div>
                                <div
                                    class="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2 mt-2"
                                >
                                    <div
                                        class="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${severityDistribution.medium}%` }"
                                    ></div>
                                </div>
                            </div>
                            <div class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span
                                        class="text-sm font-medium text-green-900 dark:text-green-100"
                                        >Low</span
                                    >
                                    <span
                                        class="text-lg font-bold text-green-900 dark:text-green-100"
                                        >{{ stats.number_of_low ?? 0 }}</span
                                    >
                                </div>
                                <div
                                    class="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mt-2"
                                >
                                    <div
                                        class="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${severityDistribution.low}%` }"
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div v-if="!render" class="space-y-2">
                            <TextLoader v-for="i in 4" :key="i" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Key Security Metrics Grid -->
            <div class="lg:col-span-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Vulnerable Dependencies Card -->
                <Card
                    class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-950/50 border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-red-500 p-2 rounded-lg">
                                <Icon icon="tabler:package" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="stats.number_of_vulnerable_dependencies_diff !== undefined"
                                :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    stats.number_of_vulnerable_dependencies_diff > 0
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : stats.number_of_vulnerable_dependencies_diff < 0
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                ]"
                            >
                                {{ stats.number_of_vulnerable_dependencies_diff > 0 ? '+' : ''
                                }}{{ stats.number_of_vulnerable_dependencies_diff }}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-red-900 dark:text-red-100">
                            {{ stats.number_of_vulnerable_dependencies ?? 0 }}
                        </div>
                        <div class="text-sm text-red-700 dark:text-red-300 mt-1">
                            Vulnerable Dependencies
                        </div>
                        <div class="text-xs text-red-600 dark:text-red-400 mt-1">
                            Dependencies with security issues
                        </div>
                    </CardContent>
                </Card>

                <!-- Total Vulnerabilities Card -->
                <Card
                    class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-950/50 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-orange-500 p-2 rounded-lg">
                                <Icon icon="tabler:bug" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="stats.number_of_vulnerabilities_diff !== undefined"
                                :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    stats.number_of_vulnerabilities_diff > 0
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : stats.number_of_vulnerabilities_diff < 0
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                ]"
                            >
                                {{ stats.number_of_vulnerabilities_diff > 0 ? '+' : ''
                                }}{{ stats.number_of_vulnerabilities_diff }}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {{ stats.number_of_vulnerabilities ?? 0 }}
                        </div>
                        <div class="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            Total Vulnerabilities
                        </div>
                        <div class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            All identified security issues
                        </div>
                    </CardContent>
                </Card>

                <!-- Security Risk Score Card -->
                <Card
                    class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-950/50 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-purple-500 p-2 rounded-lg">
                                <Icon icon="tabler:shield-check" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    securityRiskScore >= 80
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : securityRiskScore >= 60
                                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                ]"
                            >
                                {{
                                    securityRiskScore >= 80
                                        ? 'Good'
                                        : securityRiskScore >= 60
                                          ? 'Fair'
                                          : 'Poor'
                                }}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {{ securityRiskScore }}%
                        </div>
                        <div class="text-sm text-purple-700 dark:text-purple-300 mt-1">
                            Security Score
                        </div>
                        <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            Based on vulnerability severity
                        </div>
                    </CardContent>
                </Card>

                <!-- Critical & High Severity Card -->
                <Card
                    class="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950/30 dark:to-pink-950/50 border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-red-600 p-2 rounded-lg">
                                <Icon icon="tabler:alert-triangle" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="criticalAndHighCount > 0"
                                class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium"
                            >
                                Urgent
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-red-900 dark:text-red-100">
                            {{ criticalAndHighCount }}
                        </div>
                        <div class="text-sm text-red-700 dark:text-red-300 mt-1">
                            Critical & High
                        </div>
                        <div class="text-xs text-red-600 dark:text-red-400 mt-1">
                            High priority vulnerabilities
                        </div>
                    </CardContent>
                </Card>

                <!-- Mean Severity Card -->
                <Card
                    class="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-950/50 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-yellow-500 p-2 rounded-lg">
                                <Icon icon="tabler:chart-line" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="stats.mean_severity_diff !== undefined"
                                :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    stats.mean_severity_diff > 0
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : stats.mean_severity_diff < 0
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                ]"
                            >
                                {{ stats.mean_severity_diff > 0 ? '+' : ''
                                }}{{ stats.mean_severity_diff?.toFixed(2) }}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                            {{ stats.mean_severity?.toFixed(2) ?? '0.00' }}
                        </div>
                        <div class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Mean Severity
                        </div>
                        <div class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Average vulnerability severity
                        </div>
                    </CardContent>
                </Card>

                <!-- Max Severity Card -->
                <Card
                    class="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-950/50 border-pink-200 dark:border-pink-800 hover:shadow-lg transition-shadow"
                >
                    <CardHeader class="pb-2">
                        <div class="flex items-center justify-between">
                            <div class="bg-pink-500 p-2 rounded-lg">
                                <Icon icon="tabler:trending-up" class="w-5 h-5 text-white" />
                            </div>
                            <div
                                v-if="stats.max_severity_diff !== undefined"
                                :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    stats.max_severity_diff > 0
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : stats.max_severity_diff < 0
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                ]"
                            >
                                {{ stats.max_severity_diff > 0 ? '+' : ''
                                }}{{ stats.max_severity_diff?.toFixed(2) }}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-pink-900 dark:text-pink-100">
                            {{ stats.max_severity?.toFixed(2) ?? '0.00' }}
                        </div>
                        <div class="text-sm text-pink-700 dark:text-pink-300 mt-1">
                            Max Severity
                        </div>
                        <div class="text-xs text-pink-600 dark:text-pink-400 mt-1">
                            Highest severity found
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
                        Security Actions
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Recommended actions for vulnerability management
                    </p>
                </div>

                <div class="flex flex-wrap gap-3">
                    <button
                        v-if="criticalAndHighCount > 0"
                        class="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        @click="handleFixCritical"
                    >
                        <Icon icon="tabler:shield-check" class="w-4 h-4" />
                        Fix {{ criticalAndHighCount }} Critical/High
                    </button>

                    <button
                        v-if="stats.number_of_vulnerable_dependencies > 0"
                        class="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                        @click="handleUpdateVulnerable"
                    >
                        <Icon icon="tabler:refresh" class="w-4 h-4" />
                        Update {{ stats.number_of_vulnerable_dependencies }} Dependencies
                    </button>

                    <button
                        class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                        @click="handleExportSecurityReport"
                    >
                        <Icon icon="tabler:download" class="w-4 h-4" />
                        Export Security Report
                    </button>
                </div>
            </div>
        </div>

        <!-- Security Insights and Recommendations -->
        <div
            v-if="render"
            class="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 rounded-lg p-6 border border-red-200 dark:border-red-800"
        >
            <div class="flex items-start gap-4">
                <div class="bg-red-500 p-3 rounded-xl flex-shrink-0">
                    <Icon icon="tabler:shield-check" class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                        Security Insights
                    </h3>
                    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div
                            v-if="criticalAndHighCount > 0"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:alert-triangle" class="w-4 h-4 text-red-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Urgent Action Required</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                You have {{ criticalAndHighCount }} critical or high severity
                                vulnerabilities that need immediate attention.
                            </p>
                        </div>

                        <div
                            v-if="vulnerabilityTrend === 'increased'"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:trending-up" class="w-4 h-4 text-orange-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Vulnerability Trend</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                Vulnerabilities have increased by
                                {{ Math.abs(stats.number_of_vulnerabilities_diff || 0) }} since last
                                analysis.
                            </p>
                        </div>

                        <div
                            v-if="vulnerabilityTrend === 'decreased'"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:trending-down" class="w-4 h-4 text-green-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Security Improvement</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                Great job! Vulnerabilities decreased by
                                {{ Math.abs(stats.number_of_vulnerabilities_diff || 0) }} since last
                                analysis.
                            </p>
                        </div>

                        <div
                            v-if="stats.number_of_vulnerabilities === 0"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:shield-check" class="w-4 h-4 text-green-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Secure Project</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                Excellent! No vulnerabilities detected in your dependencies.
                            </p>
                        </div>

                        <div
                            v-if="topOwaspCategories.length > 0"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:list-check" class="w-4 h-4 text-blue-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Top OWASP Categories</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                Most common: {{ topOwaspCategories[0]?.name.split(':')[0] }} ({{
                                    topOwaspCategories[0]?.count
                                }}
                                issues)
                            </p>
                        </div>

                        <div
                            v-if="securityRiskScore < 60"
                            class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <Icon icon="tabler:exclamation-mark" class="w-4 h-4 text-red-500" />
                                <span class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >Security Risk</span
                                >
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                Your security score is {{ securityRiskScore }}%. Focus on fixing
                                critical and high severity issues first.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <VulnsGraph
            v-if="render"
            :analysis-i-d="analysisID"
            :project-i-d="projectID"
            :stats="stats"
        />
    </div>
</template>
