<script setup lang="ts">
import { scaleLinear } from "d3";
import { computed, ref } from "vue";

import type { KmStep } from "../experiment.entity";

import {
  AXIS_HEIGHT,
  CHART_WIDTH,
  formatNumber,
  formatShare,
  RIGHT_PADDING,
  TOP_PADDING,
} from "./chart-format";
import ChartTooltip from "./ChartTooltip.vue";

import "./experiment-chart.css";

const props = defineProps<{
  curve: KmStep[];
  median: number | null;
  /** What the chart shows, for screen readers */
  caption: string;
}>();

const PLOT_HEIGHT = 220;
const LEFT = 44;
// Extra line under the axis for its title
const height = TOP_PADDING + PLOT_HEIGHT + AXIS_HEIGHT + 14;
const bottom = TOP_PADDING + PLOT_HEIGHT;

const maxTime = computed(() =>
  Math.max(1, ...props.curve.map((step) => step.time)),
);

const x = computed(() =>
  scaleLinear()
    .domain([0, maxTime.value])
    .nice(6)
    .range([LEFT, CHART_WIDTH - RIGHT_PADDING]),
);
const y = scaleLinear().domain([0, 1]).range([bottom, TOP_PADDING]);

const xTicks = computed(() => x.value.ticks(6));
const yTicks = [0, 0.25, 0.5, 0.75, 1];

/** Flat until each step's time, then straight down to its survival. */
const path = computed(() => {
  let d = `M${x.value(0)},${y(1)}`;
  for (const step of props.curve) {
    d += `H${x.value(step.time)}V${y(step.survival)}`;
  }
  return d;
});

const censors = computed(() => props.curve.filter((step) => step.censored > 0));

/** Hover columns: each covers the days a step's survival holds. */
const columns = computed(() =>
  props.curve.map((step, i) => {
    const start = x.value(step.time);
    const next = props.curve[i + 1];
    const end = next ? x.value(next.time) : CHART_WIDTH - RIGHT_PADDING;
    return { step, x: start - 4, width: Math.max(end - start, 8) };
  }),
);

function describe(step: KmStep): string {
  const parts = [`${formatShare(step.survival)} still exposed`, `${step.at_risk} at risk`];
  if (step.events) parts.push(`${step.events} fixed`);
  if (step.censored) parts.push(`${step.censored} censored`);
  return `Day ${formatNumber(step.time)}: ${parts.join(", ")}`;
}

const hover = ref<{ x: number; y: number; text: string } | null>(null);

function show(step: KmStep): void {
  hover.value = { x: x.value(step.time), y: y(step.survival), text: describe(step) };
}

function hide(): void {
  hover.value = null;
}
</script>

<template>
  <div class="exp-viz relative max-w-[640px]">
    <svg
      :viewBox="`0 0 ${CHART_WIDTH} ${height}`"
      class="w-full h-auto"
      data-testid="survival-chart"
      tabindex="0"
      role="img"
      :aria-label="caption"
    >
      <g aria-hidden="true">
        <g v-for="tick in yTicks" :key="`y-${tick}`">
          <line
            :x1="LEFT"
            :x2="CHART_WIDTH - RIGHT_PADDING"
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
          :x="CHART_WIDTH - RIGHT_PADDING"
          :y="bottom + 34"
          text-anchor="end"
          font-size="11"
          fill="var(--viz-text-secondary)"
        >
          days exposed
        </text>

        <g v-if="median !== null" data-testid="survival-median">
          <line
            :x1="LEFT"
            :x2="x(median)"
            :y1="y(0.5)"
            :y2="y(0.5)"
            stroke="var(--viz-text-secondary)"
            stroke-width="1"
            stroke-dasharray="3 3"
          />
          <line
            :x1="x(median)"
            :x2="x(median)"
            :y1="y(0.5)"
            :y2="bottom"
            stroke="var(--viz-text-secondary)"
            stroke-width="1"
            stroke-dasharray="3 3"
          />
          <text
            :x="x(median) + 6"
            :y="y(0.5) - 6"
            font-size="11"
            fill="var(--viz-text-secondary)"
          >
            median {{ formatNumber(median) }} days
          </text>
        </g>

        <path
          data-testid="survival-curve"
          :d="path"
          fill="none"
          stroke="var(--viz-series-1)"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <!-- Censored exposures as small ticks on the curve -->
        <line
          v-for="step in censors"
          :key="`censor-${step.time}`"
          data-testid="survival-censor"
          :x1="x(step.time)"
          :x2="x(step.time)"
          :y1="y(step.survival) - 5"
          :y2="y(step.survival) + 5"
          stroke="var(--viz-series-1)"
          stroke-width="2"
          stroke-linecap="round"
        />
        <circle
          v-if="hover"
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
        :key="`hit-${column.step.time}`"
        data-testid="survival-hit"
        :x="column.x"
        :y="TOP_PADDING"
        :width="column.width"
        :height="PLOT_HEIGHT"
        fill="transparent"
        @pointerenter="show(column.step)"
        @pointerleave="hide"
      />
    </svg>

    <ChartTooltip
      v-if="hover"
      data-testid="survival-tooltip"
      :x="hover.x"
      :y="hover.y"
      :height="height"
    >{{ hover.text }}</ChartTooltip>
  </div>
</template>
