<template>
  <div
    v-if="loading"
    role="status"
    aria-label="Loading the project numbers"
    class="grid grid-cols-2 gap-4 lg:grid-cols-4"
  >
    <Skeleton v-for="index in 4" :key="index" class="h-28 rounded-card" />
  </div>
  <CardState
    v-else
    label="project numbers"
    :loading="false"
    :error="failed"
    :empty="false"
    @retry="retry"
  >
    <div class="flex flex-col gap-2">
      <ul
        aria-label="Project numbers"
        class="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatTile
          label="Critical issues"
          :value="stats.critical"
          :hint="criticalSubtitle"
        />
        <StatTile
          label="High severity"
          :value="stats.high"
          :hint="highSubtitle"
        />
        <StatTile
          label="Projects scanned"
          :value="stats.projects"
          hint="Projects with an analysis"
        />
        <StatTile
          label="Security score"
          :value="stats.gradeClass"
          :hint="scoreSubtitle"
        />
      </ul>
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="self-end">
            <Info aria-hidden="true" class="size-4" />
            About the security score
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" class="w-80 text-sm">
          <p class="mb-2 font-semibold text-foreground-strong">
            Security Grade Scale
          </p>
          <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt class="font-medium">A+ or A</dt>
            <dd>Excellent, {{ GRADE_DISPLAY_RANGES.excellent }}</dd>
            <dt class="font-medium">B+ or B</dt>
            <dd>Good, {{ GRADE_DISPLAY_RANGES.good }}</dd>
            <dt class="font-medium">C+ or C</dt>
            <dd>Fair, {{ GRADE_DISPLAY_RANGES.fair }}</dd>
            <dt class="font-medium">D+ or D</dt>
            <dd>Poor, {{ GRADE_DISPLAY_RANGES.poor }}</dd>
          </dl>
          <p class="mt-2 text-muted-foreground">
            Based on average vulnerability severity.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  </CardState>
</template>

<script setup lang="ts">
import { Info } from "@lucide/vue";
import { computed } from "vue";

import { StatTile } from "@/base_components/page";
import {
  ProjectGradeClass,
  type QuickStats,
} from "@/codeclarity_components/dashboard/dashboard.entity";
import type {
  OrganizationVulnerabilityList,
  SeverityClass,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Skeleton } from "@/shadcn/ui/skeleton";
import {
  getGradeSubtitle,
  type Grade,
  GRADE_DISPLAY_RANGES,
} from "@/utils/gradeUtils";

import type { DashboardRequest } from "../composables/useDashboardRequest";
import CardState from "../layout/CardState.vue";

// The four headline numbers of the project overview.
const props = defineProps<{
  quickStats: DashboardRequest<QuickStats>;
  vulnerabilityList: DashboardRequest<OrganizationVulnerabilityList>;
}>();

const requests = computed(() => [props.quickStats, props.vulnerabilityList]);
const loading = computed(() =>
  requests.value.some((r) => r.loading || (!r.data && !r.error)),
);
// Numbers from a failed request would read as a clean result.
const failed = computed(() => requests.value.some((r) => r.error));

function retry(): void {
  for (const request of requests.value) {
    if (request.error) void request.run();
  }
}

function countOf(severityClass: SeverityClass): number {
  return props.vulnerabilityList.data?.severity_counts[severityClass] ?? 0;
}

const stats = computed(() => ({
  critical: countOf("CRITICAL"),
  high: countOf("HIGH"),
  projects: props.quickStats.data?.nmb_projects ?? 0,
  gradeClass:
    props.quickStats.data?.max_grade?.class ?? ProjectGradeClass.A_PLUS,
}));

const criticalSubtitle = computed(() => {
  if (stats.value.critical === 0) return "No critical issues";
  return `${stats.value.critical} issue${stats.value.critical > 1 ? "s" : ""} found`;
});

const highSubtitle = computed(() => {
  if (stats.value.high === 0) return "No high severity";
  return `${stats.value.high} issue${stats.value.high > 1 ? "s" : ""} found`;
});

const scoreSubtitle = computed(() => {
  const gradeClass = stats.value.gradeClass;
  const gradeMap: Record<ProjectGradeClass, Grade> = {
    [ProjectGradeClass.A_PLUS]: "A+",
    [ProjectGradeClass.A]: "A",
    [ProjectGradeClass.B_PLUS]: "B+",
    [ProjectGradeClass.B]: "B",
    [ProjectGradeClass.C_PLUS]: "C+",
    [ProjectGradeClass.C]: "C",
    [ProjectGradeClass.D_PLUS]: "D+",
    [ProjectGradeClass.D]: "D",
  };
  return getGradeSubtitle(gradeMap[gradeClass] ?? "A+", "security");
});
</script>
