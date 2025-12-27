<script lang="ts" setup>
import type { Edge } from "@vue-flow/core";
import { storeToRefs } from "pinia";
import { Form } from "vee-validate";
import { ref, type Ref } from "vue";
import { useRoute } from "vue-router";
import InfoCard from "@/base_components/ui/cards/InfoCard.vue";
import LoadingSubmitButton from "@/base_components/ui/loaders/LoadingSubmitButton.vue";
import { AnalyzerRepository } from "@/codeclarity_components/organizations/analyzers/AnalyzerRepository";
import type { Plugin } from "@/codeclarity_components/organizations/analyzers/Plugin";
import { PluginRepository } from "@/codeclarity_components/organizations/analyzers/PluginRepository";
import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import {
  retrieveWorkflowSteps,
  layoutNodes,
  createEdgesFromNodes,
  type AnalyzerNode,
  type ConfigNode,
} from "@/utils/vueFlow";
import type { AnalyzerTemplate } from "./AnalyzerTemplatesRepository";
import AnalyzerFormFields from "./shared/AnalyzerFormFields.vue";
import AnalyzerTemplateSelector from "./shared/AnalyzerTemplateSelector.vue";
import { initializeDefaultNodes } from "./shared/analyzerUtils";
import { analyzerValidationSchema } from "./shared/analyzerValidation";
import WorkflowDesigner from "./shared/WorkflowDesigner.vue";

const orgId: Ref<string> = ref("");
const orgInfo: Ref<Organization | undefined> = ref();

// Repositories
const analyzerRepo: AnalyzerRepository = new AnalyzerRepository();
const pluginRepo: PluginRepository = new PluginRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const { defaultOrg } = storeToRefs(userStore);

// Error Handling
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string> = ref("");

// Form Data
const name: Ref<string> = ref("");
const description: Ref<string> = ref("");
const selectedTemplate: Ref<AnalyzerTemplate | null> = ref(null);
const supportedLanguages: Ref<string[]> = ref(["javascript"]);
const languageConfig: Ref<Record<string, { plugins: string[] }>> = ref({});
const logo: Ref<string> = ref("js");
const plugins: Ref<Plugin[]> = ref([]);
const nodes: Ref<(AnalyzerNode | ConfigNode)[]> = ref([]);
const edges: Ref<Edge[]> = ref([]);

// Form Validation
const formValidationSchema = analyzerValidationSchema;

function setOrgInfo(_orgInfo: Organization): void {
  orgInfo.value = _orgInfo;
  if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
    void router.push({
      name: "orgManage",
      params: { page: "", orgId: _orgInfo.id },
    });
  }
}

// Methods
function onTemplateChanged(template: AnalyzerTemplate): void {
  // Update form fields based on selected template
  name.value = template.name;
  description.value = template.description;
  supportedLanguages.value = [...template.supported_languages];
  languageConfig.value = { ...template.language_config };
  logo.value = template.logo;

  // Update workflow nodes and edges based on template
  if (template.steps && template.steps.length > 0) {
    // Convert template steps to nodes
    const templateNodes = initializeDefaultNodes(plugins.value, template.steps);
    if (templateNodes.length > 0) {
      nodes.value = templateNodes;
      edges.value = createEdgesFromNodes(templateNodes);
      nodes.value = layoutNodes(nodes.value);
    }
  }
}

async function submit(): Promise<void> {
  const arr = retrieveWorkflowSteps(nodes.value, edges.value);

  try {
    const resp = await analyzerRepo.createAnalyzer({
      orgId: defaultOrg!.value!.id,
      data: {
        name: name.value,
        description: description.value,
        steps: arr,
        supported_languages: supportedLanguages.value,
        language_config: languageConfig.value,
        logo: logo.value,
      },
      bearerToken: authStore.getToken ?? "",
    });
    console.error(resp);
  } catch (_err) {
    error.value = true;
    if (_err instanceof BusinessLogicError) {
      errorCode.value = _err.error_code;
    }
  } finally {
    router.back();
  }
}

async function init(): Promise<void> {
  const route = useRoute();
  const _orgId = route.params.orgId;

  if (!_orgId) {
    router.back();
  }

  if (!authStore.getToken) {
    throw new Error("No default org selected");
  }

  if (typeof _orgId === "string") {
    orgId.value = _orgId;
  } else {
    router.back();
  }

  try {
    const resp = await pluginRepo.geAllPlugins({
      bearerToken: authStore.getToken,
    });
    plugins.value = resp.data;

    // Initialize with default nodes
    const defaultNodes = initializeDefaultNodes(plugins.value);

    if (defaultNodes.length > 0) {
      nodes.value = defaultNodes;
      edges.value = createEdgesFromNodes(defaultNodes);
      nodes.value = layoutNodes(nodes.value);
    } else {
      nodes.value = [];
      edges.value = [];
    }
  } catch (_err) {
    error.value = true;
    if (_err instanceof BusinessLogicError) {
      errorCode.value = _err.error_code;
    }
  }
}

void init();
</script>
<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Page Header -->
    <HeaderItem
      v-if="orgId"
      :org-id="orgId"
      @on-org-info="setOrgInfo($event)"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Unified Analyzer Creation Card -->
      <InfoCard
        title="Create Analyzer"
        description="Define your analyzer details and build the analysis workflow"
        icon="solar:settings-bold"
        variant="primary"
        class="shadow-lg"
      >
        <Form
          id="form"
          class="space-y-8"
          :validation-schema="formValidationSchema"
          @submit="submit"
        >
          <!-- Template Selection Section -->
          <AnalyzerTemplateSelector
            v-model:selected-template="selectedTemplate"
            @template-changed="onTemplateChanged"
          />

          <!-- Basic Information Section -->
          <AnalyzerFormFields
            v-model:name="name"
            v-model:description="description"
            v-model:supported-languages="supportedLanguages"
            v-model:logo="logo"
          />

          <!-- Workflow Designer Section -->
          <WorkflowDesigner
            v-model:nodes="nodes"
            v-model:edges="edges"
            :plugins="plugins"
          />

          <!-- Security Note and Submit Buttons -->
          <div class="space-y-4">
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                class="px-4 py-2 border border-slate-300/60 text-theme-gray hover:bg-slate-50 rounded-lg transition-colors duration-200 font-medium"
                @click="$router.back()"
              >
                Cancel
              </button>
              <LoadingSubmitButton
                ref="loadingButtonRef"
                class="px-6 py-2 bg-linear-to-r from-theme-primary to-green-600 hover:from-theme-primary/90 hover:to-green-600/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <span>Create Analyzer</span>
              </LoadingSubmitButton>
            </div>
          </div>
        </Form>
      </InfoCard>
    </div>
  </div>
</template>
