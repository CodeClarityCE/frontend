<script lang="ts" setup>
import * as d3 from 'd3';
import { onMounted } from 'vue';
import type { RadarChartData, RadarChartOptions } from '@/base_components/charts/radarChart';

export interface Props {
    chartData: RadarChartData;
    chartOptions: Partial<RadarChartOptions>;
}

const props = defineProps<Props>();

var margin = { top: 40, right: 40, bottom: 40, left: 40 },
    width = 600,
    height = 450;
let options: RadarChartOptions = {
    w: width, //Width of the circle
    h: height, //Height of the circle
    margin: margin, //The margins of the SVG
    levels: 6, //How many levels or inner circles should there be drawn
    maxValue: 60, //What is the value that the biggest circle will represent
    labelFactor: 1.25, //How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 60, //The number of pixels after which a label needs to be given a new line
    opacityArea: 0.35, //The opacity of the area of the blob
    dotRadius: 4, //The size of the colored circles of each blog
    opacityCircles: 0.1, //The opacity of the circles of each blob
    strokeWidth: 2, //The width of the stroke around each blob
    roundStrokes: false, //If true the area and stroke will follow a round path (cardinal-closed)
    color: d3
        .scaleOrdinal()
        .range(['#008491', '#023f47', '#175181', '#0b9749', '#35cb36', '#c3f166', '#c2f79a']), //Color function,
    format: '.0f',
    unit: '',
    legend: { title: 'LEGEND', translateX: 125, translateY: 40 }
};
options = { ...options, ...props.chartOptions };

onMounted(() => {
    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const radius = Math.min(options.w, options.h) / 2 - options.margin.top;

    let data = {};

    for (const axis of props.chartData[0]['axes']) {
        data[axis['axis']] = axis['value'];
    }

    // append the svg object to the div called 'my_dataviz'
    const svg = d3
        .select('.doughnutChart')
        .append('svg')
        .attr('width', options.w)
        .attr('height', options.h)
        .attr('viewBox', [0, 0, options.w, options.h])
        .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');

    const chart = svg
        .append('g')
        .attr('transform', `translate(${options.w / 4 + options.margin.left},${options.h / 2})`);

    // Compute the position of each group on the pie:
    const pie = d3.pie().value((d) => d[1]);

    const data_ready = pie(Object.entries(data));

    const circles = svg
        .selectAll('circle')
        .data(data_ready)
        .enter()
        .append('circle')
        .attr('cx', 400)
        .attr('cy', (d, i) => i * 20 + 125)
        .attr('r', 5)
        .attr('fill', (d) => options.color(d.data[0]))
        .attr('id', (d, i) => 'circle' + i)
        .text((d) => d.data[0] + ': ' + d.data[1]);

    const legend = svg
        .selectAll()
        .data(data_ready)
        .enter()
        .append('text')
        .attr('x', 410)
        .attr('y', (d, i) => i * 20 + 130)
        .attr('id', (d, i) => 'text' + i)
        // .attr('font-family', 'Poppins')
        .text((d) => d.data[0] + ': ' + d.data[1] + options.unit);

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    const doughnut = chart
        .selectAll('whatever')
        .data(data_ready)
        .join('path')
        .attr(
            'd',
            d3
                .arc()
                .innerRadius(100) // This is the size of the donut hole
                .outerRadius(radius)
                .cornerRadius(10)
        )
        .attr('fill', (d) => options.color(d.data[0]))
        // .attr('transform','translate(-100, 20)')
        .attr('stroke', 'white')
        .style('stroke-width', '5px')
        .style('opacity', 0.8)
        .attr('class', 'bar')
        .on('mouseenter', function (d, selected) {
            doughnut.style('opacity', 0.1);
            legend.style('opacity', 0.1);
            circles.style('opacity', 0.1);
            d3.select(this).style('opacity', 0.8);
            d3.select('#text' + selected.index).style('opacity', 0.8);
            d3.select('#circle' + selected.index).style('opacity', 0.8);
        })
        .on('mouseleave', function () {
            doughnut.style('opacity', 0.8);
            legend.style('opacity', 0.8);
            circles.style('opacity', 0.8);
        });
});
</script>
<template>
    <div>
        <div class="doughnutChart"></div>
    </div>
</template>
