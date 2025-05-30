<script lang="ts" setup>
import * as d3 from 'd3';
import { onMounted } from 'vue';
import type { DoughnutChartData, DoughnutChartOptions, VulnerabilityLabel } from './doughnutChart';

const props = defineProps<{
    data: DoughnutChartData;
    options: Partial<DoughnutChartOptions>;
    id: string;
}>();

// default config values
let config: DoughnutChartOptions = {
    w: 250, //width of the chart
    h: 250, //height of the chart
    p: 20 //padding inside the w.h box -> low value [O] or high value [ o ]
};

config = { ...config, ...props.options };

const colors = props.data.map((slice) => slice.color)

onMounted(() => {
    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const radius = Math.min(config.w, config.h) / 2 - config.p;

    const data: Record<VulnerabilityLabel, number> = {} as Record<VulnerabilityLabel, number>;

    for (const slice of props.data) {
        data[slice.label] = slice.count;
    }

    // append the svg object to the div called 'my_dataviz'
    const svg = d3
        .select('.doughnutChart')
        .append('svg')
        .attr('width', config.w)
        .attr('height', config.h)
        .append('g')
        .attr('transform', 'translate(' + config.w / 2 + ',' + config.h / 2 + ')');

    // set the color scale
    var color = d3
        .scaleOrdinal()
        .domain(Object.keys(data))
        .range(colors);

    // Compute the position of each group on the pie:

    // Step 1: Convert the original data object into an array of [label, value] pairs
    // Example: { Critical: 5, High: 3 } → [ ['Critical', 5], ['High', 3] ]
    const entries = Object.entries(data) as [VulnerabilityLabel, number][];

    // Step 2: Create a pie generator that calculates angles based on the value (d[1])
    // Each entry's value determines the size of its corresponding slice in the chart
    const pie = d3.pie<[VulnerabilityLabel, number]>().value((d) => d[1]);

    // Step 3: Apply the pie generator to the entries
    // This returns an array of enriched objects (PieArcDatum) with angle and value metadata
    const data_ready = pie(entries);

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    const arcGenerator = d3
        .arc<d3.PieArcDatum<[VulnerabilityLabel, number]>>()
        .innerRadius(50)
        .outerRadius(radius);

    svg.selectAll('whatever')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arcGenerator) //
        .attr(
            'fill',
            (d: d3.PieArcDatum<[VulnerabilityLabel, number]>) => color(d.data[0]) as string
        )
        .attr('stroke', 'black')
        .style('stroke-width', '2px')
        .style('opacity', 0.7);
});
</script>
<template>
    <div>
        <div :id="id" class="doughnutChart "></div>
    </div>
</template>
