<script lang="ts" setup>
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { ResultsRepository } from '../results.repository';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ref, type Ref } from 'vue';
import { Result } from '../result.entity';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import { Rocket } from 'lucide-vue-next';
import AlertTitle from '@/shadcn/ui/alert/AlertTitle.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';
import type { CodeQLResult } from './codeql.entity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Badge } from '@/shadcn/ui/badge';

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
    <div v-if="codeql_results.length > 0" class="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
        <Card v-for="(codeql_result, index) in codeql_results" :key="index">
            <CardHeader>
                <CardTitle>{{ codeql_result.ruleId }}</CardTitle>
                <CardDescription>{{ codeql_result.message.text }}</CardDescription>
            </CardHeader>
            <CardContent>
                <div class="grid grid-cols-8 gap-2">
                    <span class="text-xs col-span-4 text-center">File</span>
                    <span class="text-xs text-center">Start Line</span>
                    <span class="text-xs text-center">End Line</span>
                    <span class="text-xs text-center">Start Column</span>
                    <span class="text-xs text-center">End Column</span>
                </div>
                <div
                    v-for="(location, i) of codeql_result.locations"
                    :key="i"
                    class="grid grid-cols-8 gap-2"
                >
                    <Badge variant="secondary" class="rounded-full col-span-4">{{
                        location.physicalLocation.artifactLocation.uri
                    }}</Badge>
                    <Badge class="rounded-full">{{
                        location.physicalLocation.region.startLine
                    }}</Badge>
                    <Badge class="rounded-full">{{
                        location.physicalLocation.region.endLine
                    }}</Badge>
                    <Badge class="rounded-full">{{
                        location.physicalLocation.region.startColumn
                    }}</Badge>
                    <Badge class="rounded-full">{{
                        location.physicalLocation.region.endColumn
                    }}</Badge>
                </div>
            </CardContent>
            <br />
        </Card>
    </div>
    <!-- <DataTable v-if="codeql_results.length > 0" :columns="columns" :data="codeql_results" /> -->
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
