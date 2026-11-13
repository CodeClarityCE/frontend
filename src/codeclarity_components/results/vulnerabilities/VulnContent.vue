<script lang="ts" setup>
import { Info } from "@lucide/vue";
import { computed, ref, watch } from "vue";

import ColumnChart from "@/base_components/charts/ColumnChart.vue";
import { StatTile } from "@/base_components/page";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { AnalysisStats } from "@/codeclarity_components/results/stats.entity";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import {
  getGradeSubtitle,
  GRADE_DISPLAY_RANGES,
  scoreToGrade,
} from "@/utils/gradeUtils";

import SelectWorkspace from "../SelectWorkspace.vue";

import { owaspCategory } from "./vuln-format";

const props = withDefaults(
  defineProps<{
    analysisID?: string;
    projectID?: string;
    executedSbomPlugins?: string[];
  }>(),
  { projectID: "", analysisID: "", executedSbomPlugins: () => [] },
);

const emit = defineEmits<{
  "ecosystem-filter-changed": [ecosystem: string | null];
}>();

const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

const selected_workspace = defineModel<string>("selected_workspace", {
  default: ".",
});
const workspaceError = ref(false);
const ecosystemFilter = ref<string | null>(null);
const loading = ref(true);
const failed = ref(false);
const stats = ref<AnalysisStats>(new AnalysisStats());

// Counts requests so an answer for an earlier selection is dropped.
let latestRequest = 0;

