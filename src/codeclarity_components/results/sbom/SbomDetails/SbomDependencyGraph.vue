<script lang="ts" setup>
import { Maximize, Minus, Plus } from "@lucide/vue";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import {
  type Edge,
  type Node,
  type NodeMouseEvent,
  VueFlow,
} from "@vue-flow/core";
import { MiniMap } from "@vue-flow/minimap";
import { type Component, markRaw, onMounted, ref } from "vue";

import DependencyNodeComponent from "@/base_components/ui/flow/DependencyNode.vue";
import { Skeleton } from "@/shadcn/ui/skeleton";
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

// The paths from the project root to one dependency, as a graph.
const props = defineProps<{
  dependency: DependencyDetails;
  analysisID: string;
  projectID: string;
}>();

const nodeTypes = {
  dependency: markRaw(DependencyNodeComponent as Component),
} as const;

const nodes = ref<Node<DependencyNodeData>[]>([]);
const edges = ref<Edge[]>([]);
const loading = ref(true);
const failed = ref(false);

const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

async function loadGraph(): Promise<void> {
  const target = `${props.dependency.name}@${props.dependency.version}`;
  try {
    if (!userStore.getDefaultOrg || !authStore.getToken)
      throw new Error("Missing auth context");
    const res = await resultsRepository.getDependencyGraph({
      orgId: userStore.getDefaultOrg.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: ".",
      dependency: target,
      bearerToken: authStore.getToken,
    });
    const layout = layoutDependencyGraph(res.data, target);
    nodes.value = layout.nodes;
    edges.value = layout.edges;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

// Opens the clicked dependency's own details page.
function onNodeClick(event: NodeMouseEvent): void {
  const data = event.node.data as DependencyNodeData;
  if (data.isVirtualRoot || data.isPruned) return;
  const url = new URL(window.location.href);
  url.searchParams.set("package_id", `${data.packageName}@${data.version}`);
  window.location.href = url.toString();
}

onMounted(() => {
  void loadGraph();
});

const LEGEND = [
  {
    label: "This dependency",
    swatch: "border-2 border-warning bg-warning-subtle",
  },
  {
    label: "Project root",
    swatch: "border-2 border-neutral bg-neutral-subtle",
  },
  {
    label: "Shown elsewhere in the graph",
    swatch: "border border-dashed border-muted-foreground bg-muted",
  },
];
</script>

<template>
  <div v-if="loading" role="status" aria-label="Loading the dependency graph">
    <Skeleton class="h-[600px] rounded-card" />
  </div>

  <div
    v-else-if="failed || nodes.length === 0"
    class="flex min-h-64 flex-col items-center justify-center gap-2 rounded-card border border-dashed p-8 text-center"
  >
    <h3 class="font-semibold text-foreground-strong">
      No dependency graph available
    </h3>
    <p class="max-w-md text-sm text-muted-foreground">
      There is no path data for this package. It may be a root dependency, or
      the analysis did not record its graph.
    </p>
  </div>

  <div v-else class="flex flex-col gap-3">
    <ul class="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <li
        v-for="item in LEGEND"
        :key="item.label"
        class="flex items-center gap-1.5"
      >
        <span
          aria-hidden="true"
          class="size-3 rounded-sm"
          :class="item.swatch"
        />
        {{ item.label }}
      </li>
      <li class="flex items-center gap-1.5">
        <span aria-hidden="true" class="h-0.5 w-5 rounded-full bg-warning" />
        Path to this dependency
      </li>
    </ul>
    <div
      class="h-[600px] overflow-hidden rounded-card border bg-background"
      role="group"
      :aria-label="`Dependency graph of ${dependency.name}: ${nodes.length} packages on the paths from the project root`"
    >
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
        class="size-full"
        @node-click="onNodeClick"
      >
        <Background pattern-color="var(--border)" :gap="20" />
        <Controls position="top-right" :show-interactive="false">
          <template #icon-zoom-in>
            <Plus aria-hidden="true" class="size-3" />
            <span class="sr-only">Zoom in</span>
          </template>
          <template #icon-zoom-out>
            <Minus aria-hidden="true" class="size-3" />
            <span class="sr-only">Zoom out</span>
          </template>
          <template #icon-fit-view>
            <Maximize aria-hidden="true" class="size-3" />
            <span class="sr-only">Fit the graph to the view</span>
          </template>
        </Controls>
        <MiniMap />
      </VueFlow>
    </div>
  </div>
</template>

<style scoped>
/* Controls large enough to meet the 24px target size. */
:deep(.vue-flow__controls-button) {
  width: 28px;
  height: 28px;
}

:deep(.vue-flow__controls-button:focus-visible) {
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
</style>
