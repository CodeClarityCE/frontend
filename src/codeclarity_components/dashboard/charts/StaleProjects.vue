<script setup lang="ts">
import { computed, ref } from "vue";

import { OrganizationVulnerabilitiesRepository } from "@/codeclarity_components/vulnerabilities/organization_vulnerabilities.repository";
import {
  analysedAgo,
  type OrganizationFreshness,
} from "@/codeclarity_components/vulnerabilities/project_freshness.entity";
import ReanalyseButton from "@/codeclarity_components/vulnerabilities/ReanalyseButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import CardState from "../layout/CardState.vue";

// Projects whose current analysis is older than the organization's threshold.
const authStore = useAuthStore();
const userStore = useUserStore();
const repository = new OrganizationVulnerabilitiesRepository();

const freshness = ref<OrganizationFreshness | null>(null);
const loading = ref(true);
const error = ref(false);

async function fetch(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getToken) return;
  loading.value = true;
  error.value = false;
  try {
    freshness.value = await repository.getFreshness({
      orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
void fetch();

const stale = computed(
  () => freshness.value?.projects.filter((project) => project.stale) ?? [],
);
const days = computed(() => freshness.value?.threshold_days ?? 14);
</script>

<template>
  <CardState
    label="stale projects"
    :loading="loading"
    :error="error"
    :empty="stale.length === 0"
    :empty-text="`Every project was analysed in the last ${days} days.`"
    @retry="() => void fetch()"
  >
    <div class="flex flex-col gap-3">
      <p class="text-sm text-muted-foreground">
        Their current analysis is older than {{ days }} days, so newer
        vulnerabilities are not checked yet.
      </p>
      <ul class="flex flex-col divide-y" aria-label="Stale projects">
        <li
          v-for="project in stale"
          :key="project.project_id"
          data-testid="stale-project"
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
    </div>
  </CardState>
</template>
