<script setup lang="ts">
import { StatusBadge } from "@/base_components/page";

import {
  type ExperimentStatus,
  ExperimentStatusLabels,
  ExperimentStatusTones,
  isExperimentActive,
} from "./experiment.entity";

defineProps<{ status: ExperimentStatus }>();
</script>

<template>
  <StatusBadge
    :tone="ExperimentStatusTones[status]"
    :label="ExperimentStatusLabels[status]"
    :busy="isExperimentActive({ status })"
  />
</template>
