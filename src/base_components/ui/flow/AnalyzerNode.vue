<template>
  <div class="analyzer-node">
    <Handle
      v-for="(dependency, index) in data.plugin.depends_on"
      :id="dependency"
      :key="`input-${dependency}-${index}`"
      type="target"
      :position="Position.Left"
      :style="{
        top: `${20 + index * 20}px`,
        backgroundColor: 'white',
        border: '2px solid black',
        width: '16px',
        height: '16px',
      }"
    />

    <div class="node-header">
      <Icon icon="solar:cpu-bolt-bold" class="text-white" />
      <h3 class="node-title">{{ data.label }}</h3>
    </div>

    <div class="node-content">
      <p class="node-description">{{ data.description }}</p>
      <div class="node-version">{{ data.version }}</div>
    </div>

    <Handle
      :id="data.label"
      type="source"
      :position="Position.Right"
      :style="{
        backgroundColor: 'white',
        border: '2px solid black',
        width: '16px',
        height: '16px',
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
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
</script>

<style scoped>
.analyzer-node {
  position: relative;
  background-color: #000000;
  color: white;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  min-width: 280px;
  max-width: 320px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.node-title {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.node-description {
  font-size: 0.75rem;
  line-height: 1rem;
  opacity: 0.9;
  line-height: 1.25;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 3.6em;
}

.node-version {
  font-size: 0.75rem;
  line-height: 1rem;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  text-align: center;
}

/* Handle styles are applied via inline styles in template */
</style>
