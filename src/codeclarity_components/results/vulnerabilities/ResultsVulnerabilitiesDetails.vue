<script lang="ts" setup>
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { AnalysisRepository } from '@/codeclarity_components/analyses/analysis.repository';
import { Project } from '@/codeclarity_components/projects/project.entity';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { onMounted, onUpdated, ref, type Ref, watch } from 'vue';
import Details from './VulnDetails.vue';
// Import stores

const project: Ref<Project> = ref(new Project());
const analysis: Ref<Analysis> = ref(new Analysis());
const projectID: Ref<string> = ref('');
const analysisID: Ref<string> = ref('');

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const projectRepository: ProjectRepository = new ProjectRepository();
const analysisRepository: AnalysisRepository = new AnalysisRepository();

const props = defineProps<{
    runIndex?: number | null;
}>();

const only_details = ref(false);
const active_tab = ref('List');
const finding = ref<Record<string, unknown>>({});

// VIEW DATA
const details = ref(false);
let y_position = 0;
const reference_click_element = ref('');

function resetView(): void {
    finding.value = {};
    details.value = false;
}

onMounted(() => {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
});

onUpdated(() => {
    const mainContainer = document.getElementsByClassName('main-container')[0];
    if (mainContainer) mainContainer.scrollTop = 0;
    setTimeout(() => {
        const container = document.getElementsByClassName('main-container')[0];
        if (y_position !== 0 && details.value === false && container)
            container.scrollTop = y_position;
    }, 50);
});

watch(active_tab, async (newTab, oldTab) => {
    if (newTab !== oldTab) {
        y_position = 0;
        reference_click_element.value = '';
    }
});

async function init(): Promise<void> {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    const analysis_id = searchParams.get('analysis_id');
    const project_id = searchParams.get('project_id');
    if (analysis_id === null || project_id === null) {
        throw new Error('Missing analysis_id or project_id');
    }
    analysisID.value = analysis_id;
    projectID.value = project_id;

    void getProject(project_id);
    void getAnalysis(project_id, analysis_id);
}
async function getProject(projectID: string): Promise<void> {
    let res: DataResponse<Project>;
    try {
        if (userStore.getDefaultOrg == null) {
            throw new Error('No default org');
        }

        if (authStore.getToken == null) {
            throw new Error('No token');
        }

        res = await projectRepository.getProjectById({
            orgId: userStore.getDefaultOrg.id,
            projectId: projectID,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        project.value = res.data;
    } catch (_err) {
        console.error(_err);

        // error.value = true;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    } finally {
        // loading.value = false;
        // createDepTypeChart();
        // createDepStatusDistChart();
    }
}

async function getAnalysis(projectID: string, analysisID: string): Promise<void> {
    let res: DataResponse<Analysis>;
    try {
        if (userStore.getDefaultOrg == null) {
            throw new Error('No default org');
        }

        if (authStore.getToken == null) {
            throw new Error('No token');
        }

        res = await analysisRepository.getProjectById({
            orgId: userStore.getDefaultOrg.id,
            projectId: projectID,
            analysisId: analysisID,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        analysis.value = res.data;
    } catch (_err) {
        console.error(_err);

        // error.value = true;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    } finally {
        // loading.value = false;
        // createDepTypeChart();
        // createDepStatusDistChart();
    }
}

void init();
</script>

<template>
    <Details
        class="p-12"
        :show-back="!only_details"
        :analysis-i-d="analysisID"
        :project-i-d="projectID"
        :run-index="props.runIndex"
        @close="resetView()"
    ></Details>
</template>
