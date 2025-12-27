<script lang="ts" setup>
import * as d3 from "d3";
import { onMounted } from "vue";

interface ChartDataPoint {
  date: string;
  close: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

const props = defineProps<{
  chartData: ChartData;
}>();

onMounted(() => {
  // Declare the chart dimensions and margins.
  const width = 640;
  const height = 400;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 40;

  const aapl: ChartDataPoint[] = [];

  for (let i = 0; i < (props.chartData.datasets[0]?.data?.length ?? 0); i++) {
    aapl.push({
      date: props.chartData.labels?.[i] ?? "",
      close: props.chartData.datasets[0]?.data?.[i] ?? 0,
    });
  }

  // Declare the x (horizontal position) scale.
  const x = d3
    .scaleBand()
    .rangeRound([0, width])
    .padding(1)
    .domain(props.chartData.labels);

  // Declare the y (vertical position) scale.
  const yExtent = d3.extent(aapl, (d) => d.close) as [number, number];
  const y = d3
    .scaleLinear()
    .domain(yExtent)
    .range([height - marginBottom, marginTop]);

  const line = d3
    .area<ChartDataPoint>()
    .x((d) => x(d.date) ?? 0)
    .y((d) => y(d.close));
  // .curve(d3.curveNatural);

  // Create the SVG container.
  const svg = d3
    .select(".lineChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  // Add the x-axis.
  svg
    .append("g")
    .style("font-size", "12px")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0),
    );

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg
    .append("g")
    .style("font-size", "16px")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1),
    );

  // Append a path for the line.
  svg
    .append("path")
    .attr("class", "area")
    .attr("stroke", "#008491")
    .attr("stroke-width", 5)
    .attr("d", line(aapl));

  // create a tooltip
  const tooltip = d3
    .select(".lineChart")
    .append("div")
    .style("opacity", 0)
    .style("position", "fixed")
    .attr("class", "tooltip")
    .style("font-size", "18px");

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (): void {
    tooltip.style("opacity", 1);
  };
  const mousemove = function (event: MouseEvent, d: ChartDataPoint): void {
    tooltip
      .html(d.close.toString())
      .style("left", `${event.x}px`)
      .style("top", `${event.y - 18 * 2}px`);
  };
  const mouseleave = function (): void {
    tooltip.style("opacity", 0);
  };

  svg
    .selectAll("circle")
    .data(aapl)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.date) ?? 0)
    .attr("cy", (d) => y(d.close))
    .attr("r", 5)
    .style("fill", "white")
    .style("stroke", "#008491")
    .attr("stroke-width", 3)
    .attr("title", (d) => d.close.toString())
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
});
</script>
<template>
  <div>
    <div if="lineChart" class="lineChart"></div>
  </div>
</template>

<style>
.area {
  fill: hsla(185, 100%, 28%, 0.449);
}
</style>

<style>
.lineChart .tooltip {
  background-color: white;
  padding: 0px 5px;
  border: 1px solid #008491;
  border-radius: 5px;
}
</style>
