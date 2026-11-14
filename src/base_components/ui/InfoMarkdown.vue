<script lang="ts" setup>
import VueMarkdown from "vue-markdown-render";

defineProps<{
  markdown: string;
}>();
</script>

<template>
  <vue-markdown
    class="short_listing_description"
    :source="markdown"
    :options="{ linkify: false }"
  />
</template>
<style scoped>
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
