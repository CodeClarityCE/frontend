<script setup lang="ts">
import { ref } from "vue";

import { saveBlob } from "@/utils/download";

import { type ChartData, chartDataCsv, standaloneSvg } from "./chart-export";

const props = defineProps<{
  /** File name without its extension */
  name: string;
  /** The values drawn in the chart */
  data: ChartData;
}>();

const content = ref<HTMLElement | null>(null);

function downloadSvg(): void {
  const chart = content.value?.querySelector("svg");
  if (!chart) return;
  saveBlob(
    new Blob([standaloneSvg(chart)], { type: "image/svg+xml;charset=utf-8" }),
    `${props.name}.svg`,
  );
}

function downloadCsv(): void {
  saveBlob(
    new Blob([chartDataCsv(props.data)], { type: "text/csv;charset=utf-8" }),
    `${props.name}.csv`,
  );
}
</script>

<template>
  <div>
    <div ref="content">
      <slot />
    </div>
    <div class="flex gap-2 mt-1">
      <button
        type="button"
        data-testid="export-svg"
        class="text-xs text-gray-500 hover:text-gray-900 underline"
        @click="downloadSvg"
      >
        Download SVG
      </button>
      <button
        type="button"
        data-testid="export-csv"
        class="text-xs text-gray-500 hover:text-gray-900 underline"
        @click="downloadCsv"
      >
        Download data (CSV)
      </button>
    </div>
  </div>
</template>
