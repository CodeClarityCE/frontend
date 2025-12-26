<script lang="ts" setup>
import { PageHeader } from "@/base_components";
import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import type {
  Analyzer,
  Stage,
} from "@/codeclarity_components/organizations/analyzers/Analyzer";
import { AnalyzerRepository } from "@/codeclarity_components/organizations/analyzers/AnalyzerRepository";
import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import type { Project } from "@/codeclarity_components/projects/project.entity";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import router from "@/router";
import Alert from "@/shadcn/ui/alert/Alert.vue";
import AlertDescription from "@/shadcn/ui/alert/AlertDescription.vue";
import AlertTitle from "@/shadcn/ui/alert/AlertTitle.vue";
import Button from "@/shadcn/ui/button/Button.vue";
import { FormField } from "@/shadcn/ui/form";
import FormControl from "@/shadcn/ui/form/FormControl.vue";
import FormDescription from "@/shadcn/ui/form/FormDescription.vue";
import FormItem from "@/shadcn/ui/form/FormItem.vue";
import FormLabel from "@/shadcn/ui/form/FormLabel.vue";
import FormMessage from "@/shadcn/ui/form/FormMessage.vue";
import Input from "@/shadcn/ui/input/Input.vue";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { toast } from "@/shadcn/ui/toast";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import type { DataResponse } from "@/utils/api/responses/DataResponse";
import { filterUndefined } from "@/utils/form/filterUndefined";
import { Icon } from "@iconify/vue";
import { watchDeep } from "@vueuse/core";
import { AlertCircle } from "lucide-vue-next";
import { Form } from "vee-validate";
import { h, ref, type Ref } from "vue";
import { RouterLink } from "vue-router";
import ScheduleSelector from "./components/ScheduleSelector.vue";
import SelectLicensePolicy from "./components/SelectLicensePolicy.vue";
import SelectVulnerabilityPolicy from "./components/SelectVulnerabilityPolicy.vue";

/*****************************************************************************/
/*                                  Interfaces                               */
/*****************************************************************************/
interface AvailableAnalyzer {
  id: number;
  name: string;
  displayName: string;
  description: string;
}

// AnalyzerStep type removed - use Stage[] from Analyzer module instead

interface PluginConfig {
  name: string;
  required?: boolean;
  description?: string;
}

// Helper to cast Stage config to expected array type for template iteration
function getPluginConfigs(config: Record<string, unknown>): PluginConfig[] {
  return config as unknown as PluginConfig[];
}

interface FormValues {
  branch?: string;
  commit_id?: string;
  [key: string]: string | undefined;
}

interface AnalysisDataPayload {
  analyzer_id: string;
  branch: string;
  commit_hash: string;
  config: Record<string, Record<string, unknown>>;
  schedule_type?: "once" | "daily" | "weekly";
  is_active?: boolean;
  next_scheduled_run?: string;
}

const user = useUserStore();
const auth = useAuthStore();

const state = useStateStore();
state.$reset();

state.page = "add";

/*****************************************************************************/
/*                                    Data                                   */
/*****************************************************************************/
const projectRepository: AnalysisRepository = new AnalysisRepository();
const analyzerRepository: AnalyzerRepository = new AnalyzerRepository();
const projectRepo: ProjectRepository = new ProjectRepository();

const selected_branch: Ref<string> = ref("");
const selected_commit_hash: Ref<string> = ref("");
const selected_analyzers: Ref<number[]> = ref([]);
const selected_license_policy: Ref<string[]> = ref([]);
const selected_vulnerability_policy: Ref<string | null> = ref(null);
const selected_analyzers_list: Ref<Analyzer[]> = ref([]);
const availableAnalyzers: Ref<AvailableAnalyzer[]> = ref([]);

const configuration: Ref<Record<string, Record<string, unknown>>> = ref({});

// Available languages for analyzer configuration only
const availableLanguages = ["javascript", "php"];

// Schedule data
const scheduleData = ref({
  schedule_type: "once" as "once" | "daily" | "weekly",
  next_scheduled_run: undefined as Date | undefined,
  is_active: true,
});

const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const errorMessage: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(false);

