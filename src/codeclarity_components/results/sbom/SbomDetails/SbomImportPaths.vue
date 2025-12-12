<script lang="ts" setup>
import TreeChart from '@/base_components/data-display/charts/TreeChart.vue';
import { type DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { Icon } from '@iconify/vue';
import { ref, type PropType, type Ref, onMounted } from 'vue';

// Import stores
import type { GraphDependency } from '../../graph.entity';
import { ResultsRepository } from '../../results.repository';

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

const hierarchy: Ref<GraphDependency[]> = ref([]);

async function init() {
    try {
        if (userStore.getDefaultOrg === null) {
            throw new Error('No default org');
        }

        if (authStore.getToken === null) {
            throw new Error('No token');
        }
        const res = await resultsRepository.getDependencyGraph({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: '.',
            dependency: `${props.dependency.name  }@${  props.dependency.version}`,
            bearerToken: authStore.getToken
        });
        hierarchy.value = res.data;
    } catch {
        console.error('error');
    }
}

onMounted(() => {
    init();
});
</script>

<template>
    <div class="import-paths-panel">
        <div class="section-header">
            <h2 class="section-title">Import Paths</h2>
        </div>

        <div class="import-paths-content">
            <div class="chart-description">
                <p class="description-text">
                    <span class="description-item"
                        >Dependencies with gray background are dev dependencies.</span
                    >
                    <span class="description-item"
                        >Explore how this package is integrated into your project.</span
                    >
                </p>
            </div>

            <div class="tree-chart-container">
                <div v-if="hierarchy && hierarchy.length > 0" class="chart-wrapper">
                    <div class="tree-chart-wrapper">
                        <TreeChart
                            id="sbom-import-paths-tree-chart"
                            :data="hierarchy"
                            :target-dependency="
                                props.dependency.name + '@' + props.dependency.version
                            "
                        />
                    </div>
                </div>

                <div v-else class="no-data-state">
                    <div class="no-data-content">
                        <Icon icon="material-symbols:data-exploration" class="no-data-icon" />
                        <h3 class="no-data-title">No dependency graph available</h3>
                        <p class="no-data-description">
                            We couldn't find dependency relationship data for this package. This
                            might occur if the package is a root dependency or if graph data is not
                            available.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.import-paths-panel {
    height: 100%;
    min-height: 500px;
}

.section-header {
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
}

.section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: theme('colors.theme-black');
    margin: 0;
}

.import-paths-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: calc(100% - 4rem);
}

.chart-description {
    padding: 0.75rem 1rem;
    background: rgba(29, 206, 121, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(29, 206, 121, 0.2);
}

.description-text {
    font-size: 0.875rem;
    color: theme('colors.theme-gray');
    margin: 0;
    line-height: 1.5;
}

.description-item {
    display: block;
    margin-bottom: 0.25rem;

    &:last-child {
        margin-bottom: 0;
    }
}

.tree-chart-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 400px;
}

.chart-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    box-shadow:
        0 1px 3px 0 rgb(0 0 0 / 0.1),
        0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.tree-chart-wrapper {
    flex: 1;
    width: 100%;
    min-height: 350px;
    overflow: visible;
    padding: 1rem;
    background: #fafbfc;

    /* Deep styling for TreeChart component */
    :deep(.tree-chart-container) {
        margin: 0;
        width: 100%;
        max-width: none;
        overflow-x: auto;
        overflow-y: visible;
        border-radius: 8px;
    }

    :deep(.tree-chart) {
        width: 100%;
        min-width: 100%;
        overflow-x: auto;
        overflow-y: visible;
        background: transparent;
    }

    :deep(svg) {
        width: 100%;
        min-width: 100%;
        height: auto;
        overflow: visible;
        border-radius: 6px;
    }

    /* Enhanced node styling */
    :deep(.node) {
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        transition: all 0.15s ease-in-out;

        &:hover {
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
        }
    }

    /* Enhanced edge styling */
    :deep(.link) {
        stroke: #6b7280;
        stroke-width: 1.5;
        opacity: 0.6;
        transition: all 0.15s ease-in-out;

        &:hover {
            opacity: 1;
            stroke-width: 2;
        }
    }
}

.no-data-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px dashed #d1d5db;
    min-height: 350px;
}

.no-data-content {
    text-align: center;
    max-width: 400px;
    padding: 2rem;
}

.no-data-icon {
    font-size: 3rem;
    color: #9ca3af;
    margin-bottom: 1rem;
}

.no-data-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
}

.no-data-description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
}

/* Responsive adjustments */
@media (max-width: 1400px) {
    .tree-chart-wrapper {
        :deep(.tree-chart),
        :deep(svg) {
            min-width: 100vw;
        }
    }
}

@media (max-width: 768px) {
    .chart-description {
        padding: 0.5rem 0.75rem;
    }

    .description-text {
        font-size: 0.8rem;
    }

    .tree-chart-wrapper {
        padding: 0.75rem;
        min-height: 300px;
    }

    .no-data-content {
        padding: 1.5rem;
    }

    .no-data-icon {
        font-size: 2.5rem;
    }
}
</style>
