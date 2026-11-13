<script setup lang="ts">
import { line, scaleLinear, scalePoint } from "d3";
import { computed, ref } from "vue";

import {
  AXIS_HEIGHT,
  formatNumber,
  plural,
  RIGHT_PADDING,
  TOP_PADDING,
  xTickCount,
} from "@/base_components/charts/chart-format";
import { useChartWidth } from "@/base_components/charts/chart-layout";
import ChartTable from "@/base_components/charts/ChartTable.vue";
import ChartTooltip from "@/base_components/charts/ChartTooltip.vue";

import type { LoadRow } from "../experiment.entity";

import "@/base_components/charts/chart.css";

const props = defineProps<{
  rows: LoadRow[];
  /** What the chart shows, for screen readers */
  caption: string;
}>();

const chartWidth = useChartWidth();

const HEIGHT = 240;
const Y_LABEL_WIDTH = 44;
/** Above this many grid dates, only isolated points get a marker */
const MAX_MARKED_POINTS = 40;

const SERIES = [
  { key: "hindsight", label: "Hindsight", color: "var(--viz-series-1)" },
  { key: "as_of", label: "As-of", color: "var(--viz-series-2)" },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];

const keys = computed(() => props.rows.map((row) => row.grid_date ?? "HEAD"));

const x = computed(() =>
  scalePoint<string>()
    .domain(keys.value)
    .range([Y_LABEL_WIDTH + 8, chartWidth.value - RIGHT_PADDING])
    .padding(0.5),
);

const plotBottom = HEIGHT - AXIS_HEIGHT;

const y = computed(() => {
  const max = Math.max(1, ...props.rows.map((row) => row.hindsight ?? 0));
  return scaleLinear()
    .domain([0, max])
    .nice(4)
    .range([plotBottom, TOP_PADDING]);
});

const yTicks = computed(() => y.value.ticks(4).filter(Number.isInteger));

/** Thin the date labels so they never collide; HEAD is always labelled. */
const xLabels = computed(() => {
  const n = keys.value.length;
  const every = Math.max(1, Math.ceil(n / xTickCount(chartWidth.value)));
  return keys.value.filter(
    (key, i) => key === "HEAD" || (i % every === 0 && n - 1 - i >= every / 2),
  );
});

function xOf(index: number): number {
  return x.value(keys.value[index]!) ?? 0;
}

function valueOf(row: LoadRow, key: SeriesKey): number | null {
  return row[key];
}

function pathOf(key: SeriesKey): string {
  const draw = line<LoadRow>()
    .defined((row) => valueOf(row, key) !== null)
    .x((_, i) => xOf(i))
    .y((row) => y.value(valueOf(row, key) ?? 0));
  return draw(props.rows) ?? "";
}

/** Points to mark: all of them on short grids, else those a line cannot show. */
function pointsOf(key: SeriesKey): { index: number; value: number }[] {
  const all = props.rows.length <= MAX_MARKED_POINTS;
  return props.rows.flatMap((row, index) => {
    const value = valueOf(row, key);
    if (value === null) return [];
    const isolated =
      (index === 0 || valueOf(props.rows[index - 1]!, key) === null) &&
      (index === props.rows.length - 1 ||
        valueOf(props.rows[index + 1]!, key) === null);
    return all || isolated ? [{ index, value }] : [];
  });
}

/** The gap between neighbouring dates, so columns tile the plot. */
const columnWidth = computed(() => x.value.step());

function labelOf(row: LoadRow): string {
  return row.grid_date ?? "HEAD";
}

function describe(row: LoadRow): string {
  if (row.hindsight === null || row.as_of === null)
    return `${labelOf(row)}: no done snapshot`;
  const projects = plural(row.projects, "project");
  return `${labelOf(row)}: hindsight ${formatNumber(row.hindsight)}, as-of ${formatNumber(row.as_of)}, ${projects}`;
}

const hover = ref<number | null>(null);

/** Anchor the tooltip so it stays inside the chart near either edge. */
const tooltipShift = computed(() => {
  if (hover.value === null) return "-50%";
  const share = xOf(hover.value) / chartWidth.value;
  if (share < 0.25) return "-10%";
  return share > 0.75 ? "-90%" : "-50%";
});

const tooltipY = computed(() => {
  if (hover.value === null) return 0;
  const row = props.rows[hover.value]!;
  return y.value(row.hindsight ?? 0);
});
</script>

