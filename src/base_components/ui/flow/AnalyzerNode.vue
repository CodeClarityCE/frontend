<template>
  <div
    class="relative min-w-[280px] max-w-[320px] rounded-card border border-surface-inverse-raised bg-surface-inverse p-4 text-background shadow-raised"
  >
    <Handle
      v-for="(dependency, index) in data.plugin.depends_on"
      :id="dependency"
      :key="`input-${dependency}-${index}`"
      type="target"
      :position="Position.Left"
      :style="{ ...handleStyle, top: `${20 + index * 20}px` }"
    />

    <div class="mb-2 flex items-center gap-2">
      <Cpu aria-hidden="true" class="size-4 shrink-0" />
      <h3 class="truncate text-sm font-semibold">{{ data.label }}</h3>
    </div>

    <div class="flex flex-col gap-1">
      <p class="line-clamp-3 text-xs opacity-90">{{ data.description }}</p>
      <div class="rounded-sm bg-background/20 px-2 py-1 text-center text-xs">
        {{ data.version }}
      </div>
    </div>

    <Handle
      :id="data.label"
      type="source"
      :position="Position.Right"
      :style="handleStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { Cpu } from "@lucide/vue";
import { Handle, Position } from "@vue-flow/core";

import type { Plugin } from "@/codeclarity_components/organizations/analyzers/Plugin";

interface Props {
  data: {
    label: string;
    plugin: Plugin;
    version: string;
    description: string;
  };
}

defineProps<Props>();

// Connection points in the token colours.
const handleStyle = {
  backgroundColor: "var(--background)",
  border: "2px solid var(--foreground-strong)",
  width: "16px",
  height: "16px",
};
</script>
