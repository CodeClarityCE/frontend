<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import {
  type Edge,
  type Node,
  type NodeMouseEvent,
  VueFlow,
} from "@vue-flow/core";
import { MiniMap } from "@vue-flow/minimap";
import { type Component, markRaw, onMounted, type PropType, ref } from "vue";

import DependencyNodeComponent from "@/base_components/ui/flow/DependencyNode.vue";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import {
  type DependencyNodeData,
  layoutDependencyGraph,
} from "@/utils/dependencyGraphLayout";

import { ResultsRepository } from "../../results.repository";

import { type DependencyDetails } from "./SbomDetails";

import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";

const props = defineProps({
  dependency: {
    type: Object as PropType<DependencyDetails>,
    required: true,
  },
  analysisID: {
    type: String,
    required: true,
  },
  projectID: {
    type: String,
    required: true,
  },
});

const nodeTypes = {
  dependency: markRaw(DependencyNodeComponent as Component),
} as const;

const nodes = ref<Node<DependencyNodeData>[]>([]);
const edges = ref<Edge[]>([]);
const loading = ref(true);
const hasError = ref(false);

const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

async function loadGraph(): Promise<void> {
  loading.value = true;
  hasError.value = false;

  try {
    if (!userStore.getDefaultOrg || !authStore.getToken) {
      throw new Error("Missing auth context");
    }

    const res = await resultsRepository.getDependencyGraph({
      orgId: userStore.getDefaultOrg.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: ".",
      dependency: `${props.dependency.name}@${props.dependency.version}`,
      bearerToken: authStore.getToken,
    });

    const targetDep = `${props.dependency.name}@${props.dependency.version}`;
    const layout = layoutDependencyGraph(res.data, targetDep);
    nodes.value = layout.nodes;
    edges.value = layout.edges;
  } catch (e) {
    console.error("Error loading dependency graph:", e);
    hasError.value = true;
  } finally {
    loading.value = false;
  }
}

function onNodeClick(event: NodeMouseEvent): void {
  const nodeData = event.node.data as DependencyNodeData;
  if (nodeData.isVirtualRoot || nodeData.isPruned) return;

  // Update the URL to navigate to the clicked dependency
  const packageId = `${nodeData.packageName}@${nodeData.version}`;
  const url = new URL(window.location.href);
  url.searchParams.set("package_id", packageId);
  window.location.href = url.toString();
}

onMounted(() => {
  void loadGraph();
});
</script>

<template>
  <div class="dependency-graph-container">
    <!-- Loading -->
    <div v-if="loading" class="graph-placeholder">
      <Icon icon="solar:loading-bold" class="animate-spin placeholder-icon" />
      <p class="placeholder-text">Loading dependency graph...</p>
    </div>

    <!-- Error / empty -->
    <div v-else-if="hasError || nodes.length === 0" class="graph-placeholder">
      <Icon icon="material-symbols:data-exploration" class="placeholder-icon" />
      <h3 class="placeholder-title">No dependency graph available</h3>
      <p class="placeholder-text">
        Could not find dependency relationship data for this package. This might
        occur if the package is a root dependency or if graph data is not
        available.
      </p>
    </div>

    <!-- Graph -->
    <div v-else class="graph-wrapper">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :node-types="nodeTypes"
        :default-viewport="{ zoom: 0.75 }"
        :min-zoom="0.05"
        :max-zoom="2"
        fit-view-on-init
        :nodes-draggable="false"
        :nodes-connectable="false"
        class="dep-flow"
        @node-click="onNodeClick"
      >
        <Background pattern-color="#e5e7eb" :gap="20" />
        <Controls position="top-right" />
        <MiniMap />
      </VueFlow>

      <!-- Legend -->
      <div class="graph-legend">
        <div class="legend-item">
          <span class="legend-dot target-dot"></span>
          <span class="legend-label">Target dependency</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot root-dot"></span>
          <span class="legend-label">Project root</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot pruned-dot"></span>
          <span class="legend-label">Duplicate (shown elsewhere)</span>
        </div>
        <div class="legend-item">
          <span class="legend-line animated-line"></span>
          <span class="legend-label">Path to target</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dependency-graph-container {
  width: 100%;
  min-height: 600px;
}

.graph-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.placeholder-icon {
  font-size: 3rem;
  color: #9ca3af;
}

.placeholder-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.placeholder-text {
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 400px;
  margin: 0;
  line-height: 1.5;
}

.graph-wrapper {
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.dep-flow {
  width: 100%;
  height: 100%;
}

/* Legend overlay */
.graph-legend {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 1rem;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  z-index: 5;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.target-dot {
  background: #f59e0b;
  border: 1.5px solid #d97706;
}

.root-dot {
  background: #3b82f6;
  border: 1.5px solid #2563eb;
}

.pruned-dot {
  background: #e2e8f0;
  border: 1.5px dashed #94a3b8;
}

.legend-line {
  width: 20px;
  height: 3px;
  background: #f59e0b;
  border-radius: 2px;
  flex-shrink: 0;
}

.animated-line {
  background: linear-gradient(90deg, #f59e0b 50%, transparent 50%);
  background-size: 8px 3px;
  animation: dash-move 0.6s linear infinite;
}

@keyframes dash-move {
  to {
    background-position: 8px 0;
  }
}

.legend-label {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .graph-wrapper {
    height: 450px;
  }

  .graph-legend {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
