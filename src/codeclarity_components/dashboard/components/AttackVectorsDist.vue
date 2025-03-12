<script setup lang="ts">
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { DashboardRepository } from '@/codeclarity_components/dashboard/dashboard.repository';
import type { AttackVectorDist } from '@/codeclarity_components/dashboard/dashboard.entity';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import BoxLoader from '@/base_components/BoxLoader.vue';
import { Icon } from '@iconify/vue';
import type { RadarChartData, RadarChartOptions } from '@/base_components/charts/radarChart';
import DoughnutChart from '@/base_components/charts/DoughnutChart.vue';
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

const chartData: Ref<RadarChartData> = ref([
    {
        name: 'Attack Vectors',
        axes: []
    }
]);

const options: Ref<Partial<RadarChartOptions>> = ref({
    unit: '%'
});

async function fetch(refresh: boolean = false) {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    if (!refresh) loading.value = true;

    error.value = false;
    errorCode.value = undefined;

    try {
        const resp = await dashboardRepository.getAttackVectorsDist({
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

function generateChart(stats: AttackVectorDist[]) {
    for (let entry of stats) {
        if (entry.count === 0) continue;
        chartData.value[0].axes.push({
            axis: entry.attack_vector,
            value: entry.count
        });
    }
}

fetch();
</script>
<template>
    <div class="p-6 pb-2">
        <div v-if="loading" class="flex flex-row justify-center items-center">
            <BoxLoader class="rounded-full" :dimensions="{ width: '250px', height: '250px' }" />
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
                                <Button @click="fetch">
                                    Try again
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="flex flex-row justify-center items-center">
                <!-- Chart -->
                <DoughnutChart :chartData="chartData" :chartOptions="options"></DoughnutChart>
            </div>
        </div>
    </div>
</template>
