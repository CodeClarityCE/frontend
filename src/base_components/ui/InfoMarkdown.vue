<script lang="ts" setup>
import VueMarkdown from "vue-markdown-render";

defineProps<{
  markdown: string;
  /** Turn bare URLs into links */
  linkify?: boolean;
}>();
</script>

<template>
  <vue-markdown
    class="short_listing_description"
    :source="markdown"
    :options="{ linkify }"
  />
</template>
<style scoped>
/* Long URLs and package paths wrap instead of widening the page. */
.short_listing_description {
  overflow-wrap: anywhere;
}

.short_listing_description :deep(a) {
  color: var(--brand-subtle-foreground);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.short_listing_description :deep(:is(h1, h2, h3, h4, h5)) {
  color: var(--foreground-strong);
  font-weight: 500;
}

.short_listing_description :deep(pre) {
  background-color: var(--surface-inverse);
  color: var(--background);
  padding: 1.5rem;
  border-radius: var(--radius-control-size);
  font-size: 0.8rem;
  overflow-x: auto;
}
</style>
