<template>
    <div value="sbom" class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
            <!-- <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> NodeJS Supported Version </CardTitle>
                    <Icon :icon="'akar-icons:node-fill'" class="text-gray-400"></Icon>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.node_min_supported_version }} >
                        {{ stats.node_max_supported_version }}
                    </div>
                    <p class="text-xs text-muted-foreground">last month</p>
                </CardContent>
            </Card> -->
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Direct Dependencies </CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        class="h-4 w-4 text-muted-foreground"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_non_dev_dependencies ?? 0 }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_direct_dependencies_diff ?? 0 }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Direct Dev Dependencies </CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        class="h-4 w-4 text-muted-foreground"
                    >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_dev_dependencies ?? 0 }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_dev_dependencies_diff ?? 0 }}
                    </p>
                </CardContent>
            </Card>
            <!-- <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Transitive Dependencies </CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        class="h-4 w-4 text-muted-foreground"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_transitive_dependencies ?? 0 }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_transitive_dependencies_diff ?? 0 }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Optional Dependencies </CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        class="h-4 w-4 text-muted-foreground"
                    >
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <path d="M2 10h20" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_optional_dependencies ?? 0 }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_optional_dependencies_diff ?? 0 }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Peer Dependencies </CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        class="h-4 w-4 text-muted-foreground"
                    >
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_peer_dependencies ?? 0 }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_peer_dependencies_diff ?? 0 }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Bundled Dependencies </CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        class="h-4 w-4 text-muted-foreground"
                    >
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <path d="M2 10h20" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_bundled_dependencies ?? 0 }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_bundled_dependencies_diff ?? 0 }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Average Age </CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        class="h-4 w-4 text-muted-foreground"
                    >
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ formatAgo(stats.average_dependency_age).replace('ago', '') ?? 'N/A' }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{
                            formatAgo(stats.average_dependency_age_diff).replace('ago', '') ?? 'N/A'
                        }}
                    </p>
                </CardContent>
            </Card> -->
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div class="grid gap-4 col-span-3">
                <Card class="col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle>Composition</CardTitle>
                        <CardDescription
                            >{{ stats.number_of_dependencies ?? 0 }} Dependencies</CardDescription
                        >
                    </CardHeader>
                    <CardContent class="flex items-center justify-center flex-grow">
                        <div class="flex gap-2 items-center justify-center">
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
                <Card class="col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>
                            {{
                                (stats?.number_of_unlicensed_dependencies ?? 0) +
                                (stats?.number_of_outdated_dependencies ?? 0) +
                                (stats?.number_of_deprecated_dependencies ?? 0)
                            }}
                            Issues
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="flex items-center justify-center flex-grow">
                        <div class="flex gap-2 items-center justify-center">
                            <div class="flex flex-col items-center justify-center">
                                <TextLoader v-if="!render" />
                                <div v-if="render" class="flex items-center gap-1">
                                    <Icon :icon="'ph:circle-fill'" class="text-[#146c94]"></Icon>
                                    <div class="flex items-center gap-1">
                                        <div>Deprecated</div>
                                        <div class="side-stats-text-value" style="color: #146c94">
                                            {{ stats?.number_of_deprecated_dependencies }}
                                        </div>
                                    </div>
                                </div>
                                <TextLoader v-if="!render" />
                                <div v-if="render" class="flex items-center gap-1">
                                    <Icon :icon="'ph:circle-fill'" class="text-[#19a7ce]"></Icon>
                                    <div class="flex items-center gap-1">
                                        <div>Unlicensed</div>
                                        <div class="side-stats-text-value" style="color: #19a7ce">
                                            {{ stats?.number_of_unlicensed_dependencies }}
                                        </div>
                                    </div>
                                </div>
                                <TextLoader v-if="!render" />
                                <div v-if="render" class="flex items-center gap-1">
                                    <Icon :icon="'ph:circle-fill'" class="text-[#afd3e2]"></Icon>
                                    <div class="flex items-center gap-1">
                                        <div>Outdated</div>
                                        <div class="side-stats-text-value" style="color: #afd3e2">
                                            {{ stats?.number_of_outdated_dependencies }}
                                        </div>
                                    </div>
                                </div>
                                <TextLoader v-if="!render" />
                            </div>

                            <div v-if="render">
                                <Bar :data="bar_data" :options="bar_config" />
                            </div>
                            <div v-if="!render" class="w-1/2">
                                <div
                                    style="
                                        display: flex;
                                        flex-direction: row;
                                        column-gap: 1em;
                                        align-items: end;
                                    "
                                >
                                    <BoxLoader :dimensions="{ height: '30px', width: '40px' }" />
                                    <BoxLoader :dimensions="{ height: '60px', width: '40px' }" />
                                    <BoxLoader :dimensions="{ height: '150px', width: '40px' }" />
                                </div>
                            </div>
                            <div class="stats-divider hide-on-collpase"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card class="col-span-4">
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

<script lang="ts" setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue/dist/iconify.js';

import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import TextLoader from '../../../common_components/TextLoader.vue';
import BoxLoader from '../../../common_components/BoxLoader.vue';
import DonutLoader from '../../../common_components/DonutLoader.vue';
import { SbomStats } from '@/repositories/types/entities/Stats';
import moment from 'moment';
import { Doughnut, Bar } from 'vue-chartjs';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/repositories/ResultsRepository';
import type { DataResponse } from '@/repositories/types/responses/DataResponse';
import SbomTable from './SbomTable.vue';

export interface Props {
    analysisID: string;
    projectID: string;
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
        getSbomStats();
    }
);
watch(
    () => props.analysisID,
    () => {
        getSbomStats();
    }
);

const render: Ref<boolean> = ref(false);
// const error = ref(false);
const stats: Ref<SbomStats> = ref(new SbomStats());

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

let donutDimensions = {
    width: '180px',
    height: '180px'
};

// Methods
function formatAgo(dateString: number) {
    return moment(dateString).fromNow();
}
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
            workspace: '.',
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        stats.value = res.data;
        render.value = true;
    } catch (_err) {
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
    let labels = ['Deprecated', 'Unlicensed', 'Outdated'];
    let data = [
        stats.value.number_of_deprecated_dependencies,
        stats.value.number_of_unlicensed_dependencies,
        stats.value.number_of_outdated_dependencies
    ];
    let colors = ['#146C94', '#19A7CE', '#AFD3E2'];

    let dependency_dist_data = {
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
    let labels = ['Direct', 'Transitive'];
    let data = [
        stats.value.number_of_direct_dependencies,
        stats.value.number_of_transitive_dependencies
    ];
    let colors = ['#146C94', '#19A7CE'];

    let dependency_dist_data = {
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
