<script setup lang="ts">
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { DashboardRepository } from '@/codeclarity_components/dashboard/dashboard.repository';
import { SeverityInfoByWeek } from '@/codeclarity_components/dashboard/dashboard.entity';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import moment from 'moment';
import { Icon } from '@iconify/vue';
import LineChart from '@/base_components/charts/LineChart.vue';
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
const data: Ref<SeverityInfoByWeek[] | undefined> = ref();
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const chartData: Ref<any | undefined> = ref();
const noData: Ref<boolean> = ref(false);

async function fetch(refresh: boolean = false) {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    if (!refresh) loading.value = true;

    noData.value = false;
    error.value = false;
    errorCode.value = undefined;

    try {
        const resp = await dashboardRepository.getWeeklySeverityInfo({
            orgId: defaultOrg.value.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            integrationIds: props.integrationIds
        });
        if (resp.data.length == 0) noData.value = true;
        else generateChart(resp.data);
        data.value = resp.data;
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        if (!refresh) loading.value = false;
    }
}
fetch();

function getWeekFormat(weekNumber: number, year: number) {
    const startWeek = moment().day('Monday').year(year).week(weekNumber);
    const endWeek = moment()
        .day('Sunday')
        .year(year)
        .week(weekNumber + 1);
    if (startWeek.format('YYYY') != endWeek.format('YYYY')) {
        return `${startWeek.format('MMM Do YY')} - ${endWeek.format('MMM Do YY')}`;
    } else {
        return `${startWeek.format('MMM D')} - ${endWeek.format('MMM D')}, ${endWeek.format(
            'YYYY'
        )}`;
    }
}

function generateChart(stats: SeverityInfoByWeek[]) {
    let max = 0;
    const data: number[] = [];
    const labels: string[] = [];
    for (const weeklySeverity of stats) {
        data.push(Number.parseFloat(weeklySeverity.summed_severity.toFixed(0)));
        labels.push(
            getWeekFormat(weeklySeverity.week_number.week, weeklySeverity.week_number.year)
        );
        if (weeklySeverity.summed_severity > max) max = weeklySeverity.summed_severity;
    }
    chartData.value = {
        labels: labels,
        datasets: [
            {
                data: data
            }
        ]
    };
}
</script>
<template>
    <div class="flex flex-col xl:flex-row xl:flex-none items-center">
        <div>
            <div v-if="loading || noData" class="flex flex-col gap-2 relative">
                <Skeleton class="h-[200px] w-[300px] rounded-xl" />
                <div
                    v-if="noData"
                    class="flex flex-row justify-center items-center absolute w-full h-full"
                >
                    <div class="font-black text-xl">No Data</div>
                </div>
            </div>
            <div v-else>
                <div v-if="error"></div>
                <div v-else>
                    <div class="dashboard-exposure-graph">
                        <LineChart :chartData="chartData"></LineChart>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <div v-if="loading || noData" class="flex flex-col gap-2">
                <Skeleton v-for="index in 4" :key="index" class="h-[30px] w-[100px] rounded-xl" />
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
                                    <Button @click="fetch()"> Try again </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="flex flex-col gap-2 items-center">
                    <div class="font-bold text-xl">Weekly Exposure</div>
                    <div class="flex flex-row justify-between">
                        <div class="flex flex-col gap-2">
                            <template
                                v-for="(exposure, index) in data!.slice().reverse()"
                                :key="index"
                            >
                                <div class="flex flex-col gap-y-3 justify-between items-center">
                                    <div class="week">
                                        {{
                                            getWeekFormat(
                                                exposure.week_number.week,
                                                exposure.week_number.year
                                            )
                                        }}
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <SeverityBubble
                                            v-if="exposure.nmb_critical > 0"
                                            :critical="true"
                                        >
                                            <template #content>
                                                {{ exposure.nmb_critical }}
                                            </template>
                                        </SeverityBubble>
                                        <SeverityBubble v-if="exposure.nmb_high > 0" :high="true">
                                            <template #content>
                                                {{ exposure.nmb_high }}
                                            </template>
                                        </SeverityBubble>
                                        <SeverityBubble
                                            v-if="exposure.nmb_medium > 0"
                                            :medium="true"
                                        >
                                            <template #content>
                                                {{ exposure.nmb_medium }}
                                            </template>
                                        </SeverityBubble>
                                        <SeverityBubble v-if="exposure.nmb_low > 0" :low="true">
                                            <template #content>
                                                {{ exposure.nmb_low }}
                                            </template>
                                        </SeverityBubble>
                                        <SeverityBubble v-if="exposure.nmb_none > 0" :none="true">
                                            <template #content>
                                                {{ exposure.nmb_none }}
                                            </template>
                                        </SeverityBubble>
                                        <Badge
                                            v-if="
                                                exposure.nmb_critical === 0 &&
                                                exposure.nmb_high === 0 &&
                                                exposure.nmb_medium === 0 &&
                                                exposure.nmb_low === 0 &&
                                                exposure.nmb_none === 0
                                            "
                                        >
                                            N/A
                                        </Badge>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
