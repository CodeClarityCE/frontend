<script lang="ts" setup>
import AnalyzerFormFields from './shared/AnalyzerFormFields.vue';
import WorkflowDesigner from './shared/WorkflowDesigner.vue';
import { analyzerValidationSchema } from './shared/analyzerValidation';
import { initializeDefaultNodes } from './shared/analyzerUtils';
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { AnalyzerRepository } from '@/codeclarity_components/organizations/analyzers/AnalyzerRepository';
import { PluginRepository } from '@/codeclarity_components/organizations/analyzers/PluginRepository';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { Form } from 'vee-validate';
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { storeToRefs } from 'pinia';
import type { Edge } from '@vue-flow/core';
import type { Plugin } from '@/codeclarity_components/organizations/analyzers/Plugin';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import {
    retrieveWorkflowSteps,
    layoutNodes,
    createEdgesFromNodes,
    type AnalyzerNode,
    type ConfigNode
} from '@/utils/vueFlow';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';

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

// Form Validation
const formValidationSchema = analyzerValidationSchema;

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

        // Initialize with default nodes
        const defaultNodes = initializeDefaultNodes(plugins.value);

        if (defaultNodes.length > 0) {
            nodes.value = defaultNodes;
            edges.value = createEdgesFromNodes(defaultNodes);
            nodes.value = layoutNodes(nodes.value);
        } else {
            nodes.value = [];
            edges.value = [];
        }
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    }
}

init();
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
                    <AnalyzerFormFields v-model:name="name" v-model:description="description" />

                    <!-- Workflow Designer Section -->
                    <WorkflowDesigner
                        v-model:nodes="nodes"
                        v-model:edges="edges"
                        :plugins="plugins"
                    />

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