const project_id: Ref<string> = ref("");
const project: Ref<Project | undefined> = ref();

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("id");
if (projectId === null) {
  throw new Error("Project id not found");
}
project_id.value = projectId;

// Fetch project info
async function getProject(): Promise<void> {
  if (auth.getAuthenticated && auth.getToken) {
    if (user.defaultOrg?.id === undefined) {
      return;
    }
    try {
      const res: DataResponse<Project> = await projectRepo.getProjectById({
        orgId: user.defaultOrg?.id,
        projectId: project_id.value,
        bearerToken: auth.getToken,
        handleBusinessErrors: true,
      });
      project.value = res.data;
    } catch (err) {
      error.value = true;
      if (err instanceof BusinessLogicError) {
        errorCode.value = err.error_code;
        errorMessage.value = err.error_message;
      }
    }
  }
}

// Initialize
void getProject();
void fetchAvailableAnalyzers();

// Fetch available analyzers
async function fetchAvailableAnalyzers(): Promise<void> {
  if (auth.getAuthenticated && auth.getToken && user.defaultOrg?.id) {
    try {
      const res = await analyzerRepository.getAnalyzers({
        orgId: user.defaultOrg.id,
        page: 0,
        entries_per_page: 0,
        search_key: "",
        bearerToken: auth.getToken,
        handleBusinessErrors: true,
      });

      // Transform the data to include display names
      availableAnalyzers.value = res.data.map(
        (analyzer: Analyzer): AvailableAnalyzer => {
          const id = Number(analyzer.id);
          const name = String(analyzer.name);
          const displayName = name === "JS" ? "JavaScript Analyzer" : name;
          const description =
            analyzer.description ?? "SBOM, vulnerabilities and licenses";
          return {
            id,
            name,
            displayName,
            description,
          };
        },
      );
    } catch (err) {
      console.error("Failed to fetch analyzers:", err);
    }
  }
}

function onSubmit(values: FormValues, plugin_name: string): void {
  // Just apply config silently - comprehensive toast is shown by validateAllConfigurations
  void applyConfigSilently(values, plugin_name);
}

watchDeep(selected_analyzers, () => {
  selected_analyzers_list.value = [];
  const firstAnalyzer = selected_analyzers.value[0];
  if (selected_analyzers.value.length > 0 && firstAnalyzer !== undefined) {
    void getAnalyzer(firstAnalyzer.toString());
  }
});

async function getAnalyzer(analyzer_id: string): Promise<void> {
  loading.value = true;
  let response: DataResponse<Analyzer>;
  try {
    response = await analyzerRepository.getAnalyzer({
      analyzer_id: analyzer_id,
      orgId: user.defaultOrg?.id ?? "",
      bearerToken: auth.getToken!,
      handleBusinessErrors: true,
    });
    selected_analyzers_list.value.push(response.data);
  } catch (_err) {
    error.value = true;
    if (_err instanceof BusinessLogicError) {
      errorCode.value = _err.error_code;
    }
  } finally {
    loading.value = false;
  }
}

// Helper functions for SBOM plugin consolidation
function isSBOMPlugin(pluginName: string): boolean {
  return pluginName.endsWith("-sbom");
}

function hasSBOMPlugins(analyzer: Analyzer): boolean {
  return analyzer.steps.some((step: Stage[]) =>
    step.some(
      (plugin: Stage) =>
        isSBOMPlugin(String(plugin.name)) &&
        Object.keys(plugin.config).length > 0,
    ),
  );
}

function onSubmitSBOM(values: FormValues): void {
  // Apply the same configuration to all SBOM plugins
  selected_analyzers_list.value.forEach((analyzer: Analyzer) => {
    analyzer.steps.forEach((step: Stage[]) => {
      step.forEach((plugin: Stage) => {
        if (isSBOMPlugin(String(plugin.name))) {
          void onSubmit(values, String(plugin.name));
        }
      });
    });
  });
}

// Additional helper functions for the new adaptive UI
function hasPolicyPlugins(analyzer: Analyzer): boolean {
  return hasVulnFinderPlugin(analyzer) || hasLicenseFinderPlugin(analyzer);
}

