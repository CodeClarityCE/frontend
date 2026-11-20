<script setup lang="ts">
import { computed } from "vue";

import { SeverityBadge } from "@/base_components/page";
import type { OrganizationVulnerabilityList } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import {
  SEVERITY_LABELS,
  SEVERITY_LEVELS,
  type SeverityLevel,
} from "@/utils/severity";

import type { DashboardRequest } from "../composables/useDashboardRequest";
import CardState from "../layout/CardState.vue";

const props = defineProps<{
  request: DashboardRequest<OrganizationVulnerabilityList>;
}>();

interface Vuln {
  id: string;
  severity: number;
  level: SeverityLevel;
  projects: number;
  instances: number;
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
  for (const [severityClass, count] of Object.entries(
    props.request.data?.severity_counts ?? {},
  )) {
    next[levelOf(severityClass)] = count;
  }
  return next;
});

// The API lists the worst vulnerabilities first.
const vulns = computed((): Vuln[] =>
  (props.request.data?.data ?? []).map((vuln) => ({
    id: vuln.vulnerability_id,
    severity: vuln.severity_score ?? 0,
    level: levelOf(vuln.severity_class),
    projects: vuln.project_count,
    instances: vuln.instance_count,
  })),
);

const plural = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;
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
        <ul aria-label="Vulnerabilities in your projects" class="divide-y">
          <li v-for="vuln in vulns" :key="vuln.id">
            <RouterLink
              :to="{
                name: 'orgVulnerability',
                params: { vulnerabilityId: vuln.id },
              }"
              class="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <SeverityBadge
                :level="vuln.level"
                :score="vuln.severity || undefined"
              />
              <span class="min-w-0 flex-1 truncate font-medium">{{
                vuln.id
              }}</span>
              <span class="shrink-0 text-muted-foreground">{{
                plural(vuln.projects, "project")
              }}</span>
              <span class="shrink-0 text-muted-foreground tabular-nums">{{
                plural(vuln.instances, "instance")
              }}</span>
            </RouterLink>
          </li>
        </ul>
      </ScrollArea>
    </div>
  </CardState>
</template>
