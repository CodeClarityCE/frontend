<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { onMounted, onUnmounted, ref, computed, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { AnalyzerRepository } from '@/codeclarity_components/organizations/analyzers/AnalyzerRepository';
import { PluginRepository } from '@/codeclarity_components/organizations/analyzers/PluginRepository';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { Form } from 'vee-validate';
import * as z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { storeToRefs } from 'pinia';
import FormTextField from '@/base_components/forms/FormTextField.vue';
import { VueFlow, useVueFlow, Position, type Edge } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import type { Plugin } from '@/codeclarity_components/organizations/analyzers/Plugin';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import {
    retrieveWorkflowSteps,
    layoutNodes,
    createEdgesFromNodes,
    type AnalyzerNode,
    type ConfigNode
} from '@/utils/vueFlow';
import AnalyzerNodeComponent from '@/base_components/ui/flow/AnalyzerNode.vue';
import ConfigNodeComponent from '@/base_components/ui/flow/ConfigNode.vue';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import { Icon } from '@iconify/vue';

const orgId: Ref<string> = ref('');
const orgInfo: Ref<Organization | undefined> = ref();

// Repositories
const analyzerRepo: AnalyzerRepository = new AnalyzerRepository();
const pluginRepo: PluginRepository = new PluginRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const { defaultOrg } = storeToRefs(userStore);

// Error Handling
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string> = ref('');

// Form Data
const name: Ref<string> = ref('');
const description: Ref<string> = ref('');
const plugins: Ref<Array<Plugin>> = ref([]);
const nodes: Ref<(AnalyzerNode | ConfigNode)[]> = ref([]);
const edges: Ref<Edge[]> = ref([]);
const selectedNodes: Ref<any[]> = ref([]);

// Try to get VueFlow instance with selected nodes
let vueFlowInstance: any = null;
try {
    const vueFlow = useVueFlow();
    vueFlowInstance = vueFlow;
    console.log('VueFlow instance:', vueFlow);
} catch (error) {
    console.log('Could not get VueFlow instance:', error);
}

const { fitView } = vueFlowInstance || { fitView: () => {} };

// Form Validation
const formValidationSchema = toTypedSchema(
    z.object({
        name: z.string().min(5, 'Please enter a name (minimum 5 characters)'),
        description: z.string().min(10, 'Please enter a description (minimum 10 characters)')
    })
);

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

// Methods
async function submit() {
    const arr = retrieveWorkflowSteps(nodes.value, edges.value);

    try {
        const resp = await analyzerRepo.createAnalyzer({
            orgId: defaultOrg!.value!.id,
            data: {
                name: name.value,
                description: description.value,
                steps: arr
            },
            bearerToken: authStore.getToken ?? ''
        });
        console.error(resp);
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        router.back();
    }
}

async function init() {
    const route = useRoute();
    const _orgId = route.params.orgId;

    if (!_orgId) {
        router.back();
    }

    if (!authStore.getToken) {
        throw new Error('No default org selected');
    }

    if (typeof _orgId == 'string') {
        orgId.value = _orgId;
    } else {
        router.back();
    }

    try {
        const resp = await pluginRepo.geAllPlugins({
            bearerToken: authStore.getToken
        });
        plugins.value = resp.data;

        // Start with SBOM and vulnerability plugins by default
        const defaultNodes: AnalyzerNode[] = [];

        // Add SBOM plugin
        const sbomPlugin = plugins.value.find(
            (p) => p.name.includes('sbom') || p.name.includes('js-sbom')
        );
        if (sbomPlugin) {
            const sbomNodeId = `analyzer-${sbomPlugin.name}`;
            const sbomNode: AnalyzerNode = {
                id: sbomNodeId,
                type: 'analyzer',
                position: { x: 0, y: 0 }, // Will be positioned by layoutNodes
                data: {
                    label: sbomPlugin.name,
                    plugin: sbomPlugin,
                    version: sbomPlugin.version,
                    description: sbomPlugin.description
                },
                targetPosition: Position.Left,
                sourcePosition: Position.Right,
                selectable: true,
                deletable: true
            };
            defaultNodes.push(sbomNode);
            console.log('Added SBOM plugin by default:', sbomPlugin.name);
        }

        // Add vulnerability plugin
        const vulnPlugin = plugins.value.find(
            (p) =>
                p.name.includes('vuln') ||
                p.name.includes('vulnerability') ||
                p.name.includes('js-vuln-finder')
        );
        if (vulnPlugin) {
            const vulnNodeId = `analyzer-${vulnPlugin.name}`;
            const vulnNode: AnalyzerNode = {
                id: vulnNodeId,
                type: 'analyzer',
                position: { x: 0, y: 0 }, // Will be positioned by layoutNodes
                data: {
                    label: vulnPlugin.name,
                    plugin: vulnPlugin,
                    version: vulnPlugin.version,
                    description: vulnPlugin.description
                },
                targetPosition: Position.Left,
                sourcePosition: Position.Right,
                selectable: true,
                deletable: true
            };
            defaultNodes.push(vulnNode);
            console.log('Added vulnerability plugin by default:', vulnPlugin.name);
        }

        if (defaultNodes.length > 0) {
            nodes.value = defaultNodes;
            edges.value = createEdgesFromNodes(defaultNodes);
            nodes.value = layoutNodes(nodes.value);

            setTimeout(() => {
                fitView({ padding: 0.1 });
            }, 100);

            console.log(
                'Added default plugins:',
                defaultNodes.map((n) => n.data.plugin.name)
            );
        } else {
            // Start with empty graph if no default plugins found
            nodes.value = [];
            edges.value = [];
            console.log('No default plugins found, starting with empty graph');
        }
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    }
}

init();

const nodeTypes = {
    analyzer: AnalyzerNodeComponent,
    config: ConfigNodeComponent
};

// Context menu for adding nodes
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// Computed property that dynamically shows available plugins
const availablePlugins = computed(() => {
    const existingPluginNames = nodes.value
        .filter((n): n is AnalyzerNode => n.type === 'analyzer')
        .map((n) => n.data.plugin.name);

    console.log('Computing available plugins. Current nodes:', existingPluginNames);
    console.log(
        'All plugins:',
        plugins.value.map((p) => p.name)
    );

    const available = plugins.value.filter(
        (plugin) => !existingPluginNames.includes(plugin.name) && !plugin.name.includes('notifier')
    );

    console.log(
        'Available plugins:',
        available.map((p) => p.name)
    );
    return available;
});

function onPaneContextMenu(event: MouseEvent) {
    event.preventDefault();
    contextMenuPosition.value = { x: event.clientX, y: event.clientY };
    showContextMenu.value = true;
}

function addNodeToGraph(plugin: Plugin) {
    const nodeId = `analyzer-${plugin.name}`;

    // Get canvas position relative to the flow
    const flowElement = document.querySelector('.vue-flow');
    const flowRect = flowElement?.getBoundingClientRect();

    const canvasX = flowRect ? contextMenuPosition.value.x - flowRect.left : 200;
    const canvasY = flowRect ? contextMenuPosition.value.y - flowRect.top : 200;

    const newNode: AnalyzerNode = {
        id: nodeId,
        type: 'analyzer',
        position: {
            x: canvasX,
            y: canvasY
        },
        data: {
            label: plugin.name,
            plugin,
            version: plugin.version,
            description: plugin.description
        },
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        selectable: true,
        deletable: true
    };

    console.log('Adding node:', newNode);
    nodes.value.push(newNode);

    // Create edges and re-layout
    const currentNodes = nodes.value.filter((n): n is AnalyzerNode => n.type === 'analyzer');
    console.log(
        'Current nodes after add:',
        currentNodes.map((n) => n.data.plugin.name)
    );

    edges.value = createEdgesFromNodes(currentNodes);
    nodes.value = layoutNodes(nodes.value);

    setTimeout(() => {
        fitView({ padding: 0.1 });
    }, 100);

    showContextMenu.value = false;
}

function closeContextMenu() {
    showContextMenu.value = false;
}

// Handle keyboard delete
function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();

        console.log('Delete key pressed');
        console.log('Our tracked selected nodes:', selectedNodes.value);

        // Try multiple ways to get selected nodes
        let nodesToDelete: any[] = [];

        // Method 1: Our manual tracking
        if (selectedNodes.value.length > 0) {
            nodesToDelete = selectedNodes.value;
            console.log('Using manually tracked nodes:', nodesToDelete.length);
        }

        // Method 2: Try VueFlow instance
        if (nodesToDelete.length === 0 && vueFlowInstance) {
            try {
                const vueFlowSelected =
                    vueFlowInstance.getSelectedNodes?.value ||
                    vueFlowInstance.selectedNodes?.value ||
                    [];
                if (vueFlowSelected.length > 0) {
                    nodesToDelete = vueFlowSelected;
                    console.log('Using VueFlow selected nodes:', nodesToDelete.length);
                }
            } catch (error) {
                console.log('Could not get VueFlow selected nodes:', error);
            }
        }

        // Method 3: Check nodes array for selected property
        if (nodesToDelete.length === 0) {
            const selectedFromArray = nodes.value.filter((n: any) => n.selected === true);
            if (selectedFromArray.length > 0) {
                nodesToDelete = selectedFromArray;
                console.log('Using nodes with selected=true:', nodesToDelete.length);
            }
        }

        console.log('Final nodes to delete:', nodesToDelete);

        if (nodesToDelete.length > 0) {
            nodesToDelete.forEach((node) => {
                deleteNode(node);
            });
            selectedNodes.value = []; // Clear selection after deletion
        } else {
            console.log('No nodes selected for deletion by any method');
        }
    }
}

