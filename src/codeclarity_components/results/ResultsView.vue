<script lang="ts" setup>
import { useStateStore } from '@/stores/state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/ui/tabs';
import { onBeforeMount, ref, type Ref } from 'vue';
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { AnalysisRepository } from '@/codeclarity_components/analyses/analysis.repository';

import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const ResultsSBOM = defineAsyncComponent({
    loader: () => import('./sbom/ResultsSBOM.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const ResultsSBOMDetails = defineAsyncComponent({
    loader: () => import('./sbom/ResultsSBOMDetails.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const ResultsLicenses = defineAsyncComponent({
    loader: () => import('./licenses/ResultsLicenses.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const ResultsVulnerabilities = defineAsyncComponent({
    loader: () => import('./vulnerabilities/ResultsVulnerabilities.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const ResultsVulnerabilitiesDetails = defineAsyncComponent({
    loader: () => import('./vulnerabilities/ResultsVulnerabilitiesDetails.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const ResultsPatching = defineAsyncComponent({
    loader: () => import('./patching/ResultsPatching.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const state = useStateStore();
state.$reset();

state.page = 'results';

const props = defineProps<{
    page?: string;
}>();

const project: Ref<Project> = ref(new Project());
const analysis: Ref<Analysis> = ref(new Analysis());
const projectID: Ref<string> = ref('');
const analysisID: Ref<string> = ref('');

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const projectRepository: ProjectRepository = new ProjectRepository();
const analysisRepository: AnalysisRepository = new AnalysisRepository();

const tab = ref({
    'js-sbom': false,
    'js-vuln-finder': false,
    'js-patching': false,
    'js-license': false
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
    await getAnalysis(project_id, analysis_id);

    for (const step of analysis.value.steps) {
        for (const result of step) {
            console.log(result.Name);

            if (result.Status != 'success') {
                continue;
            }
            if (result.Name == 'js-sbom') {
                tab.value['js-sbom'] = true;
            } else if (result.Name == 'js-vuln-finder') {
                tab.value['js-vuln-finder'] = true;
            } else if (result.Name == 'js-patching') {
                tab.value['js-patching'] = true;
            } else if (result.Name == 'js-license') {
                tab.value['js-license'] = true;
            }
        }
    }
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

        if (projectID == null) {
            throw new Error('No project id');
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

onBeforeMount(() => {
    init();
});
</script>
<template>
    <div class="flex-1 space-y-4 p-8 pt-6">
        <div class="flex items-center justify-between space-y-2">
            <h2 class="text-3xl font-bold tracking-tight">Results</h2>
            {{ project.name }}
        </div>
        <ResultsVulnerabilitiesDetails v-if="props.page == 'vulnerabilities_details'" />
        <ResultsSBOMDetails v-else-if="props.page == 'sbom_details'" />
        <Tabs v-else default-value="sbom" class="space-y-4">
            <TabsList>
                <TabsTrigger v-if="tab['js-sbom']" value="sbom"> SBOM </TabsTrigger>
                <TabsTrigger v-if="tab['js-vuln-finder']" value="vulnerabilities">
                    Vulnerabilities
                </TabsTrigger>
                <TabsTrigger v-if="tab['js-patching']" value="patches"> Patches </TabsTrigger>
                <TabsTrigger v-if="tab['js-license']" value="licenses"> Licenses </TabsTrigger>
                <!-- <TabsTrigger value="licenses" disabled> Licenses </TabsTrigger> -->
            </TabsList>
            <TabsContent value="sbom" class="space-y-4">
                <ResultsSBOM :project="project" :analysis="analysis" />
            </TabsContent>
            <TabsContent value="vulnerabilities" class="space-y-4">
                <ResultsVulnerabilities :project="project" :analysis="analysis" />
            </TabsContent>
            <TabsContent value="patches" class="space-y-4">
                <ResultsPatching :project="project" :analysis="analysis" />
            </TabsContent>
            <TabsContent value="licenses" class="space-y-4">
                <ResultsLicenses :project="project" :analysis="analysis" />
            </TabsContent>
        </Tabs>
    </div>
</template>
