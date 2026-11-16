<script setup lang="ts">
import { computed } from "vue";

import { SeverityBadge } from "@/base_components/page";
import type { LatestVulns } from "@/codeclarity_components/dashboard/dashboard.entity";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import {
  SEVERITY_LABELS,
  SEVERITY_LEVELS,
  type SeverityLevel,
} from "@/utils/severity";

import type { DashboardRequest } from "../composables/useDashboardRequest";
import CardState from "../layout/CardState.vue";

const props = defineProps<{
  request: DashboardRequest<LatestVulns>;
}>();

interface Vuln {
  severity: number;
  level: SeverityLevel;
  name: string;
}

/** The levels counted at the top of the card */
const COUNTED: SeverityLevel[] = ["critical", "high", "medium"];

function levelOf(severityClass: string | null | undefined): SeverityLevel {
  const level = (severityClass ?? "").toLowerCase() as SeverityLevel;
  return SEVERITY_LEVELS.includes(level) ? level : "none";
}

const counts = computed(() => {
  const next: Record<SeverityLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };
  for (const item of props.request.data?.severity_count ?? []) {
    next[levelOf(item.severity_class)] = item.count;
  }
  return next;
});

const vulns = computed((): Vuln[] =>
  Object.values(props.request.data?.vulns ?? {})
    .map((vuln) => ({
      severity: vuln.severity ?? 0,
      level: levelOf(vuln.severity_class),
      name: vuln.cwe_name,
    }))
    .sort((a, b) => b.severity - a.severity),
);
</script>

<template>
  <CardState
    label="vulnerabilities summary"
    :loading="request.loading || (!request.data && !request.error)"
    :error="request.error"
    :empty="vulns.length === 0"
    empty-text="No vulnerabilities found."
    @retry="() => void request.run()"
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