// Handle selection changes
function onSelectionChange(selection: any) {
    try {
        console.log('Selection change event:', selection);
        const selectedNodesList = selection?.nodes || [];
        selectedNodes.value = selectedNodesList;
        console.log(
            'Selection changed:',
            selectedNodesList.map((n: any) => n?.data?.plugin?.name || n?.id || 'unknown')
        );
    } catch (error) {
        console.error('Error in onSelectionChange:', error);
        console.log('Selection object:', selection);
    }
}

// Handle node clicks - Vue Flow uses single argument pattern
function onNodeClick(eventData: any) {
    try {
        console.log('Node click event data:', eventData);

        // Vue Flow might pass { event, node } or just the node
        let node = null;

        if (eventData.node) {
            // Pattern: { event, node }
            node = eventData.node;
            console.log('Found node in .node property:', node);
        } else if (eventData.data) {
            // Pattern: node directly
            node = eventData;
            console.log('Event data is the node directly:', node);
        } else if (eventData.id) {
            // Pattern: node with id property
            node = eventData;
            console.log('Event data has id, treating as node:', node);
        }

        if (node?.id) {
            console.log('Processing node click:', node.data?.plugin?.name || node.id);

            // Manual selection tracking - clear all selections first
            nodes.value.forEach((n: any) => {
                if ('selected' in n) n.selected = false;
            });

            // Find and select the clicked node
            const foundNode = nodes.value.find((n) => n.id === node.id) as any;
            if (foundNode) {
                foundNode.selected = true;
                selectedNodes.value = [foundNode];
                console.log(
                    'Manually selected node:',
                    foundNode.type === 'analyzer' ? foundNode.data.plugin.name : foundNode.id
                );
            } else {
                console.log('Could not find node in nodes array');
            }
        } else {
            console.log('No valid node found in event data');
        }
    } catch (error) {
        console.error('Error in onNodeClick:', error);
        console.log('Event data:', eventData);
    }
}

