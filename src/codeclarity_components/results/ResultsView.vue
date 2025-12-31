<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import {
  type Component,
  defineAsyncComponent,
  onBeforeMount,
  type Ref,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";

import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import {
  Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import { Project } from "@/codeclarity_components/projects/project.entity";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";
import type { DataResponse } from "@/utils/api/responses/DataResponse";

const ResultsSBOM = defineAsyncComponent({
  loader: (() => import("./sbom/ResultsSBOM.vue")) as () => Promise<Component>,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
});

const ResultsSBOMDetails = defineAsyncComponent({
  loader: (() =>
    import("./sbom/ResultsSBOMDetails.vue")) as () => Promise<Component>,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
});

const ResultsLicenses = defineAsyncComponent({
  loader: (() =>
    import("./licenses/ResultsLicenses.vue")) as () => Promise<Component>,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
});

const ResultsVulnerabilities = defineAsyncComponent({
  loader: (() =>
    import("./vulnerabilities/ResultsVulnerabilities.vue")) as () => Promise<Component>,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
});

const ResultsVulnerabilitiesDetails = defineAsyncComponent({
  loader: (() =>
    import("./vulnerabilities/ResultsVulnerabilitiesDetails.vue")) as () => Promise<Component>,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
});

const ResultsPatching = defineAsyncComponent({
  loader: (() =>
    import("./patching/ResultsPatching.vue")) as () => Promise<Component>,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
});

const ResultsCodeQL = defineAsyncComponent({
  loader: (() =>
    import("./codeql/ResultsCodeQL.vue")) as () => Promise<Component>,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
});

const state = useStateStore();
state.$reset();

state.page = "results";

const props = defineProps<{
  page?: string;
}>();

const project: Ref<Project> = ref(new Project());
const analysis: Ref<Analysis> = ref(new Analysis());
const projectID: Ref<string> = ref("");
const analysisID: Ref<string> = ref("");
const runIndex: Ref<number | null> = ref(null);

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const projectRepository: ProjectRepository = new ProjectRepository();
const analysisRepository: AnalysisRepository = new AnalysisRepository();

const tab = ref({
  sbom: false, // Generic SBOM tab for both js-sbom and php-sbom
  "vuln-finder": false,
  "js-patching": false,
  "license-finder": false,
  codeql: false,
});

const default_tab: Ref<string> = ref("sbom");
const current_tab: Ref<string> = ref("sbom");
const loading: Ref<boolean> = ref(true);

async function init(): Promise<void> {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;

  const analysis_id = searchParams.get("analysis_id");
  const project_id = searchParams.get("project_id");
  const run_index = searchParams.get("run_index");

  if (analysis_id === null || project_id === null) {
    throw new Error("Missing analysis_id or project_id");
  }
  analysisID.value = analysis_id;
  projectID.value = project_id;

  // Parse run_index if provided (for scheduled analysis historical results)
  if (run_index !== null) {
    runIndex.value = parseInt(run_index, 10);
  }

  void getProject(project_id);
  await getAnalysis(project_id, analysis_id);

  for (const step of analysis.value.steps) {
    for (const result of step) {
      if (result.Status !== AnalysisStatus.SUCCESS) {
        continue;
      }
      if (result.Name === "js-sbom" || result.Name === "php-sbom") {
        tab.value.sbom = true;
      } else if (result.Name === "vuln-finder") {
        tab.value["vuln-finder"] = true;
      } else if (result.Name === "js-patching") {
        tab.value["js-patching"] = true;
      } else if (result.Name === "license-finder") {
        tab.value["license-finder"] = true;
      } else if (result.Name === "codeql") {
        tab.value.codeql = true;
      }
    }
  }
}

async function getProject(projectID: string): Promise<void> {
  let res: DataResponse<Project>;
  try {
    if (userStore.getDefaultOrg == null) {
      throw new Error("No default org");
    }

    if (authStore.getToken == null) {
      throw new Error("No token");
    }

    if (projectID === null) {
      throw new Error("No project id");
    }

    res = await projectRepository.getProjectById({
      orgId: userStore.getDefaultOrg.id,
      projectId: projectID,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
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

async function getAnalysis(
  projectID: string,
  analysisID: string,
): Promise<void> {
  let res: DataResponse<Analysis>;
  try {
    if (userStore.getDefaultOrg == null) {
      throw new Error("No default org");
    }

    if (authStore.getToken == null) {
      throw new Error("No token");
    }

    res = await analysisRepository.getProjectById({
      orgId: userStore.getDefaultOrg.id,
      projectId: projectID,
      analysisId: analysisID,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    analysis.value = res.data;
    // Map plugin names to tab names
    const pluginName = res.data.steps?.[0]?.[0]?.Name ?? "";
    let tabName = pluginName;
    if (pluginName === "js-sbom" || pluginName === "php-sbom") {
      tabName = "sbom";
    }
    default_tab.value = tabName;
    current_tab.value = tabName;
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

// Function to handle tab value changes while preserving run_index
function handleTabChange(newTab: string): void {
  current_tab.value = newTab;

  // Update URL to maintain run_index parameter when switching tabs
  const currentQuery = { ...route.query };
  void router.replace({
    name: route.name,
    query: currentQuery, // This preserves all query parameters including run_index
  });
}

// Watch for route query changes to sync current tab
watch(
  () => route.query,
  () => {
    // This ensures that when URL changes, we stay in sync
  },
  { deep: true },
);

onBeforeMount(async () => {
  await init();
  loading.value = false;
});
</script>
<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <div class="space-y-1">
        <h2 class="text-3xl font-bold tracking-tight">Results</h2>
        <div class="flex items-center gap-4 text-sm text-gray-600">
          <span class="font-medium">{{ project.name }}</span>
          <span v-if="runIndex !== null" class="flex items-center gap-1">
            <Icon icon="solar:history-bold" class="w-4 h-4" />
            Historical Run #{{ runIndex + 1 }}
          </span>
        </div>
      </div>
    </div>
    <ResultsVulnerabilitiesDetails
      v-if="props.page === 'vulnerabilities_details'"
      :run-index="runIndex"
    />
    <ResultsSBOMDetails
      v-else-if="props.page === 'sbom_details'"
      :run-index="runIndex"
    />
    <Tabs
      v-else-if="!loading"
      v-model:value="current_tab"
      :default-value="default_tab"
      class="space-y-4"
      @value-change="handleTabChange"
    >
      <TabsList>
        <TabsTrigger v-if="tab['sbom']" value="sbom"> SBOM </TabsTrigger>
        <TabsTrigger v-if="tab['vuln-finder']" value="vuln-finder">
          Vulnerabilities
        </TabsTrigger>
        <TabsTrigger v-if="tab['js-patching']" value="js-patching">
          Patches
        </TabsTrigger>
        <TabsTrigger v-if="tab['license-finder']" value="license-finder">
          Licenses
        </TabsTrigger>
        <TabsTrigger v-if="tab['codeql']" value="codeql"> CodeQL </TabsTrigger>
      </TabsList>
      <TabsContent value="sbom" class="space-y-4">
        <ResultsSBOM
          :project="project"
          :analysis="analysis"
          :run-index="runIndex"
        />
      </TabsContent>
      <TabsContent value="vuln-finder" class="space-y-4">
        <ResultsVulnerabilities
          :project="project"
          :analysis="analysis"
          :run-index="runIndex"
        />
      </TabsContent>
      <TabsContent value="js-patching" class="space-y-4">
        <ResultsPatching
          :project="project"
          :analysis="analysis"
          :run-index="runIndex"
        />
      </TabsContent>
      <TabsContent value="license-finder" class="space-y-4">
        <ResultsLicenses
          :project="project"
          :analysis="analysis"
          :run-index="runIndex"
        />
      </TabsContent>
      <TabsContent value="codeql" class="space-y-4">
        <ResultsCodeQL
          :project="project"
          :analysis="analysis"
          :run-index="runIndex"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
