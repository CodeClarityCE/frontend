<script setup lang="ts">
import { computed } from "vue";

import { excluded, type FigureCaption } from "../charts/chart-caption";
import {
  formatInterval,
  formatNumber,
  formatShare,
  formatShareWithInterval,
  gridLineData,
  type GridLineSeries,
  plural,
} from "../charts/chart-format";
import ChartExport from "../charts/ChartExport.vue";
import GridLineChart from "../charts/GridLineChart.vue";
import OpenAsFigure from "../charts/OpenAsFigure.vue";
import type {
  ConfidenceInterval,
  FixKindRow,
  RemovedTransitiveIntervals,
  UpstreamLeverageBlock,
} from "../experiment.entity";

const props = defineProps<{
  leverage: UpstreamLeverageBlock;
  shareIntervals?: RemovedTransitiveIntervals | undefined;
  snapshotInterval?: ConfidenceInterval | null | undefined;
}>();

const HEAD = "HEAD";
const CLEAR_TITLE =
  "Packages needed to clear 50% and 80% of instances per grid date";
const SHARE_TITLE =
  "Share of fixes of known kind removed transitively, per grid interval";

const clear = computed(() => props.leverage.packages_to_clear);
const clearLabels = computed(() =>
  clear.value.map((row) => row.grid_date ?? HEAD),
);
const clearSeries = computed<GridLineSeries[]>(() => [
  {
    key: "50",
    label: "Clear 50%",
    values: clear.value.map((r) => r.pkgs_clear_50),
    color: "var(--viz-series-1)",
  },
  {
    key: "80",
    label: "Clear 80%",
    values: clear.value.map((r) => r.pkgs_clear_80),
    color: "var(--viz-series-2)",
  },
]);
const clearMax = computed(() =>
  Math.max(4, ...clear.value.map((r) => r.pkgs_clear_80 ?? 0)),
);
const clearColumns = computed(() => [
  {
    label: "Instances",
    values: clear.value.map((r) => formatNumber(r.instances)),
  },
]);

function describeClear(index: number): string {
  const row = clear.value[index]!;
  const label = clearLabels.value[index]!;
  if (row.pkgs_clear_50 === null || row.pkgs_clear_80 === null)
    return `${label}: no done snapshot`;
  if (row.instances === 0) return `${label}: no instances`;
  return `${label}: 50% of ${plural(row.instances, "instance")} in ${plural(row.pkgs_clear_50, "package")}, 80% in ${plural(row.pkgs_clear_80, "package")}`;
}

const intervals = computed(() => props.leverage.fix_kinds);
const shareLabels = computed(() =>
  intervals.value.map((row) => row.interval_to ?? HEAD),
);
/** Interval columns for the CSV, when the API sent intervals. */
const shareBounds = computed(() => {
  const byInterval = props.shareIntervals?.by_interval;
  if (!byInterval) return null;
  return {
    lower: intervals.value.map((_, i) => byInterval[i]?.low ?? null),
    upper: intervals.value.map((_, i) => byInterval[i]?.high ?? null),
  };
});

const shareSeries = computed<GridLineSeries[]>(() => [
  {
    key: "share",
    label: "Removed transitively",
    values: intervals.value.map((r) => r.removed_transitive_share),
    color: "var(--viz-series-1)",
    ...(shareBounds.value ?? {}),
  },
]);
const shareColumns = computed(() => [
  { label: "Fixes", values: intervals.value.map((r) => formatNumber(r.fixes)) },
  {
    label: "Unknown kind",
    values: intervals.value.map((r) => formatNumber(r.unknown)),
  },
  ...(props.shareIntervals
    ? [
        {
          label: "95% CI",
          values: intervals.value.map((_, i) =>
            formatInterval(props.shareIntervals!.by_interval[i] ?? null),
          ),
        },
      ]
    : []),
]);

function knownShare(
  counts: FixKindRow | UpstreamLeverageBlock["overall"],
  interval: ConfidenceInterval | null | undefined,
): string {
  const known = counts.fixes - counts.unknown;
  return `${formatShareWithInterval(counts.removed_transitive_share, interval)} of ${plural(known, "fix", "fixes")} of known kind removed transitively`;
}

function describeShare(index: number): string {
  const row = intervals.value[index]!;
  const label = `${row.interval_from ?? HEAD} to ${row.interval_to ?? HEAD}`;
  if (row.fixes === 0) return `${label}: no fixes`;
  if (row.removed_transitive_share === null)
    return `${label}: ${plural(row.fixes, "fix", "fixes")}, all of unknown kind`;
  const unknown = row.unknown ? `, ${formatNumber(row.unknown)} unknown` : "";
  return `${label}: ${knownShare(row, props.shareIntervals?.by_interval[index])}${unknown}`;
}

