<script lang="ts" setup>
/**
 * SBOM Content Component
 *
 * Main component for displaying Software Bill of Materials (SBOM) data.
 * Features:
 * - Package manager detection and adaptation
 * - Health score calculation and security metrics
 * - Direct dependency update modal
 * - Multi-format export (CSV, JSON, CycloneDX, HTML)
 * - Interactive charts and statistics
 */

import type { DoughnutChartData } from '@/base_components/data-display/charts/doughnutChart';
import DoughnutChart from '@/base_components/data-display/charts/DoughnutChart.vue';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import StatCard from '@/base_components/ui/cards/StatCard.vue';
import DonutLoader from '@/base_components/ui/loaders/DonutLoader.vue';
import TextLoader from '@/base_components/ui/loaders/TextLoader.vue';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { SbomStats } from '@/codeclarity_components/results/stats.entity';
import { Button } from '@/shadcn/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { Icon } from '@iconify/vue';
import { computed, ref, type Ref, watch } from 'vue';
import SelectWorkspace from '../SelectWorkspace.vue';
import {
    convertToCycloneDX,
    convertToCSV,
    convertToHTML,
    sortDependenciesByPriority,
    type ExportOptions
} from './exports/sbomExportUtils';
import PackageJsonUpdatesModal from './PackageJsonUpdatesModal.vue';
import SbomExportMenu from './SbomExportMenu.vue';
import SbomTable from './SbomTable.vue';
import {
    calculateHealthScore,
    calculateSecurityIssues,
    convertToPackageUpdates,
    getDirectDependenciesNeedingUpdates,
    type Dependency
} from './utils/sbomUtils';

export interface Props {
    analysisID?: string;
    projectID?: string;
    projectName?: string;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: '',
    projectName: ''
});

// Repositories and stores
const sbomRepo: ResultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

// Component state
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const render: Ref<boolean> = ref(false);

// SBOM data
const stats: Ref<SbomStats> = ref(new SbomStats());
const dependencies: Ref<Dependency[]> = ref([]);
const allDependencies: Ref<Dependency[]> = ref([]); // Store all dependencies for filtering
const selected_workspace: Ref<string> = ref('.');
const packageManager: Ref<string> = ref('yarn'); // Detected from workspace data
const selectedEcosystemFilter: Ref<string | null> = ref(null);

// UI state
const showUpdatesModal: Ref<boolean> = ref(false);

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
const exportMenuRef = ref<InstanceType<typeof SbomExportMenu>>();

const donutDimensions = {
    width: '180px',
    height: '180px'
};

// Watchers
watch(
    () => props.projectID,
    () => getSbomStats()
);
watch(
    () => props.analysisID,
    () => getSbomStats()
);
watch(selected_workspace, () => getSbomStats());

// Computed properties - using utility functions for clarity
const healthScore = computed(() => calculateHealthScore(stats.value));
const securityIssues = computed(() => calculateSecurityIssues(stats.value));
const directDependenciesNeedingUpdates = computed(() =>
    getDirectDependenciesNeedingUpdates(dependencies.value)
);
const directUpdatesCount = computed(() => directDependenciesNeedingUpdates.value.length);
const packageUpdates = computed(() =>
    convertToPackageUpdates(directDependenciesNeedingUpdates.value)
);

// Event handlers
function handleUpdateOutdated(): void {
    /** Opens the package.json updates modal if there are direct dependencies needing updates */
    if (directUpdatesCount.value > 0) {
        showUpdatesModal.value = true;
    }
}

function handleCopyToClipboard(_content: string): void {
    /** Handles clipboard copy events from the modal */
    // Content copied to clipboard
}

function handlePackageManagerLoaded(manager: string): void {
    /** Receives package manager info from SelectWorkspace component */
    packageManager.value = manager.toLowerCase();
}

function handleEcosystemFilterChanged(ecosystemType: string | null): void {
    /** Handles ecosystem filter changes from SelectWorkspace component */
    selectedEcosystemFilter.value = ecosystemType;
    // Refresh both dependencies and stats with the new filter
    void getSbomStats(true); // This will call fetchDependencies() as well
}

