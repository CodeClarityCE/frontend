/////////////////////////////////////////////////////////
/////////////// The Doughnut Chart Function /////////////
/////////////////////////////////////////////////////////

export interface DoughnutChartSlice {
  label: VulnerabilityLabel;
  color: string;
  count: number;
}

export type VulnerabilityLabel =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "None";

export type DoughnutChartData = DoughnutChartSlice[];

export interface DoughnutChartOptions {
  w: number;
  h: number;
  p: number;
}
