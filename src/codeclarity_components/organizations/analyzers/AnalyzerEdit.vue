<script lang="ts" setup>
import { ArrowLeft, LoaderCircle } from "@lucide/vue";
import type { Edge } from "@vue-flow/core";
import { type Ref, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

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
import { useAuthStore } from "@/stores/auth";
import { errorToast, successToast } from "@/utils/toasts";
import {
  type AnalyzerNode,
  type ConfigNode,
  createAnalyzerNodes,
  layoutNodes,
  retrieveWorkflowSteps,
} from "@/utils/vueFlow";

import AnalyzerFormFields from "./shared/AnalyzerFormFields.vue";
import { useAnalyzerForm } from "./shared/useAnalyzerForm";
import WorkflowDesigner from "./shared/WorkflowDesigner.vue";

const props = defineProps<{
  page?: string;
  orgId: string;
}>();

const route = useRoute();
const analyzerRepo = new AnalyzerRepository();
const pluginRepo = new PluginRepository();
const authStore = useAuthStore();

const analyzerId = String(route.query.analyzerId ?? "");
const { name, description, shownErrors, isValid, submitted } =
  useAnalyzerForm();
const plugins: Ref<Plugin[]> = ref([]);
const nodes: Ref<(AnalyzerNode | ConfigNode)[]> = ref([]);
const edges: Ref<Edge[]> = ref([]);
const submitting = ref(false);

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

async function submit(): Promise<void> {
  submitted.value = true;
  if (!isValid.value || !authStore.getToken || submitting.value) return;

  submitting.value = true;
  try {
    await analyzerRepo.updateAnalyzer({
      orgId: props.orgId,
      analyzer_id: analyzerId,
      data: {
        name: name.value.trim(),
        description: description.value.trim(),
        steps: retrieveWorkflowSteps(nodes.value, edges.value),
      },
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast(`Saved ${name.value.trim()}`);
    void router.push(listRoute);
  } catch {
    errorToast("Failed to save the analyzer");
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
    const { nodes: flowNodes, edges: flowEdges } = createAnalyzerNodes(
      plugins.value,
    );
    nodes.value = layoutNodes(flowNodes);
    edges.value = flowEdges;

    const res = await analyzerRepo.getAnalyzer({
      orgId: props.orgId,
      bearerToken: authStore.getToken,
      analyzer_id: analyzerId,
    });
    name.value = res.data.name;
    description.value = res.data.description;
  } catch {
    errorToast("Failed to load the analyzer");
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
      <PageHeading>Edit <BrandEmphasis>analyzer</BrandEmphasis></PageHeading>
    </div>

    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h2 class="text-lg font-semibold text-foreground-strong">Details</h2>
        </CardHeader>
        <CardContent>
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
          <CardDescription>The plugins this analyzer runs.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowDesigner
            v-model:nodes="nodes"
            v-model:edges="edges"
            :plugins="plugins"
            :readonly="true"
          />
        </CardContent>
      </Card>

      <div class="flex justify-end gap-3">
        <Button :as="RouterLink" :to="listRoute" variant="outline">
          Cancel
        </Button>
        <Button type="submit" :disabled="submitting">
          <LoaderCircle
            v-if="submitting"
            aria-hidden="true"
            class="animate-spin motion-reduce:animate-none"
          />
          Save changes
        </Button>
      </div>
    </form>
  </div>
</template>
