/** Lag chart rows and their CSV, built from experiment results. */
import type { ChartData } from "@/base_components/charts/chart-export";

import type { BootstrapInterval, LagSummary } from "../experiment.entity";

/** One row of a lag strip chart: a group's lags and their summary. */
export interface LagChartRow {
  key: string;
  label: string;
  /** The below-zero count is left out when a chart has none */
  summary: Omit<LagSummary, "before_disclosure"> & {
    before_disclosure?: number;
  };
  lags: number[];
  /** 95% interval of the median, when the results carry one */
  interval?: BootstrapInterval | null;
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
