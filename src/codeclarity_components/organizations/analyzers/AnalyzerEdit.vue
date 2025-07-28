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
import * as z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { storeToRefs } from 'pinia';
import FormTextField from '@/base_components/forms/FormTextField.vue';
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import type { Plugin } from '@/codeclarity_components/organizations/analyzers/Plugin';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { createAnalyzerNodes, retrieveWorkflowSteps, layoutNodes, type AnalyzerNode, type ConfigNode } from '@/utils/vueFlow';
import AnalyzerNodeComponent from '@/components/flow/AnalyzerNode.vue';
import ConfigNodeComponent from '@/components/flow/ConfigNode.vue';

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
const { fitView } = useVueFlow();

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
        
        setTimeout(() => {
            fitView({ padding: 0.1 });
        }, 100);
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

const nodeTypes = {
    analyzer: AnalyzerNodeComponent,
    config: ConfigNodeComponent
};

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
                <FormTextField
                    v-model="name"
                    :placeholder="'Enter a name'"
                    :type="'text'"
                    :name="'name'"
                >
                    <template #name>Name</template>
                </FormTextField>

                <FormTextField
                    v-model="description"
                    :placeholder="'Enter a description'"
                    :type="'text'"
                    :name="'description'"
                >
                    <template #name>Description</template>
                </FormTextField>

                <div class="flex justify-center">
                    <div class="w-full h-[500px] rounded-lg border-2 border-slate-300/60">
                        <VueFlow
                            :nodes="nodes"
                            :edges="edges"
                            :node-types="nodeTypes"
                            class="w-full h-full rounded-lg bg-white"
                            :default-viewport="{ zoom: 0.8 }"
                            :min-zoom="0.2"
                            :max-zoom="4"
                        >
                            <Background pattern-color="#aaa" :gap="16" />
                            <Controls />
                            <MiniMap />
                        </VueFlow>
                    </div>
                </div>

                <LoadingSubmitButton ref="loadingButtonRef">
                    <span>Create</span>
                </LoadingSubmitButton>
            </Form>
        </div>
    </div>
</template>
