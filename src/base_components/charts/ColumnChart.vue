<script setup lang="ts">
import { scaleLinear } from "d3";
import { computed, ref } from "vue";

import {
  type GridLineSeries,
  insideX,
  LABEL_GAP,
  labelWidth,
  TOP_PADDING,
  xTickCount,
} from "./chart-format";
import { useChartWidth } from "./chart-layout";
import ChartTable from "./ChartTable.vue";
import ChartTooltip from "./ChartTooltip.vue";

import "./chart.css";

const props = defineProps<{
  /** One per group of columns along x */
  labels: string[];
  series: GridLineSeries[];
  /** Top of the y range before rounding */
  yMax: number;
  formatY: (value: number) => string;
  /** Tooltip and screen reader text of one group */
  describe: (index: number) => string;
  /** What the chart shows, for screen readers */
  caption: string;
  /** Header of the table's first column */
  xTitle: string;
  /** Counts: y labels only at whole numbers */
  integer?: boolean;
  /** One column per group with the series on top of each other, the first at the bottom */
  stacked?: boolean;
}>();

const chartWidth = useChartWidth();

const LEFT = 44;
const RIGHT = 16;
const PLOT_HEIGHT = 160;
const AXIS_HEIGHT = 28;
const MAX_BAR_WIDTH = 24;
/** The surface gap between neighbouring bars */
const BAR_GAP = 2;
const TIP_RADIUS = 4;

const height = TOP_PADDING + PLOT_HEIGHT + AXIS_HEIGHT;
const baseline = TOP_PADDING + PLOT_HEIGHT;

const step = computed(
  () => (chartWidth.value - LEFT - RIGHT) / Math.max(props.labels.length, 1),
);

const barWidth = computed(() => {
  const count = props.stacked ? 1 : Math.max(props.series.length, 1);
  const room = (step.value * 0.8 - BAR_GAP * (count - 1)) / count;
  return Math.max(1, Math.min(MAX_BAR_WIDTH, room));
});

const y = computed(() =>
  scaleLinear()
    .domain([0, Math.max(props.yMax, 1)])
    .nice(4)
    .range([baseline, TOP_PADDING]),
);

const yTicks = computed(() =>
  y.value.ticks(4).filter((tick) => !props.integer || Number.isInteger(tick)),
);

/** How many steps along x the widest label needs to stay clear of the next */
const labelSteps = computed(
  () =>
    (Math.max(0, ...props.labels.map(labelWidth)) + LABEL_GAP) /
    Math.max(step.value, 1),
);

/** Evenly spaced labels, as many as the width fits. */
const xTicks = computed(() => {
  const every = Math.max(
    1,
    Math.ceil(props.labels.length / xTickCount(chartWidth.value)),
    Math.ceil(labelSteps.value),
  );
  return props.labels.map((_, i) => i).filter((i) => i % every === 0);
});

function groupStart(index: number): number {
  const count = props.stacked ? 1 : props.series.length;
  const width = count * barWidth.value + (count - 1) * BAR_GAP;
  return LEFT + step.value * (index + 0.5) - width / 2;
}

function xOf(index: number): number {
  return LEFT + step.value * (index + 0.5);
}

/** A column from `from` up to `to`, rounded at its tip unless `square`. */
function barPath(
  groupIndex: number,
  seriesIndex: number,
  to: number,
  from = 0,
  square = false,
): string {
  const left =
    groupStart(groupIndex) + seriesIndex * (barWidth.value + BAR_GAP);
  const right = left + barWidth.value;
  const bottom = y.value(from);
  // Stacked segments keep a 1px surface gap to the one above.
  const top = square ? Math.min(bottom, y.value(to) + 1) : y.value(to);
  const radius = square
    ? 0
    : Math.min(TIP_RADIUS, barWidth.value / 2, bottom - top);
  return [
    `M${left},${bottom}`,
    `V${top + radius}`,
    `Q${left},${top} ${left + radius},${top}`,
    `H${right - radius}`,
    `Q${right},${top} ${right},${top + radius}`,
    `V${bottom}`,
    "Z",
  ].join("");
}

// Stacked: each segment starts where the series below it ends.
function stackedBars(): {
  key: string;
  color: string;
  stroke: string | undefined;
  d: string;
}[] {
  return props.labels.flatMap((_, groupIndex) => {
    const values = props.series.map((s) => s.values[groupIndex] ?? 0);
    const topmost = values.reduce(
      (last, value, index) => (value > 0 ? index : last),
      -1,
    );
    let below = 0;
    return props.series.flatMap((series, seriesIndex) => {
      const value = values[seriesIndex]!;
      if (value <= 0) return [];
      const from = below;
      below += value;
      return [
        {
          key: `${series.key}-${groupIndex}`,
          color: series.colors?.[groupIndex] ?? series.color,
          stroke: series.strokes?.[groupIndex],
          d: barPath(groupIndex, 0, below, from, seriesIndex !== topmost),
        },
      ];
    });
  });
}

