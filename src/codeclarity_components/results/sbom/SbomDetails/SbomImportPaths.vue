<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import Tree from '@/codeclarity_components/results/sbom/tree/UtilitiesSbomTree.vue';
import { ref, type PropType, type Ref } from 'vue';
import {
    DependencyTreeManager,
    type FilterConfig,
    type FlatTreeNode,
    type PaginationConfig,
    type Graph
} from '@/utils/tree/sbom/TreeGenerator';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
    dependency: {
        type: Object as PropType<DependencyDetails>,
        required: true
    },
    analysisID: {
        type: String,
        required: true
    },
    projectID: {
        type: String,
        required: true
    }
});

const treeNodes: Ref<Array<FlatTreeNode>> = ref([]);

const resultsRepository: ResultsRepository = new ResultsRepository();
const dependencyTreeManager: Ref<DependencyTreeManager | null> = ref(null);
// const render: Ref<boolean> = ref(false);

const projectName: Ref<string> = ref('');

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const package_id_param = urlParams.get('package_id');

    if (package_id_param == null) return;
    try {
        if (userStore.getDefaultOrg == null) {
            throw new Error('No default org');
        }

        if (authStore.getToken == null) {
            throw new Error('No token');
        }
        // const res = await resultsRepository.getDependencyGraph({
        //     orgId: userStore.getDefaultOrg.id,
        //     projectId: props.projectID,
        //     analysisId: props.analysisID,
        //     workspace: '.',
        //     dependency: package_id_param,
        //     bearerToken: authStore.getToken
        // });
        // try {
        //     let graph: Graph = {
        //         dependencies: res.data.graph.dependencies,
        //         start_dev_deps: res.data.graph.start_dev_deps,
        //         start_dev_deps_constraints: res.data.graph.start_dev_deps_constraints,
        //         start_deps: res.data.graph.start_deps,
        //         start_deps_constraints: res.data.graph.start_deps_constraints
        //     };
        //     dependencyTreeManager.value = new DependencyTreeManager(graph, false);
        //     projectName.value = res.data.project_name;
        //     buildTree();
        // } catch (err) {
        //     console.error(`Encountered problem during dependency data parsing: ${err}`);
        // }
        // render.value = true;
    } catch {
        console.error('error');
        // render.value = false;
    }
}

function buildTree() {
    try {
        if (!dependencyTreeManager.value) return;

        const paginationConfig: PaginationConfig = {
            apply: false,
            entriesPerPage: 50
        };

        const filterConfig: Partial<FilterConfig> = {};

        const [nodes] = dependencyTreeManager.value.getTree(paginationConfig, filterConfig, {
            includeDev: true
        });
        // nmb_entries_showing.value = paginationInfo.returnedItemCount;
        // nmb_entries_total.value = paginationInfo.matchingItemCount;
        // page_number.value = paginationInfo.currentPage;
        // total_pages.value = paginationInfo.matchingPagesCount;

        treeNodes.value = nodes;
        // render.value = true;
    } catch (err) {
        console.error(`Encountered problem during dependency tree construction: ${err}`);
        // render.value = false;
    }
}
init();
</script>

<template>
    <div>
        <div class="flex flex-col gap-2 mb-2">
            <h2 class="font-black"><span class="text-primary text-3xl">I</span>mport Paths</h2>
            <span>Dependencies with a gray background are dev dependencies</span>
        </div>
        <Tree :nodes="treeNodes" :root-name="projectName" />
    </div>
</template>
