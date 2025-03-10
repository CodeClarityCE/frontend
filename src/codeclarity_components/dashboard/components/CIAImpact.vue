<script setup lang="ts">
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { DashboardRepository } from '@/codeclarity_components/dashboard/dashboard.repository';
import type { CIAImpact } from '@/codeclarity_components/dashboard/dashboard.entity';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import BoxLoader from '@/base_components/BoxLoader.vue';
import { Icon } from '@iconify/vue';
import BlueButton from '@/base_components/buttons/BlueButton.vue';
import RadarChart from '@/base_components/charts/RadarChart.vue';
import type { RadarChartData, RadarChartOptions } from '@/base_components/charts/radarChart';

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
const chartDataold: Ref<any | undefined> = ref();
const chartOptions: Ref<any | undefined> = ref();
const ciaMap: Ref<{ [key: string]: { color: string; value: number } }> = ref({});

const chartData: Ref<RadarChartData> = ref([
    {
        name: 'Mean Impact',
        axes: []
    }
]);

const options: Ref<Partial<RadarChartOptions>> = ref({
    format: '0.1f',
    maxValue: 1.0
});

async function fetch(refresh: boolean = false) {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    if (!refresh) loading.value = true;

    ciaMap.value = {};
    error.value = false;
    errorCode.value = undefined;

    try {
        const resp = await dashboardRepository.getCIAImpact({
            orgId: defaultOrg.value.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            integrationIds: props.integrationIds
        });
        generateChart(resp.data);
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        if (!refresh) loading.value = false;
    }
}

function generateChart(stats: CIAImpact[]) {
    const data = [];
    const colors = ['#5390d9', '#56cfe1', '#80ffdb'];
    let i = 0;
    const indicies: { [key: string]: number } = { c: 0, i: 0, a: 0 };
    for (const impact of stats) {
        if (impact.cia == 'Confidentiality') {
            indicies.c = i;
        }
        if (impact.cia == 'Integrity') {
            indicies.i = i;
        }
        if (impact.cia == 'Availability') {
            indicies.a = i;
        }
        ciaMap.value[impact.cia] = { color: colors[i], value: impact.impact };
        i++;
    }
    for (const index of Object.values(indicies)) {
        data.push(stats[index].impact);
    }
    const labels = [
        'Mean Confidentiality Impact',
        'Mean Integrity Impact',
        'Mean Availability Impact'
    ];
    chartData.value[0].axes = [
        { axis: 'CONFIDENTIALITY', value: data[0] },
        { axis: 'INTEGRITY', value: data[1] },
        { axis: 'AVAILABILITY', value: data[2] }
    ];
    chartDataold.value = {
        labels: labels,
        datasets: [
            {
                data: data,
                fill: true,
                backgroundColor: 'rgb(83, 144, 217, 0.4)',
                borderColor: 'rgb(83, 144, 217)',
                pointBackgroundColor: 'rgb(83, 144, 217, 0.4)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(83, 144, 217, 0.4)',
                pointRadius: 0.0
            }
        ]
    };
    chartOptions.value = {
        elements: {
            line: {
                borderWidth: 0
            }
        },
        plugins: {
            legend: {
                display: false
            },
            datalabels: {
                display: false
            }
        },
        scale: {
            beginAtZero: true,
            max: 1.0,
            min: 0,
            stepSize: 0.5
        },
        scales: {
            r: {
                pointLabels: {
                    display: false
                },
                ticks: {
                    display: false
                }
            }
        }
    };
}

fetch();
</script>
<template>
    <div class="p-6 pb-2">
        <div v-if="loading" class="flex flex-row gap-1">
            <div>
                <BoxLoader :dimensions="{ width: '250px', height: '250px' }" />
            </div>
        </div>
        <div v-else>
            <div v-if="error">
                <div class="flex flex-row gap-2">
                    <Icon
                        class="icon user-icon"
                        icon="solar:confounded-square-outline"
                        style="font-size: 3rem; height: fit-content"
                    ></Icon>
                    <div>
                        <div class="flex flex-col gap-2">
                            <div class="flex flex-col gap-2">
                                <div>Failed to load the dashboard component</div>
                            </div>
                            <div class="flex flex-row gap-2 items-center flex-wrap">
                                <BlueButton @click="fetch()">
                                    <template #text> Try again </template>
                                </BlueButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="flex flex-row justify-center items-center">
                <RadarChart :id="'ciaImpact'" :data="chartData" :options="options"></RadarChart>
            </div>
        </div>
    </div>
</template>
