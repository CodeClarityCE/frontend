<script lang="ts" setup>
import * as d3 from 'd3';
import { onMounted, toRef, watch } from 'vue';
import type { RadarChartOptions } from '@/base_components/charts/radarChart';

export interface Props {
    chartData: {
        label: string;
        datasets: object[];
    };
    chartOptions: Partial<RadarChartOptions>;
    id: string;
    hideAxis?: boolean;
}

const props = defineProps<Props>();
const dataCopy = toRef(props, 'chartData');

let options: RadarChartOptions = {
    w: 450, //Width of the circle
    h: 450, //Height of the circle
    margin: { top: 0, right: 0, bottom: 110, left: 200 }, //The margins of the SVG
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

watch(dataCopy.value, () => {
    drawChart();
});

onMounted(() => {
    drawChart();
});

function drawChart() {
    // Labels of row and columns
    let groupsSet: Set<string> = new Set();
    let varsSet: Set<string> = new Set();

    const data = dataCopy.value.datasets[0].data;
    for (const element of data) {
        groupsSet.add(element.y);
        varsSet.add(element.x);
    }
    const myGroups = Array.from(groupsSet);
    const myVars = Array.from(varsSet);

    // Remove the previous svg
    d3.select('#' + props.id)
        .select('svg')
        .remove();

    // append the svg object to the body of the page
    const svg = d3
        .select('#' + props.id)
        .append('svg')
        .attr('width', options.w + options.margin.left + options.margin.right)
        .attr('height', options.h + options.margin.top + options.margin.bottom)
        .attr('viewBox', [
            0,
            0,
            options.w + options.margin.left + options.margin.right,
            options.h + options.margin.top + options.margin.bottom
        ])
        .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
        .append('g')
        .attr('transform', `translate(${options.margin.left},${options.margin.top})`);

    // Build X scales and axis:
    const x = d3.scaleBand().range([0, options.w]).domain(myGroups).padding(0.01);
    svg.append('g')
        .attr('transform', `translate(0, ${options.h})`)
        .style('font-size', '14px')
        // .style('font-family', 'Poppins')
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('dy', '.5em')
        .attr('dx', '-.75em')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    // Build X scales and axis:
    const y = d3.scaleBand().range([options.h, 0]).domain(myVars).padding(0.01);
    svg.append('g').style('font-size', '14px').call(d3.axisLeft(y));

    if (props.hideAxis) {
        svg.selectAll('path').style('display', 'none');
    }

    // Build color scale
    const myColor = d3.scaleLinear().range(['#00849105', '#008491']).domain([1, 100]);

    // create a tooltip
    const tooltip = d3
        .select('#' + props.id)
        .append('div')
        .style('opacity', 0)
        .style('position', 'fixed')
        .attr('class', 'tooltip')
        .style('font-size', '18px');
    // .style('font-family', 'Poppins');

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function () {
        tooltip.style('opacity', 1);
    };
    const mousemove = function (event, d) {
        tooltip
            .html(d.v + options.unit)
            .style('left', event.x + 'px')
            .style('top', event.y - 18 * 2 + 'px');
    };
    const mouseleave = function () {
        tooltip.style('opacity', 0);
    };

    // add the squares
    svg.selectAll()
        .data(data, function (d) {
            return d.x + ':' + d.y;
        })
        .enter()
        .append('rect')
        .attr('x', function (d) {
            return x(d.y);
        })
        .attr('y', function (d) {
            return y(d.x);
        })
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', function (d) {
            return myColor(d.v);
        })
        .attr('rx', 10)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);
}
</script>
<template>
    <div :id="id" class="chart"></div>
</template>

<style>
.chart .tooltip {
    background-color: white;
    padding: 0px 5px;
    border: 1px solid #008491;
    border-radius: 5px;
}
</style>
