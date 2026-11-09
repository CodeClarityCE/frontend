<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";

import {
  type KnowledgeSourceStatus,
  KnowledgeStatusRepository,
} from "@/codeclarity_components/results/knowledge-status.repository";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { useAuthStore } from "@/stores/auth";
import { formatDate } from "@/utils/dateUtils";

const SOURCE_LABELS: Record<string, string> = {
  cwe: "CWE",
  epss: "EPSS",
  friends_of_php: "FriendsOfPHP",
  gcve: "GCVE",
  licenses: "Licenses",
  nvd: "NVD",
  osv: "OSV",
};

const authStore = useAuthStore();
const sources = ref<KnowledgeSourceStatus[]>([]);

const unhealthy = computed(() =>
  sources.value.filter((source) => source.status !== "healthy"),
);

function hasNeverRun(source: KnowledgeSourceStatus): boolean {
  return source.last_outcome === null;
}

// A fresh deployment has no recorded runs, which is expected and not a fault.
const allNeverRun = computed(() => unhealthy.value.every(hasNeverRun));

function dataAsOf(source: KnowledgeSourceStatus): string {
  return source.watermark === null
    ? ""
    : ` Data is current to ${formatDate(source.watermark, "LL")}.`;
}

function describe(source: KnowledgeSourceStatus): string {
  if (source.status === "failed") {
    return `Last update failed.${dataAsOf(source)}`;
  }
  if (hasNeverRun(source)) {
    return `No update has been recorded yet.${dataAsOf(source)}`;
  }
  return `Out of date.${dataAsOf(source)}`;
}

// The notice is advisory, so a failed lookup must never affect the page.
onMounted(async () => {
  if (!authStore.getAuthenticated || !authStore.getToken) return;
  try {
    const response = await new KnowledgeStatusRepository().getStatus({
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    sources.value = response.data.sources;
  } catch (error) {
    console.warn("Could not load knowledge source status", error);
  }
});
</script>

<template>
  <Alert v-if="unhealthy.length > 0" data-testid="knowledge-status-notice">
    <AlertTitle>
      {{
        allNeverRun
          ? "Knowledge sources have not been updated yet"
          : "Some knowledge sources may be out of date"
      }}
    </AlertTitle>
    <AlertDescription>
      <p>
        These results may be incomplete.
        <template v-if="allNeverRun">
          This is expected on a new installation until the first update
          completes.
        </template>
        This notice shows the current status of each source, which may differ
        from when this analysis ran.
      </p>
      <ul class="mt-2 list-disc pl-5">
        <li v-for="source in unhealthy" :key="source.source">
          <span class="font-medium">{{
            SOURCE_LABELS[source.source] ?? source.source
          }}</span
          >: {{ describe(source) }}
        </li>
      </ul>
    </AlertDescription>
  </Alert>
</template>
