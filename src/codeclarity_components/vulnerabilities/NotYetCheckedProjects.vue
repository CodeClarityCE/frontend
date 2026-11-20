<script setup lang="ts">
import { ref, watch } from "vue";

import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { formatShortDate } from "@/utils/dateUtils";
import { logger } from "@/utils/logger";

import { OrganizationVulnerabilitiesRepository } from "./organization_vulnerabilities.repository";
import {
  analysedAgo,
  type VulnerabilityNotYetChecked,
} from "./project_freshness.entity";
import ReanalyseButton from "./ReanalyseButton.vue";

// Projects whose current analysis predates the vulnerability's publication, for its page.
const props = defineProps<{
  vulnerabilityId: string;
}>();

const authStore = useAuthStore();
const userStore = useUserStore();
const repository = new OrganizationVulnerabilitiesRepository();

const result = ref<VulnerabilityNotYetChecked | null>(null);

async function fetch(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getToken) return;
  try {
    result.value = await repository.getNotYetChecked({
      orgId,
      vulnerabilityId: props.vulnerabilityId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
  } catch (error) {
    result.value = null;
    logger.warn("Could not load the projects not yet checked", {
      component: "NotYetCheckedProjects",
      organizationId: orgId,
      stack: error instanceof Error ? error.stack : String(error),
    });
  }
}
watch(
  () => props.vulnerabilityId,
  () => void fetch(),
  { immediate: true },
);

const plural = (count: number): string =>
  `${count} project${count === 1 ? "" : "s"}`;
</script>

<template>
  <section
    v-if="result && result.projects.length > 0"
    aria-label="Not yet checked"
    class="flex flex-col gap-3 rounded-card border p-4"
  >
    <div class="flex flex-col gap-1">
      <h3 class="text-base font-medium">
        Not yet checked in {{ plural(result.projects.length) }}
      </h3>
      <p class="text-sm text-muted-foreground">
        Their current analysis is older than this vulnerability, first published
        {{ formatShortDate(result.published) }}. Re-analyse them to find out
        whether it affects them.
      </p>
    </div>
    <ul class="flex flex-col divide-y">
      <li
        v-for="project in result.projects"
        :key="project.project_id"
        data-testid="not-yet-checked-project"
        class="flex flex-wrap items-center justify-between gap-2 py-2"
      >
        <div class="flex flex-col">
          <span class="font-medium">{{ project.project_name }}</span>
          <span class="text-xs text-muted-foreground">
            {{ analysedAgo(project.analyzed_on) }}
          </span>
        </div>
        <ReanalyseButton
          :project-id="project.project_id"
          :project-name="project.project_name"
        />
      </li>
    </ul>
  </section>
</template>
