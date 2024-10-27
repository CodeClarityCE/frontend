<script setup lang="ts">
import { BusinessLogicError } from '@/repositories/BaseRepository';
import { DashboardRepository } from '@/repositories/DashboardRepository';
import type { ProjectQuickStats } from '@/repositories/types/entities/Dashboard';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import Pagination from '@/common_components/PaginationComponent.vue';
import { type TableHeader } from '@/common_components/tables/SortableTable.vue';
import { SortDirection } from '@/repositories/types/PaginatedRequestOptions';
import SortSelector from '@/common_components/tables/SortSelector.vue';
import BlueButton from '@/common_components/buttons/BlueButton.vue';
import HeatMapChart from '@/common_components/charts/HeatMapChart.vue';
import type { RadarChartOptions } from '@/common_components/charts/radarChart';
import { Skeleton } from '@/shadcn/ui/skeleton';

// Props
const props = defineProps<{
    integrationIds: string[];
}>();

watch(props.integrationIds, async () => {
    fetch();
});

// Repositories
const dashboardRepository: DashboardRepository = new DashboardRepository();

// Stores
const userStore = useUserStore();
const authStore = useAuthStore();

const { defaultOrg } = storeToRefs(userStore);

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const chartData: Ref<any> = ref();
const page: Ref<number> = ref(0);
const entriesPerPage: Ref<number> = ref(5);
const totalPages: Ref<number> = ref(0);
const totalEntries: Ref<number> = ref(0);
const chartOptions: Ref<RadarChartOptions> = ref({} as RadarChartOptions);
const projectCount: Ref<number> = ref(0);
const data: Ref<ProjectQuickStats[]> = ref([]);
const noData: Ref<boolean> = ref(false);

const sortKey: Ref<string> = ref('grade');
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);
const headers: TableHeader[] = [
    { label: 'Project', key: 'project_name' },
    { label: 'Grade', key: 'grade' },
    { label: 'Vulnerabilities', key: 'nmb_vulns' },
    { label: 'Avg Severity', key: 'avg_severity' },
    { label: 'Deprecated deps', key: 'nmb_deprecated_deps' },
    { label: 'Outdated deps', key: 'nmb_outdated_deps' },
    { label: 'License conflicts', key: 'nmb_license_conflicts' }
];

watch([page, sortDirection, sortKey], async () => {
    await fetch();
});

async function fetch(refresh: boolean = false) {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    if (!refresh) loading.value = true;

    noData.value = false;
    error.value = false;
    errorCode.value = undefined;
    projectCount.value = 0;

    try {
        const resp = await dashboardRepository.getProjectsQuickStats({
            orgId: defaultOrg.value.id,
            sort: {
                sortKey: sortKey.value,
                sortDirection: sortDirection.value
            },
            pagination: {
                page: page.value,
                entries_per_page: entriesPerPage.value
            },
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            integrationIds: props.integrationIds
        });
        if (resp.data.length == 0) noData.value = true;
        else generateChart(resp.data);
        data.value = resp.data;
        totalEntries.value = resp.total_entries;
        totalPages.value = resp.total_pages;
        chartOptions.value.h = (450 / 4) * projectCount.value;
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        if (!refresh) loading.value = false;
    }
}

function generateChart(stats: ProjectQuickStats[]) {
    const data = [];
    const xAxisLabels = [];
    const yAxisLabels = [
        'Vulnerabilities',
        'Deprecated deps',
        'Outdated deps',
        'License conflicts'
    ];
    const max = [0, 0, 0, 0];
    projectCount.value = stats.length;
    for (let entry of stats) {
        if (entry.nmb_vulnerabilities > max[0]) max[0] = entry.nmb_vulnerabilities;
        if (entry.nmb_deprecated > max[1]) max[1] = entry.nmb_deprecated;
        if (entry.nmb_outdated > max[2]) max[2] = entry.nmb_outdated;
        if (entry.nmb_license_compliance_violations > max[3])
            max[3] = entry.nmb_license_compliance_violations;
        xAxisLabels.push(entry.project.name);
        data.push({
            y: yAxisLabels[0],
            x: entry.project.name,
            v: entry.nmb_vulnerabilities
        });
        data.push({
            y: yAxisLabels[1],
            x: entry.project.name,
            v: entry.nmb_deprecated
        });
        data.push({
            y: yAxisLabels[2],
            x: entry.project.name,
            v: entry.nmb_outdated
        });
        data.push({
            y: yAxisLabels[3],
            x: entry.project.name,
            v: entry.nmb_license_compliance_violations
        });
    }
    const datasets = [
        {
            label: 'Vulns',
            data: data
        }
    ];
    chartData.value = {
        datasets: datasets
    };
}
fetch();
</script>
<template>
    <div>
        <div class="flex flex-row justify-center p-6 pt-0">
            <div v-if="loading || noData" class="flex flex-row gap-1" style="position: relative">
                <div v-for="outIndex in 5" :key="outIndex">
                    <div class="flex flex-col gap-1">
                        <Skeleton
                            v-for="index in 4"
                            :key="index"
                            class="h-[50px] w-[50px] rounded-xl"
                        />
                    </div>
                </div>
                <div
                    v-if="noData"
                    class="flex flex-row justify-center items-center absolute font-black w-full h-full"
                >
                    <div class="font-black text-xl">No Data</div>
                </div>
            </div>
            <div v-else class="flex flex-col items-center w-full">
                <template v-if="error">
                    <div class="flex flex-row gap-2">
                        <Icon
                            class="text-5xl h-fit user-icon"
                            icon="solar:confounded-square-outline"
                        ></Icon>
                        <div>
                            <div class="flex flex-row gap-2">
                                <div class="flex flex-row gap-2">
                                    <div>Failed to load the dashboard component</div>
                                </div>
                                <div class="flex flex-row gap-2 items-center flex-wrap">
                                    <BlueButton @click="fetch">
                                        <template #text> Try again </template>
                                    </BlueButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="flex flex-col gap-4">
                        <SortSelector
                            class="self-end"
                            :sort-options="headers"
                            :sort-key="sortKey"
                            :sort-direction="sortDirection"
                        />
                        <HeatMapChart
                            :chart-data="chartData"
                            :chart-options="chartOptions"
                            :id="'project-problems-chart'"
                        >
                        </HeatMapChart>
                        <Pagination
                            v-model:page="page"
                            v-model:nmbEntriesShowing="entriesPerPage"
                            v-model:nmbEntriesTotal="totalEntries"
                            v-model:totalPages="totalPages"
                        />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
