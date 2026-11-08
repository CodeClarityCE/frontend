<script setup lang="ts">
import { scaleLinear } from "d3";
import { computed, ref } from "vue";

import {
  AXIS_HEIGHT,
  CHART_WIDTH,
  formatNumber,
  formatShare,
  type StepSeries,
  TOP_PADDING,
} from "./chart-format";
import ChartTable from "./ChartTable.vue";
import ChartTooltip from "./ChartTooltip.vue";

import "./experiment-chart.css";

const props = defineProps<{
  /** Days along x, as text, ascending */
  labels: string[];
  series: StepSeries[];
  /** What the chart shows, for screen readers */
  caption: string;
  xTitle: string;
}>();

const LEFT = 44;
const PLOT_HEIGHT = 220;
const yTicks = [0, 0.25, 0.5, 0.75, 1];
// Extra line under the axis for its title
const height = TOP_PADDING + PLOT_HEIGHT + AXIS_HEIGHT + 14;
const bottom = TOP_PADDING + PLOT_HEIGHT;

/** Two to four curves get end labels; one is named by the title. */
const labelled = computed(
  () => props.series.length >= 2 && props.series.length <= 4,
);
const right = computed(() => CHART_WIDTH - (labelled.value ? 72 : 16));

const times = computed(() => props.labels.map(Number));

const x = computed(() =>
  scaleLinear()
    .domain([
      Math.min(0, times.value[0] ?? 0),
      Math.max(1, times.value.at(-1) ?? 1),
    ])
    .nice(6)
    .range([LEFT, right.value]),
);
const y = scaleLinear().domain([0, 1]).range([bottom, TOP_PADDING]);

const xTicks = computed(() => x.value.ticks(6));
const start = computed(() => x.value.domain()[0]!);

/** Indexes of the points a curve reaches; it stops at its last step. */
function pointsOf(series: StepSeries): number[] {
  return series.values.flatMap((value, i) => (value === null ? [] : [i]));
}

/** Flat until each point's time, then straight down to its value. */
function curvePath(series: StepSeries): string {
  let d = `M${x.value(start.value)},${y(1)}`;
  for (const i of pointsOf(series)) {
    d += `H${x.value(times.value[i]!)}V${y(series.values[i]!)}`;
  }
  return d;
}

/** The confidence band: upper edge out, lower edge back, both stepped. */
function bandPath(series: StepSeries): string {
  const points = pointsOf(series);
  if (points.length === 0) return "";
  let d = `M${x.value(start.value)},${y(1)}`;
  for (const i of points) {
    d += `H${x.value(times.value[i]!)}V${y(series.upper[i]!)}`;
  }
  d += `V${y(series.lower[points.at(-1)!]!)}`;
  for (let p = points.length - 1; p >= 0; p--) {
    const before = points[p - 1];
    const lower = before === undefined ? 1 : series.lower[before]!;
    d += `H${x.value(times.value[points[p]!]!)}V${y(lower)}`;
  }
  return `${d}H${x.value(start.value)}Z`;
}

function censorsOf(series: StepSeries): number[] {
  return pointsOf(series).filter((i) => series.censored[i]! > 0);
}

/** End labels, nudged apart where they would touch. */
const endLabels = computed(() => {
  if (!labelled.value) return [];
  const labels = props.series.flatMap((series) => {
    const last = pointsOf(series).at(-1);
    if (last === undefined) return [];
    return [
      {
        key: series.key,
        text: series.label,
        x: x.value(times.value[last]!) + 8,
        y: y(series.values[last]!),
      },
    ];
  });
  labels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    const previous = labels[i - 1]!;
    if (labels[i]!.y - previous.y < 12) labels[i]!.y = previous.y + 12;
  }
  return labels;
});

/** Hover columns: each covers the days a point's value holds. */
const columns = computed(() =>
  times.value.map((time, index) => {
    const from = x.value(time);
    const next = times.value[index + 1];
    const to = next === undefined ? right.value : x.value(next);
    return { index, x: from - 4, width: Math.max(to - from, 8) };
  }),
);

function cell(value: number | null): string {
  return value === null ? "-" : formatShare(value);
}

function describe(index: number): string {
  const values = props.series
    .map((series) => `${series.label} ${cell(series.values[index]!)}`)
    .join(", ");
  return `Day ${formatNumber(times.value[index]!)}: ${values}`;
}

const hover = ref<{ x: number; y: number; text: string } | null>(null);

