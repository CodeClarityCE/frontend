<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

// A text link in the dark brand green, which keeps AA contrast on light surfaces.
defineProps<{
  to?: RouteLocationRaw;
  href?: string;
}>();

const linkClass =
  "rounded-sm font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
</script>

<template>
  <a
    v-if="href"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :class="linkClass"
  >
    <slot />
  </a>
  <RouterLink v-else :to="to ?? '/'" :class="linkClass">
    <slot />
  </RouterLink>
</template>
