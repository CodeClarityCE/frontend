<script setup lang="ts">
import { ExternalLink } from "@lucide/vue";
import { computed, ref } from "vue";

import { Button } from "@/shadcn/ui/button";

interface ReferenceInfo {
  url: string;
  tags: string[];
}

const props = defineProps<{
  references: ReferenceInfo[];
}>();

const LIMIT = 8;
const showAll = ref(false);
const shown = computed(() =>
  showAll.value ? props.references : props.references.slice(0, LIMIT),
);

function host(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="references.length === 0" class="text-sm text-muted-foreground">
      No references.
    </p>
    <ul v-else class="grid gap-3 md:grid-cols-2">
      <li v-for="reference in shown" :key="reference.url">
        <a
          :href="reference.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex h-full flex-col gap-2 rounded-card border p-4 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        >
          <span
            class="flex items-center justify-between gap-2 font-semibold text-foreground-strong"
          >
            {{ host(reference.url) }}
            <ExternalLink aria-hidden="true" class="size-4 shrink-0" />
          </span>
          <span class="break-all text-sm text-muted-foreground">{{
            reference.url
          }}</span>
          <span class="sr-only">(opens in a new tab)</span>
          <span v-if="reference.tags.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in reference.tags"
              :key="tag"
              class="rounded-control bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
              >{{ tag }}</span
            >
          </span>
        </a>
      </li>
    </ul>
    <Button
      v-if="references.length > LIMIT"
      variant="outline"
      class="self-center"
      @click="showAll = !showAll"
    >
      {{ showAll ? "Show fewer references" : "Show all references" }}
    </Button>
  </div>
</template>