async function handleExportReport(format: 'csv' | 'json' | 'cyclonedx' | 'html'): Promise<void> {
    if (!authStore.getAuthenticated || !authStore.getToken) return;
    if (!userStore.getDefaultOrg || !props.analysisID) return;

    try {
        const exportMenu = exportMenuRef.value as {
            setExportProgress?: (msg: string) => void;
        } | null;
        if (exportMenu?.setExportProgress) {
            exportMenu.setExportProgress('Fetching dependencies...');
        }

        // First, get the initial page to know the total count
        const firstPage = await sbomRepo.getSbom({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: selected_workspace.value,
            bearerToken: authStore.getToken,
            pagination: { page: 0, entries_per_page: 100 },
            sort: { sortKey: 'name', sortDirection: 'asc' },
            active_filters: '',
            search_key: '',
            ecosystem_filter: selectedEcosystemFilter.value ?? undefined,
            handleBusinessErrors: true
        });

        // Collect all dependencies
        let exportDependencies = [...firstPage.data];

        // If there are more pages, fetch them all
        if (firstPage.total_pages > 1) {
            const exportMenu = exportMenuRef.value as {
                setExportProgress?: (msg: string) => void;
            } | null;
            if (exportMenu?.setExportProgress) {
                exportMenu.setExportProgress(`Fetching ${firstPage.total_pages} pages...`);
            }

            const promises = [];
            for (let page = 1; page < firstPage.total_pages; page++) {
                promises.push(
                    sbomRepo.getSbom({
                        orgId: userStore.getDefaultOrg.id,
                        projectId: props.projectID,
                        analysisId: props.analysisID,
                        workspace: selected_workspace.value,
                        bearerToken: authStore.getToken,
                        pagination: { page, entries_per_page: 100 },
                        sort: { sortKey: 'name', sortDirection: 'asc' },
                        active_filters: '',
                        search_key: '',
                        ecosystem_filter: selectedEcosystemFilter.value ?? undefined,
                        handleBusinessErrors: true
                    })
                );
            }

            const additionalPages = await Promise.all(promises);
            additionalPages.forEach((page) => {
                exportDependencies = exportDependencies.concat(page.data);
            });
        }

        const exportMenu2 = exportMenuRef.value as {
            setExportProgress?: (msg: string) => void;
        } | null;
        if (exportMenu2?.setExportProgress) {
            exportMenu2.setExportProgress(`Generating ${format.toUpperCase()} file...`);
        }

        const exportOptions: ExportOptions = {
            projectName: props.projectName ?? '',
            projectId: props.projectID ?? ''
        };

        let content: string;
        let filename: string;
        let mimeType: string;
        const dateStr = new Date().toISOString().split('T')[0];
        const projectName = props.projectName ?? props.projectID;

        switch (format) {
            case 'csv':
                content = convertToCSV(exportDependencies);
                filename = `sbom-${projectName}-${dateStr}.csv`;
                mimeType = 'text/csv';
                break;
            case 'html':
                content = convertToHTML(exportDependencies, exportOptions);
                filename = `sbom-${projectName}-${dateStr}.html`;
                mimeType = 'text/html';
                break;
            case 'json':
                content = JSON.stringify(sortDependenciesByPriority(exportDependencies), null, 2);
                filename = `sbom-${projectName}-${dateStr}.json`;
                mimeType = 'application/json';
                break;
            case 'cyclonedx':
                content = convertToCycloneDX(exportDependencies, exportOptions);
                filename = `sbom-${projectName}-${dateStr}-cyclonedx.json`;
                mimeType = 'application/json';
                break;
            default:
                throw new Error(`Unsupported export format: ${format as string}`);
        }

        // Create and trigger download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Reset export state
        const exportMenu3 = exportMenuRef.value as { resetExportState?: () => void } | null;
        if (exportMenu3?.resetExportState) {
            exportMenu3.resetExportState();
        }
    } catch (error) {
        console.error('Export failed:', error);
        const exportMenu4 = exportMenuRef.value as { resetExportState?: () => void } | null;
        if (exportMenu4?.resetExportState) {
            exportMenu4.resetExportState();
        }
    }
}

