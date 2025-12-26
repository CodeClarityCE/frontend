<script setup lang="ts">
import type {
  RadarChartData,
  RadarChartOptions,
} from "@/base_components/data-display/charts/radarChart";
import RadarChart from "@/base_components/data-display/charts/RadarChart.vue";
import { ref, type Ref } from "vue";

// Props
const props = defineProps<{
  stats: {
    mean_confidentiality_impact: number;
    mean_integrity_impact: number;
    mean_availability_impact: number;
  };
}>();

const radarChartData: Ref<RadarChartData> = ref([
  {
    name: "Security Impact",
    axes: [
      {
        axis: "CONFIDENTIALITY",
        value: props.stats.mean_confidentiality_impact ?? 0,
      },
      {
        axis: "INTEGRITY",
        value: props.stats.mean_integrity_impact ?? 0,
      },
      {
        axis: "AVAILABILITY",
        value: props.stats.mean_availability_impact ?? 0,
      },
    ],
  },
]);
const radarChartOptions: Ref<Partial<RadarChartOptions>> = ref({
  format: "0.1f",
  maxValue: 1.0,
});
</script>
<template>
  <div class="p-2">
    <div class="flex flex-row justify-center items-center">
      <RadarChart
        :id="'ciaImpact'"
        :data="radarChartData"
        :options="radarChartOptions"
      ></RadarChart>
    </div>
  </div>
</template>
