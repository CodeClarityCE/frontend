<script setup lang="ts">
import { computed } from "vue";

import type { GridLineSeries } from "@/base_components/charts/chart-format";
import ColumnChart from "@/base_components/charts/ColumnChart.vue";
import {
  SEVERITY_CLASSES,
  type SeverityClass,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import {
  TrendPeriod,
  type VulnerabilityTrend,
  type VulnerabilityTrendFilters,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";

import type { FilteredDashboardRequest } from "../composables/useDashboardRequest";
import CardState from "../layout/CardState.vue";

// Open vulnerability instances per period by severity, and what each period introduced and fixed.
const props = defineProps<{
  request: FilteredDashboardRequest<
    VulnerabilityTrend,
    VulnerabilityTrendFilters
  >;
}>();

const points = computed(() => props.request.data?.points ?? []);
const monthly = computed(
  () => props.request.data?.period === TrendPeriod.Month,
);
const unit = computed(() => (monthly.value ? "month" : "week"));

// Period starts are UTC midnights, so they are formatted in UTC.
const format = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
const DAY = format({ month: "short", day: "2-digit", year: "numeric" });
const SHORT_DAY = format({ month: "short", day: "2-digit" });
const MONTH = format({ month: "long", year: "numeric" });
const SHORT_MONTH = format({ month: "short", year: "2-digit" });

const names = computed(() =>
  points.value.map((p) =>
    monthly.value
      ? MONTH.format(new Date(p.start))
      : `Week of ${DAY.format(new Date(p.start))}`,
  ),
);
const axisLabels = computed(() =>
  points.value.map((p) =>
    (monthly.value ? SHORT_MONTH : SHORT_DAY).format(new Date(p.start)),
  ),
);

const STROKED: Partial<Record<SeverityClass, string>> = {
  MEDIUM: "var(--viz-severity-medium-stroke)",
  LOW: "var(--viz-severity-low-stroke)",
};

const openSeries = computed((): GridLineSeries[] =>
  // Critical at the bottom, so the worst stays on the baseline.
  SEVERITY_CLASSES.map((c) => {
    const level = c.toLowerCase();
    return {
      key: level,
      label: c.charAt(0) + level.slice(1),
      values: points.value.map((p) => p.open[c]),
      color: `var(--viz-severity-${level})`,
      strokes: points.value.map(() => STROKED[c]),
    };
  }),
);
const openTotals = computed(() =>
  points.value.map((p) =>
    SEVERITY_CLASSES.reduce((sum, c) => sum + p.open[c], 0),
  ),
);

function describeOpen(index: number): string {
  const p = points.value[index]!;
  const parts = SEVERITY_CLASSES.filter((c) => p.open[c] > 0).map(
    (c) => `${p.open[c]} ${c.toLowerCase()}`,
  );
  const detail = parts.length ? ` (${parts.join(", ")})` : "";
  return `${names.value[index]}: ${openTotals.value[index]} open${detail}`;
}

const changeSeries = computed((): GridLineSeries[] => [
  {
    key: "introduced",
    label: "Introduced",
    values: points.value.map((p) => p.introduced),
    color: "var(--viz-series-1)",
  },
  {
    key: "fixed",
    label: "Fixed",
    values: points.value.map((p) => p.fixed),
    color: "var(--viz-series-2)",
  },
]);

function describeChanges(index: number): string {
  const p = points.value[index]!;
  return `${names.value[index]}: ${p.introduced} introduced, ${p.fixed} fixed`;
}

const empty = computed(() => points.value.every((p) => p.project_count === 0));
const count = (value: number): string => String(Math.round(value));
</script>

<template>
  <CardState
    label="open vulnerabilities over time"
    :loading="request.loading || (!request.data && !request.error)"
    :error="request.error"
    :empty="empty"
    @retry="() => void request.run()"
  >
    <div class="grid gap-8 xl:grid-cols-2">
      <div class="flex flex-col gap-2">
        <h4 class="text-sm font-semibold text-foreground-strong">
          Open per {{ unit }}
        </h4>
        <ColumnChart
          :labels="axisLabels"
          :series="openSeries"
          :y-max="Math.max(...openTotals, 1)"
          :format-y="count"
          :describe="describeOpen"
          :caption="`Open vulnerability instances by severity, per ${unit}`"
          :x-title="monthly ? 'Month' : 'Week'"
          integer
          stacked
        />
      </div>
      <div class="flex flex-col gap-2">
        <h4 class="text-sm font-semibold text-foreground-strong">
          Introduced and fixed per {{ unit }}
        </h4>
        <ColumnChart
          :labels="axisLabels"
          :series="changeSeries"
          :y-max="
            Math.max(...points.map((p) => Math.max(p.introduced, p.fixed)), 1)
          "
          :format-y="count"
          :describe="describeChanges"
          :caption="`Vulnerability instances introduced and fixed per ${unit}`"
          :x-title="monthly ? 'Month' : 'Week'"
          integer
        />
      </div>
    </div>
  </CardState>
</template>