function deleteNode(node: any) {
    try {
        console.log('Deleting node:', node?.data?.plugin?.name || 'unknown', 'ID:', node?.id);
        console.log('Node object:', node);
        console.log('Nodes before deletion:', nodes.value.length);

        if (!node?.id) {
            console.error('Cannot delete node: missing ID');
            return;
        }

        // Remove node and its edges
        const oldNodesLength = nodes.value.length;
        nodes.value = nodes.value.filter((n) => n.id !== node.id);
        console.log(
            'Nodes after deletion:',
            nodes.value.length,
            'Removed:',
            oldNodesLength - nodes.value.length
        );

        edges.value = edges.value.filter((e) => e.source !== node.id && e.target !== node.id);

        // Recreate edges for remaining nodes
        const remainingNodes = nodes.value.filter((n): n is AnalyzerNode => n.type === 'analyzer');
        console.log(
            'Remaining analyzer nodes:',
            remainingNodes.map((n) => n?.data?.plugin?.name || 'unknown')
        );

        if (remainingNodes.length > 0) {
            edges.value = createEdgesFromNodes(remainingNodes);
            nodes.value = layoutNodes(nodes.value);
            setTimeout(() => {
                fitView({ padding: 0.1 });
            }, 100);
        }

        console.log('Node deleted successfully');
    } catch (error) {
        console.error('Error in deleteNode:', error);
        console.log('Failed to delete node:', node);
    }
}

