<script lang="ts" setup>
import { History } from "@lucide/vue";
import {
  type AsyncComponentLoader,
  type Component,
  computed,
  defineAsyncComponent,
  onBeforeMount,
  type Ref,
  ref,
} from "vue";
import { useRoute, useRouter } from "vue-router";

import { PageHeading } from "@/base_components/page";
import {
  Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import { Project } from "@/codeclarity_components/projects/project.entity";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";
import type { DataResponse } from "@/utils/api/responses/DataResponse";

import ResultsNotFound from "./components/ResultsNotFound.vue";
import { isNotFound } from "./result-errors";

function lazy(loader: () => Promise<unknown>): Component {
  return defineAsyncComponent(loader as AsyncComponentLoader) as Component;
}

const ResultsSBOM = lazy(() => import("./sbom/ResultsSBOM.vue"));
const ResultsSBOMDetails = lazy(() => import("./sbom/ResultsSBOMDetails.vue"));
const ResultsLicenses = lazy(() => import("./licenses/ResultsLicenses.vue"));
const ResultsVulnerabilities = lazy(
  () => import("./vulnerabilities/ResultsVulnerabilities.vue"),
);
const ResultsVulnerabilitiesDetails = lazy(
  () => import("./vulnerabilities/ResultsVulnerabilitiesDetails.vue"),
);
const ResultsPatching = lazy(() => import("./patching/ResultsPatching.vue"));
const ResultsCodeQL = lazy(() => import("./codeql/ResultsCodeQL.vue"));

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
// Whether the analysis could not be found, or could not be loaded.
const notFound = ref(false);
const failed = ref(false);

// Maps a plugin to the tab that shows its results.
const TAB_OF: Record<string, keyof typeof tab.value> = {
  "js-sbom": "sbom",
  "php-sbom": "sbom",
  "vuln-finder": "vuln-finder",
  "js-patching": "js-patching",
  "license-finder": "license-finder",
  codeql: "codeql",
};

const hasTabs = computed(() => Object.values(tab.value).some(Boolean));

// The analysis status in words, when it has not completed.
const statusNotice = computed((): { title: string; text: string } | null => {
  switch (analysis.value.status) {
    case AnalysisStatus.COMPLETED:
    case AnalysisStatus.FINISHED:
      return null;
    case AnalysisStatus.FAILED:
    case AnalysisStatus.FAILURE:
      return {
        title: "Analysis failed",
        text:
          analysis.value.failure_reason ??
          "The analysis stopped before it finished.",
      };
    case AnalysisStatus.STARTED:
    case AnalysisStatus.ONGOING:
    case AnalysisStatus.UPDATING_DB:
      return {
        title: "Analysis running",
        text: "Results appear here when it finishes. Reload the page to check.",
      };
    default:
      return {
        title: "Analysis queued",
        text: "The analysis has not started yet. Reload the page to check.",
      };
  }
});

async function init(): Promise<void> {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;

  const analysis_id = searchParams.get("analysis_id");
  const project_id = searchParams.get("project_id");
  const run_index = searchParams.get("run_index");

  if (!analysis_id || !project_id) {
    notFound.value = true;
    return;
  }
  analysisID.value = analysis_id;
  projectID.value = project_id;

  // Parse run_index if provided (for scheduled analysis historical results)
  if (run_index !== null) {
    runIndex.value = parseInt(run_index, 10);
  }

  void getProject(project_id);
  await getAnalysis(project_id, analysis_id);

  // Only plugins that succeeded have results to show.
  let first: string | null = null;
  for (const step of analysis.value.steps ?? []) {
    for (const result of step) {
      const name = TAB_OF[result.Name];
      if (result.Status !== AnalysisStatus.SUCCESS || !name) continue;
      tab.value[name] = true;
      first ??= name;
    }
  }
  if (first) {
    default_tab.value = first;
    current_tab.value = first;
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
  } catch {
    // The tabs stay empty when the project or analysis cannot be read.
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
  } catch (error) {
    if (isNotFound(error, [projectID, analysisID])) notFound.value = true;
    else failed.value = true;
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

onBeforeMount(async () => {
  // The detail pages load what they show themselves.
  if (props.page !== "vulnerabilities_details" && props.page !== "sbom_details")
    await init();
  loading.value = false;
});
</script>
<template>
  <div class="flex flex-col gap-8 p-8">
    <ResultsNotFound
      v-if="notFound"
      title="Analysis not found"
      description="This analysis does not exist, or you do not have access to it."
    />
    <PageHeading
      v-else-if="
        props.page !== 'vulnerabilities_details' &&
        props.page !== 'sbom_details'
      "
      :description="project.name"
    >
      Results
      <template v-if="runIndex !== null" #badge>
        <span
          class="inline-flex items-center gap-1 rounded-full bg-neutral-subtle px-2.5 py-0.5 text-xs font-semibold text-neutral"
        >
          <History aria-hidden="true" class="size-3.5" />
          Historical run {{ runIndex + 1 }}
        </span>
      </template>
    </PageHeading>
    <template v-if="notFound" />
    <ResultsVulnerabilitiesDetails
      v-else-if="props.page === 'vulnerabilities_details'"
      :run-index="runIndex"
    />
    <ResultsSBOMDetails
      v-else-if="props.page === 'sbom_details'"
      :run-index="runIndex"
    />
    <template v-else-if="!loading">
      <Alert v-if="failed" variant="destructive">
        <AlertTitle>Could not load this analysis</AlertTitle>
        <AlertDescription>Reload the page to try again.</AlertDescription>
      </Alert>
      <Alert
        v-else-if="statusNotice"
        role="status"
        aria-label="Analysis status"
        :variant="
          analysis.status === AnalysisStatus.FAILURE ||
          analysis.status === AnalysisStatus.FAILED
            ? 'destructive'
            : 'default'
        "
      >
        <AlertTitle>{{ statusNotice.title }}</AlertTitle>
        <AlertDescription>{{ statusNotice.text }}</AlertDescription>
      </Alert>
      <Tabs
        v-if="!failed && hasTabs"
        v-model="current_tab"
        :default-value="default_tab"
        class="flex flex-col gap-6"
        @value-change="handleTabChange"
      >
        <TabsList aria-label="Results" class="self-start">
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
          <TabsTrigger v-if="tab['codeql']" value="codeql">
            CodeQL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sbom" class="space-y-4">
          <ResultsSBOM
            :project="project"
            :analysis="analysis"
            :run-index="runIndex"
          />
        </TabsContent>
        <TabsContent value="vuln-finder" class="mt-0">
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
    </template>
  </div>
</template>
