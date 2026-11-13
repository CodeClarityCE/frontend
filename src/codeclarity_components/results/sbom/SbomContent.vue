<script lang="ts" setup>
import { Info, RefreshCw } from "@lucide/vue";
import { computed, type Ref, ref, watch } from "vue";

import ColumnChart from "@/base_components/charts/ColumnChart.vue";
import { OwlEmptyState, StatTile } from "@/base_components/page";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import {
  type AnalysisStats,
  SbomStats,
} from "@/codeclarity_components/results/stats.entity";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { saveBlob } from "@/utils/download";
import {
  getGradeSubtitle,
  GRADE_DISPLAY_RANGES,
  scoreToGrade,
} from "@/utils/gradeUtils";
import { errorToast } from "@/utils/toasts";

import type { Dependency as SbomDependency } from "../graph.entity";
import SelectWorkspace from "../SelectWorkspace.vue";

import {
  convertToCSV,
  convertToCycloneDX,
  convertToHTML,
  type ExportFormat,
  sortDependenciesByPriority,
} from "./exports/sbomExportUtils";
import PackageJsonUpdatesModal from "./PackageJsonUpdatesModal.vue";
import SbomExportMenu from "./SbomExportMenu.vue";
import SbomTable from "./SbomTable.vue";
import {
  calculateHealthScore,
  calculateSecurityIssues,
  convertToPackageUpdates,
  getDirectDependenciesNeedingUpdates,
} from "./utils/sbomUtils";

const props = withDefaults(
  defineProps<{
    analysisID?: string;
    projectID?: string;
    projectName?: string;
    executedSbomPlugins?: string[];
  }>(),
  {
    projectID: "",
    analysisID: "",
    projectName: "",
    executedSbomPlugins: () => [],
  },
);

const sbomRepo = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

const failed = ref(false);
const loading = ref(true);
const stats: Ref<SbomStats> = ref(new SbomStats());
const vulnerabilityStats: Ref<AnalysisStats | null> = ref(null);
const dependencies: Ref<SbomDependency[]> = ref([]);
const selected_workspace = ref(".");
const packageManager = ref("yarn");
const ecosystemFilter: Ref<string | null> = ref(null);
const showUpdatesModal = ref(false);
const exporting = ref(false);

// Counts requests so an answer for an earlier selection is dropped.
let latestRequest = 0;

function context(): { orgId: string; token: string } | null {
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (!org || !authStore.getAuthenticated || !token) return null;
  if (props.projectID === "" || props.analysisID === "") return null;
  return { orgId: org.id, token };
}

// The API pages at 100, so every page is fetched to have all dependencies.
async function fetchAllDependencies(): Promise<SbomDependency[]> {
  const ctx = context();
  if (!ctx) return [];
  const fetchPage = (page: number): ReturnType<typeof sbomRepo.getSbom> =>
    sbomRepo.getSbom({
      orgId: ctx.orgId,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: selected_workspace.value,
      bearerToken: ctx.token,
      pagination: { page, entries_per_page: 100 },
      sort: { sortKey: "name", sortDirection: "ASC" },
      active_filters: "",
      search_key: "",
      ecosystem_filter: ecosystemFilter.value ?? undefined,
      handleBusinessErrors: true,
    });
  const first = await fetchPage(0);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, (first.total_pages ?? 1) - 1) }, (_, i) =>
      fetchPage(i + 1),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data ?? []);
}

async function fetchVulnerabilityStats(): Promise<AnalysisStats | null> {
  const ctx = context();
  if (!ctx) return null;
  try {
    const res = await sbomRepo.getVulnerabilitiesStat({
      orgId: ctx.orgId,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: selected_workspace.value,
      bearerToken: ctx.token,
      ecosystem_filter: ecosystemFilter.value ?? undefined,
      handleBusinessErrors: true,
    });
    return res.data;
  } catch {
    return null;
  }
}

