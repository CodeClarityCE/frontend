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
          v-for="tile in tiles"
          :key="tile.label"
          :label="tile.label"
          :value="tile.value"
          :hint="tile.change?.text"
          :trend="tile.change?.direction"
          :trend-tone="tile.change?.tone"
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
  TrendPeriod,
  type VulnerabilityTrend,
  type VulnerabilityTrendFilters,
  type VulnerabilityTrendPoint,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { GRADE_DISPLAY_RANGES, scoreToGrade } from "@/utils/gradeUtils";

import type { FilteredDashboardRequest } from "../composables/useDashboardRequest";
import CardState from "../layout/CardState.vue";

// The four headline numbers of the project overview, each against the previous period.
const props = defineProps<{
  trend: FilteredDashboardRequest<
    VulnerabilityTrend,
    VulnerabilityTrendFilters
  >;
}>();

const loading = computed(
  () => props.trend.loading || (!props.trend.data && !props.trend.error),
);
// Numbers from a failed request would read as a clean result.
const failed = computed(() => props.trend.error);

function retry(): void {
  void props.trend.run();
}

interface Change {
  text: string;
  direction: "up" | "down" | "equal";
  tone: "good" | "bad" | "neutral";
}

const since = computed(() =>
  props.trend.data?.period === TrendPeriod.Month ? "last month" : "last week",
);

// How a count moved; `fewerIsBetter` colours the arrow.
function countChange(
  now: number,
  before: number | undefined,
  fewerIsBetter: boolean,
): Change | undefined {
  if (before === undefined) return undefined;
  const diff = now - before;
  if (diff === 0) {
    return {
      text: `Same as ${since.value}`,
      direction: "equal",
      tone: "neutral",
    };
  }
  const better = diff < 0 === fewerIsBetter;
  return {
    text: `${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} than ${since.value}`,
    direction: diff > 0 ? "up" : "down",
    tone: better ? "good" : "bad",
  };
}

function scoreChange(
  now: number,
  before: number | undefined,
): Change | undefined {
  if (before === undefined) return undefined;
  const diff = Math.round(now - before);
  if (diff === 0) {
    return {
      text: `Same as ${since.value}`,
      direction: "equal",
      tone: "neutral",
    };
  }
  return {
    text: `${diff > 0 ? "Up" : "Down"} ${Math.abs(diff)} points since ${since.value}`,
    direction: diff > 0 ? "up" : "down",
    tone: diff > 0 ? "good" : "bad",
  };
}

const tiles = computed(() => {
  const points = props.trend.data?.points ?? [];
  const now: VulnerabilityTrendPoint | undefined = points[points.length - 1];
  const before: VulnerabilityTrendPoint | undefined = points[points.length - 2];
  const critical = now?.open.CRITICAL ?? 0;
  const high = now?.open.HIGH ?? 0;
  const projects = now?.project_count ?? 0;
  const score = now?.security_score ?? 100;
  return [
    {
      label: "Critical vulnerabilities",
      value: critical,
      change: countChange(critical, before?.open.CRITICAL, true),
    },
    {
      label: "High vulnerabilities",
      value: high,
      change: countChange(high, before?.open.HIGH, true),
    },
    {
      label: "Projects scanned",
      value: projects,
      change: countChange(projects, before?.project_count, false),
    },
    {
      label: "Security score",
      value: scoreToGrade(score),
      change: scoreChange(score, before?.security_score),
    },
  ];
});
</script>
