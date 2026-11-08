<script setup lang="ts">
import { CHART_WIDTH } from "./chart-format";

// A hover label placed over a chart at a point of its viewBox
withDefaults(
  defineProps<{
    x: number;
    y: number;
    /** viewBox height of the chart */
    height: number;
    /** Horizontal anchor, e.g. "-50%" to centre on x */
    shift?: string;
  }>(),
  { shift: "-50%" },
);
</script>

<template>
  <div
    class="pointer-events-none absolute z-10 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 shadow-sm whitespace-nowrap dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
    :style="{
      left: `${(x / CHART_WIDTH) * 100}%`,
      top: `calc(${(y / height) * 100}% - 8px)`,
      transform: `translate(${shift}, -100%)`,
    }"
  ><slot /></div>
</template>
