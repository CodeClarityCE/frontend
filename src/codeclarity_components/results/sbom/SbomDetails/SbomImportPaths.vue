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
    <div class="import-paths-container">
        <div class="flex flex-col gap-4 mb-4">
            <div class="header-section">
                <h2 class="font-black text-2xl mb-2">
                    <span class="text-primary text-3xl">I</span>mport Paths
                </h2>
                <span class="text-gray-600 text-sm">Dependencies with a gray background are dev dependencies</span>
            </div>
            
            {{ hierarchy }}

            <div class="tree-chart-wrapper">
                <TreeChart
                    v-if="hierarchy.length > 0"
                    id="sbom-import-paths-tree-chart"
                    :data="hierarchy"
                    :target-dependency="props.dependency.name + '@' + props.dependency.version"
                />
                <div v-else class="no-data-message">
                    <p class="text-gray-500 text-center py-8">No dependency graph data available</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.import-paths-container {
    width: 100%;
    padding: 0;
    margin: 0;
}

.header-section {
    padding: 0 16px;
}

.tree-chart-wrapper {
    width: 100%;
    min-height: 400px;
    overflow: visible;
    /* Remove any default margins/padding that might cause issues */
    margin: 0;
    padding: 0;
}

.no-data-message {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
}

/* Ensure the TreeChart component has proper spacing */
.tree-chart-wrapper :deep(.tree-chart-container) {
    margin: 0;
    width: 100%;
    max-width: none;
    overflow-x: auto;
    overflow-y: visible;
}

/* Adjust the SVG container to prevent clipping */
.tree-chart-wrapper :deep(.tree-chart) {
    width: 100%;
    min-width: 1400px; /* Increased minimum width for better spacing */
    overflow-x: auto;
    overflow-y: visible;
}

/* Make sure the SVG itself doesn't get clipped */
.tree-chart-wrapper :deep(svg) {
    width: 100%;
    min-width: 1400px; /* Increased minimum width */
    height: auto;
    overflow: visible;
}
</style>