function show(index: number): void {
  const value = props.series.find((s) => s.values[index] !== null)?.values[
    index
  ];
  hover.value = {
    x: x.value(times.value[index]!),
    y: y(value ?? 1),
    text: describe(index),
  };
}
</script>

<template>
  <div class="exp-viz relative max-w-[640px]">
    <ul
      v-if="series.length >= 2"
      class="flex flex-wrap gap-4 text-xs text-gray-600 mb-1"
    >
      <li v-for="s in series" :key="s.key" class="flex items-center gap-1">
        <svg width="16" height="8" aria-hidden="true">
          <line
            x1="0"
            x2="16"
            y1="4"
            y2="4"
            :stroke="s.color"
            stroke-width="2"
          />
        </svg>
        <span>{{ s.label }}</span>
      </li>
    </ul>

    <svg
      :viewBox="`0 0 ${CHART_WIDTH} ${height}`"
      class="w-full h-auto"
      tabindex="0"
      role="img"
      :aria-label="caption"
    >
      <g aria-hidden="true">
        <g v-for="tick in yTicks" :key="`y-${tick}`">
          <line
            :x1="LEFT"
            :x2="right"
            :y1="y(tick)"
            :y2="y(tick)"
            :stroke="tick === 0 ? 'var(--viz-baseline)' : 'var(--viz-grid)'"
            stroke-width="1"
          />
          <text
            :x="LEFT - 6"
            :y="y(tick) + 4"
            text-anchor="end"
            font-size="11"
            fill="var(--viz-text-muted)"
            style="font-variant-numeric: tabular-nums"
          >
            {{ tick * 100 }}%
          </text>
        </g>
        <text
          v-for="tick in xTicks"
          :key="`x-${tick}`"
          :x="x(tick)"
          :y="bottom + 16"
          text-anchor="middle"
          font-size="11"
          fill="var(--viz-text-muted)"
          style="font-variant-numeric: tabular-nums"
        >
          {{ formatNumber(tick) }}
        </text>
        <text
          :x="right"
          :y="bottom + 34"
          text-anchor="end"
          font-size="11"
          fill="var(--viz-text-secondary)"
        >
          {{ xTitle }}
        </text>

        <path
          v-for="s in series"
          :key="`band-${s.key}`"
          data-testid="step-band"
          :d="bandPath(s)"
          :fill="s.color"
          fill-opacity="0.15"
          stroke="none"
        />
        <g v-for="s in series" :key="s.key">
          <path
            data-testid="step-curve"
            :d="curvePath(s)"
            fill="none"
            :stroke="s.color"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <!-- Censored exposures as small ticks on the curve -->
          <line
            v-for="i in censorsOf(s)"
            :key="`censor-${i}`"
            data-testid="step-censor"
            :x1="x(times[i]!)"
            :x2="x(times[i]!)"
            :y1="y(s.values[i]!) - 5"
            :y2="y(s.values[i]!) + 5"
            :stroke="s.color"
            stroke-width="2"
            stroke-linecap="round"
          />
        </g>
        <text
          v-for="label in endLabels"
          :key="`end-${label.key}`"
          :x="label.x"
          :y="label.y + 4"
          font-size="11"
          fill="var(--viz-text-secondary)"
        >
          {{ label.text }}
        </text>
        <circle
          v-if="hover"
          data-export-omit
          :cx="hover.x"
          :cy="hover.y"
          r="4"
          fill="var(--viz-series-1)"
          stroke="var(--viz-surface)"
          stroke-width="2"
        />
      </g>

      <rect
        v-for="column in columns"
        :key="`hit-${column.index}`"
        data-export-omit
        :x="column.x"
        :y="TOP_PADDING"
        :width="column.width"
        :height="PLOT_HEIGHT"
        fill="transparent"
        @pointerenter="show(column.index)"
        @pointerleave="hover = null"
      />
    </svg>

    <ChartTooltip v-if="hover" :x="hover.x" :y="hover.y" :height="height">{{
      hover.text
    }}</ChartTooltip>

    <ChartTable>
      <thead class="text-left text-gray-500">
        <tr>
          <th class="font-medium">{{ xTitle }}</th>
          <th v-for="s in series" :key="s.key" class="font-medium text-right">
            {{ s.label }} (95% CI)
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(label, i) in labels" :key="label">
          <td>{{ label }}</td>
          <td v-for="s in series" :key="s.key" class="text-right tabular-nums">
            {{ cell(s.values[i]!) }} ({{ cell(s.lower[i]!) }} to
            {{ cell(s.upper[i]!) }})
          </td>
        </tr>
      </tbody>
    </ChartTable>
  </div>
</template>
