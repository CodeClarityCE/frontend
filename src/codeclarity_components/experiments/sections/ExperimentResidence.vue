<script setup lang="ts">
import { computed } from "vue";

import { excluded, type FigureCaption } from "../charts/chart-caption";
import {
  formatDays,
  formatNumber,
  formatShare,
  lagChartData,
  type LagChartRow,
  plural,
} from "../charts/chart-format";
import ChartExport from "../charts/ChartExport.vue";
import LagStripChart from "../charts/LagStripChart.vue";
import {
  type ResidenceBlock,
  type SeverityCounts,
  SeverityLabels,
} from "../experiment.entity";

const props = defineProps<{ residence: ResidenceBlock }>();

function severityLabel(key: string): string {
  return SeverityLabels[key as keyof SeverityCounts] ?? key;
}

const rows = computed<LagChartRow[]>(() =>
  props.residence.by_severity.map((group) => ({
    key: group.key,
    label: severityLabel(group.key),
    summary: group,
    lags: props.residence.points
      .filter((point) => point.severity === group.key)
      .map((point) => point.residence_days),
  })),
);

/** Residence is never negative, so the axis starts at zero. */
const domain = computed<[number, number]>(() => [
  0,
  Math.max(props.residence.overall.max ?? 0, 1),
]);

const snapshotShare = computed(() => {
  const share = props.residence.snapshot_precision_share;
  return share === null ? null : formatShare(share);
});

const counts = computed(() => {
  const r = props.residence;
  const parts = [
    `${plural(r.introductions, "introduction")}, ${r.overall.n} on or before disclosure`,
    `${r.after_disclosure.n} after it`,
  ];
  if (r.undated) parts.push(`${r.undated} without a disclosure date`);
  return `${parts.join(", ")}. ${plural(r.present_at_first_observation, "exposure")} present at the first grid date have no introduction and are left out.`;
});

const after = computed(() => {
  const n = props.residence.after_disclosure.n;
  return `${plural(n, "introduction")} adopted a version already known to be vulnerable, a median ${formatNumber(props.residence.after_disclosure.median)} days after disclosure.`;
});

const figureCaption = computed<FigureCaption>(() => {
  const r = props.residence;
  return {
    description: "Pre-disclosure residence in days by severity",
    n: `n = ${r.overall.n} introductions on or before disclosure`,
    exclusions: [
      ...excluded(
        r.after_disclosure.n,
        "introduction",
        "introductions",
        "after disclosure",
      ),
      ...excluded(
        r.undated,
        "introduction",
        "introductions",
        "without a disclosure date",
      ),
      ...excluded(
        r.present_at_first_observation,
        "exposure",
        "exposures",
        "present at the first grid date",
      ),
    ],
  };
});

function describe(row: LagChartRow, days: number): string {
  if (days === 0) return `${row.label}: introduced on the day of disclosure`;
  return `${row.label}: introduced ${formatDays(days)} before disclosure`;
}
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200 p-4 space-y-4"
    data-testid="experiment-residence"
  >
    <div>
      <h3 class="font-semibold text-gray-900">Pre-disclosure residence</h3>
      <p class="text-sm text-gray-500">
        Days a vulnerable version sat in a project before its advisory was
        published, from the introduction to the disclosure. Each dot is one
        introduction; the band spans the middle half and the tick marks the
        median.
      </p>
    </div>

    <p class="text-sm text-gray-700">
      {{ counts }}
      <template v-if="snapshotShare">
        {{ snapshotShare }} dated only to a snapshot interval, using the later
        snapshot's commit date (an upper bound, so residence may read longer).
      </template>
    </p>

    <p v-if="residence.overall.n === 0" class="text-sm text-gray-500">
      No introductions before disclosure yet.
    </p>
    <div v-else data-testid="residence-by-severity">
      <h4 class="text-sm font-medium text-gray-900 mb-1">By severity</h4>
      <ChartExport
        name="pre-disclosure-residence-by-severity"
        :data="lagChartData(rows, 'residence_days')"
        :caption="figureCaption"
      >
        <LagStripChart
          :rows="rows"
          :domain="domain"
          caption="Pre-disclosure residence in days by severity"
          zero-label="Disclosure"
          unit="introductions"
          :describe="describe"
        />
      </ChartExport>
    </div>

    <div
      v-if="residence.after_disclosure.n > 0"
      data-testid="residence-after-disclosure"
      class="text-sm"
    >
      <h4 class="font-medium text-gray-900 mb-1">After disclosure</h4>
      <p class="text-gray-700 mb-2">{{ after }}</p>
      <table class="w-full">
        <thead class="text-left text-gray-500">
          <tr>
            <th class="font-medium">Severity</th>
            <th class="font-medium text-right">Introductions</th>
            <th class="font-medium text-right">Median days after disclosure</th>
          </tr>
        </thead>
        <tbody class="text-gray-700" style="font-variant-numeric: tabular-nums">
          <tr
            v-for="group in residence.after_disclosure_by_severity"
            :key="group.key"
            data-testid="residence-after-row"
          >
            <td>{{ severityLabel(group.key) }}</td>
            <td class="text-right">{{ group.n }}</td>
            <td class="text-right">{{ formatNumber(group.median) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
