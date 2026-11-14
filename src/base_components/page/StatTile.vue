<script setup lang="ts">
// One number with its label. Place several inside a <ul> with an aria-label;
// each tile renders as a list item.
defineProps<{ label: string; value: string | number; hint?: string }>();
</script>

<template>
  <li
    class="flex flex-col gap-1 rounded-card border bg-card p-4 text-card-foreground shadow-card"
  >
    <span class="text-sm text-muted-foreground">{{ label }}</span>
    <span
      class="text-2xl font-bold tabular-nums tracking-tight text-foreground-strong"
    >
      <slot>{{ value }}</slot>
    </span>
    <span v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</span>
  </li>
</template>
