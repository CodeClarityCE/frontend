<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import {
  Position,
  type Edge,
  type NodeMouseEvent,
  useVueFlow,
  VueFlow,
} from "@vue-flow/core";
import {
  computed,
  markRaw,
  onMounted,
  onUnmounted,
  ref,
  type Component,
} from "vue";
import AnalyzerNodeComponent from "@/base_components/ui/flow/AnalyzerNode.vue";
import ConfigNodeComponent from "@/base_components/ui/flow/ConfigNode.vue";
import type { Plugin } from "@/codeclarity_components/organizations/analyzers/Plugin";
import {
  createEdgesFromNodes,
  layoutNodes,
  type AnalyzerNode,
  type ConfigNode,
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
  const vueFlow = useVueFlow();
  vueFlowInstance = vueFlow;
} catch (error) {
  console.warn("Could not get VueFlow instance:", error);
}

const { fitView } = vueFlowInstance ?? {
  fitView: () => {
    /* no-op fallback */
  },
};

// Using markRaw to prevent Vue from making components reactive
const nodeTypes = {
  analyzer: markRaw(AnalyzerNodeComponent as Component),
  config: markRaw(ConfigNodeComponent as Component),
} as const;

// Context menu for adding nodes
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedNodes = ref<(AnalyzerNode | ConfigNode)[]>([]);

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
      } catch (error) {
        console.warn("Could not get VueFlow selected nodes:", error);
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
  try {
    const selectedNodesList = selection?.nodes ?? [];
    selectedNodes.value = selectedNodesList;
  } catch (error) {
    console.error("Error in onSelectionChange:", error);
  }
}

function onNodeClick(eventData: NodeMouseEvent): void {
  if (props.readonly) return;
  try {
    const node = eventData.node;

    if (node?.id) {
      const updatedNodes = props.nodes.map((n) => ({
        ...n,
        selected: n.id === node.id,
      })) as (AnalyzerNode | ConfigNode)[];

      void emit("update:nodes", updatedNodes);

      const foundNode = updatedNodes.find((n) => n.id === node.id);
      if (foundNode) {
        selectedNodes.value = [foundNode];
      }
    }
  } catch (error) {
    console.error("Error in onNodeClick:", error);
  }
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
  try {
    const mouseEvent = event.event;
    const node = event.node;

    if (mouseEvent) {
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
    }

    if (node) {
      deleteNode(node);
    }
  } catch (error) {
    console.error("Error in onNodeContextMenu:", error);
  }
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
  <div class="bg-white border border-slate-200/60 rounded-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Icon icon="solar:diagram-up-bold" class="w-5 h-5 text-theme-primary" />
        <h3 class="text-lg font-semibold text-theme-black">
          Workflow Designer
        </h3>
      </div>
      <div class="flex items-center gap-2 text-xs text-theme-gray">
        <Icon icon="solar:info-circle-bold" class="w-4 h-4" />
        <span>{{
          readonly
            ? "View workflow configuration"
            : "Design your analysis workflow visually"
        }}</span>
      </div>
    </div>

    <div>
      <div class="relative w-full h-[700px]">
        <VueFlow
          :nodes="nodes"
          :edges="edges"
          :node-types="nodeTypes"
          class="w-full h-full rounded-lg border-2 border-slate-300/60 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
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
          <Background pattern-color="#aaa" :gap="16" />
          <Controls />
        </VueFlow>

        <!-- Context Menu -->
        <div
          v-if="showContextMenu && !readonly"
          class="fixed bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-2xl shadow-slate-900/10 py-1 z-50 min-w-[280px]"
          :style="{
            left: contextMenuPosition.x + 'px',
            top: contextMenuPosition.y + 'px',
          }"
        >
          <div
            class="px-4 py-3 text-sm font-semibold text-theme-black border-b border-slate-200/60 bg-slate-50/50"
          >
            <div class="flex items-center gap-2">
              <Icon
                icon="solar:add-circle-bold"
                class="w-4 h-4 text-theme-primary"
              />
              Add Plugin
            </div>
          </div>
          <div class="max-h-48 overflow-y-auto py-1">
            <button
              v-for="plugin in availablePlugins"
              :key="plugin.name"
              class="w-full px-4 py-3 text-left text-sm hover:bg-theme-primary/5 hover:border-l-4 hover:border-l-theme-primary flex items-center gap-3 transition-all duration-200 border-l-4 border-l-transparent group"
              @click="addNodeToGraph(plugin)"
            >
              <div
                class="shrink-0 w-8 h-8 bg-theme-primary/10 rounded-lg flex items-center justify-center group-hover:bg-theme-primary/20 transition-colors duration-200"
              >
                <Icon
                  icon="solar:cpu-bolt-bold"
                  class="w-4 h-4 text-theme-primary"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div
                  class="font-semibold text-theme-black group-hover:text-theme-primary transition-colors duration-200"
                >
                  {{ plugin.name }}
                </div>
                <div class="text-xs text-theme-gray truncate mt-0.5">
                  {{ plugin.description }}
                </div>
              </div>
            </button>
            <div
              v-if="availablePlugins.length === 0"
              class="px-4 py-6 text-sm text-theme-gray text-center"
            >
              <Icon
                icon="solar:box-bold"
                class="w-8 h-8 text-theme-gray/50 mx-auto mb-2"
              />
              <div>All plugins already added</div>
            </div>
          </div>
        </div>

        <!-- Backdrop to close context menu -->
        <div
          v-if="showContextMenu && !readonly"
          class="fixed inset-0 z-40"
          @click="closeContextMenu"
        ></div>

        <!-- Status Info -->
        <div class="absolute bottom-4 left-4 z-10">
          <div
            class="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-slate-200/60"
          >
            <div class="flex items-center gap-6 text-xs text-theme-gray">
              <span class="flex items-center gap-1">
                <Icon
                  icon="solar:widget-bold"
                  class="w-3 h-3 text-theme-primary"
                />
                <span
                  >{{
                    nodes.filter((n) => n.type === "analyzer").length
                  }}
                  nodes</span
                >
              </span>
              <span class="flex items-center gap-1">
                <Icon
                  icon="solar:link-bold"
                  class="w-3 h-3 text-theme-primary"
                />
                <span>{{ edges.length }} connections</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Help Text -->
        <div class="absolute bottom-4 right-4 z-10">
          <div
            class="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-slate-200/60"
          >
            <div class="text-xs text-theme-gray">
              {{
                readonly
                  ? "Workflow view (read-only)"
                  : "Right-click canvas to add • Select & Delete key to remove"
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
