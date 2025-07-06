<script lang="ts" setup>
import { Icon } from '@iconify/vue';

import { ref, watch, computed } from 'vue';
import type { Ref } from 'vue';
import TextLoader from '@/base_components/ui/loaders/TextLoader.vue';
import { AnalysisStats } from '@/codeclarity_components/results/stats.entity';

// Import base components
import { InfoCard, StatCard } from '@/base_components';

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
    <div class="space-y-4">
        <!-- Workspace Selection -->
        <SelectWorkspace
            v-model:error="error"
            v-model:selected_workspace="selected_workspace"
            :project-i-d="projectID"
            :analysis-i-d="analysisID"
        />

        <!-- Key Statistics Grid -->
        <div class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            <!-- Total Vulnerabilities -->
            <StatCard
                label="Total Vulnerabilities"
                :value="stats.number_of_vulnerabilities ?? 0"
                icon="solar:bug-bold"
                variant="default"
                :subtitle="
                    stats.number_of_vulnerabilities_diff !== undefined
                        ? `${stats.number_of_vulnerabilities_diff > 0 ? '+' : ''}${stats.number_of_vulnerabilities_diff} from last scan`
                        : 'Security vulnerabilities found'
                "
                :subtitle-icon="
                    stats.number_of_vulnerabilities_diff > 0
                        ? 'solar:arrow-up-linear'
                        : stats.number_of_vulnerabilities_diff < 0
                          ? 'solar:arrow-down-linear'
                          : 'solar:bug-linear'
                "
            />

            <!-- Critical & High Count -->
            <StatCard
                label="Critical & High"
                :value="criticalAndHighCount"
                icon="solar:danger-triangle-bold"
                variant="danger"
                subtitle="Immediate attention required"
                subtitle-icon="solar:shield-warning-linear"
            />

            <!-- Vulnerable Dependencies -->
            <StatCard
                label="Vulnerable Dependencies"
                :value="stats.number_of_vulnerable_dependencies ?? 0"
                icon="solar:package-bold"
                variant="danger"
                :subtitle="
                    stats.number_of_vulnerable_dependencies_diff !== undefined
                        ? `${stats.number_of_vulnerable_dependencies_diff > 0 ? '+' : ''}${stats.number_of_vulnerable_dependencies_diff} from last scan`
                        : 'All identified dependencies'
                "
                :subtitle-icon="
                    stats.number_of_vulnerable_dependencies_diff > 0
                        ? 'solar:arrow-up-linear'
                        : stats.number_of_vulnerable_dependencies_diff < 0
                          ? 'solar:arrow-down-linear'
                          : 'solar:package-linear'
                "
            />

            <!-- Security Score -->
            <StatCard
                label="Security Score"
                :value="`${securityRiskScore}%`"
                icon="solar:shield-check-bold"
                variant="primary"
                :subtitle="
                    securityRiskScore >= 80
                        ? 'Excellent security posture'
                        : securityRiskScore >= 60
                          ? 'Good security posture'
                          : 'Needs immediate attention'
                "
                :subtitle-icon="
                    securityRiskScore >= 80
                        ? 'solar:shield-check-linear'
                        : securityRiskScore >= 60
                          ? 'solar:shield-linear'
                          : 'solar:shield-warning-linear'
                "
            />
        </div>

        <!-- Detailed Analysis Grid -->
        <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <!-- Vulnerability Distribution -->
            <InfoCard
                title="Vulnerability Distribution"
                description="Breakdown of vulnerabilities by severity level"
                icon="solar:chart-square-bold"
                variant="primary"
            >
                <div v-if="render" class="space-y-4">
                    <!-- Severity breakdown -->
                    <div class="grid gap-3 grid-cols-2">
                        <div
                            class="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-semibold text-gray-900">Critical</span>
                                <span class="text-xl font-bold text-theme-black">{{
                                    stats.number_of_critical ?? 0
                                }}</span>
                            </div>
                            <div class="w-full bg-red-100 rounded-full h-2">
                                <div
                                    class="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    :style="{ width: `${severityDistribution.critical}%` }"
                                ></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ severityDistribution.critical }}% of total
                            </div>
                        </div>

                        <div
                            class="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-semibold text-gray-900">High</span>
                                <span class="text-xl font-bold text-theme-black">{{
                                    stats.number_of_high ?? 0
                                }}</span>
                            </div>
                            <div class="w-full bg-orange-100 rounded-full h-2">
                                <div
                                    class="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                    :style="{ width: `${severityDistribution.high}%` }"
                                ></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ severityDistribution.high }}% of total
                            </div>
                        </div>

                        <div
                            class="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-semibold text-gray-900">Medium</span>
                                <span class="text-xl font-bold text-theme-black">{{
                                    stats.number_of_medium ?? 0
                                }}</span>
                            </div>
                            <div class="w-full bg-yellow-100 rounded-full h-2">
                                <div
                                    class="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                    :style="{ width: `${severityDistribution.medium}%` }"
                                ></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ severityDistribution.medium }}% of total
                            </div>
                        </div>

                        <div
                            class="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-semibold text-gray-900">Low</span>
                                <span class="text-xl font-bold text-theme-black">{{
                                    stats.number_of_low ?? 0
                                }}</span>
                            </div>
                            <div class="w-full bg-green-100 rounded-full h-2">
                                <div
                                    class="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    :style="{ width: `${severityDistribution.low}%` }"
                                ></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ severityDistribution.low }}% of total
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="space-y-3">
                    <TextLoader v-for="i in 4" :key="i" />
                </div>
            </InfoCard>

            <!-- Vulnerability Visualization -->
            <InfoCard
                title="Vulnerability Trends"
                description="Visual representation of vulnerability data"
                icon="solar:chart-2-bold"
                variant="default"
            >
                <div v-if="render" class="space-y-4">
                    <!-- Trend Summary -->
                    <div class="grid grid-cols-2 gap-3">
                        <!-- Trend Indicator -->
                        <div class="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div class="flex items-center justify-center mb-2">
                                <Icon
                                    :icon="
                                        vulnerabilityTrend === 'increased'
                                            ? 'solar:arrow-up-bold'
                                            : vulnerabilityTrend === 'decreased'
                                              ? 'solar:arrow-down-bold'
                                              : 'solar:minus-bold'
                                    "
                                    :class="[
                                        'w-6 h-6',
                                        vulnerabilityTrend === 'increased'
                                            ? 'text-red-500'
                                            : vulnerabilityTrend === 'decreased'
                                              ? 'text-green-500'
                                              : 'text-gray-500'
                                    ]"
                                />
                            </div>
                            <p class="text-sm font-semibold text-theme-black capitalize">
                                {{ vulnerabilityTrend }}
                            </p>
                            <p class="text-xs text-gray-500">Since last scan</p>
                        </div>

                        <!-- Quick Stats -->
                        <div class="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div class="text-xl font-bold text-theme-black mb-1">
                                {{ (stats.number_of_critical || 0) + (stats.number_of_high || 0) }}
                            </div>
                            <p class="text-sm font-semibold text-red-600">High Priority</p>
                            <p class="text-xs text-gray-500">Critical + High</p>
                        </div>
                    </div>

                    <!-- Severity Progress Bars -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-700">Critical</span>
                            <span class="text-sm font-bold text-theme-black">{{
                                stats.number_of_critical ?? 0
                            }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div
                                class="bg-red-600 h-2 rounded-full transition-all duration-300"
                                :style="{
                                    width: `${Math.min(100, (stats.number_of_critical || 0) * 25)}%`
                                }"
                            ></div>
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-700">High</span>
                            <span class="text-sm font-bold text-theme-black">{{
                                stats.number_of_high ?? 0
                            }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div
                                class="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                :style="{
                                    width: `${Math.min(100, (stats.number_of_high || 0) * 25)}%`
                                }"
                            ></div>
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-700">Medium + Low</span>
                            <span class="text-sm font-bold text-theme-black">{{
                                (stats.number_of_medium || 0) + (stats.number_of_low || 0)
                            }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div
                                class="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                :style="{
                                    width: `${Math.min(100, ((stats.number_of_medium || 0) + (stats.number_of_low || 0)) * 25)}%`
                                }"
                            ></div>
                        </div>
                    </div>
                </div>

                <div v-else class="space-y-3">
                    <TextLoader v-for="i in 4" :key="i" />
                </div>
            </InfoCard>

            <!-- Security Impact Analysis -->
            <InfoCard
                title="Security Impact"
                description="CIA triad impact assessment"
                icon="solar:shield-cross-bold"
                variant="default"
            >
                <div v-if="render" class="space-y-4">
                    <!-- Impact Metrics -->
                    <div class="grid gap-3">
                        <!-- Confidentiality -->
                        <div
                            class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-blue-100">
                                    <Icon
                                        icon="solar:eye-closed-bold"
                                        class="w-5 h-5 text-blue-600"
                                    />
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-theme-black">
                                        Confidentiality
                                    </p>
                                    <p class="text-xs text-gray-500">Data exposure risk</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-theme-black">
                                    {{ stats.mean_confidentiality_impact?.toFixed(1) ?? '0.0' }}
                                </div>
                                <div class="text-xs text-gray-500">Impact Score</div>
                            </div>
                        </div>

                        <!-- Integrity -->
                        <div
                            class="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                        >
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-purple-100">
                                    <Icon
                                        icon="solar:shield-check-bold"
                                        class="w-5 h-5 text-purple-600"
                                    />
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-theme-black">Integrity</p>
                                    <p class="text-xs text-gray-500">Data modification risk</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-theme-black">
                                    {{ stats.mean_integrity_impact?.toFixed(1) ?? '0.0' }}
                                </div>
                                <div class="text-xs text-gray-500">Impact Score</div>
                            </div>
                        </div>

                        <!-- Availability -->
                        <div
                            class="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-green-100">
                                    <Icon icon="solar:server-bold" class="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-theme-black">Availability</p>
                                    <p class="text-xs text-gray-500">Service disruption risk</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-theme-black">
                                    {{ stats.mean_availability_impact?.toFixed(1) ?? '0.0' }}
                                </div>
                                <div class="text-xs text-gray-500">Impact Score</div>
                            </div>
                        </div>
                    </div>

                    <!-- Overall Impact Summary -->
                    <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-theme-black">Overall Impact</p>
                                <p class="text-xs text-gray-500">Combined risk assessment</p>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-theme-black">
                                    {{
                                        (
                                            ((stats.mean_confidentiality_impact || 0) +
                                                (stats.mean_integrity_impact || 0) +
                                                (stats.mean_availability_impact || 0)) /
                                            3
                                        ).toFixed(1)
                                    }}
                                </div>
                                <div class="text-xs text-gray-500">Average Score</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="space-y-3">
                    <TextLoader v-for="i in 4" :key="i" />
                </div>
            </InfoCard>
        </div>

        <!-- Additional Metrics -->
        <div class="grid gap-4 grid-cols-1 md:grid-cols-3">
            <!-- Mean Severity -->
            <StatCard
                label="Mean Severity"
                :value="stats.mean_severity?.toFixed(2) ?? '0.00'"
                icon="solar:chart-line-bold"
                variant="default"
                :subtitle="
                    stats.mean_severity_diff !== undefined
                        ? `${stats.mean_severity_diff > 0 ? '+' : ''}${stats.mean_severity_diff?.toFixed(2)} from last scan`
                        : 'Average vulnerability severity'
                "
                :subtitle-icon="
                    stats.mean_severity_diff && stats.mean_severity_diff > 0
                        ? 'solar:arrow-up-linear'
                        : stats.mean_severity_diff && stats.mean_severity_diff < 0
                          ? 'solar:arrow-down-linear'
                          : 'solar:chart-linear'
                "
            />

            <!-- Max Severity -->
            <StatCard
                label="Max Severity"
                :value="stats.max_severity?.toFixed(2) ?? '0.00'"
                icon="solar:danger-triangle-bold"
                variant="danger"
                :subtitle="
                    stats.max_severity_diff !== undefined
                        ? `${stats.max_severity_diff > 0 ? '+' : ''}${stats.max_severity_diff?.toFixed(2)} from last scan`
                        : 'Highest severity found'
                "
                :subtitle-icon="
                    stats.max_severity_diff && stats.max_severity_diff > 0
                        ? 'solar:arrow-up-linear'
                        : stats.max_severity_diff && stats.max_severity_diff < 0
                          ? 'solar:arrow-down-linear'
                          : 'solar:danger-linear'
                "
            />

            <!-- OWASP Top 10 -->
            <InfoCard
                title="Top OWASP Categories"
                description="Most prevalent OWASP Top 10 vulnerabilities"
                icon="solar:shield-bold"
                variant="primary"
            >
                <div v-if="render && topOwaspCategories.length > 0" class="space-y-3">
                    <div
                        v-for="(category, index) in topOwaspCategories"
                        :key="index"
                        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-theme-black truncate">
                                {{ category.name.split(':')[1] || category.name }}
                            </p>
                            <p class="text-xs text-gray-500">{{ category.name.split(':')[0] }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-primary text-white"
                            >
                                {{ category.count }}
                            </span>
                        </div>
                    </div>
                </div>
                <div v-else-if="render" class="text-center py-8">
                    <Icon
                        icon="solar:shield-check-bold"
                        class="w-12 h-12 text-theme-primary mx-auto mb-2"
                    />
                    <p class="text-sm text-gray-500">No OWASP Top 10 vulnerabilities found</p>
                </div>
                <div v-else class="space-y-3">
                    <TextLoader v-for="i in 3" :key="i" />
                </div>
            </InfoCard>
        </div>

        <!-- Quick Actions -->
        <InfoCard
            title="Security Actions"
            description="Recommended actions to improve your security posture"
            icon="solar:settings-bold"
            variant="primary"
        >
            <div class="grid gap-3 grid-cols-1 md:grid-cols-3">
                <button
                    class="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-theme-primary hover:bg-theme-primary/5 transition-all duration-200 text-left group"
                    @click="handleFixCritical"
                >
                    <div class="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                        <Icon icon="solar:bug-minimalistic-bold" class="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p class="font-semibold text-theme-black">Fix Critical Issues</p>
                        <p class="text-sm text-gray-500">
                            Address {{ stats.number_of_critical ?? 0 }} critical vulnerabilities
                        </p>
                    </div>
                </button>

                <button
                    class="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-theme-primary hover:bg-theme-primary/5 transition-all duration-200 text-left group"
                    @click="handleUpdateVulnerable"
                >
                    <div
                        class="p-2 rounded-lg bg-theme-primary/10 group-hover:bg-theme-primary/20 transition-colors"
                    >
                        <Icon icon="solar:refresh-bold" class="w-5 h-5 text-theme-primary" />
                    </div>
                    <div>
                        <p class="font-semibold text-theme-black">Update Dependencies</p>
                        <p class="text-sm text-gray-500">
                            Update {{ stats.number_of_vulnerable_dependencies ?? 0 }} vulnerable
                            packages
                        </p>
                    </div>
                </button>

                <button
                    class="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-theme-primary hover:bg-theme-primary/5 transition-all duration-200 text-left group"
                    @click="handleExportSecurityReport"
                >
                    <div
                        class="p-2 rounded-lg bg-theme-primary/10 group-hover:bg-theme-primary/20 transition-colors"
                    >
                        <Icon icon="solar:document-bold" class="w-5 h-5 text-theme-primary" />
                    </div>
                    <div>
                        <p class="font-semibold text-theme-black">Export Report</p>
                        <p class="text-sm text-gray-500">Generate security analysis report</p>
                    </div>
                </button>
            </div>
        </InfoCard>
    </div>
</template>
