<script setup lang="ts">
import { CalendarDays } from "@lucide/vue";

import { formatDate } from "@/utils/dateUtils";

// When a plugin result was created, and which run it belongs to.
defineProps<{
  createdOn?: Date | string;
  runIndex?: number | null;
  pluginName?: string;
}>();
</script>

<template>
  <p
    v-if="createdOn"
    class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
  >
    <CalendarDays aria-hidden="true" class="size-4" />
    <span>
      {{ pluginName ? `${pluginName} result` : "Result" }} created
      {{ formatDate(createdOn, "MMM DD, YYYY HH:mm") }}
    </span>
    <span
      v-if="runIndex !== null && runIndex !== undefined"
      class="rounded-control bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
    >
      Run #{{ runIndex + 1 }}
    </span>
  </p>
</template>
