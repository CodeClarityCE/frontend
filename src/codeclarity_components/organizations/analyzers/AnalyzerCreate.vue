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
import Alert from '@/shadcn/ui/alert/Alert.vue';
import { Terminal } from 'lucide-vue-next';
import AlertTitle from '@/shadcn/ui/alert/AlertTitle.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';

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
    <div class="min-h-screen bg-white">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>

        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <!-- Header Section -->
            <div class="text-center mb-12">
                <div
                    class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mb-6"
                >
                    <svg
                        class="w-8 h-8 text-white"
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
                </div>
                <h1 class="text-4xl font-bold text-gray-900 mb-4">Create Analyzer</h1>
                <p class="text-lg text-gray-600 max-w-3xl mx-auto">
                    Build a custom analyzer workflow by configuring analysis steps and their
                    dependencies. Create a visual flow to define how your code analysis should be
                    performed.
                </p>
            </div>

            <!-- Main Form Card -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Card Header -->
                <div
                    class="bg-gradient-to-r from-purple-50 to-indigo-50 px-8 py-6 border-b border-gray-100"
                >
                    <h2 class="text-xl font-semibold text-gray-900 flex items-center">
                        <svg
                            class="w-5 h-5 text-purple-600 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        Analyzer Configuration
                    </h2>
                    <p class="text-sm text-gray-600 mt-1">
                        Define your analyzer details and build the analysis workflow
                    </p>
                </div>

                <!-- Card Content -->
                <div class="px-8 py-8">
                    <Form
                        id="form"
                        class="space-y-8"
                        :validation-schema="formValidationSchema"
                        @submit="submit"
                    >
                        <!-- Basic Information Section -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Name Field -->
                            <div>
                                <FormTextField
                                    v-model="name"
                                    :placeholder="'Enter analyzer name...'"
                                    :type="'text'"
                                    :name="'name'"
                                >
                                    <template #name>
                                        <span
                                            class="block text-sm font-semibold text-gray-900 mb-2"
                                        >
                                            Analyzer Name
                                            <span class="text-red-500">*</span>
                                        </span>
                                    </template>
                                </FormTextField>
                            </div>

                            <!-- Description Field -->
                            <div>
                                <FormTextField
                                    v-model="description"
                                    :placeholder="'Enter analyzer description...'"
                                    :type="'text'"
                                    :name="'description'"
                                >
                                    <template #name>
                                        <span
                                            class="block text-sm font-semibold text-gray-900 mb-2"
                                        >
                                            Description
                                            <span class="text-red-500">*</span>
                                        </span>
                                    </template>
                                </FormTextField>
                            </div>
                        </div>

                        <!-- Workflow Builder Section -->
                        <div class="border-t border-gray-100 pt-8">
                            <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <svg
                                    class="w-5 h-5 text-indigo-600 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                                    />
                                </svg>
                                Workflow Builder
                            </h3>

                            <!-- Instructions Alert -->
                            <div class="mb-6">
                                <Alert class="border border-blue-200 bg-blue-50">
                                    <Terminal class="h-4 w-4 text-blue-600" />
                                    <AlertTitle class="text-blue-900"
                                        >How to Build Your Analyzer</AlertTitle
                                    >
                                    <AlertDescription class="text-blue-800">
                                        <div class="space-y-3 mt-3">
                                            <p class="font-medium">
                                                Create your analysis workflow using the visual
                                                editor below:
                                            </p>
                                            <ul class="list-decimal list-inside space-y-2 pl-4">
                                                <li>
                                                    <strong>Add Components:</strong> Right-click on
                                                    the canvas and select
                                                    <span
                                                        class="bg-blue-100 px-2 py-1 rounded text-sm"
                                                        >Add node → codeclarity → [component]</span
                                                    >
                                                </li>
                                                <li>
                                                    <strong>Example Flow:</strong> JS Analyzer →
                                                    SBOM Generator → License Checker + Vulnerability
                                                    Scanner → Patching
                                                </li>
                                                <li>
                                                    <strong>Dependencies:</strong> The SBOM output
                                                    feeds into license and vulnerability analysis
                                                </li>
                                                <li>
                                                    <strong>Remove Components:</strong> Right-click
                                                    any node and select
                                                    <span
                                                        class="bg-blue-100 px-2 py-1 rounded text-sm"
                                                        >Remove</span
                                                    >
                                                </li>
                                            </ul>
                                            <div class="bg-blue-100 p-3 rounded-lg mt-4">
                                                <p class="text-sm">
                                                    <strong>Tip:</strong> Drag nodes to arrange them
                                                    visually. Dependencies will be automatically
                                                    connected based on component requirements.
                                                </p>
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <!-- Canvas Container -->
                            <div
                                class="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6"
                            >
                                <div class="flex justify-center">
                                    <div class="relative">
                                        <canvas
                                            id="mycanvas"
                                            class="rounded-lg border border-gray-200 bg-white shadow-sm"
                                            :width="getWidth()"
                                            :height="getWidth() / 2"
                                        ></canvas>
                                        <!-- Canvas Overlay Instructions -->
                                        <div
                                            class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200"
                                        >
                                            <p class="text-xs text-gray-600">
                                                <svg
                                                    class="w-3 h-3 inline mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                Right-click to add components
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Button Section -->
                        <div class="border-t border-gray-100 pt-8">
                            <div class="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    class="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium"
                                    @click="$router.back()"
                                >
                                    Cancel
                                </button>
                                <LoadingSubmitButton
                                    ref="loadingButtonRef"
                                    class="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                                >
                                    <svg
                                        class="w-5 h-5"
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
                </div>
            </div>

            <!-- Feature Cards Section -->
            <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">SBOM Generation</h3>
                    <p class="text-gray-600 text-sm">
                        Automatically generate Software Bill of Materials to track all dependencies
                        and components in your projects.
                    </p>
                </div>

                <div
                    class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Vulnerability Scanning</h3>
                    <p class="text-gray-600 text-sm">
                        Identify security vulnerabilities in your dependencies and get
                        recommendations for fixes and patches.
                    </p>
                </div>

                <div
                    class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">License Compliance</h3>
                    <p class="text-gray-600 text-sm">
                        Ensure your projects comply with license policies and get alerts for any
                        license violations or conflicts.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