<template>
  <div class="chart-viz max-w-[640px]">
    <ul
      data-export-legend
      class="flex gap-4 text-xs text-foreground mb-1"
      aria-hidden="true"
    >
      <li
        v-for="series in SERIES"
        :key="series.key"
        data-testid="load-legend-item"
        class="flex items-center gap-1"
      >
        <svg width="16" height="8">
          <line
            x1="1"
            x2="15"
            y1="4"
            y2="4"
            :stroke="series.color"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span>{{ series.label }}</span>
      </li>
    </ul>

    <div class="relative">
      <svg
        :viewBox="`0 0 ${chartWidth} ${HEIGHT}`"
        class="w-full h-auto"
        role="group"
        :aria-label="caption"
      >
        <g aria-hidden="true">
          <g v-for="tick in yTicks" :key="`y-${tick}`">
            <line
              :x1="Y_LABEL_WIDTH"
              :x2="chartWidth - RIGHT_PADDING"
              :y1="y(tick)"
              :y2="y(tick)"
              :stroke="tick === 0 ? 'var(--viz-baseline)' : 'var(--viz-grid)'"
              stroke-width="1"
            />
            <text
              :x="Y_LABEL_WIDTH - 6"
              :y="y(tick) + 4"
              text-anchor="end"
              font-size="11"
              fill="var(--viz-text-muted)"
              style="font-variant-numeric: tabular-nums"
            >
              {{ formatNumber(tick) }}
            </text>
          </g>
          <text
            v-for="key in xLabels"
            :key="`x-${key}`"
            :x="x(key)"
            :y="plotBottom + 16"
            text-anchor="middle"
            font-size="11"
            fill="var(--viz-text-muted)"
          >
            {{ key }}
          </text>
          <line
            v-if="hover !== null"
            data-testid="load-crosshair"
            data-export-omit
            :x1="xOf(hover)"
            :x2="xOf(hover)"
            :y1="TOP_PADDING"
            :y2="plotBottom"
            stroke="var(--viz-baseline)"
            stroke-width="1"
          />
        </g>

        <g
          v-for="series in SERIES"
          :key="series.key"
          data-testid="load-series"
          :data-key="series.key"
          aria-hidden="true"
        >
          <path
            :d="pathOf(series.key)"
            fill="none"
            :stroke="series.color"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <circle
            v-for="point in pointsOf(series.key)"
            :key="`p-${point.index}`"
            data-testid="load-point"
            :cx="xOf(point.index)"
            :cy="y(point.value)"
            r="4"
            :fill="series.color"
            stroke="var(--viz-surface)"
            stroke-width="2"
          />
        </g>

        <!-- One column per grid date: the hover and focus target -->
        <rect
          v-for="(row, index) in rows"
          :key="`col-${labelOf(row)}`"
          data-testid="load-column"
          data-export-omit
          :x="xOf(index) - columnWidth / 2"
          :y="TOP_PADDING"
          :width="columnWidth"
          :height="plotBottom - TOP_PADDING"
          fill="transparent"
          tabindex="0"
          role="img"
          :aria-label="describe(row)"
          class="outline-none"
          @pointerenter="hover = index"
          @pointerleave="hover = null"
          @focus="hover = index"
          @blur="hover = null"
        />
      </svg>

      <ChartTooltip
        v-if="hover !== null"
        data-testid="load-tooltip"
        :x="xOf(hover)"
        :y="tooltipY"
        :height="HEIGHT"
        :shift="tooltipShift"
        >{{ describe(rows[hover]!) }}</ChartTooltip
      >
    </div>

    <ChartTable>
      <thead class="text-left text-muted-foreground">
        <tr>
          <th class="font-medium">Grid date</th>
          <th class="font-medium text-right">Projects</th>
          <th class="font-medium text-right">Hindsight</th>
          <th class="font-medium text-right">As-of</th>
          <th class="font-medium text-right">Undated</th>
        </tr>
      </thead>
      <tbody class="text-foreground" style="font-variant-numeric: tabular-nums">
        <tr
          v-for="row in rows"
          :key="labelOf(row)"
          data-testid="load-table-row"
        >
          <td>
            {{
              row.grid_date ??
              (row.as_of_date ? `HEAD (as of ${row.as_of_date})` : "HEAD")
            }}
          </td>
          <td class="text-right">{{ row.projects }}</td>
          <td class="text-right">{{ formatNumber(row.hindsight) }}</td>
          <td class="text-right">{{ formatNumber(row.as_of) }}</td>
          <td class="text-right">{{ row.undated }}</td>
        </tr>
      </tbody>
    </ChartTable>
  </div>
</template>
