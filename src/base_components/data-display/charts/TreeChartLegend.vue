<script lang="ts" setup>
import * as d3 from "d3";
import { onMounted, watch } from "vue";

const props = defineProps<{
  svgSelector: string; // e.g. '#tree-svg'
  marginLeft: number;
  x0: number;
  marginTop: number;
  legendSpace: number;
  hasPrunedNodes: boolean;
  prunedNodes: Set<string>;
  targetDependency?: string;
}>();

const legendGroupId = "tree-chart-legend-group";

function renderLegend(): void {
  // Remove previous legend if exists
  d3.select(`${props.svgSelector} #${legendGroupId}`).remove();

  const legendHeight = props.hasPrunedNodes ? 165 : 145;
  const svg = d3.select(props.svgSelector);
  const legend = svg
    .append("g")
    .attr("id", legendGroupId)
    .attr(
      "transform",
      `translate(${-props.marginLeft + 20}, ${props.x0 - props.marginTop - props.legendSpace + 20})`,
    );

  legend
    .append("rect")
    .attr("x", -15)
    .attr("y", -15)
    .attr("width", 310)
    .attr("height", legendHeight)
    .attr("fill", "rgba(255, 255, 255, 0.95)")
    .attr("stroke", "#e5e7eb")
    .attr("stroke-width", 1)
    .attr("rx", 6);

  legend
    .append("text")
    .attr("x", 0)
    .attr("y", 5)
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#374151")
    .text("Legend");

  let yOffset = 25;

  // Target dependency indicator
  legend
    .append("circle")
    .attr("cx", 10)
    .attr("cy", yOffset)
    .attr("r", 6)
    .attr("fill", "url(#highlightGradient)")
    .attr("stroke", "#f59e0b")
    .attr("stroke-width", 2);

  legend
    .append("text")
    .attr("x", 25)
    .attr("y", yOffset + 5)
    .attr("font-size", "11px")
    .attr("fill", "#374151")
    .text("Target Dependency");

  yOffset += 20;

  // Pruned duplicate indicator (only if there are pruned nodes)
  if (props.hasPrunedNodes) {
    legend
      .append("circle")
      .attr("cx", 10)
      .attr("cy", yOffset)
      .attr("r", 3)
      .attr("fill", "#94a3b8")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.6);

    legend
      .append("text")
      .attr("x", 25)
      .attr("y", yOffset + 5)
      .attr("font-size", "11px")
      .attr("fill", "#374151")
      .text("Pruned Duplicate (⋯) - Children shown elsewhere");

    yOffset += 20;
  }

  // Root indicator
  legend
    .append("circle")
    .attr("cx", 10)
    .attr("cy", yOffset)
    .attr("r", 5)
    .attr("fill", "#3b82f6")
    .attr("stroke", "#1d4ed8")
    .attr("stroke-width", 2);

  legend
    .append("text")
    .attr("x", 25)
    .attr("y", yOffset + 5)
    .attr("font-size", "11px")
    .attr("fill", "#374151")
    .text("Root Node");

  yOffset += 20;

  // Parent/Child indicator
  legend
    .append("circle")
    .attr("cx", 10)
    .attr("cy", yOffset)
    .attr("r", 4)
    .attr("fill", "#374151")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2);

  legend
    .append("text")
    .attr("x", 25)
    .attr("y", yOffset + 5)
    .attr("font-size", "11px")
    .attr("fill", "#374151")
    .text("Parent/Child Nodes");

  yOffset += 20;

  // PROD/DEV badge legend
  let badgeLegendYOffset = yOffset;
  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", badgeLegendYOffset)
    .attr("width", 32)
    .attr("height", 13)
    .attr("rx", 8)
    .attr("fill", "#bbf7d0")
    .attr("stroke", "#22c55e")
    .attr("stroke-width", 1.2);
  legend
    .append("text")
    .attr("x", 16)
    .attr("y", badgeLegendYOffset + 9)
    .attr("text-anchor", "middle")
    .attr("font-size", "7px")
    .attr("font-weight", "bold")
    .attr("fill", "#15803d")
    .text("PROD");
  legend
    .append("text")
    .attr("x", 35)
    .attr("y", badgeLegendYOffset + 11)
    .attr("font-size", "11px")
    .attr("fill", "#374151")
    .text("Direct Production Dependency");
  badgeLegendYOffset += 20;
  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", badgeLegendYOffset)
    .attr("width", 28)
    .attr("height", 13)
    .attr("rx", 8)
    .attr("fill", "#f3e8ff")
    .attr("stroke", "#a855f7")
    .attr("stroke-width", 1.2);
  legend
    .append("text")
    .attr("x", 14)
    .attr("y", badgeLegendYOffset + 9)
    .attr("text-anchor", "middle")
    .attr("font-size", "7px")
    .attr("font-weight", "bold")
    .attr("fill", "#a855f7")
    .text("DEV");
  legend
    .append("text")
    .attr("x", 35)
    .attr("y", badgeLegendYOffset + 11)
    .attr("font-size", "11px")
    .attr("fill", "#374151")
    .text("Direct Development Dependency");
}

onMounted(() => {
  if (props.targetDependency) renderLegend();
});

watch(
  () => [props.targetDependency, props.hasPrunedNodes, props.x0],
  () => {
    if (props.targetDependency) renderLegend();
  },
);
</script>
<template>
  <!-- This component only renders into the SVG via D3 -->
  <div style="display: none"></div>
</template>
