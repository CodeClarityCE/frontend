<script lang="ts" setup>
import { type Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import { type Project } from "@/codeclarity_components/projects/project.entity";
import Alert from "@/shadcn/ui/alert/Alert.vue";
import AlertDescription from "@/shadcn/ui/alert/AlertDescription.vue";
import AlertTitle from "@/shadcn/ui/alert/AlertTitle.vue";
import { Badge } from "@/shadcn/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { Rocket } from "lucide-vue-next";
import { ref, type Ref } from "vue";
import ResultTimestamp from "../components/ResultTimestamp.vue";
import { Result } from "../result.entity";
import { ResultsRepository } from "../results.repository";
import type { CodeQLResult } from "./codeql.entity";

const props = defineProps<{
  analysis: Analysis;
  project: Project;
  runIndex?: number | null;
}>();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// Repositories setup
const resultsRepository: ResultsRepository = new ResultsRepository();

const result: Ref<Result> = ref(new Result());
const codeql_results: Ref<CodeQLResult[]> = ref([]);

async function init(): Promise<void> {
  try {
    const res = await resultsRepository.getResultByType({
      orgId: userStore.getDefaultOrg?.id ?? "",
      projectId: props.project.id,
      analysisId: props.analysis.id,
      type: "codeql",
      bearerToken: authStore.getToken ?? "",
      runIndex: props.runIndex,
    });
    result.value = res.data;
    const resultData = res.data.result as {
      workspaces: Record<string, { results?: CodeQLResult[] }>;
    };
    const workspaces = resultData.workspaces;
    const workspace = workspaces["."];
    codeql_results.value = workspace?.results ?? [];
  } catch (e) {
    console.error(e);
  }
}

void init();
</script>

<template>
  <ResultTimestamp
    :created-on="result.created_on"
    :run-index="props.runIndex"
    plugin-name="CodeQL"
  />

  <div
    v-if="codeql_results.length > 0"
    class="grid md:grid-cols-2 xl:grid-cols-3 gap-2"
  >
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
