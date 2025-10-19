<script setup lang="ts">
import WaffleChart, {
    type WaffleChartEntry
} from '@/base_components/data-display/charts/WaffleChart.vue';
import { ref, watch, type Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { DashboardRepository } from '@/codeclarity_components/dashboard/dashboard.repository';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import type { LicenseDist } from '@/codeclarity_components/dashboard/dashboard.entity';
import { Icon } from '@iconify/vue';
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
const chartOptions: Ref<any | undefined> = ref();
const chartData: Ref<WaffleChartEntry[]> = ref([]);
const noData: Ref<boolean> = ref(false);

async function fetch(refresh: boolean = false) {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    if (!refresh) loading.value = true;
    chartData.value = [];
    chartOptions.value = undefined;

    noData.value = false;
    error.value = false;
    errorCode.value = undefined;

    try {
        const resp = await dashboardRepository.getLicenseDist({
            orgId: defaultOrg.value.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            integrationIds: props.integrationIds
        });
        if (resp.data.length == 0) noData.value = true;
        generateChartData(resp.data);
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        if (!refresh) loading.value = false;
    }
}

function generateChartData(licenseDistData: LicenseDist) {
    const waffleChartData: WaffleChartEntry[] = [];

    for (const key of Object.keys(licenseDistData)) {
        waffleChartData.push({ label: key, value: licenseDistData[key] });
    }
    chartData.value = waffleChartData;
}

fetch();
</script>
<template>
    <div class="h-full w-full">
        <div v-if="loading || noData" class="flex flex-row justify-center items-center h-full">
            <div class="grid gap-1 relative grid-cols-10">
                <Skeleton v-for="index in 100" :key="index" class="h-[20px] w-[20px] rounded" />
                <div
                    v-if="noData"
                    class="flex flex-row justify-center items-center"
                    style="position: absolute; width: 100%; height: 100%"
                >
                    <div style="font-weight: 900; font-size: 1.25em">No Data</div>
                </div>
            </div>
        </div>
        <div v-else-if="error" class="flex flex-row justify-center items-center h-full">
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
                            <Button @click="fetch()"> Try again </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <WaffleChart
            v-else
            :data="chartData"
            :source-percentual="false"
            :output-percentual="true"
        />
    </div>
</template>

<style scoped lang="scss"></style>
