<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { Button } from '@/shadcn/ui/button';

import { ref, watch, computed } from 'vue';
import type { Ref } from 'vue';
import TextLoader from '@/base_components/ui/loaders/TextLoader.vue';
import DonutLoader from '@/base_components/ui/loaders/DonutLoader.vue';
import { SbomStats } from '@/codeclarity_components/results/stats.entity';
import DoughnutChart from '@/base_components/data-display/charts/DoughnutChart.vue';
import type { DoughnutChartData } from '@/base_components/data-display/charts/doughnutChart';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import SbomTable from './SbomTable.vue';
import SelectWorkspace from '../SelectWorkspace.vue';

// Import common components
import StatCard from '@/base_components/ui/cards/StatCard.vue';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';

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
const donut_data: Ref<DoughnutChartData> = ref([]);
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
    // Updated colors to use theme colors
    const colors = ['#000000', '#1dce79', '#333333'];

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
    // Updated colors to use theme colors
    const colors = ['#1dce79', '#000000', '#666666'];

    // Convert to d3 DoughnutChart format
    const d3_data: DoughnutChartData = labels.map((label, index) => ({
        label: label as any, // Cast to satisfy the type requirement
        count: data[index],
        color: colors[index]
    }));

    donut_data.value = d3_data;
}
</script>

