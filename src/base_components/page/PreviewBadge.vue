<script setup lang="ts">
import { PREVIEW_NOTE } from "./preview";
</script>

<template>
  <!-- Marks a Preview feature: one whose behaviour and data may still change. -->
  <span
    :title="PREVIEW_NOTE"
    class="inline-flex shrink-0 items-center rounded-full border border-brand-subtle-border bg-brand-subtle px-2 py-0.5 text-xs font-semibold leading-none text-brand-subtle-foreground"
    >Preview</span
  >
</template>
