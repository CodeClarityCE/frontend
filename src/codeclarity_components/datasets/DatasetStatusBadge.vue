<script setup lang="ts">
import { StatusBadge } from "@/base_components/page";

import {
  DatasetStatus,
  DatasetStatusLabels,
  DatasetStatusTones,
} from "./dataset.entity";

defineProps<{ status: DatasetStatus }>();
</script>

<template>
  <StatusBadge
    :tone="DatasetStatusTones[status]"
    :label="DatasetStatusLabels[status]"
    :busy="status === DatasetStatus.BUILDING"
  />
</template>
