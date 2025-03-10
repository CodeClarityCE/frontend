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
import LoadingSubmitButton from '@/base_components/LoadingSubmitButton.vue';
import { storeToRefs } from 'pinia';
import FormTextField from '@/base_components/forms/FormTextField.vue';
// import FormCodeFieldVue from '@/base_components/forms/FormCodeField.vue';
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

        if (title == 'codeql' || title.includes('notifier')) {
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
    <div class="flex flex-col gap-8 w-full mb-2">
        <HeaderItem
            v-if="orgId"
            :org-id="orgId"
            @on-org-info="setOrgInfo($event)"
        ></HeaderItem>

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

                <!-- <FormCodeFieldVue v-model="steps" :name="'steps'" :markdown="example">
                    <template #name>Steps</template>
                </FormCodeFieldVue> -->
                <Alert>
                    <Terminal class="h-4 w-4" />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                        This is an example of how you can create a graph. You can drag and drop the
                        nodes to create a flow.
                        <ul class="list-decimal list-inside pl-4">
                            <li>
                                In this example, we have a full JS analyzer with a block creating an
                                SBOM.
                            </li>
                            <li>
                                The SBOM output is then used by the license and vulnerability
                                blocks.
                            </li>
                            <li>
                                The Patching block is dependent on the SBOM and vulnerability
                                blocks.
                            </li>
                        </ul>
                        <br /><br />
                        If you want to remove a component, you can right-click on the component and
                        select <i>Remove</i>. <br /><br />
                        To add a new component, right-click on the canvas and select
                        <i>Add node -> codeclarity -> your component</i>.
                    </AlertDescription>
                </Alert>
                <div class="flex justify-center">
                    <canvas
                        class="rounded-lg"
                        id="mycanvas"
                        :width="getWidth()"
                        :height="getWidth() / 2"
                    ></canvas>
                </div>

                <LoadingSubmitButton ref="loadingButtonRef">
                    <span>Create</span>
                </LoadingSubmitButton>
            </Form>
        </div>
    </div>
</template>
