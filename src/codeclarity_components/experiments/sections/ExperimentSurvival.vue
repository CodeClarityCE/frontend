<script setup lang="ts">
import { computed, ref } from "vue";

import type { ChartCaption } from "@/base_components/charts/chart-caption";
import {
  formatNumber,
  formatShare,
  formatShareWithInterval,
} from "@/base_components/charts/chart-format";
import ChartExport from "@/base_components/charts/ChartExport.vue";
import ChartTable from "@/base_components/charts/ChartTable.vue";

import OpenAsFigure from "../charts/OpenAsFigure.vue";
import SurvivalChart from "../charts/SurvivalChart.vue";
import {
  type ConfidenceInterval,
  type ExposureSurvivalBlock,
  type SeverityCounts,
  SeverityLabels,
  type SurvivalGroup,
} from "../experiment.entity";

const props = defineProps<{
  survival: ExposureSurvivalBlock;
  snapshotInterval?: ConfidenceInterval | null | undefined;
}>();

function labelOf(group: SurvivalGroup): string {
  if (group.key === "all") return "All severities";
  return SeverityLabels[group.key as keyof SeverityCounts] ?? group.key;
}

const groups = computed(() => [
  props.survival.overall,
  ...props.survival.by_severity,
]);

const selectedKey = ref("all");
const selected = computed(
  () =>
    groups.value.find((g) => g.key === selectedKey.value) ??
    props.survival.overall,
);

const counts = computed(() => {
  const { n, fixed, censored } = props.survival.overall;
  return `${n} exposures, ${fixed} fixed, ${censored} still open at HEAD (censored at ${props.survival.censored_at}).`;
});

const snapshotShare = computed(() => {
  const share = props.survival.snapshot_precision_share;
  return share === null
    ? null
    : formatShareWithInterval(share, props.snapshotInterval);
});

const medianText = computed(() =>
  selected.value.median_days === null
    ? "Survival stays above 50%: no median yet."
    : `Median ${formatNumber(selected.value.median_days)} days until half are fixed.`,
);

/** The curve as drawn, including its start at 100% on day 0. */
const plotted = computed(() => {
  const { n, curve, median_days: median } = selected.value;
  return {
    columns: [
      "time_days",
      "survival",
      "lower_95",
      "upper_95",
      "at_risk",
      "events",
      "censored",
      "median_days",
    ],
    rows: [
      [0, 1, 1, 1, n, 0, 0, median],
      ...curve.map((s) => [
        s.time,
        s.survival,
        s.lower,
        s.upper,
        s.at_risk,
        s.events,
        s.censored,
        median,
      ]),
    ],
  };
});

const figureCaption = computed<ChartCaption>(() => {
  const g = selected.value;
  return {
    description: `Exposure survival (Kaplan-Meier with 95% Greenwood log-log band), ${labelOf(g).toLowerCase()}`,
    n: `n = ${g.n} exposures, ${g.fixed} fixed, ${g.censored} censored at ${props.survival.censored_at}`,
  };
});

const caption = computed(() => {
  const g = selected.value;
  const median =
    g.median_days === null
      ? "no median"
      : `median ${formatNumber(g.median_days)} days`;
  return `Exposure survival, ${labelOf(g).toLowerCase()}: ${g.n} exposures, ${g.fixed} fixed, ${median}`;
});
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200 p-4 space-y-4"
    data-testid="experiment-survival"
  >
    <div>
      <h3 class="font-semibold text-gray-900">Exposure survival</h3>
      <p class="text-sm text-gray-500">
        Share of exposures still unfixed after a number of days, from their
        introduction (or the first grid date they were seen) to the fix
        (Kaplan-Meier). Exposures still open at HEAD are censored, shown as
        ticks; failed snapshots are gaps, never fixes. The shaded band is the
        95% confidence interval (Greenwood, log-log).
      </p>
    </div>

    <OpenAsFigure
      :definition="{
        metric: 'survival',
        chart_form: 'step',
        group_by: 'severity',
        filters: {},
      }"
    />

    <p class="text-sm text-gray-700">
      {{ counts }}
      <template v-if="snapshotShare">
        {{ snapshotShare }} of fixes dated only to a snapshot interval, using
        the later snapshot's commit date (an upper bound).
      </template>
    </p>

    <p v-if="survival.overall.n === 0" class="text-sm text-gray-500">
      No exposures yet.
    </p>
    <template v-else>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Severity">
        <button
          v-for="group in groups"
          :key="group.key"
          type="button"
          data-testid="survival-group"
          :aria-pressed="group.key === selected.key ? 'true' : 'false'"
          class="rounded-full border px-3 py-1 text-xs"
          :class="
            group.key === selected.key
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          "
          @click="selectedKey = group.key"
        >
          {{ labelOf(group) }}
        </button>
      </div>

      <p class="text-sm text-gray-700">{{ medianText }}</p>

      <ChartExport
        :name="`exposure-survival-${selected.key.toLowerCase()}`"
        :data="plotted"
        :caption="figureCaption"
      >
        <SurvivalChart
          :curve="selected.curve"
          :median="selected.median_days"
          :caption="caption"
        />
      </ChartExport>

      <ChartTable>
        <thead class="text-left text-gray-500">
          <tr>
            <th class="font-medium">Group</th>
            <th class="font-medium text-right">Exposures</th>
            <th class="font-medium text-right">Fixed</th>
            <th class="font-medium text-right">Censored</th>
            <th class="font-medium text-right">Median days</th>
          </tr>
        </thead>
        <tbody class="text-gray-700" style="font-variant-numeric: tabular-nums">
          <tr
            v-for="group in groups"
            :key="group.key"
            data-testid="survival-table-row"
          >
            <td>{{ labelOf(group) }}</td>
            <td class="text-right">{{ group.n }}</td>
            <td class="text-right">{{ group.fixed }}</td>
            <td class="text-right">{{ group.censored }}</td>
            <td class="text-right">{{ formatNumber(group.median_days) }}</td>
          </tr>
        </tbody>
      </ChartTable>

      <ChartTable label="Show steps with 95% bounds">
        <thead class="text-left text-gray-500">
          <tr>
            <th class="font-medium text-right">Day</th>
            <th class="font-medium text-right">Still exposed</th>
            <th class="font-medium text-right">95% lower</th>
            <th class="font-medium text-right">95% upper</th>
            <th class="font-medium text-right">At risk</th>
          </tr>
        </thead>
        <tbody class="text-gray-700" style="font-variant-numeric: tabular-nums">
          <tr
            v-for="step in selected.curve"
            :key="step.time"
            data-testid="survival-step-row"
          >
            <td class="text-right">{{ formatNumber(step.time) }}</td>
            <td class="text-right">{{ formatShare(step.survival) }}</td>
            <td class="text-right">{{ formatShare(step.lower) }}</td>
            <td class="text-right">{{ formatShare(step.upper) }}</td>
            <td class="text-right">{{ step.at_risk }}</td>
          </tr>
        </tbody>
      </ChartTable>
    </template>
  </div>
</template>
