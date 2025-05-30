import * as d3 from 'd3';
/////////////////////////////////////////////////////////
/////////////// The Doughnut Chart Function /////////////
/////////////////////////////////////////////////////////

export type DoughnutChartSlice = {
    label: VulnerabilityLabel;
    color: string;
    count: number;
};

export type VulnerabilityLabel = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';

export type DoughnutChartData = DoughnutChartSlice[];

export type DoughnutChartOptions = {
    w: number;
    h: number;
    p: number;
};
