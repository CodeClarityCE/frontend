/** Shared formatting and layout for experiment charts. */
import type { ConfidenceInterval, LagSummary } from "../experiment.entity";

import type { ChartData } from "./chart-export";

/** One row of a lag strip chart: a group's lags and their summary. */
export interface LagChartRow {
  key: string;
  label: string;
  /** The below-zero count is left out when a chart has none */
  summary: Omit<LagSummary, "before_disclosure"> & {
    before_disclosure?: number;
  };
  lags: number[];
}

/** One line of a grid line chart; null values leave a gap. */
export interface GridLineSeries {
  key: string;
  label: string;
  values: (number | null)[];
  /** A role token from experiment-chart.css, e.g. "var(--viz-series-1)" */
  color: string;
}

/** One Kaplan-Meier curve of a Figure, with its band and censoring. */
export interface StepSeries extends GridLineSeries {
  lower: (number | null)[];
  upper: (number | null)[];
  censored: number[];
}

/** viewBox width; charts scale to their container */
export const CHART_WIDTH = 640;
/** Left column for row labels */
export const LABEL_WIDTH = 150;
export const ROW_HEIGHT = 40;
export const AXIS_HEIGHT = 28;
export const TOP_PADDING = 20;
export const RIGHT_PADDING = 16;

/** How many x labels fit: fewer when laid out for a single column. */
export function xTickCount(width: number): number {
  return width < CHART_WIDTH ? 3 : 6;
}

/** Whole numbers as is, others with one decimal. */
export function formatNumber(value: number | null): string {
  if (value === null) return "-";
  return Number.isInteger(value)
    ? value.toLocaleString("en-US")
    : value.toFixed(1);
}

/** "1 day" or "N days". */
export function formatDays(days: number): string {
  const abs = Math.abs(days);
  return `${formatNumber(abs)} ${abs === 1 ? "day" : "days"}`;
}

/** "1 fix" or "N fixes": the count with its word. */
export function plural(n: number, word: string, many = `${word}s`): string {
  return `${formatNumber(n)} ${n === 1 ? word : many}`;
}

/** A share as a percentage with one decimal. */
export function formatShare(share: number | null): string {
  return share === null ? "-" : `${(share * 100).toFixed(1)}%`;
}

/** The dots of a lag chart with the summary drawn over them, one row per dot. */
export function lagChartData(
  rows: LagChartRow[],
  valueColumn: string,
): ChartData {
  return {
    columns: [
      "group",
      valueColumn,
      "group_n",
      "group_median",
      "group_p25",
      "group_p75",
    ],
    rows: rows.flatMap((row) =>
      row.lags.map((lag) => [
        row.label,
        lag,
        row.summary.n,
        row.summary.median,
        row.summary.p25,
        row.summary.p75,
      ]),
    ),
  };
}

/** The lines of a grid chart, one row per point along x. */
export function gridLineData(
  xTitle: string,
  labels: string[],
  series: GridLineSeries[],
): ChartData {
  return {
    columns: [xTitle, ...series.map((s) => s.label)],
    rows: labels.map((label, i) => [
      label,
      ...series.map((s) => s.values[i] ?? null),
    ]),
  };
}

/** An interval as "low to high", a dash when there is none. */
export function formatInterval(interval: ConfidenceInterval | null): string {
  return interval === null
    ? "-"
    : `${formatShare(interval.low)} to ${formatShare(interval.high)}`;
}

/** A share followed by its 95% interval, when it has one. */
export function formatShareWithInterval(
  share: number | null,
  interval: ConfidenceInterval | null | undefined,
): string {
  return interval
    ? `${formatShare(share)} (95% CI ${formatInterval(interval)})`
    : formatShare(share);
}

/** A p-value for reading: below 0.001 it is not shown as a rounded zero. */
export function formatPValue(p: number | null): string {
  if (p === null) return "p = -";
  return p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`;
}
