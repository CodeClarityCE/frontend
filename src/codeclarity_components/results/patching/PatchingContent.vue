<script lang="ts" setup>
import { computed, type Ref, ref, watch } from "vue";

import ColumnChart from "@/base_components/charts/ColumnChart.vue";
import { StatTile } from "@/base_components/page";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { PatchingStats } from "@/codeclarity_components/results/stats.entity";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import SelectWorkspace from "../SelectWorkspace.vue";

import Patches from "./PatchingPatches.vue";
import PatchesTable from "./PatchingTable.vue";

const props = withDefaults(
  defineProps<{
    analysisID?: string;
    projectID?: string;
    executedSbomPlugins?: string[];
  }>(),
  { projectID: "", analysisID: "", executedSbomPlugins: () => [] },
);

const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

const loading = ref(true);
const failed = ref(false);
const selected_workspace = ref(".");
const stats: Ref<PatchingStats> = ref(new PatchingStats());

// Counts requests so an answer for an earlier selection is dropped.
let latestRequest = 0;

async function load(): Promise<void> {
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (!org || !token || props.projectID === "" || props.analysisID === "")
    return;
  const request = ++latestRequest;
  try {
    const res = await resultsRepository.getPatchesStat({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: selected_workspace.value,
      bearerToken: token,
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

watch(
  [() => props.projectID, () => props.analysisID, selected_workspace],
  () => void load(),
  { immediate: true },
);

const SEVERITIES = [
  ["Critical", "critical"],
  ["High", "high"],
  ["Medium", "medium"],
  ["Low", "low"],
  ["None", "none"],
] as const;

function stat(when: "before" | "after", key: string): number {
  const value = (stats.value as unknown as Record<string, number | undefined>)[
    `${when}_patch_${key}`
  ];
  return value ?? 0;
}

const severitySeries = computed(() => [
  {
    key: "before",
    label: "Before patching",
    values: SEVERITIES.map(([, key]) => stat("before", `number_of_${key}`)),
    color: "var(--viz-series-2)",
  },
  {
    key: "after",
    label: "After patching",
    values: SEVERITIES.map(([, key]) => stat("after", `number_of_${key}`)),
    color: "var(--viz-series-1)",
  },
]);

const severityMax = computed(() =>
  Math.max(1, ...severitySeries.value.flatMap((s) => s.values)),
);

function describeSeverity(index: number): string {
  const [label, key] = SEVERITIES[index] ?? ["", ""];
  return `${label}: ${stat("before", `number_of_${key}`)} before patching, ${stat("after", `number_of_${key}`)} after`;
}

const tiles = computed(() =>
  (
    [
      ["Issues", "number_of_issues"],
      ["Vulnerabilities", "number_of_vulnerabilities"],
      ["Vulnerable dependencies", "number_of_vulnerable_dependencies"],
    ] as const
  ).map(([label, key]) => ({
    label,
    after: stat("after", key),
    hint: `${stat("before", key)} before patching`,
  })),
);

const impacts = computed(() =>
  (["Confidentiality", "Integrity", "Availability"] as const).map((name) => ({
    name,
    before: stat("before", `overall_${name.toLowerCase()}_impact`).toFixed(1),
    after: stat("after", `overall_${name.toLowerCase()}_impact`).toFixed(1),
  })),
);
</script>

<template>
  <section aria-labelledby="patches-heading" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2
        id="patches-heading"
        class="text-xl font-semibold tracking-tight text-foreground-strong"
      >
        Patches
      </h2>
      <SelectWorkspace
        v-model:selected_workspace="selected_workspace"
        :project-i-d="projectID"
        :analysis-i-d="analysisID"
        :executed-sbom-plugins="executedSbomPlugins"
      />
    </div>

    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load the patch summary</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <div
      v-else-if="loading"
      role="status"
      aria-label="Loading the patch summary"
      class="flex flex-col gap-4"
    >
      <div class="grid gap-4 sm:grid-cols-3">
        <Skeleton v-for="i in 3" :key="i" class="h-24 rounded-card" />
      </div>
      <Skeleton class="h-64 rounded-card" />
    </div>

    <template v-else>
      <ul aria-label="Patch numbers" class="grid gap-4 sm:grid-cols-3">
        <StatTile
          v-for="tile in tiles"
          :key="tile.label"
          :label="`${tile.label} after patching`"
          :value="tile.after"
          :hint="tile.hint"
        />
      </ul>

      <div class="grid gap-4 lg:grid-cols-3">
        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle class="text-base">
              Vulnerabilities by severity, before and after patching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ColumnChart
              :labels="SEVERITIES.map(([label]) => label)"
              :series="severitySeries"
              :y-max="severityMax"
              :format-y="(v) => String(v)"
              :describe="describeSeverity"
              caption="Vulnerabilities by severity, before and after patching"
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
              Overall impact, 0 to 10, before and after patching.
            </p>
            <dl class="flex flex-col gap-2 text-sm">
              <div
                v-for="impact in impacts"
                :key="impact.name"
                class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
              >
                <dt>{{ impact.name }}</dt>
                <dd class="tabular-nums">
                  {{ impact.before }} to
                  <span class="font-semibold text-foreground-strong">{{
                    impact.after
                  }}</span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </template>

    <PatchesTable :analysis-i-d="analysisID" :project-i-d="projectID" />
    <Patches :analysis-i-d="analysisID" :project-i-d="projectID" />
  </section>
</template>
