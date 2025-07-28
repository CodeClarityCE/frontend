<script lang="ts" setup>
import AnalyzerFormFields from './shared/AnalyzerFormFields.vue';
import WorkflowDesigner from './shared/WorkflowDesigner.vue';
import { analyzerValidationSchema } from './shared/analyzerValidation';
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
    createAnalyzerNodes,
    retrieveWorkflowSteps,
    layoutNodes,
    type AnalyzerNode,
    type ConfigNode
} from '@/utils/vueFlow';

const analyzer_id: Ref<string> = ref('');
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
        await analyzerRepo.updateAnalyzer({
            orgId: defaultOrg!.value!.id,
            analyzer_id: analyzer_id.value,
            data: {
                name: name.value,
                description: description.value,
                steps: arr
            },
            bearerToken: authStore.getToken ?? ''
        });
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
        console.log(_err);
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

    if (typeof _orgId == 'string') {
        orgId.value = _orgId;
    } else {
        router.back();
    }

    try {
        const resp = await pluginRepo.geAllPlugins({
            bearerToken: authStore.getToken ?? ''
        });
        plugins.value = resp.data;
        const { nodes: flowNodes, edges: flowEdges } = createAnalyzerNodes(plugins.value);
        nodes.value = layoutNodes(flowNodes);
        edges.value = flowEdges;
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    }

    try {
        analyzer_id.value = route.query.analyzerId as string;
        const res = await analyzerRepo.getAnalyzer({
            orgId: defaultOrg!.value!.id,
            bearerToken: authStore.getToken ?? '',
            analyzer_id: analyzer_id.value
        });
        name.value = res.data.name;
        description.value = res.data.description;
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
    <div class="flex flex-col gap-8 w-full mb-2">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>

        <div class="p-12">
            <Form
                id="form"
                class="flex flex-col gap-6"
                :validation-schema="formValidationSchema"
                @submit="submit"
            >
                <AnalyzerFormFields v-model:name="name" v-model:description="description" />

                <WorkflowDesigner
                    v-model:nodes="nodes"
                    v-model:edges="edges"
                    :plugins="plugins"
                    :readonly="true"
                />

                <LoadingSubmitButton ref="loadingButtonRef">
                    <span>Create</span>
                </LoadingSubmitButton>
            </Form>
        </div>
    </div>
</template>