async function loadStats(): Promise<void> {
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (!org || !authStore.getAuthenticated || !token) return;
  if (props.projectID === "" || props.analysisID === "") return;
  const request = ++latestRequest;
  try {
    const res = await resultsRepository.getVulnerabilitiesStat({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: selected_workspace.value,
      bearerToken: token,
      ecosystem_filter: ecosystemFilter.value ?? undefined,
      handleBusinessErrors: true,
    });
    if (request !== latestRequest) return;
    stats.value = res.data;
    failed.value = false;
  } catch {
    if (request === latestRequest) failed.value = true;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

function onEcosystemFilterChanged(ecosystem: string | null): void {
  ecosystemFilter.value = ecosystem;
  emit("ecosystem-filter-changed", ecosystem);
}

watch(
  [
    () => props.projectID,
    () => props.analysisID,
    selected_workspace,
    ecosystemFilter,
  ],
  () => void loadStats(),
  { immediate: true },
);

// 100 with no critical or high findings, lower as they make up more of the total.
const securityScore = computed(() => {
  const total = stats.value.number_of_vulnerabilities ?? 0;
  if (total === 0) return 100;
  const weighted =
    (stats.value.number_of_critical ?? 0) * 10 +
    (stats.value.number_of_high ?? 0) * 5;
  return Math.max(0, Math.round(100 - (weighted / (total * 10)) * 100));
});
const grade = computed(() => scoreToGrade(securityScore.value));

function sinceLastScan(diff: number | undefined): string | undefined {
  if (diff === undefined || diff === null) return undefined;
  if (diff === 0) return "No change since the last scan";
  return `${diff > 0 ? "+" : ""}${diff} since the last scan`;
}

function score(value: number | undefined): string {
  return (value ?? 0).toFixed(1);
}

const SEVERITIES = [
  { label: "Critical", key: "number_of_critical", color: "critical" },
  { label: "High", key: "number_of_high", color: "high" },
  { label: "Medium", key: "number_of_medium", color: "medium" },
  { label: "Low", key: "number_of_low", color: "low" },
  { label: "None", key: "number_of_none", color: "none" },
] as const;

const severityCounts = computed(() =>
  SEVERITIES.map((s) => stats.value[s.key] ?? 0),
);

const severitySeries = computed(() => [
  {
    key: "count",
    label: "Vulnerabilities",
    values: severityCounts.value,
    color: "var(--viz-series-1)",
    colors: SEVERITIES.map((s) => `var(--viz-severity-${s.color})`),
  },
]);

function describeSeverity(index: number): string {
  const count = severityCounts.value[index] ?? 0;
  return `${SEVERITIES[index]?.label ?? ""}: ${count} ${count === 1 ? "vulnerability" : "vulnerabilities"}`;
}

const owaspCounts = computed(() =>
  (
    [
      ["1345", stats.value.number_of_owasp_top_10_2021_a1],
      ["1346", stats.value.number_of_owasp_top_10_2021_a2],
      ["1347", stats.value.number_of_owasp_top_10_2021_a3],
      ["1348", stats.value.number_of_owasp_top_10_2021_a4],
      ["1349", stats.value.number_of_owasp_top_10_2021_a5],
      ["1352", stats.value.number_of_owasp_top_10_2021_a6],
      ["1353", stats.value.number_of_owasp_top_10_2021_a7],
      ["1354", stats.value.number_of_owasp_top_10_2021_a8],
      ["1355", stats.value.number_of_owasp_top_10_2021_a9],
      ["1356", stats.value.number_of_owasp_top_10_2021_a10],
    ] as [string, number | undefined][]
  )
    .map(([id, count]) => ({ category: owaspCategory(id), count: count ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count),
);

const impactMeans = computed(() => [
  { name: "Confidentiality", value: stats.value.mean_confidentiality_impact },
  { name: "Integrity", value: stats.value.mean_integrity_impact },
  { name: "Availability", value: stats.value.mean_availability_impact },
]);
</script>

<template>
  <section aria-labelledby="vuln-summary-heading" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2
        id="vuln-summary-heading"
        class="text-xl font-semibold tracking-tight text-foreground-strong"
      >
        Summary
      </h2>
      <SelectWorkspace
        v-model:error="workspaceError"
        v-model:selected_workspace="selected_workspace"
        :project-i-d="projectID"
        :analysis-i-d="analysisID"
        :executed-sbom-plugins="executedSbomPlugins"
        @ecosystem-filter-changed="onEcosystemFilterChanged"
      />
    </div>

    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load the vulnerability summary</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <div
      v-if="loading"
      role="status"
      aria-label="Loading the vulnerability summary"
      class="grid gap-4 sm:grid-cols-3 xl:grid-cols-6"
    >
      <Skeleton v-for="i in 6" :key="i" class="h-24 rounded-card" />
    </div>

    <template v-else-if="!failed">
      <ul
        aria-label="Vulnerability numbers"
        class="grid gap-4 sm:grid-cols-3 xl:grid-cols-6"
      >
        <StatTile
          label="Vulnerabilities"
          :value="stats.number_of_vulnerabilities ?? 0"
          :hint="sinceLastScan(stats.number_of_vulnerabilities_diff)"
        />
        <StatTile
          label="Critical and high"
          :value="(stats.number_of_critical ?? 0) + (stats.number_of_high ?? 0)"
          hint="Fix these first"
        />
        <StatTile
          label="Vulnerable dependencies"
          :value="stats.number_of_vulnerable_dependencies ?? 0"
          :hint="sinceLastScan(stats.number_of_vulnerable_dependencies_diff)"
        />
        <StatTile
          label="Security grade"
          :value="grade"
          :hint="getGradeSubtitle(grade, 'security')"
        />
        <StatTile
          label="Mean severity"
          :value="score(stats.mean_severity)"
          hint="CVSS, 0 to 10"
        />
        <StatTile
          label="Max severity"
          :value="score(stats.max_severity)"
          hint="CVSS, 0 to 10"
        />
      </ul>

      <Popover>
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="self-start">
            <Info aria-hidden="true" class="size-4" />
            How the security grade is set
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" class="w-80 text-sm">
          <p class="mb-2">
            The grade weighs critical and high vulnerabilities against the
            total.
          </p>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-1">
            <dt class="font-medium">A+ or A</dt>
            <dd>Excellent, {{ GRADE_DISPLAY_RANGES.excellent }}</dd>
            <dt class="font-medium">B+ or B</dt>
            <dd>Good, {{ GRADE_DISPLAY_RANGES.good }}</dd>
            <dt class="font-medium">C+ or C</dt>
            <dd>Fair, {{ GRADE_DISPLAY_RANGES.fair }}</dd>
            <dt class="font-medium">D+ or D</dt>
            <dd>Poor, {{ GRADE_DISPLAY_RANGES.poor }}</dd>
          </dl>
        </PopoverContent>
      </Popover>

      <div class="grid gap-4 lg:grid-cols-2">
        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle class="text-base">
              Vulnerabilities by severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ColumnChart
              :labels="SEVERITIES.map((s) => s.label)"
              :series="severitySeries"
              :y-max="Math.max(...severityCounts, 1)"
              :format-y="(v) => String(v)"
              :describe="describeSeverity"
              caption="Vulnerabilities by severity"
              x-title="Severity"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Security impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="mb-3 text-sm text-muted-foreground">
              Mean impact across vulnerabilities, 0 to 10.
            </p>
            <dl class="flex flex-col gap-2 text-sm">
              <div
                v-for="impact in impactMeans"
                :key="impact.name"
                class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
              >
                <dt>{{ impact.name }}</dt>
                <dd class="font-semibold tabular-nums text-foreground-strong">
                  {{ score(impact.value) }}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle class="text-base">OWASP Top 10</CardTitle>
          </CardHeader>
          <CardContent>
            <ul
              v-if="owaspCounts.length > 0"
              class="flex flex-col gap-2 text-sm"
            >
              <li
                v-for="entry in owaspCounts.slice(0, 5)"
                :key="entry.category.id"
                class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
              >
                <span>
                  <span class="font-semibold">{{ entry.category.id }}</span>
                  {{ entry.category.name }}
                </span>
                <span class="font-semibold tabular-nums text-foreground-strong">
                  {{ entry.count }}
                </span>
              </li>
            </ul>
            <p v-else class="text-sm text-muted-foreground">
              No vulnerabilities in an OWASP Top 10 category.
            </p>
          </CardContent>
        </Card>
      </div>
    </template>
  </section>
</template>