function hasVulnFinderPlugin(analyzer: Analyzer): boolean {
  return analyzer.steps.some((step: Stage[]) =>
    step.some(
      (plugin: Stage) =>
        (String(plugin.name) === "vuln-finder" ||
          String(plugin.name) === "js-vuln-finder") &&
        Object.keys(plugin.config).length > 0,
    ),
  );
}

function hasLicenseFinderPlugin(analyzer: Analyzer): boolean {
  return analyzer.steps.some((step: Stage[]) =>
    step.some(
      (plugin: Stage) =>
        (String(plugin.name) === "license-finder" ||
          String(plugin.name) === "js-license") &&
        Object.keys(plugin.config).length > 0,
    ),
  );
}

function hasAdvancedPlugins(analyzer: Analyzer): boolean {
  return analyzer.steps.some((step: Stage[]) =>
    step.some((plugin: Stage) => isAdvancedPlugin(plugin)),
  );
}

function isAdvancedPlugin(plugin: Stage): boolean {
  // Advanced plugins are those that aren't SBOM, vuln-finder, or license-finder
  // and have configuration options
  const pluginName = String(plugin.name);
  const isPolicyPlugin =
    pluginName === "vuln-finder" ||
    pluginName === "js-vuln-finder" ||
    pluginName === "license-finder" ||
    pluginName === "js-license";

  return (
    !isSBOMPlugin(pluginName) &&
    !isPolicyPlugin &&
    Object.keys(plugin.config).length > 0
  );
}

// Helper functions for modern analyzer UI
function getAnalyzerIcon(analyzerName: string): string {
  const name = analyzerName.toLowerCase();
  if (name.includes("javascript") || name.includes("js")) {
    return "devicon:javascript";
  }
  if (name.includes("php")) {
    return "devicon:php";
  }
  if (name.includes("multi") || name.includes("language")) {
    return "solar:code-square-bold";
  }
  return "solar:shield-check-bold";
}

function getAnalyzerTechnologies(analyzerName: string): string[] {
  const name = analyzerName.toLowerCase();
  if (name.includes("multi") || name.includes("language")) {
    return ["JavaScript", "PHP", "Node.js", "Composer"];
  }
  if (name.includes("javascript") || name.includes("js")) {
    return ["JavaScript", "Node.js", "npm", "yarn"];
  }
  if (name.includes("php")) {
    return ["PHP", "Composer", "Laravel", "Symfony"];
  }
  return ["Security Analysis"];
}

// Validate all configurations (without showing individual toasts)
async function validateAllConfigurations(): Promise<void> {
  // Get the current selected analyzer
  if (selected_analyzers_list.value.length === 0) {
    throw new Error("No analyzer selected");
  }

  const analyzer = selected_analyzers_list.value[0];
  if (!analyzer) {
    throw new Error("No analyzer found");
  }

  // 1. Apply SBOM configuration if needed
  if (hasSBOMPlugins(analyzer)) {
    // Get actual form values from the SBOM form inputs
    const branchInput: HTMLInputElement | null = document.querySelector(
      'input[placeholder="main"]',
    );
    const commitHashInput: HTMLInputElement | null = document.querySelector(
      'input[placeholder="latest"]',
    );

    const branchValue: string =
      branchInput !== null ? branchInput.value : "main";
    const commitHashValue: string =
      commitHashInput !== null ? commitHashInput.value : "";

    // Update global values with actual form input
    selected_branch.value = branchValue;
    selected_commit_hash.value = commitHashValue !== "" ? commitHashValue : " ";

    const sbomConfig: FormValues = {
      branch: branchValue,
    };
    void onSubmitSBOM(sbomConfig);
  }

  // 2. Apply policy configurations silently
  analyzer.steps.forEach((step: Stage[]) => {
    step.forEach((plugin: Stage) => {
      const pluginName = String(plugin.name);
      // Vulnerability policy
      if (
        (pluginName === "vuln-finder" || pluginName === "js-vuln-finder") &&
        Object.keys(plugin.config).length > 0
      ) {
        void applyConfigSilently({}, "vuln-finder");
      }

      // License policy
      if (
        (pluginName === "license-finder" || pluginName === "js-license") &&
        Object.keys(plugin.config).length > 0
      ) {
        void applyConfigSilently({}, "license-finder");
      }

      // Advanced plugins - apply empty config for now
      if (isAdvancedPlugin(plugin)) {
        void applyConfigSilently({}, pluginName);
      }
    });
  });

  // 3. Show single comprehensive configuration toast
  void showFinalConfigurationToast();
}

