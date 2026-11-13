<script lang="ts" setup>
import {
  Cpu,
  Link2,
  Maximize,
  Plus,
  Workflow,
  ZoomIn,
  ZoomOut,
} from "@lucide/vue";
import { Background } from "@vue-flow/background";
import { ControlButton, Controls } from "@vue-flow/controls";
import {
  type Edge,
  type NodeMouseEvent,
  Position,
  useVueFlow,
  VueFlow,
} from "@vue-flow/core";
import {
  type Component,
  computed,
  markRaw,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from "vue";

import AnalyzerNodeComponent from "@/base_components/ui/flow/AnalyzerNode.vue";
import ConfigNodeComponent from "@/base_components/ui/flow/ConfigNode.vue";
import type { Plugin } from "@/codeclarity_components/organizations/analyzers/Plugin";
import {
  type AnalyzerNode,
  type ConfigNode,
  createEdgesFromNodes,
  layoutNodes,
} from "@/utils/vueFlow";

import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";

const props = defineProps<{
  nodes: (AnalyzerNode | ConfigNode)[];
  edges: Edge[];
  plugins: Plugin[];
  readonly?: boolean;
}>();

const emit = defineEmits<{
  "update:nodes": [nodes: (AnalyzerNode | ConfigNode)[]];
  "update:edges": [edges: Edge[]];
}>();

let vueFlowInstance: ReturnType<typeof useVueFlow> | null = null;
try {
  vueFlowInstance = useVueFlow();
} catch {
  // Without an instance the designer still works, it just cannot fit the view.
}

const noop = (): void => {
  // Nothing to do without a canvas instance.
};
const { fitView, zoomIn, zoomOut } = vueFlowInstance ?? {
  fitView: noop,
  zoomIn: noop,
  zoomOut: noop,
};

// Using markRaw to prevent Vue from making components reactive
const nodeTypes = {
  analyzer: markRaw(AnalyzerNodeComponent as Component),
  config: markRaw(ConfigNodeComponent as Component),
} as const;

// Context menu for adding nodes
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedNodes = shallowRef<(AnalyzerNode | ConfigNode)[]>([]);

// Computed property that dynamically shows available plugins
const availablePlugins = computed(() => {
  const existingPluginNames = props.nodes
    .filter((n): n is AnalyzerNode => n.type === "analyzer")
    .map((n) => n.data.plugin.name);

  return props.plugins.filter(
    (plugin) =>
      !existingPluginNames.includes(plugin.name) &&
      !plugin.name.includes("notifier"),
  );
});

function onPaneContextMenu(event: MouseEvent): void {
  if (props.readonly) return;
  event.preventDefault();
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  showContextMenu.value = true;
}

function addNodeToGraph(plugin: Plugin): void {
  // Build all nodes including dependencies first
  const nodesToAdd = buildPluginWithDependencies(
    plugin,
    props.nodes,
    props.plugins,
  );

  if (nodesToAdd.length === 0) {
    showContextMenu.value = false;
    return;
  }

  // Add all nodes at once
  const allNodes = [...props.nodes, ...nodesToAdd];

  // Create edges and layout
  const currentNodes = allNodes.filter(
    (n): n is AnalyzerNode => n.type === "analyzer",
  );
  const newEdges = createEdgesFromNodes(currentNodes);
  const layoutedNodes = layoutNodes(allNodes);

  // Emit both updates
  void emit("update:nodes", layoutedNodes);
  void emit("update:edges", newEdges);

  // Fit view if available
  setTimeout(() => {
    if (typeof fitView === "function") {
      void fitView({ padding: 0.1 });
    }
  }, 100);

  showContextMenu.value = false;
}

function buildPluginWithDependencies(
  plugin: Plugin,
  existingNodes: (AnalyzerNode | ConfigNode)[],
  availablePlugins: Plugin[],
  processedPlugins = new Set<string>(),
): AnalyzerNode[] {
  // Avoid circular dependencies
  if (processedPlugins.has(plugin.name)) {
    return [];
  }
  processedPlugins.add(plugin.name);

  // Check if plugin is already added
  const existingPluginNames = existingNodes
    .filter((n): n is AnalyzerNode => n.type === "analyzer")
    .map((n) => n.data.plugin.name);

  if (existingPluginNames.includes(plugin.name)) {
    return [];
  }

  const nodesToAdd: AnalyzerNode[] = [];

  // First, add all dependencies recursively
  plugin.depends_on.forEach((dependencyName) => {
    const dependencyPlugin = availablePlugins.find(
      (p) => p.name === dependencyName,
    );
    if (dependencyPlugin) {
      const dependencyNodes = buildPluginWithDependencies(
        dependencyPlugin,
        [...existingNodes, ...nodesToAdd],
        availablePlugins,
        processedPlugins, // Pass the same set, don't create a new one
      );
      nodesToAdd.push(...dependencyNodes);
    }
  });

  // Then add the plugin itself
  const nodeId = `analyzer-${plugin.name}`;
  const flowElement = document.querySelector(".vue-flow");
  const flowRect = flowElement?.getBoundingClientRect();

  const canvasX = flowRect ? contextMenuPosition.value.x - flowRect.left : 200;
  const canvasY = flowRect ? contextMenuPosition.value.y - flowRect.top : 200;

  const newNode: AnalyzerNode = {
    id: nodeId,
    type: "analyzer",
    position: {
      x: canvasX,
      y: canvasY,
    },
    data: {
      label: plugin.name,
      plugin,
      version: plugin.version,
      description: plugin.description,
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    selectable: true,
    deletable: true,
  };

  nodesToAdd.push(newNode);
  return nodesToAdd;
}

function closeContextMenu(): void {
  showContextMenu.value = false;
}

function handleKeyDown(event: KeyboardEvent): void {
  if (props.readonly) return;
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();

    let nodesToDelete: (AnalyzerNode | ConfigNode)[] = [];

    if (selectedNodes.value.length > 0) {
      nodesToDelete = selectedNodes.value;
    }

    if (nodesToDelete.length === 0 && vueFlowInstance) {
      try {
        const instance = vueFlowInstance as unknown as {
          getSelectedNodes?: { value: (AnalyzerNode | ConfigNode)[] };
          selectedNodes?: { value: (AnalyzerNode | ConfigNode)[] };
        };
        const vueFlowSelected =
          instance.getSelectedNodes?.value ??
          instance.selectedNodes?.value ??
          [];
        if (vueFlowSelected.length > 0) {
          nodesToDelete = vueFlowSelected;
        }
      } catch {
        // Fall back to the nodes marked selected below.
      }
    }

    if (nodesToDelete.length === 0) {
      const selectedFromArray = props.nodes.filter(
        (n) => "selected" in n && n.selected === true,
      );
      if (selectedFromArray.length > 0) {
        nodesToDelete = selectedFromArray;
      }
    }

    if (nodesToDelete.length > 0) {
      nodesToDelete.forEach((node) => {
        deleteNode(node);
      });
      selectedNodes.value = [];
    }
  }
}

function onSelectionChange(selection: {
  nodes?: (AnalyzerNode | ConfigNode)[];
}): void {
  selectedNodes.value = selection?.nodes ?? [];
}

function onNodeClick(eventData: NodeMouseEvent): void {
  if (props.readonly) return;
  const node = eventData.node;
  if (!node?.id) return;
  const updatedNodes = props.nodes.map((n) => ({
    ...n,
    selected: n.id === node.id,
  })) as (AnalyzerNode | ConfigNode)[];
  void emit("update:nodes", updatedNodes);
  const foundNode = updatedNodes.find((n) => n.id === node.id);
  if (foundNode) selectedNodes.value = [foundNode];
}

function deleteNode(node: { id?: string }): void {
  if (!node?.id) {
    return;
  }

  const filteredNodes = props.nodes.filter((n) => n.id !== node.id);
  const filteredEdges = props.edges.filter(
    (e) => e.source !== node.id && e.target !== node.id,
  );

  const remainingNodes = filteredNodes.filter(
    (n): n is AnalyzerNode => n.type === "analyzer",
  );

  if (remainingNodes.length > 0) {
    const newEdges = createEdgesFromNodes(remainingNodes);
    const layoutedNodes = layoutNodes(filteredNodes);
    void emit("update:nodes", layoutedNodes);
    void emit("update:edges", newEdges);
    setTimeout(() => {
      void fitView({ padding: 0.1 });
    }, 100);
  } else {
    void emit("update:nodes", filteredNodes);
    void emit("update:edges", filteredEdges);
  }
}

function onNodeContextMenu(event: NodeMouseEvent): void {
  if (props.readonly) return;
  event.event.preventDefault();
  event.event.stopPropagation();
  deleteNode(event.node);
}

onMounted(() => {
  if (!props.readonly) {
    document.addEventListener("keydown", handleKeyDown);
  }
});

onUnmounted(() => {
  if (!props.readonly) {
    document.removeEventListener("keydown", handleKeyDown);
  }
});
</script>
<template>
  <div class="relative h-[700px] w-full">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      class="workflow-canvas h-full w-full rounded-card border bg-background"
      :default-viewport="{ zoom: 0.8 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :nodes-selectable="!readonly"
      :multi-selection-key-code="['Control', 'Meta']"
      @pane-context-menu="onPaneContextMenu"
      @node-context-menu="onNodeContextMenu"
      @selection-change="onSelectionChange"
      @node-click="onNodeClick"
    >
      <Background :gap="16" />
      <Controls
        :show-zoom="false"
        :show-fit-view="false"
        :show-interactive="false"
      >
        <ControlButton aria-label="Zoom in" @click="zoomIn()">
          <ZoomIn aria-hidden="true" />
        </ControlButton>
        <ControlButton aria-label="Zoom out" @click="zoomOut()">
          <ZoomOut aria-hidden="true" />
        </ControlButton>
        <ControlButton aria-label="Fit view" @click="fitView()">
          <Maximize aria-hidden="true" />
        </ControlButton>
      </Controls>
    </VueFlow>

    <!-- Menu to add a plugin where the user right-clicked -->
    <div
      v-if="showContextMenu && !readonly"
      role="menu"
      aria-label="Add plugin"
      class="fixed z-50 min-w-[280px] rounded-card border bg-popover py-1 text-popover-foreground shadow-raised"
      :style="{
        left: contextMenuPosition.x + 'px',
        top: contextMenuPosition.y + 'px',
      }"
    >
      <div
        class="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold text-foreground-strong"
      >
        <Plus aria-hidden="true" class="size-4" />
        Add plugin
      </div>
      <div class="max-h-48 overflow-y-auto py-1">
        <button
          v-for="plugin in availablePlugins"
          :key="plugin.name"
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          @click="addNodeToGraph(plugin)"
        >
          <Cpu
            aria-hidden="true"
            class="size-4 shrink-0 text-muted-foreground"
          />
          <span class="flex min-w-0 flex-col">
            <span class="font-semibold text-foreground-strong">
              {{ plugin.name }}
            </span>
            <span class="truncate text-xs text-muted-foreground">
              {{ plugin.description }}
            </span>
          </span>
        </button>
        <p
          v-if="availablePlugins.length === 0"
          class="px-4 py-6 text-center text-sm text-muted-foreground"
        >
          Every plugin is already in the workflow
        </p>
      </div>
    </div>

    <!-- Backdrop to close the menu -->
    <div
      v-if="showContextMenu && !readonly"
      class="fixed inset-0 z-40"
      @click="closeContextMenu"
    ></div>

    <div
      class="absolute left-4 top-4 z-10 flex items-center gap-6 rounded-md border bg-background px-4 py-2 text-xs text-muted-foreground shadow-card"
    >
      <span class="flex items-center gap-1">
        <Workflow aria-hidden="true" class="size-3" />
        {{ nodes.filter((n) => n.type === "analyzer").length }} plugins
      </span>
      <span class="flex items-center gap-1">
        <Link2 aria-hidden="true" class="size-3" />
        {{ edges.length }} connections
      </span>
    </div>
    <p
      v-if="readonly"
      class="absolute right-4 top-4 z-10 rounded-md border bg-background px-4 py-2 text-xs text-muted-foreground shadow-card"
    >
      Read-only view
    </p>
  </div>
</template>

<style>
/* Canvas dots and controls drawn with the design tokens. */
.workflow-canvas .vue-flow__background circle {
  fill: var(--border);
}
.workflow-canvas .vue-flow__controls {
  display: flex;
  gap: 0.25rem;
}
.workflow-canvas .vue-flow__controls-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 2px);
  background: var(--background);
  color: var(--foreground);
}
.workflow-canvas .vue-flow__controls-button svg {
  width: 1rem;
  height: 1rem;
}
.workflow-canvas .vue-flow__controls-button svg {
  fill: none;
}
.workflow-canvas .vue-flow__controls-button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.workflow-canvas .vue-flow__controls-button:hover {
  background: var(--muted);
}
</style>