async function load(): Promise<void> {
  const ctx = context();
  if (!ctx) return;
  const request = ++latestRequest;
  try {
    const [statsRes, deps, vulnStats] = await Promise.all([
      sbomRepo.getSbomStat({
        orgId: ctx.orgId,
        projectId: props.projectID,
        analysisId: props.analysisID,
        workspace: selected_workspace.value,
        bearerToken: ctx.token,
        ecosystem_filter: ecosystemFilter.value ?? undefined,
        handleBusinessErrors: true,
      }),
      fetchAllDependencies(),
      fetchVulnerabilityStats(),
    ]);
    if (request !== latestRequest) return;
    stats.value = statsRes.data;
    dependencies.value = deps;
    vulnerabilityStats.value = vulnStats;
    failed.value = false;
  } catch {
    if (request === latestRequest) failed.value = true;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

watch(
  [
    () => props.projectID,
    () => props.analysisID,
    selected_workspace,
    ecosystemFilter,
  ],
  () => void load(),
  { immediate: true },
);

const total = computed(() => stats.value.number_of_dependencies ?? 0);
const directTotal = computed(
  () =>
    (stats.value.number_of_direct_dependencies ?? 0) +
    (stats.value.number_of_both_direct_transitive_dependencies ?? 0),
);
const healthGrade = computed(() =>
  scoreToGrade(calculateHealthScore(stats.value)),
);
const securityIssues = computed(() =>
  calculateSecurityIssues(vulnerabilityStats.value),
);
const securityHint = computed(() => {
  if (securityIssues.value === null) return "Vulnerability data unavailable";
  return securityIssues.value === 0 ? "No issues found" : "Requires attention";
});

const healthFactors = computed(() => [
  {
    label: "Deprecated",
    count: stats.value.number_of_deprecated_dependencies ?? 0,
  },
  {
    label: "Unlicensed",
    count: stats.value.number_of_unlicensed_dependencies ?? 0,
  },
  {
    label: "Outdated",
    count: stats.value.number_of_outdated_dependencies ?? 0,
  },
]);

const COMPOSITION = ["Direct", "Transitive", "Both"];
const compositionCounts = computed(() => [
  stats.value.number_of_direct_dependencies ?? 0,
  stats.value.number_of_transitive_dependencies ?? 0,
  stats.value.number_of_both_direct_transitive_dependencies ?? 0,
]);
const compositionSeries = computed(() => [
  {
    key: "count",
    label: "Dependencies",
    values: compositionCounts.value,
    color: "var(--viz-series-1)",
  },
]);

function describeComposition(index: number): string {
  const count = compositionCounts.value[index] ?? 0;
  const share = total.value > 0 ? Math.round((count / total.value) * 100) : 0;
  return `${COMPOSITION[index] ?? ""}: ${count} ${count === 1 ? "dependency" : "dependencies"}, ${share}% of total`;
}

const packageUpdates = computed(() =>
  convertToPackageUpdates(
    getDirectDependenciesNeedingUpdates(dependencies.value),
  ),
);

function onPackageManagerLoaded(manager: string): void {
  packageManager.value = manager.toLowerCase();
}

function onEcosystemFilterChanged(ecosystem: string | null): void {
  ecosystemFilter.value = ecosystem;
}

const EXPORTS: Record<
  ExportFormat,
  { suffix: string; mime: string; build: (deps: SbomDependency[]) => string }
> = {
  csv: { suffix: ".csv", mime: "text/csv", build: (d) => convertToCSV(d) },
  html: {
    suffix: ".html",
    mime: "text/html",
    build: (d) =>
      convertToHTML(d, {
        projectName: props.projectName,
        projectId: props.projectID,
      }),
  },
  json: {
    suffix: ".json",
    mime: "application/json",
    build: (d) => JSON.stringify(sortDependenciesByPriority(d), null, 2),
  },
  cyclonedx: {
    suffix: "-cyclonedx.json",
    mime: "application/json",
    build: (d) =>
      convertToCycloneDX(d, {
        projectName: props.projectName,
        projectId: props.projectID,
      }),
  },
};

async function exportReport(format: ExportFormat): Promise<void> {
  exporting.value = true;
  try {
    const deps = await fetchAllDependencies();
    const target = EXPORTS[format];
    const date = new Date().toISOString().split("T")[0];
    const name = props.projectName || props.projectID;
    saveBlob(
      new Blob([target.build(deps)], { type: target.mime }),
      `sbom-${name}-${date}${target.suffix}`,
    );
  } catch {
    errorToast("Could not export the SBOM");
  } finally {
    exporting.value = false;
  }
}

const LINK =
  "rounded-sm font-medium text-brand-subtle-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
</script>

<template>
  <section aria-labelledby="sbom-heading" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2
        id="sbom-heading"
        class="text-xl font-semibold tracking-tight text-foreground-strong"
      >
        Software bill of materials
      </h2>
      <SelectWorkspace
        v-model:selected_workspace="selected_workspace"
        :project-i-d="projectID"
        :analysis-i-d="analysisID"
        :executed-sbom-plugins="executedSbomPlugins"
        @package-manager-loaded="onPackageManagerLoaded"
        @ecosystem-filter-changed="onEcosystemFilterChanged"
      />
    </div>

    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load the SBOM</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <div
      v-if="loading"
      role="status"
      aria-label="Loading the SBOM"
      class="flex flex-col gap-4"
    >
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton v-for="i in 4" :key="i" class="h-24 rounded-card" />
      </div>
      <Skeleton class="h-64 rounded-card" />
      <Skeleton class="h-96 rounded-card" />
    </div>

    <OwlEmptyState
      v-else-if="!failed && total === 0"
      title="No dependencies found"
    >
      <template #description>
        The analysis found no dependencies. A project needs a package manifest,
        such as
        <a
          :class="LINK"
          href="https://docs.npmjs.com/cli/configuring-npm/package-json"
          target="_blank"
          rel="noopener"
          >package.json</a
        >, next to its lockfile. If your project has both, write to
        <a :class="LINK" href="mailto:help@codeclarity.io"
          >help@codeclarity.io</a
        >.
      </template>
    </OwlEmptyState>

    <template v-else-if="!failed">
      <ul
        aria-label="Dependency numbers"
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatTile
          label="Dependencies"
          :value="total"
          hint="All project dependencies"
        />
        <StatTile
          label="Direct dependencies"
          :value="directTotal"
          hint="Added by you"
        />
        <StatTile
          label="Health grade"
          :value="healthGrade"
          :hint="getGradeSubtitle(healthGrade, 'health')"
        />
        <StatTile
          label="Security issues"
          :value="securityIssues ?? '-'"
          :hint="securityHint"
        />
      </ul>

      <Popover>
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="self-start">
            <Info aria-hidden="true" class="size-4" />
            How the health grade is set
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" class="w-80 text-sm">
          <p class="mb-2">
            Deprecated and unlicensed dependencies lower the grade most;
            outdated ones count for less. Vulnerabilities are counted under
            security issues.
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
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Dependency composition</CardTitle>
          </CardHeader>
          <CardContent>
            <ColumnChart
              :labels="COMPOSITION"
              :series="compositionSeries"
              :y-max="Math.max(...compositionCounts, 1)"
              :format-y="(v) => String(v)"
              :describe="describeComposition"
              caption="Dependencies by how they are added"
              x-title="Added as"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Health factors</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-6">
            <dl class="flex flex-col gap-2 text-sm">
              <div
                v-for="factor in healthFactors"
                :key="factor.label"
                class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
              >
                <dt>{{ factor.label }}</dt>
                <dd class="font-semibold tabular-nums text-foreground-strong">
                  {{ factor.count }}
                </dd>
              </div>
            </dl>
            <div class="flex flex-wrap gap-2">
              <Button
                :disabled="packageUpdates.length === 0"
                @click="showUpdatesModal = true"
              >
                <RefreshCw aria-hidden="true" class="size-4" />
                Update {{ packageUpdates.length }} direct
                {{
                  packageUpdates.length === 1 ? "dependency" : "dependencies"
                }}
              </Button>
              <SbomExportMenu :exporting="exporting" @export="exportReport" />
            </div>
          </CardContent>
        </Card>
      </div>

      <SbomTable
        :dependencies="dependencies"
        :analysis-i-d="analysisID"
        :project-i-d="projectID"
      />
    </template>

    <PackageJsonUpdatesModal
      v-model:open="showUpdatesModal"
      :updates="packageUpdates"
      :project-name="projectName"
      :package-manager="packageManager"
    />
  </section>
</template>
