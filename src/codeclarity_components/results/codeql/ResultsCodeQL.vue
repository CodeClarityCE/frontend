<script lang="ts" setup>
import { CircleCheck } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { type Ref, ref, watch } from "vue";

import { DataTable } from "@/base_components/data-table";
import { StatTile } from "@/base_components/page";
import { type Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import { type Project } from "@/codeclarity_components/projects/project.entity";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import ResultTimestamp from "../components/ResultTimestamp.vue";
import { ResultsRepository } from "../results.repository";

import type { CodeQLResult } from "./codeql.entity";

const props = defineProps<{
  analysis: Analysis;
  project: Project;
  runIndex?: number | null;
}>();

const userStore = useUserStore();
const authStore = useAuthStore();
const resultsRepository = new ResultsRepository();

interface Finding {
  key: string;
  rule: string;
  message: string;
  file: string;
  lines: string;
}

const createdOn: Ref<Date | string | undefined> = ref(undefined);
const findings: Ref<Finding[]> = ref([]);
const loading = ref(true);
const failed = ref(false);

// One row per location of each CodeQL result.
function toFindings(results: CodeQLResult[]): Finding[] {
  return results.flatMap((result, index) =>
    (result.locations ?? []).map((location, i) => {
      const { uri } = location.physicalLocation.artifactLocation;
      const { startLine, endLine } = location.physicalLocation.region;
      return {
        key: `${index}-${i}`,
        rule: result.ruleId,
        message: result.message.text,
        file: uri,
        lines:
          startLine === endLine || !endLine
            ? String(startLine)
            : `${startLine} to ${endLine}`,
      };
    }),
  );
}

let latestRequest = 0;

async function load(): Promise<void> {
  const request = ++latestRequest;
  try {
    const res = await resultsRepository.getResultByType({
      orgId: userStore.getDefaultOrg?.id ?? "",
      projectId: props.project.id,
      analysisId: props.analysis.id,
      type: "codeql",
      bearerToken: authStore.getToken ?? "",
      runIndex: props.runIndex,
    });
    if (request !== latestRequest) return;
    createdOn.value = res.data.created_on;
    const data = res.data.result as {
      workspaces?: Record<string, { results?: CodeQLResult[] }>;
    };
    findings.value = toFindings(data.workspaces?.["."]?.results ?? []);
    failed.value = false;
  } catch {
    if (request === latestRequest) failed.value = true;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

watch(
  [() => props.analysis.id, () => props.project.id, () => props.runIndex],
  () => void load(),
  { immediate: true },
);

const columns: ColumnDef<Finding, unknown>[] = [
  { id: "rule", header: "Rule", accessorFn: (f) => f.rule },
  {
    id: "message",
    header: "Finding",
    enableSorting: false,
    accessorFn: (f) => f.message,
  },
  { id: "file", header: "File", accessorFn: (f) => f.file },
  {
    id: "lines",
    header: "Lines",
    enableSorting: false,
    enableGlobalFilter: false,
    accessorFn: (f) => f.lines,
  },
];

function rowKey(finding: Finding): string {
  return finding.key;
}
</script>

<template>
  <section aria-labelledby="codeql-heading" class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h2
        id="codeql-heading"
        class="text-xl font-semibold tracking-tight text-foreground-strong"
      >
        CodeQL findings
      </h2>
      <ResultTimestamp
        :created-on="createdOn"
        :run-index="runIndex"
        plugin-name="CodeQL"
      />
    </div>

    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load the CodeQL results</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <Alert v-else-if="!loading && findings.length === 0">
      <CircleCheck aria-hidden="true" class="size-4 text-success" />
      <AlertTitle>No findings</AlertTitle>
      <AlertDescription>CodeQL found no issues in this code.</AlertDescription>
    </Alert>

    <template v-else>
      <ul
        v-if="!loading"
        aria-label="CodeQL numbers"
        class="grid gap-4 sm:grid-cols-3"
      >
        <StatTile label="Findings" :value="findings.length" />
        <StatTile
          label="Rules"
          :value="new Set(findings.map((f) => f.rule)).size"
        />
        <StatTile
          label="Files"
          :value="new Set(findings.map((f) => f.file)).size"
        />
      </ul>
      <DataTable
        :columns="columns"
        :data="findings"
        :loading="loading"
        :row-key="rowKey"
        :initial-sorting="[{ id: 'file', desc: false }]"
        caption="CodeQL findings"
        filter-label="Search findings"
        empty-text="No findings match the search."
      >
        <template #cell-rule="{ row }">
          <code class="font-mono font-semibold text-foreground-strong">{{
            row.rule
          }}</code>
        </template>
        <template #cell-file="{ row }">
          <code class="font-mono text-sm">{{ row.file }}</code>
        </template>
      </DataTable>
    </template>
  </section>
</template>
