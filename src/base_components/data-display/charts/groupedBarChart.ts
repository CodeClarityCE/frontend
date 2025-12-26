export interface GroupedBarChartGroup {
    name: string;
    color: string;
    data: number[];
}

export interface GroupedBarChartData {
    categories: string[];
    groups: GroupedBarChartGroup[];
}

export interface GroupedBarChartOptions {
    w?: number; // Width of chart
    h?: number; // Height of chart
    padding?: number; // Padding between bars within a group
    groupPadding?: number; // Padding between groups
    rounded?: boolean; // Enable/disable rounded corners
    showLabels?: boolean; // Enable/disable value labels above bars
    shadow?: boolean; // Enable/disable shadow behind bars
    fontSize?: number; // Customize font size of labels
    labelOffset?: number; // Vertical offset for label positioning
}