async function fetchDependencies(): Promise<void> {
    if (!authStore.getAuthenticated || !authStore.getToken) return;
    if (!userStore.getDefaultOrg || !props.analysisID) return;

    try {
        // Fetch first page to get total count
        const firstPage = await sbomRepo.getSbom({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: selected_workspace.value,
            bearerToken: authStore.getToken,
            pagination: { page: 0, entries_per_page: 100 },
            sort: { sortKey: 'name', sortDirection: 'asc' },
            active_filters: '',
            search_key: '',
            ecosystem_filter: selectedEcosystemFilter.value ?? undefined,
            handleBusinessErrors: true
        });

        let fetchedDependencies = [...firstPage.data];

        // If there are more pages, fetch them all
        if (firstPage.total_pages > 1) {
            const promises = [];
            for (let page = 1; page < firstPage.total_pages; page++) {
                promises.push(
                    sbomRepo.getSbom({
                        orgId: userStore.getDefaultOrg.id,
                        projectId: props.projectID,
                        analysisId: props.analysisID,
                        workspace: selected_workspace.value,
                        bearerToken: authStore.getToken,
                        pagination: { page, entries_per_page: 100 },
                        sort: { sortKey: 'name', sortDirection: 'asc' },
                        active_filters: '',
                        search_key: '',
                        ecosystem_filter: selectedEcosystemFilter.value ?? undefined,
                        handleBusinessErrors: true
                    })
                );
            }

            const additionalPages = await Promise.all(promises);
            additionalPages.forEach((page) => {
                fetchedDependencies = fetchedDependencies.concat(page.data);
            });
        }

        dependencies.value = fetchedDependencies;
        allDependencies.value = fetchedDependencies; // Store for potential client-side operations
    } catch (error) {
        console.error('Failed to fetch dependencies:', error);
    }
}

// Methods
void getSbomStats();
async function getSbomStats(refresh = false): Promise<void> {
    if (!userStore.getDefaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    if (!authStore.getAuthenticated || !props.analysisID) return;

    let res: DataResponse<SbomStats>;
    try {
        res = await sbomRepo.getSbomStat({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: selected_workspace.value,
            bearerToken: authStore.getToken,
            ecosystem_filter: selectedEcosystemFilter.value ?? undefined,
            handleBusinessErrors: true
        });
        stats.value = res.data;

        // Also fetch dependencies to calculate accurate counts
        await fetchDependencies();

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
        void createDepTypeChart();
        void createDepStatusDistChart();
    }
}

// Create charts
function createDepStatusDistChart(): void {
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

function createDepTypeChart(): void {
    const labels = ['Direct', 'Transitive', 'Both'];
    const data = [
        stats.value.number_of_direct_dependencies,
        stats.value.number_of_transitive_dependencies,
        stats.value.number_of_both_direct_transitive_dependencies
    ];
    // Updated colors to use theme colors
    const colors = ['#1dce79', '#000000', '#666666'];

    // Convert to d3 DoughnutChart format
    const d3_data = labels.map((label, index) => ({
        label: String(label),
        count: data[index] ?? 0,
        color: colors[index] ?? '#000000'
    })) as DoughnutChartData;

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
            @package-manager-loaded="handlePackageManagerLoaded"
            @ecosystem-filter-changed="handleEcosystemFilterChanged"
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
                                    <div
                                        class="w-4 h-4 rounded-full bg-theme-primary shadow-sm"
                                    ></div>
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
                                    <div class="w-4 h-4 rounded-full bg-gray-900 shadow-sm"></div>
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
                            class="w-full bg-theme-primary hover:bg-theme-primary-dark text-white flex items-center gap-3 justify-start p-4 h-auto text-left shadow-sm hover:shadow-md transition-all"
                            @click="handleUpdateOutdated"
                        >
                            <div class="bg-white/20 p-2 rounded-lg">
                                <Icon icon="solar:refresh-bold" class="h-5 w-5" />
                            </div>
                            <div class="flex-1">
                                <div class="font-semibold">Update Outdated</div>
                                <div class="text-sm opacity-90">
                                    Update {{ directUpdatesCount }} direct dependencies
                                </div>
                            </div>
                        </Button>

                        <SbomExportMenu ref="exportMenuRef" @export="handleExportReport" />
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
                :ecosystem-filter="selectedEcosystemFilter"
                :stats="stats"
            />
        </InfoCard>
    </div>

    <!-- Package.json Updates Modal -->
    <PackageJsonUpdatesModal
        v-model:open="showUpdatesModal"
        :updates="packageUpdates"
        :project-name="projectName"
        :package-manager="packageManager"
        @copy-to-clipboard="handleCopyToClipboard"
    />
</template>