<template>
    <div value="sbom" class="space-y-8">
        <SelectWorkspace
            v-model:error="error"
            v-model:selected_workspace="selected_workspace"
            :project-i-d="projectID"
            :analysis-i-d="analysisID"
        ></SelectWorkspace>

        <!-- Quick Stats Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Dependencies -->
            <StatCard
                label="Total Dependencies"
                :value="stats.number_of_dependencies ?? 0"
                icon="solar:folder-bold"
                variant="default"
                subtitle="All project dependencies"
                subtitle-icon="solar:folder-linear"
                class="border-l-4 border-l-gray-400"
            />

            <!-- Direct Dependencies -->
            <StatCard
                label="Direct Dependencies"
                :value="stats.number_of_direct_dependencies ?? 0"
                icon="solar:target-bold"
                variant="primary"
                subtitle="Explicitly added"
                subtitle-icon="solar:target-linear"
                class="border-l-4 border-l-[#1dce79]"
            />

            <!-- Health Score -->
            <StatCard
                label="Health Score"
                :value="`${healthScore}%`"
                icon="solar:heart-pulse-bold"
                :variant="healthScore >= 80 ? 'success' : healthScore >= 60 ? 'primary' : 'danger'"
                :subtitle="
                    healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs attention'
                "
                subtitle-icon="solar:heart-pulse-linear"
                :class="
                    healthScore >= 80
                        ? 'border-l-4 border-l-green-500'
                        : healthScore >= 60
                          ? 'border-l-4 border-l-[#1dce79]'
                          : 'border-l-4 border-l-red-500'
                "
            />

            <!-- Security Issues -->
            <StatCard
                label="Security Issues"
                :value="securityIssues"
                icon="solar:shield-warning-bold"
                :variant="securityIssues === 0 ? 'success' : 'danger'"
                :subtitle="securityIssues === 0 ? 'No issues found' : 'Requires attention'"
                subtitle-icon="solar:shield-warning-linear"
                :class="
                    securityIssues === 0
                        ? 'border-l-4 border-l-green-500'
                        : 'border-l-4 border-l-red-500'
                "
            />
        </div>
        <!-- Main Dashboard Grid -->
        <div class="grid gap-6 lg:grid-cols-12">
            <!-- Dependency Composition Chart -->
            <InfoCard
                title="Dependency Composition"
                :description="`${stats.number_of_dependencies ?? 0} dependencies in your project`"
                icon="solar:chart-donut-bold"
                variant="primary"
                class="lg:col-span-6"
            >
                <div class="flex items-center justify-between gap-6">
                    <!-- Chart -->
                    <div class="flex-shrink-0">
                        <div v-if="render" class="relative">
                            <DoughnutChart
                                id="sbom-dependency-chart"
                                :data="donut_data"
                                :options="{ w: 180, h: 180, p: 20 }"
                            />
                            <!-- Center text overlay -->
                            <div class="absolute inset-0 flex items-center justify-center">
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-gray-900">
                                        {{ stats.number_of_dependencies ?? 0 }}
                                    </div>
                                    <div class="text-xs text-gray-600">Total</div>
                                </div>
                            </div>
                        </div>
                        <DonutLoader v-if="!render" :dimensions="donutDimensions" />
                    </div>

                    <!-- Legend with improved readability -->
                    <div class="flex-1 space-y-3">
                        <div v-if="render" class="space-y-3">
                            <div
                                class="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-transparent border border-green-100 rounded-lg hover:shadow-sm transition-shadow"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-4 h-4 rounded-full bg-[#1dce79] shadow-sm"></div>
                                    <div>
                                        <span class="text-sm font-semibold text-gray-900"
                                            >Direct</span
                                        >
                                        <p class="text-xs text-gray-600">Explicitly added</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xl font-bold text-[#1dce79]">
                                        {{ stats?.number_of_direct_dependencies }}
                                    </div>
                                    <div class="text-xs font-medium text-gray-500">
                                        {{
                                            Math.round(
                                                (stats?.number_of_direct_dependencies /
                                                    stats?.number_of_dependencies) *
                                                    100
                                            )
                                        }}% of total
                                    </div>
                                </div>
                            </div>

                            <div
                                class="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-transparent border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-4 h-4 rounded-full bg-black shadow-sm"></div>
                                    <div>
                                        <span class="text-sm font-semibold text-gray-900"
                                            >Transitive</span
                                        >
                                        <p class="text-xs text-gray-600">
                                            Pulled in by other packages
                                        </p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xl font-bold text-black">
                                        {{ stats?.number_of_transitive_dependencies }}
                                    </div>
                                    <div class="text-xs font-medium text-gray-500">
                                        {{
                                            Math.round(
                                                (stats?.number_of_transitive_dependencies /
                                                    stats?.number_of_dependencies) *
                                                    100
                                            )
                                        }}% of total
                                    </div>
                                </div>
                            </div>

                            <div
                                class="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-transparent border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-4 h-4 rounded-full bg-gray-400 shadow-sm"></div>
                                    <div>
                                        <span class="text-sm font-semibold text-gray-900"
                                            >Both</span
                                        >
                                        <p class="text-xs text-gray-600">Direct & transitive</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xl font-bold text-gray-400">
                                        {{ stats?.number_of_both_direct_transitive_dependencies }}
                                    </div>
                                    <div class="text-xs font-medium text-gray-500">
                                        {{
                                            Math.round(
                                                (stats?.number_of_both_direct_transitive_dependencies /
                                                    stats?.number_of_dependencies) *
                                                    100
                                            )
                                        }}% of total
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="space-y-2">
                            <TextLoader v-for="i in 3" :key="i" />
                        </div>
                    </div>
                </div>
            </InfoCard>

            <!-- Quick Actions and Additional Stats -->
            <div class="lg:col-span-6 space-y-6">
                <!-- Quick Actions -->
                <InfoCard
                    title="Quick Actions"
                    description="Common dependency management tasks"
                    icon="solar:lightning-bold"
                    variant="success"
                >
                    <div class="space-y-3">
                        <Button
                            class="w-full bg-[#1dce79] hover:bg-[#17b56b] text-white flex items-center gap-3 justify-start p-4 h-auto text-left shadow-sm hover:shadow-md transition-all"
                            @click="handleUpdateOutdated"
                        >
                            <div class="bg-white/20 p-2 rounded-lg">
                                <Icon icon="solar:refresh-bold" class="h-5 w-5" />
                            </div>
                            <div class="flex-1">
                                <div class="font-semibold">Update Outdated</div>
                                <div class="text-sm opacity-90">
                                    Update {{ stats.number_of_outdated_dependencies || 0 }} outdated
                                    packages
                                </div>
                            </div>
                        </Button>

                        <Button
                            :disabled="securityIssues === 0"
                            class="w-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-3 justify-start p-4 h-auto text-left shadow-sm hover:shadow-md transition-all disabled:bg-gray-200 disabled:text-gray-400"
                            @click="handleFixSecurity"
                        >
                            <div class="bg-white/20 p-2 rounded-lg">
                                <Icon icon="solar:shield-check-bold" class="h-5 w-5" />
                            </div>
                            <div class="flex-1">
                                <div class="font-semibold">Fix Security Issues</div>
                                <div class="text-sm opacity-90">
                                    {{
                                        securityIssues === 0
                                            ? 'No security issues found'
                                            : `Address ${securityIssues} security issues`
                                    }}
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            class="w-full border-2 border-gray-200 hover:border-[#1dce79] hover:bg-[#1dce79]/5 text-gray-700 hover:text-[#1dce79] flex items-center gap-3 justify-start p-4 h-auto text-left transition-all"
                            @click="handleExportReport"
                        >
                            <div class="bg-gray-100 p-2 rounded-lg group-hover:bg-[#1dce79]/10">
                                <Icon icon="solar:download-bold" class="h-5 w-5" />
                            </div>
                            <div class="flex-1">
                                <div class="font-semibold">Export Report</div>
                                <div class="text-sm text-gray-500">
                                    Download detailed SBOM report
                                </div>
                            </div>
                        </Button>
                    </div>
                </InfoCard>
            </div>
        </div>

        <!-- SBOM Table -->
        <InfoCard
            title="Dependencies Table"
            description="Detailed view of all project dependencies"
            icon="solar:table-bold"
            variant="default"
        >
            <SbomTable
                :project-i-d="projectID"
                :analysis-i-d="analysisID"
                :selected_workspace="selected_workspace"
            />
        </InfoCard>
    </div>
</template>
