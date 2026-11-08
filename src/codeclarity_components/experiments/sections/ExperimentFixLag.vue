<script setup lang="ts">
import { computed } from "vue";

import {
  formatDays,
  formatShare,
  type LagChartRow,
} from "../charts/chart-format";
import LagStripChart from "../charts/LagStripChart.vue";
import {
  type ExposuresBlock,
  type FixKind,
  FixKindLabels,
  type FixLagBlock,
  type FixLagPoint,
  type LagGroup,
  type ResultIntervals,
  type SeverityCounts,
  SeverityLabels,
} from "../experiment.entity";

const props = defineProps<{
  fixLag: FixLagBlock;
  exposures: ExposuresBlock | null;
  intervals?: ResultIntervals["fix_lag"] | null;
}>();

function rowsOf(
  groups: LagGroup[],
  label: (key: string) => string,
  matches: (point: FixLagPoint, key: string) => boolean,
  intervals?: Record<string, LagChartRow["interval"]>,
): LagChartRow[] {
  return groups.map((group) => ({
    key: group.key,
    label: label(group.key),
    summary: group,
    lags: props.fixLag.points
      .filter((point) => matches(point, group.key))
      .map((point) => point.lag_days),
    interval: intervals?.[group.key] ?? null,
  }));
}

const bySeverity = computed(() =>
  rowsOf(
    props.fixLag.by_severity,
    (key) => SeverityLabels[key as keyof SeverityCounts] ?? key,
    (point, key) => point.severity === key,
    props.intervals?.by_severity,
  ),
);

const byKind = computed(() =>
  rowsOf(
    props.fixLag.by_kind,
    (key) => FixKindLabels[key as FixKind | "unknown"] ?? key,
    (point, key) => (point.kind ?? "unknown") === key,
    props.intervals?.by_kind,
  ),
);

/** Both charts share one x range so they compare. */
const domain = computed<[number, number]>(() => {
  const { min, max } = props.fixLag.overall;
  return [Math.min(min ?? 0, 0), Math.max(max ?? 0, 0, 1)];
});

const snapshotShare = computed(() => {
  const share = props.fixLag.snapshot_precision_share;
  return share === null ? null : formatShare(share);
});

const counts = computed(() => {
  const fixes = `${props.fixLag.fixes} fixes, ${props.fixLag.overall.before_disclosure} before disclosure`;
  const exposures = props.exposures;
  return exposures
    ? `${fixes}, over ${exposures.exposures} exposures (${exposures.open} still open at HEAD).`
    : `${fixes}.`;
});

function describe(row: LagChartRow, lag: number): string {
  if (lag === 0) return `${row.label}: fixed on the day of disclosure`;
  const when = lag < 0 ? "before" : "after";
  return `${row.label}: fixed ${formatDays(lag)} ${when} disclosure`;
}
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200 p-4 space-y-4"
    data-testid="experiment-fix-lag"
  >
    <div>
      <h3 class="font-semibold text-gray-900">Fix lag</h3>
      <p class="text-sm text-gray-500">
        Days from an advisory's disclosure to the fix. Below zero, the project
        fixed it before the advisory was published. Each dot is one fix; the
        band spans the middle half and the tick marks the median.
      </p>
    </div>

    <p class="text-sm text-gray-700">
      {{ counts }}
      <template v-if="snapshotShare">
        {{ snapshotShare }} dated only to a snapshot interval, using the later
        snapshot's commit date (an upper bound). A fix reverted and re-applied
        within one interval reads as one fix.
      </template>
    </p>

    <p v-if="fixLag.overall.n === 0" class="text-sm text-gray-500">
      No fixes with a disclosure date yet.
    </p>
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div data-testid="fix-lag-by-severity">
        <h4 class="text-sm font-medium text-gray-900 mb-1">By severity</h4>
        <LagStripChart
          :rows="bySeverity"
          :domain="domain"
          caption="Fix lag in days by severity"
          zero-label="Disclosure"
          unit="fixes"
          below-zero="before disclosure"
          :describe="describe"
        />
      </div>
      <div data-testid="fix-lag-by-kind">
        <h4 class="text-sm font-medium text-gray-900 mb-1">By fix kind</h4>
        <LagStripChart
          :rows="byKind"
          :domain="domain"
          caption="Fix lag in days by fix kind"
          zero-label="Disclosure"
          unit="fixes"
          below-zero="before disclosure"
          :describe="describe"
        />
      </div>
    </div>
  </div>
</template>
