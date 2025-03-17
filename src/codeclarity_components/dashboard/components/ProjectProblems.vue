<script setup lang="ts">
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { DashboardRepository } from '@/codeclarity_components/dashboard/dashboard.repository';
import type { ProjectQuickStats } from '@/codeclarity_components/dashboard/dashboard.entity';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import Pagination from '@/base_components/PaginationComponent.vue';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import SortableTable from '@/base_components/tables/SortableTable.vue';
import { type TableHeader } from '@/base_components/tables/SortableTable.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { ProjectGradeClass } from '@/codeclarity_components/dashboard/dashboard.entity';
import {
    isNoneSeverity,
    isCriticalSeverity,
    isHighSeverity,
    isLowSeverity,
    isMediumSeverity
} from '@/utils/severity';
import SeverityBubble from '@/base_components/bubbles/SeverityBubble.vue';
import { Badge } from '@/shadcn/ui/badge';
import { Skeleton } from '@/shadcn/ui/skeleton';
import Button from '@/shadcn/ui/button/Button.vue';

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
    for (const entry of stats) {
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
    <div v-if="loading || noData" class="flex flex-row gap-1" style="position: relative">
        <div class="flex flex-col gap-2">
            <Skeleton v-for="index in 4" :key="index" class="h-[45px] w-[400px] rounded-xl" />
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
                            <Button @click="fetch"> Try again </Button>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="w-full overflow-x-scroll">
                <SortableTable
                    v-model:sort-key="sortKey"
                    v-model:sort-direction="sortDirection"
                    :headers="headers"
                >
                    <template #data>
                        <tr v-for="(entry, index) in data" :key="index">
                            <td>
                                <Badge>
                                    <a
                                        class="flex flew-wrap gap-2 items-center"
                                        :href="entry.project.url"
                                        target="_blank"
                                        title="Open source repository"
                                    >
                                        <Icon
                                            v-if="
                                                entry.project.provider == IntegrationProvider.GITHUB
                                            "
                                            class="flex-shrink-0"
                                            icon="simple-icons:github"
                                        />
                                        <Icon
                                            v-if="
                                                entry.project.provider == IntegrationProvider.GITLAB
                                            "
                                            class="flex-shrink-0"
                                            icon="devicon:gitlab"
                                        />
                                        {{ entry.project.name }}
                                    </a>
                                </Badge>
                            </td>
                            <td class="flex flex-col justify-center items-center">
                                <div
                                    v-if="
                                        entry.grade.class == ProjectGradeClass.D_PLUS ||
                                        entry.grade.class == ProjectGradeClass.D
                                    "
                                    class="font-black text-white rounded-sm w-fit py-1 px-2 bg-severityCritical"
                                >
                                    {{ entry.grade.class }}
                                </div>
                                <div
                                    v-if="
                                        entry.grade.class == ProjectGradeClass.C_PLUS ||
                                        entry.grade.class == ProjectGradeClass.C
                                    "
                                    class="font-black text-white rounded-sm w-fit py-1 px-2 bg-severityHigh"
                                >
                                    {{ entry.grade.class }}
                                </div>
                                <div
                                    v-if="
                                        entry.grade.class == ProjectGradeClass.B_PLUS ||
                                        entry.grade.class == ProjectGradeClass.B
                                    "
                                    class="font-black text-white rounded-sm w-fit py-1 px-2 bg-severityMedium"
                                >
                                    {{ entry.grade.class }}
                                </div>
                                <div
                                    v-if="
                                        entry.grade.class == ProjectGradeClass.A_PLUS ||
                                        entry.grade.class == ProjectGradeClass.A
                                    "
                                    class="font-black text-white rounded-sm w-fit py-1 px-2 bg-severityLow"
                                >
                                    {{ entry.grade.class }}
                                </div>
                            </td>
                            <td>
                                <div>
                                    {{ entry.nmb_vulnerabilities }}
                                </div>
                            </td>
                            <td class="flex flex-col justify-center items-center">
                                <SeverityBubble
                                    :critical="isCriticalSeverity(entry.avg_severity)"
                                    :high="isHighSeverity(entry.avg_severity)"
                                    :medium="isMediumSeverity(entry.avg_severity)"
                                    :low="isLowSeverity(entry.avg_severity)"
                                    :none="isNoneSeverity(entry.avg_severity)"
                                >
                                    <template #content>{{
                                        entry.avg_severity.toFixed(1)
                                    }}</template>
                                </SeverityBubble>
                            </td>
                            <td>
                                <div>
                                    {{ entry.nmb_deprecated }}
                                </div>
                            </td>
                            <td>
                                <div>
                                    {{ entry.nmb_outdated }}
                                </div>
                            </td>
                            <td>
                                <div>
                                    {{ entry.nmb_license_compliance_violations }}
                                </div>
                            </td>
                        </tr>
                    </template>
                </SortableTable>
            </div>
            <div class="flex flex-row justify-end">
                <Pagination
                    v-model:page="page"
                    v-model:nmb-entries-showing="entriesPerPage"
                    v-model:nmb-entries-total="totalEntries"
                    v-model:total-pages="totalPages"
                />
            </div>
        </template>
    </div>
</template>
