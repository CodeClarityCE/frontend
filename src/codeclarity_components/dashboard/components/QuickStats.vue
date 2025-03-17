<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { DashboardRepository } from '@/codeclarity_components/dashboard/dashboard.repository';
import type { QuickStats } from '@/codeclarity_components/dashboard/dashboard.entity';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';

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
const data: Ref<QuickStats | undefined> = ref();

async function fetch(refresh: boolean = false) {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    if (!refresh) loading.value = true;

    error.value = false;
    errorCode.value = undefined;

    try {
        const resp = await dashboardRepository.getQuickStats({
            orgId: defaultOrg.value.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            integrationIds: props.integrationIds
        });
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
</script>
<template>
    <div v-if="!error && !loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card class="flex flex-col">
            <CardHeader>
                <CardTitle> Grade </CardTitle>
            </CardHeader>
            <CardContent class="flex items-center justify-center flex-grow">
                <div
                    class="text-4xl font-bold text-white w-fit py-6 rounded"
                    :class="{
                        'bg-severityCritical px-8': data?.max_grade.class === 'D',
                        'bg-severityCritical px-6': data?.max_grade.class === 'D+',
                        'bg-severityHigh px-8': data?.max_grade.class === 'C',
                        'bg-severityHigh px-6': data?.max_grade.class === 'C+',
                        'bg-severityMedium px-8': data?.max_grade.class === 'B',
                        'bg-severityMedium px-6': data?.max_grade.class === 'B+',
                        'bg-severityLow px-8': data?.max_grade.class === 'A',
                        'bg-severityLow px-6': data?.max_grade.class === 'A+'
                    }"
                >
                    {{ data!.max_grade.class }}
                </div>
            </CardContent>
        </Card>
        <Card class="flex flex-col">
            <CardHeader>
                <CardTitle> Highest Potential Impact </CardTitle>
                <!-- <CardDescription> Quickly identify problematic projects. </CardDescription> -->
            </CardHeader>
            <CardContent class="flex items-center justify-center flex-grow">
                <div v-if="data?.most_affected_cia" class="text-4xl font-bold">
                    {{ data!.most_affected_cia }}
                </div>
                <div v-else class="text-4xl font-bold">N/A</div>
            </CardContent>
        </Card>
        <Card class="flex flex-col">
            <CardHeader>
                <CardTitle> Deprecated Dependencies </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col items-center justify-center flex-grow">
                <div class="text-4xl font-bold">{{ data!.nmb_deprecated }}</div>
                <p class="text-xs text-muted-foreground">{{ data!.nmb_deprecated_trend.diff }}</p>
            </CardContent>
        </Card>
        <Card class="flex flex-col">
            <CardHeader>
                <CardTitle> Most affected Owasp Top 10 </CardTitle>
            </CardHeader>
            <CardContent class="flex items-center justify-center flex-grow">
                <div v-if="data?.owasp_top_10" class="flex flex-col items-center">
                    <div class="text-2xl font-semibold">
                        {{ data!.owasp_top_10?.split(':')[0] }}
                    </div>
                    <div class="text-normal font-semibold">
                        {{ data!.owasp_top_10?.split(':')[1] }}
                    </div>
                </div>
                <div v-else class="text-4xl font-semibold">N/A</div>
            </CardContent>
        </Card>
    </div>
</template>
