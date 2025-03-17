<script setup lang="ts">
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { DashboardRepository } from '@/codeclarity_components/dashboard/dashboard.repository';
import { LatestVulns } from '@/codeclarity_components/dashboard/dashboard.entity';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Skeleton } from '@/shadcn/ui/skeleton';
import Collapsible from '@/shadcn/ui/collapsible/Collapsible.vue';
import CollapsibleTrigger from '@/shadcn/ui/collapsible/CollapsibleTrigger.vue';
import CollapsibleContent from '@/shadcn/ui/collapsible/CollapsibleContent.vue';
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
const data: Ref<LatestVulns | undefined> = ref();
const severityCountsShort: Ref<{ [key: string]: number }> = ref({
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0
});
const noData: Ref<boolean> = ref(false);

async function fetch(refresh: boolean = false) {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    if (!refresh) loading.value = true;

    noData.value = false;
    error.value = false;
    errorCode.value = undefined;
    severityCountsShort.value = { CRITICAL: 0, HIGH: 0, MEDIUM: 0 };

    try {
        const resp = await dashboardRepository.getRecentVulns({
            orgId: defaultOrg.value.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            integrationIds: props.integrationIds
        });
        if (Object.keys(resp.data.vulns).length == 0) noData.value = true;
        else {
            for (const x of resp.data.severity_count) {
                if (
                    x.severity_class == 'CRITICAL' ||
                    x.severity_class == 'HIGH' ||
                    x.severity_class == 'MEDIUM'
                ) {
                    severityCountsShort.value[x.severity_class] = x.count;
                }
            }
            data.value = resp.data;
        }
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
</script>
<template>
    <div class="w-full">
        <div v-if="loading || noData" class="flex flex-col gap-8" style="position: relative">
            <div class="flex flex-row gap-4 justify-center items-center">
                <Skeleton v-for="index in 3" :key="index" class="h-[50px] w-[150px] rounded-xl" />
            </div>
            <div class="flex flex-col gap-1">
                <Skeleton v-for="index in 3" :key="index" class="h-[50px] w-full rounded-xl" />
            </div>
            <div
                v-if="noData"
                class="flex flex-row justify-center items-center absolute w-full h-full"
            >
                <div class="font-black text-xl">No Data</div>
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
                                <Button @click="fetch()"> Try again </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="dashboard-current-vulns">
                <div class="flex flex-row gap-4 justify-evenly">
                    <div
                        v-for="(value, key, index) in severityCountsShort"
                        :key="index"
                        class="flex flex-col items-center"
                    >
                        <div class="font-black text-5xl">
                            {{ value }}
                        </div>
                        <div class="font-bold text-lg text-muted-foreground">
                            {{ key }}
                        </div>
                    </div>
                </div>

                <Collapsible class="flex flex-col items-center">
                    <div v-for="(vuln, cwe_id, index) in data!.vulns" :key="cwe_id" class="w-1/2">
                        <div v-if="index < 5" class="font-bold flex justify-between pb-2">
                            <div style="font-size: 0.8em">
                                <div
                                    v-if="vuln.severity_class == 'CRITICAL'"
                                    class="severity-indicator critical"
                                >
                                    CRITICAL
                                </div>
                                <div
                                    v-else-if="vuln.severity_class == 'HIGH'"
                                    class="severity-indicator high"
                                >
                                    HIGH
                                </div>
                                <div
                                    v-else-if="vuln.severity_class == 'MEDIUM'"
                                    class="severity-indicator medium"
                                >
                                    MEDIUM
                                </div>
                                <div
                                    v-else-if="vuln.severity_class == 'LOW'"
                                    class="severity-indicator low"
                                >
                                    LOW
                                </div>
                                <div
                                    v-else-if="vuln.severity_class == 'NONE'"
                                    class="severity-indicator none"
                                >
                                    NONE
                                </div>
                            </div>
                            <div>{{ cwe_id }}</div>
                        </div>
                    </div>
                    <CollapsibleTrigger class="flex gap-2 items-center pb-2">
                        Show more vulnerabilities <Icon icon="lucide:chevrons-up-down"></Icon>
                    </CollapsibleTrigger>
                    <CollapsibleContent class="w-1/2">
                        <div v-for="(vuln, cwe_id, index) in data!.vulns" :key="cwe_id">
                            <div v-if="index >= 5" class="font-bold flex justify-between pb-2">
                                <div style="font-size: 0.8em">
                                    <div
                                        v-if="vuln.severity_class == 'CRITICAL'"
                                        class="severity-indicator critical"
                                    >
                                        CRITICAL
                                    </div>
                                    <div
                                        v-else-if="vuln.severity_class == 'HIGH'"
                                        class="severity-indicator high"
                                    >
                                        HIGH
                                    </div>
                                    <div
                                        v-else-if="vuln.severity_class == 'MEDIUM'"
                                        class="severity-indicator medium"
                                    >
                                        MEDIUM
                                    </div>
                                    <div
                                        v-else-if="vuln.severity_class == 'LOW'"
                                        class="severity-indicator low"
                                    >
                                        LOW
                                    </div>
                                    <div
                                        v-else-if="vuln.severity_class == 'NONE'"
                                        class="severity-indicator none"
                                    >
                                        NONE
                                    </div>
                                </div>
                                <div>{{ cwe_id }}</div>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

$--section-title-color: #4f4e4e;
$--section-title-size: 2.7rem;
$--section-title-font-weight: 600;
$--section-subtitle-color: rgb(157, 157, 157);
$--section-subtitle-size: 0.95rem;
$--section-subtitle-font-weight: 600;

.dashboard-current-vulns {
    display: flex;
    flex-direction: column;
    row-gap: 2rem;

    .class-count-container {
        display: flex;
        flex-direction: column;
        row-gap: 5px;
        text-align: center;

        .count {
            font-size: 3em;
            font-weight: 900;
        }

        .class {
            font-weight: 900;
            color: $--section-subtitle-color;
        }
    }
}

.severity-indicator {
    padding: 5px;
    color: white;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 5px;
}

.severity-indicator.critical {
    background-color: colors.$severity-critical;
}

.severity-indicator.high {
    background-color: colors.$severity-high;
}

.severity-indicator.medium {
    background-color: colors.$severity-medium;
}

.severity-indicator.low {
    background-color: colors.$severity-low;
}

.severity-indicator.none {
    background-color: colors.$severity-none;
}
</style>
