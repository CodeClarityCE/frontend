<script setup lang="ts">
import { ExternalLink } from "@lucide/vue";

// A link to another site, opened in a new tab without access to this one.
defineProps<{ href: string }>();
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1 text-brand-subtle-foreground underline-offset-4 hover:underline"
  >
    <slot />
    <ExternalLink class="size-3 shrink-0" aria-hidden="true" />
  </a>
</template>
