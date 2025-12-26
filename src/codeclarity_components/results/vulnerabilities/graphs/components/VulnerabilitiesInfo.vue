<script setup lang="ts">
import type {
  DoughnutChartData,
  DoughnutChartOptions,
} from "@/base_components/data-display/charts/doughnutChart";
import DoughnutChart from "@/base_components/data-display/charts/DoughnutChart.vue";
import { ref, type Ref } from "vue";
import BulletLegend from "./BulletLegend.vue";

// Props
const props = defineProps<{
  stats: {
    number_of_critical: number;
    number_of_high: number;
    number_of_medium: number;
    number_of_low: number;
    number_of_none: number;
  };
}>();

// Use severity colors from theme for better visibility
const doughnutColors = [
  "#000000", // Critical - black
  "#bf1313", // High - red
  "#ffc107", // Medium - yellow
  "#5a9d09", // Low - green
  "#09889d", // None - blue
];

const doughnutChartData: DoughnutChartData = [
  {
    label: "Critical",
    color: doughnutColors[0] ?? "#000000",
    count: props.stats.number_of_critical,
  },
  {
    label: "High",
    color: doughnutColors[1] ?? "#bf1313",
    count: props.stats.number_of_high,
  },
  {
    label: "Medium",
    color: doughnutColors[2] ?? "#ffc107",
    count: props.stats.number_of_medium,
  },
  {
    label: "Low",
    color: doughnutColors[3] ?? "#5a9d09",
    count: props.stats.number_of_low,
  },
  {
    label: "None",
    color: doughnutColors[4] ?? "#09889d",
    count: props.stats.number_of_none,
  },
];

const doghnutChartOptions: Ref<Partial<DoughnutChartOptions>> = ref({});
</script>
<template>
  <div class="p-2">
    <div class="flex flex-row justify-center items-center gap-2">
      <BulletLegend :items="doughnutChartData" />
      <DoughnutChart
        :id="'vulnDoughnutChart'"
        :data="doughnutChartData"
        :options="doghnutChartOptions"
      ></DoughnutChart>
    </div>
  </div>
</template>
