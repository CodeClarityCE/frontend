<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";

import type { DependencyNodeData } from "@/utils/dependencyGraphLayout";

interface Props {
  data: DependencyNodeData;
}

defineProps<Props>();
</script>

<template>
  <div
    class="dependency-node"
    :class="{
      target: data.isTarget,
      pruned: data.isPruned,
      'virtual-root': data.isVirtualRoot,
    }"
  >
    <Handle type="target" :position="Position.Left" class="handle" />

    <div class="node-body">
      <div class="node-name" :title="data.label">
        {{ data.isVirtualRoot ? "ROOT" : data.packageName }}
      </div>
      <div v-if="!data.isVirtualRoot && data.version" class="node-version">
        {{ data.version }}
      </div>
      <span
        v-if="data.depth === 1 && (data.isProd || data.isDev)"
        class="node-badge"
        :class="data.isDev ? 'dev' : 'prod'"
      >
        {{ data.isDev ? "DEV" : "PROD" }}
      </span>
      <div
        v-if="data.isPruned"
        class="pruned-indicator"
        title="Shown elsewhere in tree"
      >
        ...
      </div>
    </div>

    <Handle type="source" :position="Position.Right" class="handle" />
  </div>
</template>

<style scoped>
.dependency-node {
  position: relative;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  min-width: 120px;
  max-width: 200px;
  cursor: pointer;
  transition:
    border-color 150ms ease-in-out,
    box-shadow 150ms ease-in-out;
}

.dependency-node:hover {
  border-color: var(--muted-foreground);
  box-shadow: var(--shadow-card);
}

.dependency-node.target {
  border-color: var(--warning);
  border-width: 2px;
  background: var(--warning-subtle);
}

.dependency-node.pruned {
  border-style: dashed;
  border-color: var(--muted-foreground);
  background: var(--muted);
}

.dependency-node.virtual-root {
  border: 2px solid var(--neutral);
  background: var(--neutral-subtle);
}

.node-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.node-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--foreground-strong);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.target .node-name {
  color: var(--warning);
  font-weight: 700;
}

.pruned .node-name {
  color: var(--muted-foreground);
  font-weight: 400;
}

.virtual-root .node-name {
  color: var(--neutral);
  font-weight: 700;
}

.node-version {
  font-size: 10px;
  color: var(--muted-foreground);
  font-family: var(--font-mono);
}

.node-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.node-badge.prod {
  background: var(--success-subtle);
  color: var(--success);
}

.node-badge.dev {
  background: var(--neutral-subtle);
  color: var(--neutral);
}

.pruned-indicator {
  font-size: 10px;
  color: var(--muted-foreground);
  letter-spacing: 2px;
}

.handle {
  width: 6px;
  height: 6px;
  background: var(--border);
  border: 1px solid var(--muted-foreground);
}

.target .handle {
  background: var(--warning-subtle);
  border-color: var(--warning);
}

@media (prefers-reduced-motion: reduce) {
  .dependency-node {
    transition: none;
  }
}
</style>
