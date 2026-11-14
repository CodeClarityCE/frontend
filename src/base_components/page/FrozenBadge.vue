<script setup lang="ts">
import { Lock } from "@lucide/vue";
</script>

<template>
  <!-- Marks published results that no longer change. -->
  <span
    class="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-subtle px-2.5 py-0.5 text-xs font-semibold text-neutral"
  >
    <Lock aria-hidden="true" class="size-3" />
    Frozen
  </span>
</template>
