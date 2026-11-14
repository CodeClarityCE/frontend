<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: "Show table" });
</script>

<template>
  <!-- The data behind a chart, folded away under "Show table" -->
  <details class="mt-2 text-sm">
    <summary class="cursor-pointer text-muted-foreground">{{ label }}</summary>
    <table class="w-full mt-2">
      <slot />
    </table>
  </details>
</template>