const bars = computed(() =>
  props.stacked
    ? stackedBars()
    : props.series.flatMap((series, seriesIndex) =>
        series.values.flatMap((value, groupIndex) =>
          value === null
            ? []
            : [
                {
                  key: `${series.key}-${groupIndex}`,
                  color: series.colors?.[groupIndex] ?? series.color,
                  stroke: series.strokes?.[groupIndex],
                  d: barPath(groupIndex, seriesIndex, value),
                },
              ],
        ),
      ),
);

/** 95% interval of each bar, drawn over its centre. */
const errorBars = computed(() =>
  props.series.flatMap((series, seriesIndex) =>
    series.values.flatMap((_, groupIndex) => {
      const low = series.lower?.[groupIndex] ?? null;
      const high = series.upper?.[groupIndex] ?? null;
      if (low === null || high === null) return [];
      const x =
        groupStart(groupIndex) +
        seriesIndex * (barWidth.value + BAR_GAP) +
        barWidth.value / 2;
      return [{ key: `err-${series.key}-${groupIndex}`, x, low, high }];
    }),
  ),
);

const active = ref<number | null>(null);

function formatCell(value: number | null): string {
  return value === null ? "-" : props.formatY(value);
}
</script>

<template>
  <div class="chart-viz relative max-w-[640px]">
    <ul
      v-if="series.length >= 2"
      data-export-legend
      class="flex flex-wrap gap-4 text-xs text-muted-foreground mb-1"
    >
      <li
        v-for="s in series"
        :key="s.key"
        data-testid="bar-legend-item"
        class="flex items-center gap-1"
      >
        <svg width="10" height="10" aria-hidden="true">
          <rect width="10" height="10" rx="2" :fill="s.color" />
        </svg>
        <span>{{ s.label }}</span>
      </li>
    </ul>

    <svg
      :viewBox="`0 0 ${chartWidth} ${height}`"
      class="w-full h-auto"
      role="group"
      :aria-label="caption"
    >
      <g aria-hidden="true">
        <g v-for="tick in yTicks" :key="`y-${tick}`">
          <line
            :x1="LEFT"
            :x2="chartWidth - RIGHT"
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
            {{ formatY(tick) }}
          </text>
        </g>
        <text
          v-for="i in xTicks"
          :key="`x-${i}`"
          :x="insideX(xOf(i), labels[i] ?? '', chartWidth)"
          :y="baseline + 16"
          text-anchor="middle"
          font-size="11"
          fill="var(--viz-text-muted)"
        >
          {{ labels[i] }}
        </text>
        <path
          v-for="bar in bars"
          :key="bar.key"
          data-testid="figure-bar"
          :d="bar.d"
          :fill="bar.color"
          :stroke="bar.stroke"
          :stroke-width="bar.stroke ? 1 : undefined"
        />
        <g
          v-for="bar in errorBars"
          :key="bar.key"
          data-testid="figure-error-bar"
          stroke="var(--viz-text-secondary)"
          stroke-width="1"
        >
          <line :x1="bar.x" :x2="bar.x" :y1="y(bar.low)" :y2="y(bar.high)" />
          <line
            :x1="bar.x - 3"
            :x2="bar.x + 3"
            :y1="y(bar.low)"
            :y2="y(bar.low)"
          />
          <line
            :x1="bar.x - 3"
            :x2="bar.x + 3"
            :y1="y(bar.high)"
            :y2="y(bar.high)"
          />
        </g>
      </g>

      <!-- One hit target per group, the full plot height -->
      <rect
        v-for="(label, i) in labels"
        :key="`hit-${label}-${i}`"
        data-export-omit
        data-testid="bar-column"
        :x="LEFT + step * i"
        :y="TOP_PADDING"
        :width="step"
        :height="PLOT_HEIGHT"
        fill="transparent"
        tabindex="0"
        role="img"
        :aria-label="describe(i)"
        class="outline-none"
        @pointerenter="active = i"
        @pointerleave="active = null"
        @focus="active = i"
        @blur="active = null"
      />
    </svg>

    <ChartTooltip
      v-if="active !== null"
      :x="xOf(active)"
      :y="TOP_PADDING + 8"
      :height="height"
      >{{ describe(active) }}</ChartTooltip
    >

    <ChartTable>
      <thead class="text-left text-muted-foreground">
        <tr>
          <th class="font-medium">{{ xTitle }}</th>
          <th v-for="s in series" :key="s.key" class="font-medium text-right">
            {{ s.label }}
          </th>
        </tr>
      </thead>
      <tbody class="text-foreground" style="font-variant-numeric: tabular-nums">
        <tr v-for="(label, i) in labels" :key="`row-${label}-${i}`">
          <td>{{ label }}</td>
          <td v-for="s in series" :key="s.key" class="text-right">
            {{ formatCell(s.values[i] ?? null) }}
          </td>
        </tr>
      </tbody>
    </ChartTable>
  </div>
</template>
