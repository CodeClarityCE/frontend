<script lang="ts" setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue/dist/iconify.js';

import { ref, watch } from 'vue';
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
import { WorkspacesOutput } from '../workspace.entity';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/shadcn/ui/select';

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

watch(
    () => props.projectID,
    () => {
        getSbomStats('.');
    }
);
watch(
    () => props.analysisID,
    () => {
        getSbomStats('.');
    }
);

const render: Ref<boolean> = ref(false);
// const error = ref(false);
const stats: Ref<SbomStats> = ref(new SbomStats());
const workspaces: Ref<WorkspacesOutput> = ref(new WorkspacesOutput());

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

// Methods
getSbomStats('.');
async function getSbomStats(workspace: string, refresh: boolean = false) {
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
            workspace: workspace,
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

async function getSbomWorkspaces() {
    if (!userStore.getDefaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;
    try {
        const res = await sbomRepo.getSbomWorkspaces({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        workspaces.value = res.data;
    } catch (_err) {
        console.error(_err);
        error.value = true;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    }
}
getSbomWorkspaces();

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
                spacing: 3,
                borderRadius: 3,
                data: data,
                backgroundColor: colors
            }
        ]
    };

    donut_data.value = dependency_dist_data;
    donut_config.value = {
        maintainAspectRatio: true,
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                // Disable the on-canvas tooltip
                enabled: false
            }
        },
        layout: {
            padding: 20
        }
    };
}
</script>

<template>
    <div value="sbom" class="space-y-4">
        <div class="flex flex-col items-center">
            <Select @update:model-value="(e) => getSbomStats(e as string)">
                <SelectTrigger class="w-[180px]">
                    <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Workspaces</SelectLabel>
                        <SelectItem
                            v-for="workspace of workspaces.workspaces"
                            :key="workspace"
                            :value="workspace"
                        >
                            {{ workspace }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-8">
            <Card class="lg:col-start-3">
                <CardHeader class="flex flex-col items-center">
                    <CardTitle> {{ stats.number_of_non_dev_dependencies ?? 0 }}</CardTitle>
                    <CardDescription>{{
                        stats.number_of_direct_dependencies_diff ?? 0
                    }}</CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col items-center text-center">
                    Direct Dependencies
                </CardContent>
            </Card>
            <Card class="lg:col-start-3 lg:row-start-2 row-start-1 row-span-1">
                <CardHeader class="flex flex-col items-center">
                    <CardTitle> {{ stats.number_of_dev_dependencies ?? 0 }}</CardTitle>
                    <CardDescription>{{
                        stats.number_of_dev_dependencies_diff ?? 0
                    }}</CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col items-center text-center">
                    Direct Dev Dependencies
                </CardContent>
            </Card>
            <Card class="col-span-3 row-span-2 flex flex-col">
                <CardHeader>
                    <CardTitle>Composition</CardTitle>
                    <CardDescription
                        >{{ stats.number_of_dependencies ?? 0 }} Dependencies</CardDescription
                    >
                </CardHeader>
                <CardContent class="flex items-center justify-center flex-grow">
                    <div class="flex gap-2 flex-wrap items-center justify-center">
                        <div class="flex flex-col">
                            <TextLoader v-if="!render" />
                            <div v-if="render" class="flex items-center gap-1">
                                <Icon :icon="'ph:circle-fill'" class="text-[#146c94]"></Icon>
                                <div class="flex items-center gap-1">
                                    <div>Direct</div>
                                    <div class="text-[#146c94]">
                                        {{ stats?.number_of_direct_dependencies }}
                                    </div>
                                </div>
                            </div>
                            <TextLoader v-if="!render" />
                            <div v-if="render" class="flex items-center gap-1">
                                <Icon :icon="'ph:circle-fill'" class="text-[#19a7ce]"></Icon>
                                <div class="flex items-center gap-1">
                                    <div>Transitive</div>
                                    <div class="text-[#19a7ce]">
                                        {{ stats?.number_of_transitive_dependencies }}
                                    </div>
                                </div>
                            </div>
                            <TextLoader v-if="!render" />
                            <TextLoader v-if="!render" />
                            <div v-if="render" class="flex items-center gap-1">
                                <Icon :icon="'ph:circle-fill'" class="text-[#008491]"></Icon>
                                <div class="flex items-center gap-1">
                                    <div>Both</div>
                                    <div class="text-[#008491]">
                                        {{ stats?.number_of_both_direct_transitive_dependencies }}
                                    </div>
                                </div>
                            </div>
                            <TextLoader v-if="!render" />
                        </div>

                        <div v-if="render">
                            <Doughnut :data="donut_data" :options="donut_config" />
                        </div>
                        <div>
                            <DonutLoader v-if="!render" :dimensions="donutDimensions" />
                        </div>
                        <div class="stats-divider hide-on-collpase"></div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card class="col-span-4 lg:col-start-2">
                <CardHeader>
                    <CardTitle>Table</CardTitle>
                </CardHeader>
                <CardContent class="pl-2">
                    <SbomTable />
                </CardContent>
            </Card>
        </div>
    </div>
</template>
