<script setup lang="ts">
import { computed, useId } from "vue";

import type { ChartCaption } from "@/base_components/charts/chart-caption";
import {
  formatBracketInterval,
  formatDays,
  formatNumber,
  formatShareWithInterval,
  plural,
} from "@/base_components/charts/chart-format";
import ChartExport from "@/base_components/charts/ChartExport.vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

import { excluded } from "../charts/experiment-caption";
import { lagChartData, type LagChartRow } from "../charts/experiment-format";
import LagStripChart from "../charts/LagStripChart.vue";
import OpenAsFigure from "../charts/OpenAsFigure.vue";
import {
  type ConfidenceInterval,
  type ResidenceBlock,
  type ResultIntervals,
  type SeverityCounts,
  SeverityLabels,
} from "../experiment.entity";

const props = defineProps<{
  residence: ResidenceBlock;
  intervals?: ResultIntervals["residence"] | null;
  snapshotInterval?: ConfidenceInterval | null | undefined;
}>();

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
    interval: props.intervals?.by_severity[group.key] ?? null,
  })),
);

/** Residence is never negative, so the axis starts at zero. */
const domain = computed<[number, number]>(() => [
  0,
  Math.max(props.residence.overall.max ?? 0, 1),
]);

const snapshotShare = computed(() => {
  const share = props.residence.snapshot_precision_share;
  return share === null
    ? null
    : formatShareWithInterval(share, props.snapshotInterval);
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

const figureCaption = computed<ChartCaption>(() => {
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

const headingId = useId();
</script>

<template>
  <section
    class="flex flex-col gap-4 rounded-card border bg-card p-4 text-card-foreground shadow-card"
    :aria-labelledby="headingId"
    data-testid="experiment-residence"
  >
    <div>
      <h3 :id="headingId" class="font-semibold text-foreground-strong">
        Pre-disclosure residence
      </h3>
      <p class="text-sm text-muted-foreground">
        Days a vulnerable version sat in a project before its advisory was
        published, from the introduction to the disclosure. Each dot is one
        introduction; the band spans the middle half and the tick marks the
        median.
      </p>
    </div>

    <p class="text-sm text-foreground">
      {{ counts }}
      <template v-if="snapshotShare">
        {{ snapshotShare }} dated only to a snapshot interval, using the later
        snapshot's commit date (an upper bound, so residence may read longer).
      </template>
    </p>

    <p v-if="residence.overall.n === 0" class="text-sm text-muted-foreground">
      No introductions before disclosure yet.
    </p>
    <div v-else data-testid="residence-by-severity">
      <h4 class="text-sm font-medium text-foreground-strong mb-1">
        By severity
      </h4>
      <OpenAsFigure
        :definition="{
          metric: 'residence',
          chart_form: 'quartiles',
          group_by: 'severity',
          filters: {},
        }"
      />
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
      <h4 class="font-medium text-foreground-strong mb-1">After disclosure</h4>
      <p class="text-foreground mb-2">{{ after }}</p>
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead>Severity</TableHead>
            <TableHead class="text-right">Introductions</TableHead>
            <TableHead class="text-right"
              >Median days after disclosure</TableHead
            >
            <TableHead v-if="intervals" class="text-right">95% CI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="tabular-nums">
          <TableRow
            v-for="group in residence.after_disclosure_by_severity"
            :key="group.key"
            data-testid="residence-after-row"
          >
            <TableCell>{{ severityLabel(group.key) }}</TableCell>
            <TableCell class="text-right">{{ group.n }}</TableCell>
            <TableCell class="text-right">{{
              formatNumber(group.median)
            }}</TableCell>
            <TableCell v-if="intervals" class="text-right">
              {{
                formatBracketInterval(
                  intervals.after_disclosure_by_severity[group.key],
                )
              }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </section>
</template>
