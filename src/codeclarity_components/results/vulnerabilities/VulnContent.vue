<script lang="ts" setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';

import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { AnalysisStats } from '@/codeclarity_components/results/stats.entity';
import VulnsGraph from './graphs/VulnsGraph.vue';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import SelectWorkspace from '../SelectWorkspace.vue';

export interface Props {
    analysisID?: string;
    projectID?: string;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

// Repositories
const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const selected_workspace = defineModel<string>('selected_workspace', { default: '.' });

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
            workspace: selected_workspace.value,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        stats.value = res.data;
        render.value = true;
    } catch (_err) {
        console.error(_err);

        error.value = true;
        render.value = false;
    } finally {
        loading.value = false;
    }
}

watch(selected_workspace, async () => getVulnerabilitiesStats());
</script>

<template>
    <div value="sbom" class="space-y-4">
        <SelectWorkspace
            v-model:error="error"
            v-model:selected_workspace="selected_workspace"
            :project-i-d="projectID"
            :analysis-i-d="analysisID"
        ></SelectWorkspace>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card>
                <CardHeader class="flex flex-col items-center">
                    <CardTitle>{{ stats.number_of_vulnerable_dependencies }}</CardTitle>
                    <CardDescription>{{ stats.number_of_vulnerable_dependencies }}</CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col items-center"> Vulnerable libraries </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-col items-center">
                    <CardTitle>{{ stats.mean_severity?.toFixed(2) }}</CardTitle>
                    <CardDescription>{{ stats.mean_severity_diff?.toFixed(2) }}</CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col items-center"> Mean Severity </CardContent>
            </Card>
            <Card>
                <CardHeader class="flex flex-col items-center">
                    <CardTitle>{{ stats.max_severity?.toFixed(2) }}</CardTitle>
                    <CardDescription>{{ stats.max_severity_diff?.toFixed(2) }}</CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col items-center"> Max Severity </CardContent>
            </Card>
        </div>

        <VulnsGraph
            v-if="render"
            :analysis-i-d="analysisID"
            :project-i-d="projectID"
            :stats="stats"
        />
    </div>
</template>
