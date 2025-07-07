<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { onMounted, ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { AnalyzerRepository } from '@/codeclarity_components/organizations/analyzers/AnalyzerRepository';
import { PluginRepository } from '@/codeclarity_components/organizations/analyzers/PluginRepository';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { storeToRefs } from 'pinia';
import FormTextField from '@/base_components/forms/FormTextField.vue';
import * as lite from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import type { Plugin } from '@/codeclarity_components/organizations/analyzers/Plugin';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { createNode, getWidth, retrieveResult } from '@/utils/liteGraph';
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
const graph: Ref<lite.LGraph | undefined> = ref();
const plugins: Ref<Array<Plugin>> = ref([]);

// Graph data
const nodes = new Map<string, lite.LGraphNode>();
const nodes_to_link = new Map<string, string[]>();

// Form Validation
const formValidationSchema = yup.object({
    name: yup.string().required('Please enter a name').min(5),
    description: yup.string().required('Please enter a description').min(10)
    // steps: yup.string().required('Please list the steps').min(5)
});

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

// Methods
async function submit() {
    if (!graph.value) {
        return;
    }
    const serialized = graph.value.serialize().nodes;
    const links = graph.value.links;
    const arr = retrieveResult(serialized, links, graph.value, plugins.value, nodes);

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
        addPluginsToGraph();
        graph.value?.start();
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    }
}

init();

function addPluginsToGraph() {
    for (let index = 0; index < plugins.value.length; index++) {
        const element = plugins.value[index];
        const title = element.name;

        if (title.includes('notifier')) {
            continue;
        }

        const new_type = createNode(title, element, graph, nodes, nodes_to_link);

        lite.LiteGraph.registerNodeType('codeclarity/' + title, new_type);

        // Create nodes
        const new_node = lite.LiteGraph.createNode('codeclarity/' + title);
        new_node.boxcolor = '#008491';
        // new_node.pos = [100, 100];
        graph.value?.add(new_node);

        nodes.set(title, new_node);
        for (let index = 0; index < element.depends_on.length; index++) {
            const dependency_name = element.depends_on[index];
            if (!nodes_to_link.has(title)) {
                nodes_to_link.set(title, [dependency_name]);
            } else {
                nodes_to_link.get(title)?.push(dependency_name);
            }
        }
    }

    // Connect nodes
    for (const [key, value] of nodes_to_link) {
        const node = nodes.get(key);
        if (node) {
            for (let index = 0; index < value.length; index++) {
                const dependency = nodes.get(value[index]);
                if (dependency) {
                    dependency.connect(0, node, index);
                }
            }
        }
    }
    graph.value?.arrange();
}

