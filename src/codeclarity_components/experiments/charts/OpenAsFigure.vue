<script setup lang="ts">
import { computed, inject } from "vue";

import { Button } from "@/shadcn/ui/button";

import type { FigureDefinition } from "../experiment-figure.entity";

import { isInCatalog, OPEN_AS_FIGURE } from "./open-as-figure";

const props = defineProps<{ definition: FigureDefinition }>();

const composer = inject(OPEN_AS_FIGURE, null);

const offered = computed(() => {
  const catalog = composer?.catalog.value;
  return catalog ? isInCatalog(catalog, props.definition) : false;
});
</script>

<template>
  <Button
    v-if="offered"
    variant="outline"
    size="sm"
    data-testid="open-as-figure"
    @click="composer?.open(definition)"
  >
    Open as Figure
  </Button>
</template>
