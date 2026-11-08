<script setup lang="ts">
import { line, scaleLinear } from "d3";
import { computed, ref } from "vue";

import { CHART_WIDTH, type GridLineSeries, TOP_PADDING } from "./chart-format";
import ChartTable from "./ChartTable.vue";
import ChartTooltip from "./ChartTooltip.vue";

import "./experiment-chart.css";

const props = defineProps<{
  /** One per point along x, e.g. grid dates with HEAD last */
  labels: string[];
  series: GridLineSeries[];
  /** Top of the y range before rounding */
  yMax: number;
  formatY: (value: number) => string;
  /** Y axis labels, formatY when not given */
  formatTick?: (value: number) => string;
  /** Tooltip and screen reader text of one point along x */
  describe: (index: number) => string;
  /** What the chart shows, for screen readers */
  caption: string;
  /** Header of the table's first column */
  xTitle: string;
  /** More table columns after the series, one value per label */
  extraColumns?: { label: string; values: string[] }[];
}>();

const LEFT = 44;
const PLOT_HEIGHT = 160;
const AXIS_HEIGHT = 28;
const MAX_X_TICKS = 6;
/** Past this many points only the last one gets a marker */
const MAX_MARKERS = 36;

/** Two to four series get end labels; one series is named by the title. */
const labelled = computed(
  () => props.series.length >= 2 && props.series.length <= 4,
);
const RIGHT = computed(() => (labelled.value ? 72 : 16));

const height = TOP_PADDING + PLOT_HEIGHT + AXIS_HEIGHT;
const baseline = TOP_PADDING + PLOT_HEIGHT;

const step = computed(
  () => (CHART_WIDTH - LEFT - RIGHT.value) / Math.max(props.labels.length, 1),
);

function xOf(index: number): number {
  return LEFT + step.value * (index + 0.5);
}

const y = computed(() =>
  scaleLinear()
    .domain([0, Math.max(props.yMax, 1)])
    .nice(4)
    .range([baseline, TOP_PADDING]),
);

const yTicks = computed(() => y.value.ticks(4));

/** About six evenly spaced labels, always including the last. */
const xTicks = computed(() => {
  const n = props.labels.length;
  const every = Math.max(1, Math.ceil(n / MAX_X_TICKS));
  const ticks = props.labels
    .map((_, i) => i)
    .filter((i) => i % every === 0 && n - 1 - i >= every / 2);
  return n ? [...ticks, n - 1] : [];
});

function pathOf(values: (number | null)[]): string {
  return (
    line<number | null>()
      .defined((v) => v !== null)
      .x((_, i) => xOf(i))
      .y((v) => y.value(v!))(values) ?? ""
  );
}

function markersOf(values: (number | null)[]): { i: number; v: number }[] {
  const points = values.flatMap((v, i) => (v === null ? [] : [{ i, v }]));
  return points.length > MAX_MARKERS ? points.slice(-1) : points;
}

/** End labels, nudged apart where they would touch. */
const endLabels = computed(() => {
  if (!labelled.value) return [];
  const labels = props.series.flatMap((s) => {
    const last = s.values.reduce<number>(
      (found, v, i) => (v === null ? found : i),
      -1,
    );
    if (last < 0) return [];
    return [
      {
        key: s.key,
        text: s.label,
        x: xOf(last) + 8,
        y: y.value(s.values[last]!),
      },
    ];
  });
  labels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    const prev = labels[i - 1]!;
    if (labels[i]!.y - prev.y < 12) labels[i]!.y = prev.y + 12;
  }
  return labels;
});

const active = ref<number | null>(null);

function formatCell(value: number | null): string {
  return value === null ? "-" : props.formatY(value);
}
</script>

<template>
  <div class="exp-viz relative max-w-[640px]">
    <ul
      v-if="series.length >= 2"
      class="flex flex-wrap gap-4 text-xs text-gray-600 mb-1"
    >
      <li
        v-for="s in series"
        :key="s.key"
        data-testid="line-legend-item"
        class="flex items-center gap-1"
      >
        <svg width="16" height="8" aria-hidden="true">
          <line
            x1="0"
            x2="16"
            y1="4"
            y2="4"
            :stroke="s.color"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span>{{ s.label }}</span>
      </li>
    </ul>

    <svg
      :viewBox="`0 0 ${CHART_WIDTH} ${height}`"
      class="w-full h-auto"
      role="group"
      :aria-label="caption"
    >
      <g aria-hidden="true">
        <g v-for="tick in yTicks" :key="`y-${tick}`">
          <line
            :x1="LEFT"
            :x2="CHART_WIDTH - RIGHT"
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
            {{ (formatTick ?? formatY)(tick) }}
          </text>
        </g>
        <text
          v-for="i in xTicks"
          :key="`x-${i}`"
          :x="xOf(i)"
          :y="baseline + 16"
          text-anchor="middle"
          font-size="11"
          fill="var(--viz-text-muted)"
        >
          {{ labels[i] }}
        </text>
        <line
          v-if="active !== null"
          data-testid="line-crosshair"
          :x1="xOf(active)"
          :x2="xOf(active)"
          :y1="TOP_PADDING"
          :y2="baseline"
          stroke="var(--viz-baseline)"
          stroke-width="1"
        />
        <g v-for="s in series" :key="s.key">
          <path
            data-testid="line-series"
            :d="pathOf(s.values)"
            fill="none"
            :stroke="s.color"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <circle
            v-for="m in markersOf(s.values)"
            :key="`m-${m.i}`"
            :cx="xOf(m.i)"
            :cy="y(m.v)"
            r="4"
            :fill="s.color"
            stroke="var(--viz-surface)"
            stroke-width="2"
          />
        </g>
        <text
          v-for="l in endLabels"
          :key="`end-${l.key}`"
          :x="l.x"
          :y="l.y + 4"
          font-size="11"
          fill="var(--viz-text-secondary)"
        >
          {{ l.text }}
        </text>
      </g>

      <!-- One hit target per point along x, the full plot height -->
      <rect
        v-for="(label, i) in labels"
        :key="`hit-${label}-${i}`"
        data-testid="line-column"
        :x="xOf(i) - step / 2"
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
      data-testid="line-tooltip"
      :x="xOf(active)"
      :y="TOP_PADDING + 8"
      :height="height"
      >{{ describe(active) }}</ChartTooltip
    >

    <ChartTable>
      <thead class="text-left text-gray-500">
        <tr>
          <th class="font-medium">{{ xTitle }}</th>
          <th v-for="s in series" :key="s.key" class="font-medium text-right">
            {{ s.label }}
          </th>
          <th
            v-for="c in extraColumns ?? []"
            :key="c.label"
            class="font-medium text-right"
          >
            {{ c.label }}
          </th>
        </tr>
      </thead>
      <tbody class="text-gray-700" style="font-variant-numeric: tabular-nums">
        <tr
          v-for="(label, i) in labels"
          :key="`row-${label}-${i}`"
          data-testid="line-table-row"
        >
          <td>{{ label }}</td>
          <td v-for="s in series" :key="s.key" class="text-right">
            {{ formatCell(s.values[i] ?? null) }}
          </td>
          <td v-for="c in extraColumns ?? []" :key="c.label" class="text-right">
            {{ c.values[i] }}
          </td>
        </tr>
      </tbody>
    </ChartTable>
  </div>
</template>
