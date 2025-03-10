<template>
    <Details
        class="p-12"
        :show-back="!only_details"
        :analysisID="analysisID"
        :projectID="projectID"
        @close="resetView()"
    ></Details>
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, ref, type Ref, watch } from 'vue';
import Details from '@/views/results/vulnerabilities/VulnDetails.vue';
// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import { AnalysisRepository } from '@/codeclarity_components/analyses/analysis.repository';

const project: Ref<Project> = ref(new Project());
const analysis: Ref<Analysis> = ref(new Analysis());
let projectID: Ref<string> = ref('');
let analysisID: Ref<string> = ref('');

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const projectRepository: ProjectRepository = new ProjectRepository();
const analysisRepository: AnalysisRepository = new AnalysisRepository();

// defineProps<{
//     gitIntegrated: any;
//     gitSeverType: any;
//     branch: any;
//     projectName: any;
//     analysisID: number;
// }>();

const only_details = ref(false);
const active_tab = ref('List');
const finding: any = ref({});

// VIEW DATA
const details = ref(false);
let y_position = 0;
let reference_click_element = ref('');

function resetView() {
    finding.value = {};
    details.value = false;
}

onMounted(() => {
    let loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
});

onUpdated(() => {
    document.getElementsByClassName('main-container')[0].scrollTop = 0;
    setTimeout(() => {
        if (y_position != 0 && details.value == false)
            document.getElementsByClassName('main-container')[0].scrollTop = y_position;
    }, 50);
});

watch(active_tab, async (newTab, oldTab) => {
    if (newTab != oldTab) {
        y_position = 0;
        reference_click_element.value = '';
    }
});

async function init() {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    const analysis_id = searchParams.get('analysis_id');
    const project_id = searchParams.get('project_id');
    if (analysis_id == null || project_id == null) {
        throw new Error('Missing analysis_id or project_id');
    }
    analysisID.value = analysis_id;
    projectID.value = project_id;

    getProject(project_id);
    getAnalysis(project_id, analysis_id);
}
async function getProject(projectID: string) {
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

async function getAnalysis(projectID: string, analysisID: string) {
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

init();
</script>
