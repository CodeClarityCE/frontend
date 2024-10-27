<script lang="ts" setup>
import * as d3 from 'd3';
import { RadarChart, type RadarChartData, type RadarChartOptions } from './radarChart';
import { onMounted } from 'vue';

const props = defineProps<{
    data: RadarChartData;
    options: Partial<RadarChartOptions>;
    id: string;
}>();

//////////////////////////////////////////////////////////////
//////////////////////// Set-Up //////////////////////////////
//////////////////////////////////////////////////////////////

var margin = { top: 50, right: 80, bottom: 50, left: 80 },
    width = 640,
    height = 450;

let config: RadarChartOptions = {
    w: width, //Width of the circle
    h: height, //Height of the circle
    margin: margin, //The margins of the SVG
    levels: 6, //How many levels or inner circles should there be drawn
    maxValue: 60, //What is the value that the biggest circle will represent
    labelFactor: 1.25, //How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 60, //The number of pixels after which a label needs to be given a new line
    opacityArea: 0.35, //The opacity of the area of the blob
    dotRadius: 5, //The size of the colored circles of each blog
    opacityCircles: 0.1, //The opacity of the circles of each blob
    strokeWidth: 2, //The width of the stroke around each blob
    roundStrokes: false, //If true the area and stroke will follow a round path (cardinal-closed)
    color: d3.interpolateDiscrete([
        '#008491',
        '#023f47',
        '#175181',
        '#0b9749',
        '#35cb36',
        '#c3f166',
        '#c2f79a'
    ]), //Color function,
    format: '.0f',
    unit: '',
    legend: { title: 'LEGEND', translateX: 125, translateY: 40 }
};

config = { ...config, ...props.options };

onMounted(() => {
    // let svg_radar = RadarChart(".radarChart", props.data, config);
    RadarChart('#' + props.id, props.data, config);
});
</script>
<template>
    <div>
        <div :id="id" class="radarChart"></div>
    </div>
</template>

<style>
.radarChart .tooltip {
    background-color: white;
    padding: 0px 5px;
    border: 1px solid #008491;
    border-radius: 5px;
}
</style>
