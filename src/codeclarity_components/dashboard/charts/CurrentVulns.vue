<script setup lang="ts">
import { type Ref, ref, watch } from "vue";

import { SeverityBadge } from "@/base_components/page";
import { DashboardRepository } from "@/codeclarity_components/dashboard/dashboard.repository";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import {
  SEVERITY_LABELS,
  SEVERITY_LEVELS,
  type SeverityLevel,
} from "@/utils/severity";

import CardState from "../layout/CardState.vue";

const props = defineProps<{
  integrationIds: string[];
}>();

watch(
  () => props.integrationIds,
  () => void fetch(),
);

const dashboardRepository = new DashboardRepository();
const authStore = useAuthStore();
const userStore = useUserStore();

interface Vuln {
  severity: number;
  level: SeverityLevel;
  name: string;
}

/** The levels counted at the top of the card */
const COUNTED: SeverityLevel[] = ["critical", "high", "medium"];

const error = ref(false);
const loading = ref(true);
const noData = ref(false);
const counts: Ref<Record<SeverityLevel, number>> = ref(emptyCounts());
const vulns: Ref<Vuln[]> = ref([]);

function emptyCounts(): Record<SeverityLevel, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, none: 0 };
}

function levelOf(severityClass: string | null | undefined): SeverityLevel {
  const level = (severityClass ?? "").toLowerCase() as SeverityLevel;
  return SEVERITY_LEVELS.includes(level) ? level : "none";
}

async function fetch(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getAuthenticated || !authStore.getToken) return;

  loading.value = true;
  error.value = false;

  try {
    const resp = await dashboardRepository.getRecentVulns({
      orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      integrationIds: props.integrationIds,
    });
    const next = emptyCounts();
    for (const item of resp.data.severity_count) {
      next[levelOf(item.severity_class)] = item.count;
    }
    counts.value = next;
    vulns.value = Object.values(resp.data.vulns)
      .map((vuln) => ({
        severity: vuln.severity ?? 0,
        level: levelOf(vuln.severity_class),
        name: vuln.cwe_name,
      }))
      .sort((a, b) => b.severity - a.severity);
    noData.value = vulns.value.length === 0;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
void fetch();
</script>

<template>
  <CardState
    label="vulnerabilities summary"
    :loading="loading"
    :error="error"
    :empty="noData"
    empty-text="No vulnerabilities found."
    @retry="() => void fetch()"
  >
    <div class="flex flex-col gap-4">
      <ul
        aria-label="Vulnerabilities by severity"
        class="grid grid-cols-3 gap-3"
      >
        <li
          v-for="level in COUNTED"
          :key="level"
          class="flex flex-col items-center gap-1 rounded-control border p-3"
        >
          <span class="text-sm text-muted-foreground">
            {{ SEVERITY_LABELS[level] }}
          </span>
          <span
            class="text-2xl font-bold tabular-nums text-foreground-strong"
            >{{ counts[level] }}</span
          >
        </li>
      </ul>
      <ScrollArea
        class="rounded-control border"
        :class="{ 'h-64': vulns.length > 6 }"
      >
        <ul aria-label="Most severe vulnerabilities" class="divide-y">
          <li
            v-for="(vuln, index) in vulns"
            :key="index"
            class="flex items-center gap-3 px-3 py-2 text-sm"
          >
            <SeverityBadge :level="vuln.level" :score="vuln.severity" />
            <span class="truncate">{{ vuln.name }}</span>
          </li>
        </ul>
      </ScrollArea>
    </div>
  </CardState>
</template>
