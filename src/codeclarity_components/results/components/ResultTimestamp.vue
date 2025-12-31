<script setup lang="ts">
import { Icon } from "@iconify/vue";

import { formatDate } from "@/utils/dateUtils";

defineProps<{
  createdOn?: Date | string;
  runIndex?: number | null;
  pluginName?: string;
}>();
</script>

<template>
  <div v-if="createdOn" class="mb-4 p-3 bg-gray-50 rounded-lg border">
    <div class="flex items-center gap-2 text-sm text-gray-600">
      <Icon icon="solar:calendar-bold" class="w-4 h-4" />
      <span class="font-medium">
        {{ pluginName ? `${pluginName} result` : "Result" }} created:
      </span>
      <span>{{ formatDate(createdOn, "MMM DD, YYYY HH:mm") }}</span>
      <span
        v-if="runIndex !== null && runIndex !== undefined"
        class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
      >
        Run #{{ runIndex + 1 }}
      </span>
    </div>
  </div>
</template>
