<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { ref, type PropType, type Ref } from 'vue';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '../../results.repository';
import type { GraphDependency } from '../../graph.entity';
import TreeChart from '@/base_components/charts/TreeChart.vue';

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

const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const hierarchy: Ref<Array<GraphDependency>> = ref([]);

async function init() {
    try {
        if (userStore.getDefaultOrg == null) {
            throw new Error('No default org');
        }

        if (authStore.getToken == null) {
            throw new Error('No token');
        }
        const res = await resultsRepository.getDependencyGraph({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: '.',
            dependency: props.dependency.name+"@"+props.dependency.version,
            bearerToken: authStore.getToken
        });
        hierarchy.value = res.data

    } catch {
        console.error('error');
    }
}

init();
</script>

<template>
    <div>
        <div class="flex flex-col gap-2 mb-2">
            <h2 class="font-black"><span class="text-primary text-3xl">I</span>mport Paths</h2>
            <span>Dependencies with a gray background are dev dependencies</span>
            {{ hierarchy }}
            <TreeChart
                v-if="hierarchy.length > 0"
                id="sbom-import-paths-tree-chart"
                :data="hierarchy"
            />
        </div>
    </div>
</template>
