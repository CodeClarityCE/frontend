<script setup lang="ts">
import { scaleLinear } from "d3";
import { computed, ref } from "vue";

import {
  AXIS_HEIGHT,
  CHART_WIDTH,
  formatNumber,
  LABEL_WIDTH,
  type LagChartRow,
  RIGHT_PADDING,
  ROW_HEIGHT,
  TOP_PADDING,
} from "./chart-format";

import "./experiment-chart.css";

const props = defineProps<{
  rows: LagChartRow[];
  /** Shared x range in days, so charts side by side compare */
  domain: [number, number];
  /** What the chart shows, for screen readers */
  caption: string;
  /** Label of the zero line */
  zeroLabel: string;
  /** Tooltip text of one dot */
  describe: (row: LagChartRow, lag: number) => string;
  /** Unit word in row summaries, e.g. "fixes" */
  unit: string;
  /** Name of the below-zero count, e.g. "before disclosure" */
  belowZero: string;
}>();

const height = computed(
  () => TOP_PADDING + props.rows.length * ROW_HEIGHT + AXIS_HEIGHT,
);

const x = computed(() =>
  scaleLinear()
    .domain(props.domain)
    .nice(6)
    .range([LABEL_WIDTH + 8, CHART_WIDTH - RIGHT_PADDING]),
);

const ticks = computed(() => x.value.ticks(6));

const zeroX = computed(() => x.value(0));

function rowY(index: number): number {
  return TOP_PADDING + index * ROW_HEIGHT + ROW_HEIGHT / 2;
}

/** A small fixed vertical spread so equal lags stay visible. */
function jitter(index: number): number {
  return (((index * 7) % 5) - 2) * 3;
}

function summaryText(row: LagChartRow): string {
  const { n, median, before_disclosure } = row.summary;
  return `${row.label}: ${n} ${props.unit}, median ${formatNumber(median)} days, ${before_disclosure} ${props.belowZero}`;
}

const hover = ref<{ x: number; y: number; text: string } | null>(null);

function show(pointX: number, pointY: number, text: string): void {
  hover.value = { x: pointX, y: pointY, text };
}

function hide(): void {
  hover.value = null;
}
</script>

<template>
  <div class="exp-viz relative">
    <svg
      :viewBox="`0 0 ${CHART_WIDTH} ${height}`"
      class="w-full h-auto"
      role="group"
      :aria-label="caption"
    >
      <g aria-hidden="true">
        <line
          v-for="tick in ticks"
          :key="`grid-${tick}`"
          :x1="x(tick)"
          :x2="x(tick)"
          :y1="TOP_PADDING"
          :y2="height - AXIS_HEIGHT"
          stroke="var(--viz-grid)"
          stroke-width="1"
        />
        <text
          v-for="tick in ticks"
          :key="`tick-${tick}`"
          :x="x(tick)"
          :y="height - AXIS_HEIGHT + 16"
          text-anchor="middle"
          font-size="11"
          fill="var(--viz-text-muted)"
          style="font-variant-numeric: tabular-nums"
        >
          {{ formatNumber(tick) }}
        </text>
        <g data-testid="lag-zero">
          <line
            :x1="zeroX"
            :x2="zeroX"
            :y1="TOP_PADDING - 6"
            :y2="height - AXIS_HEIGHT"
            stroke="var(--viz-baseline)"
            stroke-width="1"
          />
          <text
            :x="zeroX"
            :y="TOP_PADDING - 9"
            text-anchor="middle"
            font-size="11"
            fill="var(--viz-text-secondary)"
          >
            {{ zeroLabel }}
          </text>
        </g>
      </g>

      <g
        v-for="(row, index) in rows"
        :key="row.key"
        data-testid="lag-row"
        :data-key="row.key"
        tabindex="0"
        role="img"
        :aria-label="summaryText(row)"
        class="outline-none"
        @focus="show(LABEL_WIDTH, rowY(index), summaryText(row))"
        @blur="hide"
      >
        <text
          :x="0"
          :y="rowY(index) - 2"
          font-size="12"
          fill="var(--viz-text-primary)"
        >
          {{ row.label }}
        </text>
        <text
          :x="0"
          :y="rowY(index) + 12"
          font-size="11"
          fill="var(--viz-text-muted)"
        >
          n={{ row.summary.n }}, median {{ formatNumber(row.summary.median) }}
        </text>
        <!-- Interquartile range as a soft band, median as an ink tick -->
        <rect
          v-if="row.summary.p25 !== null && row.summary.p75 !== null"
          :x="x(row.summary.p25)"
          :y="rowY(index) - 3"
          :width="Math.max(x(row.summary.p75) - x(row.summary.p25), 1)"
          height="6"
          rx="3"
          fill="var(--viz-series-1-soft)"
        />
        <circle
          v-for="(lag, i) in row.lags"
          :key="`dot-${i}`"
          data-testid="lag-dot"
          :cx="x(lag)"
          :cy="rowY(index) + jitter(i)"
          r="4"
          fill="var(--viz-series-1)"
          stroke="var(--viz-surface)"
          stroke-width="2"
        />
        <line
          v-if="row.summary.median !== null"
          :x1="x(row.summary.median)"
          :x2="x(row.summary.median)"
          :y1="rowY(index) - 9"
          :y2="rowY(index) + 9"
          stroke="var(--viz-text-primary)"
          stroke-width="2"
          stroke-linecap="round"
        />
        <!-- Hit targets larger than the dots -->
        <circle
          v-for="(lag, i) in row.lags"
          :key="`hit-${i}`"
          data-testid="lag-hit"
          :cx="x(lag)"
          :cy="rowY(index) + jitter(i)"
          r="8"
          fill="transparent"
          @pointerenter="show(x(lag), rowY(index) + jitter(i), describe(row, lag))"
          @pointerleave="hide"
        />
      </g>
    </svg>

    <div
      v-if="hover"
      data-testid="lag-tooltip"
      class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 shadow-sm whitespace-nowrap dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
      :style="{
        left: `${(hover.x / CHART_WIDTH) * 100}%`,
        top: `calc(${(hover.y / height) * 100}% - 8px)`,
      }"
    >{{ hover.text }}</div>

    <details class="mt-2 text-sm">
      <summary class="cursor-pointer text-gray-500">Show table</summary>
      <table class="w-full mt-2">
        <thead class="text-left text-gray-500">
          <tr>
            <th class="font-medium">Group</th>
            <th class="font-medium text-right">{{ unit }}</th>
            <th class="font-medium text-right">Median days</th>
            <th class="font-medium text-right">25th pct.</th>
            <th class="font-medium text-right">75th pct.</th>
            <th class="font-medium text-right">{{ belowZero }}</th>
          </tr>
        </thead>
        <tbody class="text-gray-700" style="font-variant-numeric: tabular-nums">
          <tr v-for="row in rows" :key="row.key" data-testid="lag-table-row">
            <td>{{ row.label }}</td>
            <td class="text-right">{{ row.summary.n }}</td>
            <td class="text-right">{{ formatNumber(row.summary.median) }}</td>
            <td class="text-right">{{ formatNumber(row.summary.p25) }}</td>
            <td class="text-right">{{ formatNumber(row.summary.p75) }}</td>
            <td class="text-right">{{ row.summary.before_disclosure }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>
