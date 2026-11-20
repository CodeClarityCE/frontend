<script setup lang="ts">
import { ArrowDown, ArrowUp, Minus } from "@lucide/vue";

// One number with its label. Place several inside a <ul> with an aria-label;
// each tile renders as a list item.
defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  /** Which way the number moved since the previous period; shows an arrow before the hint */
  trend?: "up" | "down" | "equal";
  /** Whether that move is good news, to colour the arrow */
  trendTone?: "good" | "bad" | "neutral";
}>();

const ICONS = { up: ArrowUp, down: ArrowDown, equal: Minus };
const TONES = {
  good: "text-success",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
};
</script>

<template>
  <li
    class="flex flex-col gap-1 rounded-card border bg-card p-4 text-card-foreground shadow-card"
  >
    <span class="text-sm text-muted-foreground">{{ label }}</span>
    <span
      class="text-2xl font-bold tabular-nums tracking-tight text-foreground-strong"
    >
      <slot>{{ value }}</slot>
    </span>
    <span
      v-if="hint"
      class="flex items-center gap-1 text-xs text-muted-foreground"
    >
      <component
        :is="ICONS[trend]"
        v-if="trend"
        aria-hidden="true"
        class="size-3"
        :class="TONES[trendTone ?? 'neutral']"
      />
      {{ hint }}
    </span>
  </li>
</template>
