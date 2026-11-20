<script setup lang="ts">
import { ref } from "vue";

import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { logger } from "@/utils/logger";

// Starts a new analysis of a project with the configuration of its last one.
const props = defineProps<{
  projectId: string;
  projectName: string;
}>();

const authStore = useAuthStore();
const userStore = useUserStore();
const analysisRepository = new AnalysisRepository();

const state = ref<"idle" | "sending" | "started" | "failed">("idle");

async function reanalyse(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getToken) return;
  state.value = "sending";
  try {
    await analysisRepository.reanalyse({
      orgId,
      projectId: props.projectId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    state.value = "started";
  } catch (error) {
    logger.warn("Could not re-analyse a project", {
      component: "ReanalyseButton",
      projectId: props.projectId,
      organizationId: orgId,
      stack: error instanceof Error ? error.stack : String(error),
    });
    state.value = "failed";
  }
}
</script>

<template>
  <span v-if="state === 'started'" class="text-sm text-muted-foreground">
    Analysis started
  </span>
  <span v-else class="flex items-center gap-2">
    <span
      v-if="state === 'failed'"
      role="alert"
      class="text-sm text-destructive"
    >
      Could not start
    </span>
    <Button
      variant="outline"
      size="sm"
      :aria-label="`Re-analyse ${projectName}`"
      :disabled="state === 'sending'"
      @click="() => void reanalyse()"
    >
      Re-analyse
    </Button>
  </span>
</template>
