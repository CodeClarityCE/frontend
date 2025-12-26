export interface BarChartSlice {
    label: string;
    color: string;
    count: number;
}

export type BarChartData = BarChartSlice[];

export interface BarChartOptions {
    w?: number; // Width of chart
    h?: number; // Allow custom height
    padding?: number; // Padding between bars
    rounded?: boolean; // Enable/disable rounded corners
    showLabels?: boolean; // Enable/disable value labels above bars
    shadow?: boolean; // Enable/disable shadow behind bars
    fontSize?: number; // Customize font size of labels
    labelOffset?: number; // Vertical offset for label positioning
}
