<template>
    <div value="sbom" class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Vulnerable library </CardTitle>
                    <Icon :icon="'akar-icons:node-fill'" class="text-gray-400"></Icon>
                </CardHeader>
                <CardContent>
                    <CardDescription class="text-xs text-muted-foreground">
                        Libraries can be present multiple times. Check the patching tab to view
                        them.
                    </CardDescription>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_vulnerable_dependencies }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_vulnerable_dependencies }}
                    </p>

                    <!-- <p class="text-xs text-muted-foreground">last month</p> -->
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Mean Severity </CardTitle>
                    <Icon :icon="'bx:bx-transfer-alt'" class="text-gray-400"></Icon>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.mean_severity?.toFixed(2) }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.mean_severity_diff?.toFixed(2) }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Max Severity </CardTitle>
                    <Icon :icon="'bx:bx-transfer-alt'" class="text-gray-400"></Icon>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.max_severity?.toFixed(2) }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.max_severity_diff?.toFixed(2) }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium"> Direct Dependencies </CardTitle>
                    <Icon :icon="'bx:bx-transfer-alt'" class="text-gray-400"></Icon>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_direct_vulnerabilities }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_direct_vulnerabilities_diff }}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium">
                        Transitive Dependencies Impacted
                    </CardTitle>
                    <Icon :icon="'bx:bx-transfer-alt'" class="text-gray-400"></Icon>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {{ stats.number_of_transitive_vulnerabilities }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.number_of_transitive_vulnerabilities_diff }}
                    </p>
                </CardContent>
            </Card>
        </div>

        <VulnsGraph v-if="render" :analysisID="analysisID" :projectID="projectID" :stats="stats" />
    </div>
</template>

<script lang="ts" setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue/dist/iconify.js';

import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { AnalysisStats } from '@/repositories/types/entities/Stats';
import VulnsGraph from './graphs/VulnsGraph.vue';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/repositories/ResultsRepository';
import type { DataResponse } from '@/repositories/types/responses/DataResponse';

export interface Props {
    analysisID: string;
    projectID: string;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

// Repositories
// Repositories
const resultsRepository: ResultsRepository = new ResultsRepository();

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
        getVulnerabilitiesStats();
    }
);
watch(
    () => props.analysisID,
    () => {
        getVulnerabilitiesStats();
    }
);

const render: Ref<boolean> = ref(false);
// const error = ref(false);
const stats: Ref<AnalysisStats> = ref(new AnalysisStats());

// let boxLoaderDimensions = {
//     width: '100px',
//     height: '40px'
// };

getVulnerabilitiesStats();

// Methods
async function getVulnerabilitiesStats(refresh: boolean = false) {
    if (!userStore.getDefaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    if (!props.projectID || !props.analysisID) return;
    if (props.projectID == '' || props.analysisID == '') return;

    let res: DataResponse<any>;
    try {
        res = await resultsRepository.getVulnerabilitiesStat({
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
        // createOwaspTop10DistChart();
        // createSeverityDistChart();
        // createRadarChart();
    }
}
</script>
