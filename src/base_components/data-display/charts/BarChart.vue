<script lang="ts" setup>
import * as d3 from 'd3';
import { onMounted } from 'vue';
import type { BarChartData, BarChartOptions } from './barChart';

// Props received by the component
const props = defineProps<{
    data: BarChartData;
    options: Partial<BarChartOptions>;
    id: string;
}>();

// Default configuration
const defaultConfig: BarChartOptions = {
    w: 400,
    h: 300,
    padding: 0.3,
    rounded: true,
    showLabels: true,
    shadow: true,
    fontSize: 12,
    labelOffset: 5
};

const config = { ...defaultConfig, ...props.options };

onMounted(() => {
    // Select the container using the dynamic id prop
    const container = d3.select(`#${props.id}`);

    // Clear any previous content to prevent duplicate renderings
    container.selectAll('*').remove();

    // Define margins around the actual chart area
    const margin = { top: 30, right: 30, bottom: 30, left: 30 };

    // Calculate internal drawing width and height (excluding margins)
    const width = (config.w ?? 400) - margin.left - margin.right;
    const height = (config.h ?? 300) - margin.top - margin.bottom;

    // Create the main SVG element inside the container
    const svg = container
        .append('svg') // Create the SVG node
        .attr('width', width + margin.left + margin.right) // Set full width including margins
        .attr('height', height + margin.top + margin.bottom) // Set full height including margins
        .append('g') // Create a group element to apply margin transformation
        .attr('transform', `translate(${margin.left},${margin.top})`); // Shift chart area inside margins

    // Create the X scale: one band per label (discrete categories)
    const x = d3
        .scaleBand()
        .range([0, width]) // Total chart width
        .domain(props.data.map((d) => d.label)) // Each label becomes one slot
        .padding(config.padding ?? 0.3); // Control spacing between bars

    // Create the Y scale: linear numeric scale based on counts
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(props.data, (d) => d.count)! * 1.2]) // Max value + 20% for padding on top
        .range([height, 0]); // Inverted because SVG Y=0 is at top

    // Optional: Render shadows behind bars (for depth effect)
    if (config.shadow) {
        svg.selectAll('bars-shadow')
            .data(props.data)
            .enter()
            .insert('rect', 'rect') // Insert behind actual bars
            .attr('x', (d) => x(d.label)! + 2) // Slight horizontal offset for shadow
            .attr('y', (d) => y(d.count) + 2) // Slight vertical offset for shadow
            .attr('width', x.bandwidth())
            .attr('height', (d) => height - y(d.count))
            .attr('fill', '#00000010') // Light transparent black for soft shadow
            .attr('rx', config.rounded ? 6 : 0); // Match rounding if enabled
    }

    // Render actual bars
    svg.selectAll('bars')
        .data(props.data)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.label)!) // Horizontal position based on label
        .attr('y', (d) => y(d.count)) // Top position of the bar
        .attr('width', x.bandwidth()) // Bar width from scaleBand
        .attr('height', (d) => height - y(d.count)) // Calculate bar height (invert Y)
        .attr('fill', (d) => d.color) // Use provided color for each bar
        .attr('rx', config.rounded ? 6 : 0); // Apply rounding if enabled

    // Optional: Render numeric value labels above bars
    if (config.showLabels) {
        svg.selectAll('labels')
            .data(props.data)
            .enter()
            .append('text')
            .text((d) => d.count) // Display count value
            .attr('x', (d) => x(d.label)! + x.bandwidth() / 2) // Centered horizontally on the bar
            .attr('y', (d) => y(d.count) - (config.labelOffset ?? 5)) // Vertical offset above the bar
            .attr('text-anchor', 'middle') // Center text alignment
            .style('fill', (d) => d.color) // Label color same as bar
            .style('font-weight', 'bold')
            .style('font-size', `${config.fontSize}px`);
    }
});
</script>

<template>
    <div>
        <div :id="id"></div>
    </div>
</template>
