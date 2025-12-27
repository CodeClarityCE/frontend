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
<style scoped lang="scss">
.short_listing_description :deep(h1),
.short_listing_description :deep(h2),
.short_listing_description :deep(h3),
.short_listing_description :deep(h4),
.short_listing_description :deep(h5) {
  color: #535353;
  font-weight: 500;
}

:deep(pre) {
  background-color: #202531;
  padding: 30px;
  border-radius: 4px;
  color: white;
  font-size: 0.8rem !important;
  overflow-x: scroll;
}
</style>