// Apply configuration silently (without toast notification)
function applyConfigSilently(values: FormValues, plugin_name: string): void {
  if (values === undefined || Object.keys(values).length === 0) {
    configuration.value[plugin_name] = {};
  } else {
    configuration.value[plugin_name] = values as Record<string, unknown>;
  }

  if (plugin_name === "license-finder") {
    configuration.value[plugin_name].licensePolicy =
      selected_license_policy.value;
  }
  if (plugin_name === "vuln-finder") {
    // Send policy ID if one is selected, otherwise send empty array for no policy
    configuration.value[plugin_name].vulnerabilityPolicy =
      selected_vulnerability_policy.value
        ? [selected_vulnerability_policy.value]
        : [];
  }
  if (
    plugin_name === "js-sbom" ||
    plugin_name === "php-sbom" ||
    plugin_name === "codeql"
  ) {
    const branchValue = values.branch ?? "main";
    configuration.value[plugin_name].project =
      `${user.defaultOrg?.id ?? ""}/projects/${project_id.value}/${branchValue}`;
    selected_branch.value = branchValue;
  }
}

// Show final comprehensive configuration toast
function showFinalConfigurationToast(): void {
  toast({
    title: "🔧 Configuration Applied",
    description: h("div", { class: "space-y-2" }, [
      h(
        "p",
        { class: "text-sm text-gray-600" },
        "Complete configuration for API requests:",
      ),
      h(
        "pre",
        {
          class:
            "mt-2 w-[380px] rounded-md bg-slate-950 p-3 text-xs overflow-auto max-h-40",
        },
        h(
          "code",
          { class: "text-white" },
          JSON.stringify(configuration.value, null, 2),
        ),
      ),
    ]),
  });
}

