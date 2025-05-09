<script setup lang="ts">
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { DashboardRepository } from '@/codeclarity_components/dashboard/dashboard.repository';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Skeleton } from '@/shadcn/ui/skeleton';
import Button from '@/shadcn/ui/button/Button.vue';
import { ScrollArea } from '@/shadcn/ui/scroll-area';

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

interface Vuln {
    severity: number;
    class: string;
    cve: string;
}

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const severityCountsShort: Ref<{ [key: string]: number }> = ref({
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0
});
const noData: Ref<boolean> = ref(false);
const vulns: Ref<Array<Vuln>> = ref([]);

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

            for (const vuln of Object.keys(resp.data.vulns)) {
                vulns.value.push({
                    severity: resp.data.vulns[vuln].severity ?? 0,
                    class: resp.data.vulns[vuln].severity_class ?? '',
                    cve: resp.data.vulns[vuln].cwe_name
                });
            }
            vulns.value.sort((a, b) => {
                return b.severity - a.severity;
            });
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

                <ScrollArea class="h-72 rounded-md border p-4">
                    <div v-for="vuln in vulns" :key="vuln.cve">
                        <div class="font-bold flex justify-between pb-2">
                            <div>{{ vuln.severity }}</div>
                            <div>
                                <div
                                    v-if="vuln.class == 'CRITICAL'"
                                    class="severity-indicator critical"
                                >
                                    CRITICAL
                                </div>
                                <div
                                    v-else-if="vuln.class == 'HIGH'"
                                    class="severity-indicator high"
                                >
                                    HIGH
                                </div>
                                <div
                                    v-else-if="vuln.class == 'MEDIUM'"
                                    class="severity-indicator medium"
                                >
                                    MEDIUM
                                </div>
                                <div v-else-if="vuln.class == 'LOW'" class="severity-indicator low">
                                    LOW
                                </div>
                                <div
                                    v-else-if="vuln.class == 'NONE'"
                                    class="severity-indicator none"
                                >
                                    NONE
                                </div>
                            </div>
                            <div>{{ vuln.cve }}</div>
                        </div>
                    </div>
                </ScrollArea>
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
