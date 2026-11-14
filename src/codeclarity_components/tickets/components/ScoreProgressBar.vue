<script setup lang="ts">
import { computed } from "vue";

// A sub-score as a bar on the severity scale, with its value in text.
const props = defineProps<{
  value: number;
  max: number;
  label: string;
}>();

const percentage = computed(() =>
  props.max === 0
    ? 0
    : Math.min(100, Math.max(0, (props.value / props.max) * 100)),
);

const barClass = computed(() => {
  const pct = percentage.value;
  if (pct >= 90) return "bg-severity-critical";
  if (pct >= 70) return "bg-severity-high";
  if (pct >= 40) return "bg-severity-medium";
  if (pct >= 10) return "bg-severity-low";
  return "bg-severity-none";
});
</script>

<template>
  <div class="flex flex-col gap-1 rounded-control border bg-card p-3">
    <div class="flex items-center justify-between text-xs">
      <span class="text-muted-foreground">{{ label }}</span>
      <span class="font-semibold text-foreground-strong">
        {{ value.toFixed(1) }} of {{ max }}
      </span>
    </div>
    <div
      class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-subtle"
      aria-hidden="true"
    >
      <div
        class="h-1.5 rounded-full"
        :class="barClass"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>
