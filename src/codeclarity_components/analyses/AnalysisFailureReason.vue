<script lang="ts" setup>
import { computed } from "vue";

import { isFailed } from "@/codeclarity_components/projects/list/analysis-status";

import type { Analysis } from "./analysis.entity";

const props = defineProps<{ analysis: Analysis }>();

const failed = computed(() => isFailed(props.analysis));
</script>

<template>
  <p
    v-if="failed"
    class="break-words text-xs text-danger"
    data-testid="analysis-failure-reason"
  >
    {{
      props.analysis.failure_reason ||
      "No reason was recorded for this failure."
    }}
  </p>
</template>
