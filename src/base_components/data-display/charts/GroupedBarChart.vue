<script lang="ts" setup>
import * as d3 from "d3";
import { onMounted } from "vue";

import type {
  GroupedBarChartData,
  GroupedBarChartOptions,
} from "./groupedBarChart";

// Props received by the component
const props = defineProps<{
  data: GroupedBarChartData;
  options: Partial<GroupedBarChartOptions>;
  id: string;
}>();

// Default configuration
const defaultConfig: GroupedBarChartOptions = {
  w: 400,
  h: 300,
  padding: 0.1,
  groupPadding: 0.2,
  rounded: true,
  showLabels: true,
  shadow: true,
  fontSize: 12,
  labelOffset: 5,
};

const config = { ...defaultConfig, ...props.options };

onMounted(() => {
  // Select the container using the dynamic id prop
  const container = d3.select(`#${props.id}`);

  // Clear any previous content to prevent duplicate renderings
  container.selectAll("*").remove();

  // Define margins around the actual chart area
  const margin = { top: 30, right: 30, bottom: 30, left: 30 };

  // Calculate internal drawing width and height (excluding margins)
  const width = (config.w ?? 400) - margin.left - margin.right;
  const height = (config.h ?? 300) - margin.top - margin.bottom;

  // Create the main SVG element inside the container
  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Get all categories and group names
  const categories = props.data.categories;
  const groupNames = props.data.groups.map((g) => g.name);

  // Create scales
  const x0 = d3
    .scaleBand()
    .domain(categories)
    .range([0, width])
    .padding(config.groupPadding ?? 0.2);

  const x1 = d3
    .scaleBand()
    .domain(groupNames)
    .range([0, x0.bandwidth()])
    .padding(config.padding ?? 0.1);

  const maxValue = d3.max(props.data.groups, (g) => d3.max(g.data)) ?? 0;
  const y = d3
    .scaleLinear()
    .domain([0, maxValue * 1.2])
    .range([height, 0]);

  // Create grouped bars
  const categoryGroups = svg
    .selectAll(".category-group")
    .data(categories)
    .enter()
    .append("g")
    .attr("class", "category-group")
    .attr("transform", (d) => `translate(${x0(d)},0)`);

  props.data.groups.forEach((group, groupIndex) => {
    // Optional: Render shadows behind bars
    if (config.shadow) {
      categoryGroups
        .selectAll(`.shadow-${groupIndex}`)
        .data(categories)
        .enter()
        .append("rect")
        .attr("class", `shadow-${groupIndex}`)
        .attr("x", x1(group.name)! + 2)
        .attr("y", (_d, i) => y(group.data[i] ?? 0) + 2)
        .attr("width", x1.bandwidth())
        .attr("height", (_d, i) => height - (y(group.data[i] ?? 0) ?? 0))
        .attr("fill", "#00000010")
        .attr("rx", config.rounded ? 6 : 0);
    }

    // Render actual bars
    categoryGroups
      .selectAll(`.bar-${groupIndex}`)
      .data(categories)
      .enter()
      .append("rect")
      .attr("class", `bar-${groupIndex}`)
      .attr("x", x1(group.name)!)
      .attr("y", (_d, i) => y(group.data[i] ?? 0))
      .attr("width", x1.bandwidth())
      .attr("height", (_d, i) => height - y(group.data[i] ?? 0))
      .attr("fill", group.color)
      .attr("rx", config.rounded ? 6 : 0);

    // Optional: Render numeric value labels above bars
    if (config.showLabels) {
      categoryGroups
        .selectAll(`.label-${groupIndex}`)
        .data(categories)
        .enter()
        .append("text")
        .attr("class", `label-${groupIndex}`)
        .text((_d, i) => group.data[i] ?? 0)
        .attr("x", x1(group.name)! + x1.bandwidth() / 2)
        .attr("y", (_d, i) => y(group.data[i] ?? 0) - (config.labelOffset ?? 5))
        .attr("text-anchor", "middle")
        .style("fill", group.color)
        .style("font-weight", "bold")
        .style("font-size", `${config.fontSize}px`);
    }
  });
});
</script>

<template>
  <div>
    <div :id="id"></div>
  </div>
</template>
