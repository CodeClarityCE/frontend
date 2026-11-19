<script setup lang="ts">
import { computed } from "vue";

import {
  cvssVersionLabel,
  findingSeverityLevel,
  SEVERITY_LABELS,
  type SeverityLevel,
  severityLevel,
} from "@/utils/severity";

// A severity in words on its ramp colour, with the CVSS score and its version when given.
const props = defineProps<{
  score?: number | null;
  level?: SeverityLevel;
  // A finding's severity; a GHSA label has a class and no score.
  severity?: {
    Severity?: number | null;
    SeverityClass?: string | null;
    SeverityType?: string | null;
  } | null;
}>();

const level = computed(
  () =>
    props.level ??
    (props.severity !== undefined
      ? findingSeverityLevel(props.severity)
      : severityLevel(props.score)),
);
const shownScore = computed(() => {
  if (props.severity === undefined) return props.score;
  const score = props.severity?.Severity;
  return score ? score : undefined;
});
const version = computed(() =>
  level.value === "none"
    ? undefined
    : cvssVersionLabel(props.severity?.SeverityType),
);

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
    <span
      v-if="shownScore !== undefined && shownScore !== null"
      class="tabular-nums"
    >
      {{ shownScore.toFixed(1) }}
    </span>
    <span v-if="version" class="font-normal">{{ version }}</span>
  </span>
</template>
