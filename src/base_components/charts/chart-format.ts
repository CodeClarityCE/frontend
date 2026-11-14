/** Shared formatting and layout for charts. */
import type { ChartData } from "./chart-export";

/** A low to high range, such as a 95% interval. */
export interface Interval {
  low: number;
  high: number;
}

/** One line of a grid line chart; null values leave a gap. */
export interface GridLineSeries {
  key: string;
  label: string;
  values: (number | null)[];
  /** A role token from chart.css, e.g. "var(--viz-series-1)" */
  color: string;
  /** A role token per value, for columns coloured one by one (severity) */
  colors?: string[];
  /** An outline token per value, for light columns that need one against white */
  strokes?: (string | undefined)[];
  /** 95% interval around values, drawn as error bars or listed in the CSV */
  lower?: (number | null)[];
  upper?: (number | null)[];
}

/** One Kaplan-Meier curve, with its band and censoring. */
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

/** An interval as "[low, high]", or "-" without one. */
export function formatBracketInterval(
  interval: Interval | null | undefined,
  format: (value: number) => string = formatNumber,
): string {
  return interval ? `[${format(interval.low)}, ${format(interval.high)}]` : "-";
}

/** The lines of a grid chart, one row per point along x. */
export function gridLineData(
  xTitle: string,
  labels: string[],
  series: GridLineSeries[],
): ChartData {
  return {
    columns: [
      xTitle,
      ...series.flatMap((s) => [
        s.label,
        ...(s.lower ? [`${s.label} lower 95`, `${s.label} upper 95`] : []),
      ]),
    ],
    rows: labels.map((label, i) => [
      label,
      ...series.flatMap((s) => [
        s.values[i] ?? null,
        ...(s.lower ? [s.lower[i] ?? null, s.upper?.[i] ?? null] : []),
      ]),
    ]),
  };
}

/** An interval as "low to high", a dash when there is none. */
export function formatInterval(interval: Interval | null): string {
  return interval === null
    ? "-"
    : `${formatShare(interval.low)} to ${formatShare(interval.high)}`;
}

/** A share followed by its 95% interval, when it has one. */
export function formatShareWithInterval(
  share: number | null,
  interval: Interval | null | undefined,
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
