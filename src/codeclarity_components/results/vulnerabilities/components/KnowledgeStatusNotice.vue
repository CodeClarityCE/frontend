<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";

import {
  type KnowledgeSnapshot,
  type KnowledgeSourceSnapshot,
  type KnowledgeSourceStatus,
  KnowledgeStatusRepository,
} from "@/codeclarity_components/results/knowledge-status.repository";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
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

const props = defineProps<{
  analysisID: string;
  projectID: string;
}>();

// The fields shared by current status and an analysis's snapshot.
type SourceState = Pick<
  KnowledgeSourceStatus | KnowledgeSourceSnapshot,
  "source" | "status" | "watermark" | "last_outcome"
>;

const authStore = useAuthStore();
const userStore = useUserStore();
const sources = ref<SourceState[]>([]);
const snapshot = ref<KnowledgeSnapshot | null>(null);

const unhealthy = computed(() =>
  sources.value.filter((source) => source.status !== "healthy"),
);

function hasNeverRun(source: SourceState): boolean {
  return source.status !== "unknown" && source.last_outcome === null;
}

// A fresh deployment has no recorded runs, which is expected and not a fault.
const allNeverRun = computed(() => unhealthy.value.every(hasNeverRun));

function dataAsOf(source: SourceState): string {
  return source.watermark === null
    ? ""
    : ` Data is current to ${formatDate(source.watermark, "LL")}.`;
}

function describe(source: SourceState): string {
  if (source.status === "unknown") {
    return "Status could not be read when this analysis ran.";
  }
  if (source.status === "failed") {
    return `Last update failed.${dataAsOf(source)}`;
  }
  if (hasNeverRun(source)) {
    return `No update has been recorded yet.${dataAsOf(source)}`;
  }
  return `Out of date.${dataAsOf(source)}`;
}

// The as-of day is a calendar date, so it is read as local midnight.
const asOfDay = computed(() =>
  snapshot.value?.knowledge_asof
    ? formatDate(`${snapshot.value.knowledge_asof}T00:00:00`, "LL")
    : "",
);

// Reads the snapshot stored with this analysis, or null when there is none or it cannot be read.
async function loadSnapshot(token: string): Promise<KnowledgeSnapshot | null> {
  const org = userStore.getDefaultOrg;
  if (!org || props.analysisID === "" || props.projectID === "") return null;
  try {
    const response = await new KnowledgeStatusRepository().getAnalysisSnapshot({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      bearerToken: token,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    return response.data;
  } catch {
    // The notice is advisory: without a snapshot it falls back to the live status.
    return null;
  }
}

// The notice is advisory, so a failed lookup must never affect the page.
onMounted(async () => {
  const token = authStore.getToken;
  if (!authStore.getAuthenticated || !token) return;
  try {
    const stored = await loadSnapshot(token);
    // A snapshot that could not read any source says nothing, so current status is shown instead.
    if (stored?.sources.some((source) => source.status !== "unknown")) {
      snapshot.value = stored;
      sources.value = stored.sources;
      return;
    }
    const response = await new KnowledgeStatusRepository().getStatus({
      bearerToken: token,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    sources.value = response.data.sources;
  } catch {
    // Without a status the notice stays hidden.
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
        <template v-if="snapshot">
          This notice shows the status of each source when this analysis
          ran<template v-if="asOfDay">, judged as of {{ asOfDay }}</template
          >.
        </template>
        <template v-else>
          This notice shows the current status of each source, which may differ
          from when this analysis ran.
        </template>
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