// Right-click delete functionality
function onNodeContextMenu(event: any) {
    try {
        console.log('Node context menu event raw:', event);
        const mouseEvent = event.event || event;
        const node = event.node || (event.target ? event : null);

        if (mouseEvent?.preventDefault) {
            mouseEvent.preventDefault();
            mouseEvent.stopPropagation();
        }

        console.log('Right-click on node:', node?.data?.plugin?.name || 'unknown');

        if (node) {
            deleteNode(node);
        } else {
            console.error('No node found in context menu event');
        }
    } catch (error) {
        console.error('Error in onNodeContextMenu:', error);
        console.log('Context menu event:', event);
    }
}

// Add keyboard event listener
onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
});

// Clean up event listener
onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
});
</script>
<template>
    <div class="min-h-screen bg-slate-50">
        <!-- Page Header -->
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)" />

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Unified Analyzer Creation Card -->
            <InfoCard
                title="Create Analyzer"
                description="Define your analyzer details and build the analysis workflow"
                icon="solar:settings-bold"
                variant="primary"
                class="shadow-lg"
            >
                <Form
                    id="form"
                    class="space-y-8"
                    :validation-schema="formValidationSchema"
                    @submit="submit"
                >
                    <!-- Basic Information Section -->
                    <div class="bg-white border border-slate-200/60 rounded-lg p-6">
                        <div class="flex items-center gap-2 mb-4">
                            <Icon
                                icon="solar:info-circle-bold"
                                class="w-5 h-5 text-theme-primary"
                            />
                            <h3 class="text-lg font-semibold text-theme-black">
                                Basic Information
                            </h3>
                        </div>

                        <div class="grid md:grid-cols-2 gap-4">
                            <!-- Name Field -->
                            <FormTextField
                                v-model="name"
                                :placeholder="'Enter analyzer name...'"
                                :type="'text'"
                                :name="'name'"
                            >
                                <template #name>
                                    <span class="block text-sm font-semibold text-theme-black mb-2">
                                        Analyzer Name
                                        <span class="text-red-500">*</span>
                                    </span>
                                </template>
                            </FormTextField>

                            <!-- Description Field -->
                            <FormTextField
                                v-model="description"
                                :placeholder="'Enter analyzer description...'"
                                :type="'text'"
                                :name="'description'"
                            >
                                <template #name>
                                    <span class="block text-sm font-semibold text-theme-black mb-2">
                                        Description
                                        <span class="text-red-500">*</span>
                                    </span>
                                </template>
                            </FormTextField>
                        </div>
                    </div>

                    <!-- Workflow Designer Section -->
                    <div class="bg-white border border-slate-200/60 rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-2">
                                <Icon
                                    icon="solar:diagram-up-bold"
                                    class="w-5 h-5 text-theme-primary"
                                />
                                <h3 class="text-lg font-semibold text-theme-black">
                                    Workflow Designer
                                </h3>
                            </div>
                            <div class="flex items-center gap-2 text-xs text-theme-gray">
                                <Icon icon="solar:info-circle-bold" class="w-4 h-4" />
                                <span>Design your analysis workflow visually</span>
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
                                    :nodes-selectable="true"
                                    :multi-selection-key-code="['Control', 'Meta']"
                                    @pane-context-menu="onPaneContextMenu"
                                    @node-context-menu="onNodeContextMenu"
                                    @selection-change="onSelectionChange"
                                    @node-click="onNodeClick"
                                >
                                    <Background pattern-color="#aaa" :gap="16" />
                                    <Controls />
                                    <!-- <MiniMap /> -->
                                </VueFlow>

                                <!-- Context Menu -->
                                <div
                                    v-if="showContextMenu"
                                    class="fixed bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-2xl shadow-slate-900/10 py-1 z-50 min-w-[280px]"
                                    :style="{
                                        left: contextMenuPosition.x + 'px',
                                        top: contextMenuPosition.y + 'px'
                                    }"
                                >
                                    <div
                                        class="px-4 py-3 text-sm font-semibold text-theme-black border-b border-slate-200/60 bg-slate-50/50"
                                    >
                                        <div class="flex items-center gap-2">
                                            <Icon icon="solar:add-circle-bold" class="w-4 h-4 text-theme-primary" />
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
                                            <div class="flex-shrink-0 w-8 h-8 bg-theme-primary/10 rounded-lg flex items-center justify-center group-hover:bg-theme-primary/20 transition-colors duration-200">
                                                <Icon
                                                    icon="solar:cpu-bolt-bold"
                                                    class="w-4 h-4 text-theme-primary"
                                                />
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="font-semibold text-theme-black group-hover:text-theme-primary transition-colors duration-200">{{ plugin.name }}</div>
                                                <div class="text-xs text-theme-gray truncate mt-0.5">
                                                    {{ plugin.description }}
                                                </div>
                                            </div>
                                        </button>
                                        <div
                                            v-if="availablePlugins.length === 0"
                                            class="px-4 py-6 text-sm text-theme-gray text-center"
                                        >
                                            <Icon icon="solar:box-bold" class="w-8 h-8 text-theme-gray/50 mx-auto mb-2" />
                                            <div>All plugins already added</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Backdrop to close context menu -->
                                <div
                                    v-if="showContextMenu"
                                    class="fixed inset-0 z-40"
                                    @click="closeContextMenu"
                                ></div>

                                <!-- Status Info -->
                                <div class="absolute bottom-4 left-4 z-10">
                                    <div
                                        class="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-slate-200/60"
                                    >
                                        <div
                                            class="flex items-center gap-6 text-xs text-theme-gray"
                                        >
                                            <span class="flex items-center gap-1">
                                                <Icon
                                                    icon="solar:widget-bold"
                                                    class="w-3 h-3 text-theme-primary"
                                                />
                                                <span
                                                    >{{
                                                        nodes.filter(
                                                            (n: any) => n.type === 'analyzer'
                                                        ).length
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
                                            Right-click canvas to add • Select & Delete key to
                                            remove
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Security Note and Submit Buttons -->
                    <div class="space-y-4">
                        <div class="flex justify-end space-x-3">
                            <button
                                type="button"
                                class="px-4 py-2 border border-slate-300/60 text-theme-gray hover:bg-slate-50 rounded-lg transition-colors duration-200 font-medium"
                                @click="$router.back()"
                            >
                                Cancel
                            </button>
                            <LoadingSubmitButton
                                ref="loadingButtonRef"
                                class="px-6 py-2 bg-gradient-to-r from-theme-primary to-green-600 hover:from-theme-primary/90 hover:to-green-600/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                                <span>Create Analyzer</span>
                            </LoadingSubmitButton>
                        </div>
                    </div>
                </Form>
            </InfoCard>
        </div>
    </div>
</template>
