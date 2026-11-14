<script setup lang="ts">
import { LoaderCircle } from "@lucide/vue";

import type { StatusTone } from "./status-tone";

// A status label in the shared status colours; the text always carries the meaning.
defineProps<{ tone: StatusTone; label: string; busy?: boolean }>();

const toneClass: Record<StatusTone, string> = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger text-danger-foreground",
  neutral: "bg-neutral-subtle text-neutral",
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="toneClass[tone]"
  >
    <LoaderCircle
      v-if="busy"
      aria-hidden="true"
      class="size-3 animate-spin motion-reduce:animate-none"
    />
    {{ label }}
  </span>
</template>
