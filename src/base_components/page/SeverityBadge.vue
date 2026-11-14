<script setup lang="ts">
import { computed } from "vue";

import {
  SEVERITY_LABELS,
  type SeverityLevel,
  severityLevel,
} from "@/utils/severity";

// A severity in words on its ramp colour, with the CVSS score when given.
const props = defineProps<{
  score?: number | null;
  level?: SeverityLevel;
}>();

const level = computed(() => props.level ?? severityLevel(props.score));

const levelClass: Record<SeverityLevel, string> = {
  critical: "bg-severity-critical text-severity-critical-foreground",
  high: "bg-severity-high text-severity-high-foreground",
  medium: "bg-severity-medium text-severity-medium-foreground",
  low: "bg-severity-low text-severity-low-foreground",
  none: "bg-severity-none text-severity-none-foreground",
};
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control px-2 py-0.5 text-xs font-semibold"
    :class="levelClass[level]"
  >
    {{ SEVERITY_LABELS[level] }}
    <span v-if="score !== undefined && score !== null" class="tabular-nums">
      {{ score.toFixed(1) }}
    </span>
  </span>
</template>