// Fetch projects
async function createAnalysisStart(): Promise<void> {
  loading.value = true;
  // Note: branch and commit hash values are now collected in validateAllConfigurations

  try {
    // Validate and apply all configurations before creating analysis
    await validateAllConfigurations();

    if (auth.getAuthenticated && auth.getToken) {
      if (user.defaultOrg?.id === undefined) {
        throw new Error("Organization id not found");
      }

      // Prepare analysis data with scheduling information
      const firstAnalyzerId = selected_analyzers.value[0];
      if (firstAnalyzerId === undefined) {
        throw new Error("No analyzer selected");
      }
      const analysisData: AnalysisDataPayload = {
        analyzer_id: firstAnalyzerId.toString(),
        branch: selected_branch.value,
        commit_hash: selected_commit_hash.value,
        config: configuration.value,
      };

      // Add scheduling fields if not 'once'
      if (scheduleData.value.schedule_type !== "once") {
        analysisData.schedule_type = scheduleData.value.schedule_type;
        analysisData.is_active = scheduleData.value.is_active;
        if (scheduleData.value.next_scheduled_run) {
          // Convert local date to UTC for storage/transmission
          analysisData.next_scheduled_run =
            scheduleData.value.next_scheduled_run.toISOString();
        }
      }

      await projectRepository.createAnalysis({
        orgId: user.defaultOrg.id,
        projectId: project_id.value,
        bearerToken: auth.getToken,
        handleBusinessErrors: true,
        data: analysisData,
      });
      toast({
        title: "✅ Analysis Created Successfully!",
        description:
          "Your analysis has been started and will run in the background. You will be notified when results are available.",
        variant: "default",
      });
      void router.push({ name: "projects" });
    }
  } catch (_err) {
    error.value = true;
    if (_err instanceof BusinessLogicError) {
      errorCode.value = _err.error_code;
      errorMessage.value = _err.error_message;
    }
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <main class="min-h-screen bg-white p-6">
    <!-- Page Header -->
    <PageHeader
      title="Analysis"
      description="Select the analyzers to run on the project"
      :show-last-updated="false"
      :show-refresh="false"
    />

    <!-- Project Information - Simplified -->
    <div
      v-if="project"
      class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div class="flex items-center gap-3">
        <Icon
          v-if="project?.type === IntegrationProvider.GITHUB"
          icon="simple-icons:github"
          class="h-6 w-6 text-gray-700"
        />
        <Icon
          v-else-if="project?.type === IntegrationProvider.GITLAB"
          icon="simple-icons:gitlab"
          class="h-6 w-6 text-gray-700"
        />
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900">{{ project?.name }}</h3>
          <p class="text-sm text-gray-600">{{ project?.type }}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="text-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
          as-child
        >
          <a
            target="_blank"
            :href="project?.url"
            class="flex items-center gap-1"
          >
            <Icon icon="solar:external-link-linear" class="h-4 w-4" />
            View
          </a>
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <Icon
        icon="eos-icons:loading"
        class="h-12 w-12 text-theme-primary animate-spin mb-4"
      />
      <span class="text-xl font-medium text-theme-black"
        >Starting analysis...</span
      >
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-8">
      <!-- Error Alert -->
      <Alert
        v-if="error"
        variant="destructive"
        class="border-red-200 bg-red-50"
      >
        <AlertCircle class="w-4 h-4 text-red-600" />
        <AlertTitle class="text-red-800 font-semibold">Error</AlertTitle>
        <AlertDescription class="text-red-700">
          <div
            v-if="
              errorCode === 'AlreadyExists' &&
              scheduleData.schedule_type !== 'once'
            "
          >
            <p class="font-medium mb-2">
              Only one scheduled analysis allowed per project
            </p>
            <p class="text-sm">
              This project already has an active scheduled analysis. Please
              cancel the existing scheduled analysis before creating a new one,
              or create a one-time analysis instead.
            </p>
          </div>
          <div v-else>{{ errorCode }} - {{ errorMessage }}</div>
        </AlertDescription>
      </Alert>

      <!-- Modern Analyzer Selection -->
      <div class="space-y-6">
        <div class="text-center">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Security Analysis
          </h3>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Select the analyzer that best matches your project's technology
            stack
          </p>
        </div>

        <!-- Analyzer Cards Grid -->
        <div class="grid gap-4 md:gap-6">
          <div
            v-for="analyzer in availableAnalyzers"
            :key="analyzer.id"
            class="group relative"
          >
            <input
              :id="`analyzer-${analyzer.id}`"
              v-model="selected_analyzers"
              type="checkbox"
              :value="analyzer.id"
              class="sr-only peer"
            />
            <label
              :for="`analyzer-${analyzer.id}`"
              class="block p-6 bg-white border-2 border-gray-200 rounded-2xl cursor-pointer transition-all duration-200 hover:border-theme-primary hover:shadow-lg peer-checked:border-theme-primary peer-checked:bg-theme-primary/5 peer-checked:shadow-lg"
            >
              <div class="flex items-start gap-4">
                <!-- Modern Icon -->
                <div class="flex-shrink-0">
                  <div
                    class="w-16 h-16 bg-gradient-to-br from-theme-primary to-theme-primary/80 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Icon
                      :icon="getAnalyzerIcon(analyzer.name)"
                      class="w-10 h-10 text-white"
                    />
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <h4
                      class="text-xl font-semibold text-gray-900 group-hover:text-theme-primary transition-colors"
                    >
                      {{ analyzer.displayName ?? analyzer.name }}
                    </h4>
                    <div class="hidden peer-checked:block">
                      <div
                        class="w-6 h-6 bg-theme-primary rounded-full flex items-center justify-center"
                      >
                        <Icon
                          icon="solar:check-bold"
                          class="w-4 h-4 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <p class="text-gray-600 mb-4 leading-relaxed">
                    {{
                      analyzer.description ||
                      "Security analysis for your codebase"
                    }}
                  </p>

                  <!-- Technology Tags -->
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tech in getAnalyzerTechnologies(analyzer.name)"
                      :key="tech"
                      class="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full"
                    >
                      {{ tech }}
                    </span>
                  </div>
                </div>

                <!-- Selection Indicator -->
                <div
                  class="flex-shrink-0 opacity-0 peer-checked:opacity-100 transition-opacity"
                >
                  <div
                    class="w-8 h-8 bg-theme-primary rounded-full flex items-center justify-center shadow-md"
                  >
                    <Icon icon="solar:check-bold" class="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </label>
          </div>

          <!-- Empty State -->
          <div
            v-if="availableAnalyzers.length === 0"
            class="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300"
          >
            <div
              class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Icon
                icon="solar:settings-linear"
                class="w-8 h-8 text-gray-400"
              />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              No Analyzers Available
            </h3>
            <p class="text-gray-600 mb-4">
              Create your first analyzer to get started with security analysis.
            </p>
            <Button variant="default" as-child>
              <RouterLink
                :to="{
                  name: 'orgs',
                  params: {
                    action: 'add',
                    page: 'analyzers',
                    orgId: user.defaultOrg?.id,
                  },
                }"
                class="inline-flex items-center gap-2"
              >
                <Icon icon="solar:add-circle-bold" class="w-4 h-4" />
                Create New Analyzer
              </RouterLink>
            </Button>
          </div>
        </div>

        <!-- Selection Summary -->
        <div v-if="selected_analyzers.length > 0" class="text-center">
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-theme-primary/10 border border-theme-primary/20 text-theme-primary rounded-full"
          >
            <Icon icon="solar:check-circle-bold" class="w-5 h-5" />
            <span class="font-medium">
              {{ selected_analyzers.length }} analyzer{{
                selected_analyzers.length > 1 ? "s" : ""
              }}
              selected
            </span>
          </div>
        </div>
      </div>

      <!-- Modern Configuration Section -->
      <div v-if="selected_analyzers.length > 0" class="space-y-6">
        <div class="text-center">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">
            Configure Your Analysis
          </h3>
          <p class="text-gray-600">
            Fine-tune the settings for your security analysis
          </p>
        </div>

        <!-- New Adaptive Configuration UI -->
        <div class="space-y-6">
          <div
            v-for="analyzer in selected_analyzers_list"
            :key="analyzer.id"
            class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <!-- Configuration Sections -->
            <div class="divide-y divide-gray-100">
              <!-- Repository Configuration (if SBOM plugins exist) -->
              <div v-if="hasSBOMPlugins(analyzer)" class="p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div
                    class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"
                  >
                    <Icon
                      icon="solar:code-square-bold"
                      class="w-5 h-5 text-blue-600"
                    />
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900">
                      Repository Configuration
                    </h4>
                    <p class="text-sm text-gray-500">
                      Source code and dependency analysis settings
                    </p>
                  </div>
                </div>

                <Form
                  class="space-y-4"
                  @submit="(values: any) => onSubmitSBOM(values)"
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField v-slot="{ componentField }" name="branch">
                      <FormItem>
                        <FormLabel class="text-sm font-medium text-gray-700">
                          Branch <span class="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="main"
                            v-bind="filterUndefined(componentField)"
                            class="border-gray-300 focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>

                    <FormField v-slot="{ componentField }" name="commit_id">
                      <FormItem>
                        <FormLabel class="text-sm font-medium text-gray-700">
                          Commit ID
                          <span class="text-xs text-gray-500">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="latest"
                            v-bind="filterUndefined(componentField)"
                            class="border-gray-300 focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </div>
                </Form>
              </div>

              <!-- Policy Configuration -->
              <div v-if="hasPolicyPlugins(analyzer)" class="p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div
                    class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"
                  >
                    <Icon
                      icon="solar:shield-check-bold"
                      class="w-5 h-5 text-green-600"
                    />
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900">
                      Security Policies
                    </h4>
                    <p class="text-sm text-gray-500">
                      Set up compliance and filtering rules
                    </p>
                  </div>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                  <!-- Vulnerability Policy -->
                  <div v-if="hasVulnFinderPlugin(analyzer)" class="space-y-3">
                    <div class="flex items-center gap-2">
                      <Icon
                        icon="solar:bug-bold"
                        class="w-5 h-5 text-red-500"
                      />
                      <span class="font-semibold text-gray-900"
                        >Vulnerability Policy</span
                      >
                      <span
                        class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >Optional</span
                      >
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4 border">
                      <SelectVulnerabilityPolicy
                        v-model:selected_vulnerability_policy="
                          selected_vulnerability_policy
                        "
                      />
                    </div>
                  </div>

                  <!-- License Policy -->
                  <div
                    v-if="hasLicenseFinderPlugin(analyzer)"
                    class="space-y-3"
                  >
                    <div class="flex items-center gap-2">
                      <Icon
                        icon="solar:document-text-bold"
                        class="w-5 h-5 text-blue-500"
                      />
                      <span class="font-semibold text-gray-900"
                        >License Policy</span
                      >
                      <span
                        class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >Optional</span
                      >
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4 border">
                      <SelectLicensePolicy
                        v-model:selected_license_policy="
                          selected_license_policy
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Advanced Plugin Configuration -->
              <div v-if="hasAdvancedPlugins(analyzer)" class="p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div
                    class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"
                  >
                    <Icon
                      icon="solar:settings-bold"
                      class="w-5 h-5 text-purple-600"
                    />
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900">
                      Advanced Configuration
                    </h4>
                    <p class="text-sm text-gray-500">
                      Plugin-specific settings and customizations
                    </p>
                  </div>
                </div>

                <div class="space-y-4">
                  <div v-for="(step, index) in analyzer.steps" :key="index">
                    <div v-for="plugin in step" :key="plugin.name">
                      <div v-if="isAdvancedPlugin(plugin)">
                        <div
                          class="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div class="flex items-center gap-2 mb-3">
                            <span class="font-medium text-gray-900">{{
                              plugin.name
                            }}</span>
                            <span
                              class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded"
                              >{{ plugin.version }}</span
                            >
                          </div>

                          <Form
                            class="space-y-3"
                            @submit="
                              (values: any) => onSubmit(values, plugin.name)
                            "
                          >
                            <div
                              v-for="config in getPluginConfigs(plugin.config)"
                              :key="config.name"
                              class="space-y-2"
                            >
                              <FormField
                                v-slot="{ componentField }"
                                :name="config.name"
                              >
                                <FormItem>
                                  <FormLabel
                                    class="text-sm font-medium text-gray-700"
                                  >
                                    {{ config.name }}
                                    <span
                                      v-if="config.required"
                                      class="text-red-500"
                                      >*</span
                                    >
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      v-if="config.name === 'language'"
                                      v-bind="filterUndefined(componentField)"
                                    >
                                      <SelectTrigger
                                        class="border-gray-300 focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                                      >
                                        <SelectValue
                                          placeholder="Select language"
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectItem
                                            v-for="language in availableLanguages"
                                            :key="language"
                                            :value="language"
                                          >
                                            {{
                                              language.charAt(0).toUpperCase() +
                                              language.slice(1)
                                            }}
                                          </SelectItem>
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      v-else
                                      :placeholder="config.name"
                                      v-bind="filterUndefined(componentField)"
                                      class="border-gray-300 focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                                    />
                                  </FormControl>
                                  <FormDescription
                                    v-if="config.description"
                                    class="text-xs text-gray-500"
                                  >
                                    {{ config.description }}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              </FormField>
                            </div>
                          </Form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Configuration -->
        <div class="space-y-4">
          <ScheduleSelector v-model="scheduleData" />
        </div>

        <!-- Create Analysis Button - More prominent -->
        <div class="border-t border-gray-200 pt-6 mt-8">
          <div class="flex justify-center">
            <Button
              size="lg"
              class="px-8 bg-theme-primary hover:bg-theme-primary/90 text-white font-medium"
              :disabled="loading"
              @click="createAnalysisStart"
            >
              <Icon
                v-if="loading"
                icon="eos-icons:loading"
                class="h-4 w-4 mr-2 animate-spin"
              />
              {{ loading ? "Creating Analysis..." : "Create Analysis" }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