onMounted(() => {
    graph.value = new lite.LGraph();
    // lite.LiteGraph.clearRegisteredTypes();
    const canvas = new lite.LGraphCanvas('#mycanvas', graph.value);
    canvas.show_info = false;
    canvas.bgcanvas.style.backgroundColor = 'white';
});
</script>
<template>
    <div class="min-h-screen bg-slate-50">
        <!-- Page Header -->
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)" />

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Page Header -->
            <InfoCard
                title="Analyzer Configuration"
                description="Build a custom analyzer workflow by configuring analysis steps and their dependencies"
                icon="solar:chart-square-bold"
                variant="primary"
                class="mb-8 shadow-lg"
            />

            <!-- Quick Setup Instructions at Top -->
            <InfoCard
                title="Quick Setup"
                description="Follow these steps to create your analyzer workflow"
                icon="solar:magic-stick-bold"
                variant="primary"
                class="shadow-md mb-8"
            >
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="bg-white border border-slate-200/60 rounded-lg p-4 shadow-sm">
                        <div class="flex items-center gap-2 mb-3">
                            <div
                                class="w-5 h-5 bg-theme-primary rounded-full flex items-center justify-center"
                            >
                                <Icon icon="solar:list-check-bold" class="text-white text-xs" />
                            </div>
                            <h4 class="font-semibold text-theme-black">Steps to follow:</h4>
                        </div>

                        <ol class="space-y-2 text-sm">
                            <li class="flex items-start gap-2">
                                <span
                                    class="flex-shrink-0 w-4 h-4 bg-theme-primary text-white text-xs rounded-full flex items-center justify-center font-bold"
                                    >1</span
                                >
                                <span class="text-theme-gray"
                                    >Fill in analyzer name and description</span
                                >
                            </li>
                            <li class="flex items-start gap-2">
                                <span
                                    class="flex-shrink-0 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                    >2</span
                                >
                                <span class="text-theme-gray">Right-click canvas → Add nodes</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span
                                    class="flex-shrink-0 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                    >3</span
                                >
                                <span class="text-theme-gray"
                                    >Nodes auto-connect by dependencies</span
                                >
                            </li>
                            <li class="flex items-start gap-2">
                                <span
                                    class="flex-shrink-0 w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                    >4</span
                                >
                                <span class="text-theme-gray">Create analyzer when ready</span>
                            </li>
                        </ol>
                    </div>

                    <!-- Available Components -->
                    <div class="bg-white border border-slate-200/60 rounded-lg p-4 shadow-sm">
                        <div class="flex items-center gap-2 mb-3">
                            <div
                                class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                            >
                                <Icon icon="solar:widget-bold" class="text-white text-xs" />
                            </div>
                            <h4 class="font-semibold text-theme-black">Available components:</h4>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <span
                                class="inline-flex items-center gap-1 px-3 py-1 bg-theme-primary/10 border border-theme-primary/20 rounded-full text-xs text-theme-primary"
                            >
                                <Icon icon="solar:code-bold" class="w-3 h-3" />
                                JS Analyzer
                            </span>
                            <span
                                class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-200 rounded-full text-xs text-green-600"
                            >
                                <Icon icon="solar:document-text-bold" class="w-3 h-3" />
                                SBOM Generator
                            </span>
                            <span
                                class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 border border-purple-200 rounded-full text-xs text-purple-600"
                            >
                                <Icon icon="solar:shield-search-bold" class="w-3 h-3" />
                                Vuln Scanner
                            </span>
                            <span
                                class="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 border border-orange-200 rounded-full text-xs text-orange-600"
                            >
                                <Icon icon="solar:file-check-bold" class="w-3 h-3" />
                                License Check
                            </span>
                        </div>
                    </div>
                </div>
            </InfoCard>

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

                        <div
                            class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/60 p-6 shadow-sm"
                        >
                            <div class="relative w-full">
                                <canvas
                                    id="mycanvas"
                                    class="w-full rounded-lg border-2 border-slate-300/60 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
                                    :width="Math.max(1200, getWidth() * 0.98)"
                                    :height="700"
                                ></canvas>

                                <!-- Enhanced Status Bar -->
                                <div class="absolute top-4 left-4 flex flex-col gap-2">
                                    <div
                                        class="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-slate-200/60"
                                    >
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                                            ></div>
                                            <span class="text-xs font-medium text-theme-black"
                                                >Workflow Active</span
                                            >
                                        </div>
                                    </div>
                                    <div
                                        class="bg-theme-primary/10 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-theme-primary/20"
                                    >
                                        <div class="flex items-center gap-2">
                                            <Icon
                                                icon="solar:mouse-minimalistic-bold"
                                                class="w-3 h-3 text-theme-primary"
                                            />
                                            <span class="text-xs text-theme-primary"
                                                >Right-click to add nodes</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <!-- Quick Actions -->
                                <div class="absolute top-4 right-4">
                                    <div
                                        class="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-slate-200/60"
                                    >
                                        <div class="flex items-center gap-4">
                                            <button
                                                class="flex items-center gap-1 text-xs text-theme-gray hover:text-theme-primary transition-colors"
                                            >
                                                <Icon icon="solar:refresh-bold" class="w-3 h-3" />
                                                Reset
                                            </button>
                                            <div class="w-px h-3 bg-slate-300/60"></div>
                                            <button
                                                class="flex items-center gap-1 text-xs text-theme-gray hover:text-theme-primary transition-colors"
                                            >
                                                <Icon icon="solar:maximize-bold" class="w-3 h-3" />
                                                Auto-arrange
                                            </button>
                                            <div class="w-px h-3 bg-slate-300/60"></div>
                                            <button
                                                class="flex items-center gap-1 text-xs text-theme-gray hover:text-theme-primary transition-colors"
                                            >
                                                <Icon icon="solar:eye-bold" class="w-3 h-3" />
                                                Zoom fit
                                            </button>
                                            <div class="w-px h-3 bg-slate-300/60"></div>
                                            <button
                                                class="flex items-center gap-1 text-xs text-theme-gray hover:text-theme-primary transition-colors"
                                            >
                                                <Icon
                                                    icon="solar:save-floppy-disk-bold"
                                                    class="w-3 h-3"
                                                />
                                                Save Layout
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status Info -->
                                <div class="absolute bottom-4 left-4">
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
                                                <span id="nodeCount">0 nodes</span>
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <Icon
                                                    icon="solar:link-bold"
                                                    class="w-3 h-3 text-theme-primary"
                                                />
                                                <span id="connectionCount">0 connections</span>
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <Icon
                                                    icon="solar:cpu-bolt-bold"
                                                    class="w-3 h-3 text-green-600"
                                                />
                                                <span>Ready to build</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Help Text -->
                                <div class="absolute bottom-4 right-4">
                                    <div
                                        class="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-slate-200/60"
                                    >
                                        <div class="text-xs text-theme-gray">
                                            Drag nodes to arrange • Connect outputs to inputs •
                                            Double-click to configure
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Workflow Tips -->
                            <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div
                                    class="bg-white rounded-lg p-3 border border-slate-200/60 shadow-sm"
                                >
                                    <div class="flex items-center gap-2 mb-1">
                                        <Icon
                                            icon="solar:lightbulb-bold"
                                            class="w-4 h-4 text-amber-500"
                                        />
                                        <span class="text-sm font-medium text-theme-black"
                                            >Quick Start</span
                                        >
                                    </div>
                                    <p class="text-xs text-theme-gray">
                                        Begin with JS Analyzer for JavaScript projects
                                    </p>
                                </div>
                                <div
                                    class="bg-white rounded-lg p-3 border border-slate-200/60 shadow-sm"
                                >
                                    <div class="flex items-center gap-2 mb-1">
                                        <Icon
                                            icon="solar:routing-bold"
                                            class="w-4 h-4 text-theme-primary"
                                        />
                                        <span class="text-sm font-medium text-theme-black"
                                            >Common Flow</span
                                        >
                                    </div>
                                    <p class="text-xs text-theme-gray">
                                        Analyzer → SBOM → Security Checks
                                    </p>
                                </div>
                                <div
                                    class="bg-white rounded-lg p-3 border border-slate-200/60 shadow-sm"
                                >
                                    <div class="flex items-center gap-2 mb-1">
                                        <Icon
                                            icon="solar:settings-bold"
                                            class="w-4 h-4 text-green-600"
                                        />
                                        <span class="text-sm font-medium text-theme-black"
                                            >Configuration</span
                                        >
                                    </div>
                                    <p class="text-xs text-theme-gray">
                                        Double-click nodes to configure settings
                                    </p>
                                </div>
                                <div
                                    class="bg-white rounded-lg p-3 border border-slate-200/60 shadow-sm"
                                >
                                    <div class="flex items-center gap-2 mb-1">
                                        <Icon
                                            icon="solar:rocket-bold"
                                            class="w-4 h-4 text-purple-600"
                                        />
                                        <span class="text-sm font-medium text-theme-black"
                                            >Best Practice</span
                                        >
                                    </div>
                                    <p class="text-xs text-theme-gray">
                                        Test workflows before deploying to production
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Security Note and Submit Buttons -->
                    <div class="space-y-4">
                        <div
                            class="flex items-start gap-2 p-3 bg-theme-primary/10 border border-theme-primary/20 rounded-lg"
                        >
                            <Icon
                                icon="solar:shield-check-bold"
                                class="text-theme-primary mt-0.5 flex-shrink-0"
                            />
                            <div class="text-xs text-theme-primary">
                                <strong>Security Note:</strong> Your analyzer configuration is
                                stored securely and will be used to create automated security
                                analysis workflows.
                            </div>
                        </div>

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

            <!-- Bottom Section - Examples and Advanced Tips -->
            <div class="grid lg:grid-cols-2 gap-8 mt-8">
                <!-- Example Workflow -->
                <InfoCard
                    title="Example Workflow"
                    description="A typical security analysis pipeline"
                    icon="solar:flow-bold"
                    variant="default"
                    class="shadow-sm"
                >
                    <div class="space-y-4">
                        <div
                            class="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200"
                        >
                            <div
                                class="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                            >
                                <Icon icon="solar:arrow-right-bold" class="text-white text-sm" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-theme-black mb-1">
                                    Recommended Flow
                                </h4>
                                <p class="text-sm text-theme-gray">
                                    JS Analyzer → SBOM Generator → License Checker + Vulnerability
                                    Scanner → Patching
                                </p>
                            </div>
                        </div>

                        <div class="bg-white border border-slate-200/60 rounded-lg p-4">
                            <h5 class="font-medium text-theme-black mb-2">Why this works:</h5>
                            <ul class="space-y-2 text-sm text-theme-gray">
                                <li class="flex items-start gap-2">
                                    <Icon
                                        icon="solar:check-circle-bold"
                                        class="text-green-500 mt-0.5 flex-shrink-0"
                                    />
                                    <span>JS Analyzer identifies all JavaScript dependencies</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <Icon
                                        icon="solar:check-circle-bold"
                                        class="text-green-500 mt-0.5 flex-shrink-0"
                                    />
                                    <span>SBOM Generator creates a complete bill of materials</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <Icon
                                        icon="solar:check-circle-bold"
                                        class="text-green-500 mt-0.5 flex-shrink-0"
                                    />
                                    <span
                                        >Parallel license and vulnerability checking for
                                        efficiency</span
                                    >
                                </li>
                                <li class="flex items-start gap-2">
                                    <Icon
                                        icon="solar:check-circle-bold"
                                        class="text-green-500 mt-0.5 flex-shrink-0"
                                    />
                                    <span
                                        >Automatic patching recommendations based on findings</span
                                    >
                                </li>
                            </ul>
                        </div>
                    </div>
                </InfoCard>

                <!-- Advanced Configuration -->
                <InfoCard
                    title="Advanced Configuration"
                    description="Tips for complex analyzer setups"
                    icon="solar:settings-minimalistic-bold"
                    variant="default"
                    class="shadow-sm"
                >
                    <div class="space-y-4">
                        <div
                            class="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200"
                        >
                            <div
                                class="flex-shrink-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                            >
                                <Icon icon="solar:settings-bold" class="text-white text-sm" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-theme-black mb-1">
                                    Custom Workflows
                                </h4>
                                <p class="text-sm text-theme-gray">
                                    Create specialized analysis pipelines for different project
                                    types and security requirements.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="text-sm">
                                <h5 class="font-medium text-theme-black mb-2">Pro Tips:</h5>
                                <ul class="space-y-1 text-theme-gray pl-4">
                                    <li>• Use multiple analyzers for polyglot projects</li>
                                    <li>• Parallel processing for independent checks</li>
                                    <li>• Connect outputs to inputs for data flow</li>
                                    <li>• Test your workflow before deployment</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </InfoCard>
            </div>
        </div>
    </div>
</template>
