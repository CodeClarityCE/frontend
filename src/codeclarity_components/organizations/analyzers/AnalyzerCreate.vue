<script lang="ts" setup>
import { ArrowLeft } from "@lucide/vue";
import type { Edge } from "@vue-flow/core";
import { computed, type Ref, ref } from "vue";
import { RouterLink } from "vue-router";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
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
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { errorToast, successToast } from "@/utils/toasts";
import {
  type AnalyzerNode,
  type ConfigNode,
  createEdgesFromNodes,
  layoutNodes,
  retrieveWorkflowSteps,
} from "@/utils/vueFlow";

import type { AnalyzerTemplate } from "./AnalyzerTemplatesRepository";
import AnalyzerFormFields from "./shared/AnalyzerFormFields.vue";
import AnalyzerTemplateSelector from "./shared/AnalyzerTemplateSelector.vue";
import { initializeDefaultNodes } from "./shared/analyzerUtils";
import { useAnalyzerForm } from "./shared/useAnalyzerForm";
import WorkflowDesigner from "./shared/WorkflowDesigner.vue";
import { workflowProblem } from "./shared/workflowRules";

const props = defineProps<{
  page?: string;
  orgId: string;
}>();

const analyzerRepo = new AnalyzerRepository();
const pluginRepo = new PluginRepository();
const authStore = useAuthStore();

const { name, description, shownErrors, isValid, submitted } =
  useAnalyzerForm();
const selectedTemplate: Ref<AnalyzerTemplate | null> = ref(null);
const supportedLanguages: Ref<string[]> = ref(["javascript"]);
const languageConfig: Ref<Record<string, { plugins: string[] }>> = ref({});
const logo: Ref<string> = ref("js");
const plugins: Ref<Plugin[]> = ref([]);
const nodes: Ref<(AnalyzerNode | ConfigNode)[]> = ref([]);
const edges: Ref<Edge[]> = ref([]);
const submitting = ref(false);

// Why the workflow on the canvas cannot be saved, shown once the user tried.
const workflowError = computed(() =>
  workflowProblem(
    nodes.value
      .filter((n): n is AnalyzerNode => n.type === "analyzer")
      .map((n) => n.data.plugin),
  ),
);

const listRoute = {
  name: "orgs",
  params: { action: "manage", page: "analyzers", orgId: props.orgId },
};

// Only admins manage analyzers; others go back to the organisation overview.
function setOrgInfo(orgInfo: Organization): void {
  if (!isMemberRoleGreaterOrEqualTo(orgInfo.role, MemberRole.ADMIN)) {
    void router.push({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: orgInfo.id },
    });
  }
}

function setNodes(next: AnalyzerNode[]): void {
  nodes.value = layoutNodes(next);
  edges.value = createEdgesFromNodes(next);
}

// A template fills in the form and replaces the workflow; Custom puts back the default one.
function onTemplateChanged(template: AnalyzerTemplate | null): void {
  if (!template) {
    supportedLanguages.value = ["javascript"];
    languageConfig.value = {};
    logo.value = "js";
    setNodes(initializeDefaultNodes(plugins.value));
    return;
  }
  name.value = template.name;
  description.value = template.description;
  supportedLanguages.value = [...template.supported_languages];
  languageConfig.value = { ...template.language_config };
  logo.value = template.logo;
  setNodes(initializeDefaultNodes(plugins.value, template.steps));
}

async function submit(): Promise<void> {
  submitted.value = true;
  if (
    !isValid.value ||
    workflowError.value ||
    !authStore.getToken ||
    submitting.value
  )
    return;

  submitting.value = true;
  try {
    await analyzerRepo.createAnalyzer({
      orgId: props.orgId,
      data: {
        name: name.value.trim(),
        description: description.value.trim(),
        steps: retrieveWorkflowSteps(nodes.value, edges.value),
        supported_languages: supportedLanguages.value,
        language_config: languageConfig.value,
        logo: logo.value,
      },
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast(`Created ${name.value.trim()}`);
    void router.push(listRoute);
  } catch {
    errorToast("Failed to create the analyzer");
  } finally {
    submitting.value = false;
  }
}

async function init(): Promise<void> {
  if (!authStore.getToken) return;
  try {
    const resp = await pluginRepo.geAllPlugins({
      bearerToken: authStore.getToken,
    });
    plugins.value = resp.data;
    setNodes(initializeDefaultNodes(plugins.value));
  } catch {
    errorToast("Failed to load the plugins");
  }
}

void init();
</script>
<template>
  <div class="flex flex-col gap-8">
    <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo" />

    <div class="flex flex-col gap-3">
      <RouterLink
        :to="listRoute"
        class="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" class="size-4" />
        Analyzers
      </RouterLink>
      <PageHeading
        description="Pick a template or start from scratch, then shape the workflow of plugins it runs."
      >
        New <BrandEmphasis>analyzer</BrandEmphasis>
      </PageHeading>
    </div>

    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h2 class="text-lg font-semibold text-foreground-strong">Details</h2>
        </CardHeader>
        <CardContent class="flex flex-col gap-6">
          <AnalyzerTemplateSelector
            v-model:selected-template="selectedTemplate"
            @template-changed="onTemplateChanged"
          />
          <AnalyzerFormFields
            v-model:name="name"
            v-model:description="description"
            :errors="shownErrors"
          />
        </CardContent>
      </Card>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h2 class="text-lg font-semibold text-foreground-strong">Workflow</h2>
          <CardDescription>
            Right-click the canvas to add a plugin. Select a plugin and press
            Delete to remove it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowDesigner
            v-model:nodes="nodes"
            v-model:edges="edges"
            :plugins="plugins"
          />
          <p
            v-if="submitted && workflowError"
            role="alert"
            class="mt-3 text-sm text-destructive"
          >
            {{ workflowError }}
          </p>
        </CardContent>
      </Card>

      <div class="flex justify-end gap-3">
        <Button :as="RouterLink" :to="listRoute" variant="outline">
          Cancel
        </Button>
        <Button type="submit" :disabled="submitting">
          <Spinner v-if="submitting" />
          Create analyzer
        </Button>
      </div>
    </form>
  </div>
</template>