const overall = computed(() => props.leverage.overall);

const clearCaption = computed<FigureCaption>(() => {
  const last = clear.value.at(-1);
  return {
    description: CLEAR_TITLE,
    n: `n = ${last?.instances ?? 0} instances in ${last?.projects ?? 0} projects at ${last?.grid_date ?? HEAD}`,
    exclusions: excluded(
      clear.value.filter((r) => r.pkgs_clear_50 === null).length,
      "grid date",
      "grid dates",
      "without a done snapshot",
    ),
  };
});

const shareCaption = computed<FigureCaption>(() => {
  const { fixes, unknown } = overall.value;
  return {
    description: SHARE_TITLE,
    n: `n = ${fixes - unknown} fixes of known kind`,
    exclusions: excluded(unknown, "fix", "fixes", "of unknown kind"),
  };
});

const summary = computed(() => {
  const o = overall.value;
  if (o.fixes === 0) return "No fixes yet.";
  if (o.removed_transitive_share === null)
    return `${plural(o.fixes, "fix", "fixes")}, all of unknown kind.`;
  return `${knownShare(o, props.shareIntervals?.overall)}.`;
});

const unknownNote = computed(() => {
  const { unknown, fixes } = overall.value;
  if (!unknown) return null;
  const verb = unknown === 1 ? "has" : "have";
  return `${formatNumber(unknown)} of ${plural(fixes, "fix", "fixes")} ${verb} an unknown kind (no probe outcome after the fix) and ${unknown === 1 ? "is" : "are"} left out of the share.`;
});
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200 p-4 space-y-4"
    data-testid="experiment-upstream-leverage"
  >
    <div>
      <h3 class="font-semibold text-gray-900">Upstream leverage over time</h3>
      <p class="text-sm text-gray-500">
        How few packages carry most vulnerability instances at each grid date,
        and how much remediation came from upstream: fixes where a vulnerable
        transitive dependency left the tree.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div data-testid="leverage-packages-to-clear">
        <h4 class="text-sm font-medium text-gray-900 mb-1">
          Packages to clear instances
        </h4>
        <p class="text-xs text-gray-500 mb-1">
          The fewest packages whose fixes would clear 50% and 80% of the
          instances in done snapshots at each grid date.
        </p>
        <OpenAsFigure
          :definition="{
            metric: 'upstream_leverage',
            chart_form: 'line',
            group_by: null,
            filters: {},
          }"
        />
        <ChartExport
          name="packages-to-clear"
          :data="gridLineData('Grid date', clearLabels, clearSeries)"
          :caption="clearCaption"
        >
          <GridLineChart
            :labels="clearLabels"
            :series="clearSeries"
            :y-max="clearMax"
            :format-y="formatNumber"
            :describe="describeClear"
            :extra-columns="clearColumns"
            :caption="CLEAR_TITLE"
            x-title="Grid date"
          />
        </ChartExport>
      </div>
      <div data-testid="leverage-transitive-share">
        <h4 class="text-sm font-medium text-gray-900 mb-1">
          Fixes removed transitively
        </h4>
        <p class="text-xs text-gray-700 mb-1">
          {{ summary }}
          <template v-if="unknownNote">{{ unknownNote }}</template>
        </p>
        <p v-if="intervals.length === 0" class="text-sm text-gray-500">
          No grid intervals yet.
        </p>
        <ChartExport
          v-else
          name="fixes-removed-transitively"
          :data="gridLineData('Interval ending', shareLabels, shareSeries)"
          :caption="shareCaption"
        >
          <GridLineChart
            :labels="shareLabels"
            :series="shareSeries"
            :y-max="1"
            :format-y="formatShare"
            :format-tick="(share: number) => `${Math.round(share * 100)}%`"
            :describe="describeShare"
            :extra-columns="shareColumns"
            :caption="SHARE_TITLE"
            x-title="Interval ending"
          />
        </ChartExport>
        <p
          v-if="overall.snapshot_precision_share !== null"
          class="text-xs text-gray-500 mt-1"
        >
          {{
            formatShareWithInterval(
              overall.snapshot_precision_share,
              snapshotInterval,
            )
          }}
          of fixes dated only to a snapshot interval. A fix counts in the
          interval ending at the later snapshot it was seen fixed in.
        </p>
      </div>
    </div>
  </div>
</template>
