<script setup lang="ts">
import { computed, ref } from "vue";

import { formatNumber, formatShare } from "../charts/chart-format";
import ChartTable from "../charts/ChartTable.vue";
import SurvivalChart from "../charts/SurvivalChart.vue";
import {
  type ExposureSurvivalBlock,
  type SeverityCounts,
  SeverityLabels,
  type SurvivalGroup,
} from "../experiment.entity";

const props = defineProps<{ survival: ExposureSurvivalBlock }>();

function labelOf(group: SurvivalGroup): string {
  if (group.key === "all") return "All severities";
  return SeverityLabels[group.key as keyof SeverityCounts] ?? group.key;
}

const groups = computed(() => [props.survival.overall, ...props.survival.by_severity]);

const selectedKey = ref("all");
const selected = computed(
  () => groups.value.find((g) => g.key === selectedKey.value) ?? props.survival.overall,
);

const counts = computed(() => {
  const { n, fixed, censored } = props.survival.overall;
  return `${n} exposures, ${fixed} fixed, ${censored} still open at HEAD (censored at ${props.survival.censored_at}).`;
});

const snapshotShare = computed(() => {
  const share = props.survival.snapshot_precision_share;
  return share === null ? null : formatShare(share);
});

const medianText = computed(() =>
  selected.value.median_days === null
    ? "Survival stays above 50%: no median yet."
    : `Median ${formatNumber(selected.value.median_days)} days until half are fixed.`,
);

const caption = computed(() => {
  const g = selected.value;
  const median = g.median_days === null ? "no median" : `median ${formatNumber(g.median_days)} days`;
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
        ticks; failed snapshots are gaps, never fixes.
      </p>
    </div>

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

      <SurvivalChart
        :curve="selected.curve"
        :median="selected.median_days"
        :caption="caption"
      />

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
            <tr v-for="group in groups" :key="group.key" data-testid="survival-table-row">
              <td>{{ labelOf(group) }}</td>
              <td class="text-right">{{ group.n }}</td>
              <td class="text-right">{{ group.fixed }}</td>
              <td class="text-right">{{ group.censored }}</td>
              <td class="text-right">{{ formatNumber(group.median_days) }}</td>
            </tr>
          </tbody>
      </ChartTable>
    </template>
  </div>
</template>
