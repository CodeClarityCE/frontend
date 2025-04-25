<script lang="ts" setup>
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { ResultsRepository } from '../results.repository';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ref, type Ref } from 'vue';
import { Result } from '../result.entity';
import { columns, type CodeQLResult } from './columns';
import DataTable from './DataTable.vue';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import { Rocket } from 'lucide-vue-next';
import AlertTitle from '@/shadcn/ui/alert/AlertTitle.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';

const props = defineProps<{
    analysis: Analysis;
    project: Project;
}>();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// Repositories setup
const resultsRepository: ResultsRepository = new ResultsRepository();

const result: Ref<Result> = ref(new Result());
const codeql_results: Ref<Array<CodeQLResult>> = ref([]);

async function init() {
    try {
        const res = await resultsRepository.getResultByType({
            orgId: userStore.getDefaultOrg?.id ?? '',
            projectId: props.project.id,
            analysisId: props.analysis.id,
            type: 'codeql',
            bearerToken: authStore.getToken ?? ''
        });
        result.value = res.data;
        codeql_results.value = res.data.result.workspaces['.'].results as Array<CodeQLResult>;
    } catch (e) {
        console.error(e);
    }
}

init();
</script>

<template>
    <DataTable v-if="codeql_results.length > 0" :columns="columns" :data="codeql_results" />
    <div v-else class="flex justify-center">
        <Alert class="w-1/2">
            <Rocket class="h-4 w-4" />
            <AlertTitle>Well done!</AlertTitle>
            <AlertDescription>
                Everything looks fine! CodeQL didn't find anything
            </AlertDescription>
        </Alert>
    </div>
</template>
