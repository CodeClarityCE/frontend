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
  background: white;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  min-width: 120px;
  max-width: 200px;
  cursor: pointer;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.dependency-node:hover {
  border-color: #9ca3af;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dependency-node.target {
  border-color: #f59e0b;
  border-width: 2px;
  background: #fffbeb;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}

.dependency-node.target:hover {
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
}

.dependency-node.pruned {
  border-style: dashed;
  border-color: #cbd5e1;
  background: #f8fafc;
  opacity: 0.7;
}

.dependency-node.virtual-root {
  border-color: #3b82f6;
  background: #eff6ff;
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
  color: #1f2937;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.target .node-name {
  color: #92400e;
  font-weight: 700;
}

.pruned .node-name {
  color: #64748b;
  font-weight: 400;
}

.virtual-root .node-name {
  color: #1e40af;
  font-weight: 700;
}

.node-version {
  font-size: 10px;
  color: #6b7280;
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
}

.node-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.node-badge.prod {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.node-badge.dev {
  background: #f3e8ff;
  color: #7c3aed;
  border: 1px solid #c4b5fd;
}

.pruned-indicator {
  font-size: 10px;
  color: #94a3b8;
  letter-spacing: 2px;
}

.handle {
  width: 6px;
  height: 6px;
  background: #d1d5db;
  border: 1px solid #9ca3af;
}

.target .handle {
  background: #fbbf24;
  border-color: #f59e0b;
}
</style>
