<script setup lang="ts">
import { computed } from "vue";

type Level = "critical" | "high" | "medium" | "low" | "none";

const props = withDefaults(
  defineProps<{
    score: number;
    maxScore: number;
    label: string;
    type: "cvss" | "epss" | "vlai";
    sublabel?: string;
  }>(),
  { sublabel: "" },
);

const WIDTH = 90;
const STROKE = 7;
const radius = (WIDTH - STROKE) / 2;
const circumference = 2 * Math.PI * radius;
const center = WIDTH / 2;

const percentage = computed(() =>
  Math.min(100, Math.max(0, (props.score / props.maxScore) * 100)),
);
const dashOffset = computed(
  () => circumference - (percentage.value / 100) * circumference,
);

// Thresholds per score type, from critical down to low.
const thresholds: Record<"cvss" | "epss" | "vlai", number[]> = {
  cvss: [9, 7, 4, 0.1],
  epss: [50, 20, 5, 0.1],
  vlai: [9, 7, 4, 1],
};
const levels: Level[] = ["critical", "high", "medium", "low"];

const level = computed<Level>(() => {
  const index = thresholds[props.type].findIndex((min) => props.score >= min);
  return index === -1 ? "none" : (levels[index] ?? "none");
});

const levelLabel: Record<Level, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

const strokeClass: Record<Level, string> = {
  critical: "stroke-severity-critical",
  high: "stroke-severity-high",
  medium: "stroke-severity-medium",
  low: "stroke-severity-low",
  none: "stroke-severity-none",
};

const displayValue = computed(() => {
  if (props.type === "epss") return `${props.score.toFixed(1)}%`;
  if (props.type === "vlai") return props.sublabel || props.score.toFixed(1);
  return props.score.toFixed(1);
});
</script>

<template>
  <figure class="flex flex-col items-center gap-2">
    <div
      class="relative"
      role="img"
      :aria-label="`${label}: ${displayValue}, ${levelLabel[level]}`"
      :style="{ width: `${WIDTH}px`, height: `${WIDTH}px` }"
    >
      <svg :width="WIDTH" :height="WIDTH" class="-rotate-90" aria-hidden="true">
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          class="stroke-neutral-subtle"
          :stroke-width="STROKE"
        />
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          :class="strokeClass[level]"
          :stroke-width="STROKE"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
        />
      </svg>
      <span
        aria-hidden="true"
        class="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground-strong"
      >
        {{ displayValue }}
      </span>
    </div>
    <figcaption class="flex flex-col items-center text-center">
      <span
        class="text-xs font-semibold uppercase tracking-wide text-foreground"
      >
        {{ label }}
      </span>
      <span class="text-xs text-muted-foreground">{{ levelLabel[level] }}</span>
      <span
        v-if="sublabel && type !== 'vlai'"
        class="text-xs text-muted-foreground"
      >
        {{ sublabel }}
      </span>
    </figcaption>
  </figure>
</template>
