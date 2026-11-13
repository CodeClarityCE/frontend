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
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  none: "bg-severity-none",
};
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control px-2 py-0.5 text-xs font-semibold text-severity-foreground"
    :class="levelClass[level]"
  >
    {{ SEVERITY_LABELS[level] }}
    <span v-if="score !== undefined && score !== null" class="tabular-nums">
      {{ score.toFixed(1) }}
    </span>
  </span>
</template>
