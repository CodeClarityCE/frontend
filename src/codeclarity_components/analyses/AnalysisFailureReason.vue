<script lang="ts" setup>
import { computed } from "vue";

import { type Analysis, AnalysisStatus } from "./analysis.entity";

const props = defineProps<{ analysis: Analysis }>();

const failed = computed(
  () =>
    props.analysis.status === AnalysisStatus.FAILURE ||
    props.analysis.status === AnalysisStatus.FAILED,
);
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
