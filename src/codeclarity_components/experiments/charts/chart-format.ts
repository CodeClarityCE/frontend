/** Shared formatting and layout for experiment charts. */
import type { LagSummary } from "../experiment.entity";

/** One row of a lag strip chart: a group's lags and their summary. */
export interface LagChartRow {
  key: string;
  label: string;
  /** The below-zero count is left out when a chart has none */
  summary: Omit<LagSummary, "before_disclosure"> & { before_disclosure?: number };
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

/** viewBox width; charts scale to their container */
export const CHART_WIDTH = 640;
/** Left column for row labels */
export const LABEL_WIDTH = 150;
export const ROW_HEIGHT = 40;
export const AXIS_HEIGHT = 28;
export const TOP_PADDING = 20;
export const RIGHT_PADDING = 16;

/** Whole numbers as is, others with one decimal. */
export function formatNumber(value: number | null): string {
  if (value === null) return "-";
  return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(1);
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
