<script setup lang="ts">
import { ref } from "vue";

import { SeverityBadge } from "@/base_components/page";
import { TicketStatusLabels } from "@/codeclarity_components/tickets/tickets.entity";
import type { FixNextEntry } from "@/codeclarity_components/vulnerabilities/fix_next.entity";
import { OrganizationVulnerabilitiesRepository } from "@/codeclarity_components/vulnerabilities/organization_vulnerabilities.repository";
import { RemediationKind } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import { levelOfClass } from "@/codeclarity_components/vulnerabilities/severity-class";
import { Badge } from "@/shadcn/ui/badge";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import CardState from "../layout/CardState.vue";

// The organization's remediations, most urgent first, with the reasons for their rank.
const authStore = useAuthStore();
const userStore = useUserStore();
const repository = new OrganizationVulnerabilitiesRepository();

const entries = ref<FixNextEntry[]>([]);
const loading = ref(true);
const error = ref(false);

async function fetch(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getToken) return;
  loading.value = true;
  error.value = false;
  try {
    entries.value = await repository.getFixNext({
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

const plural = (count: number, noun: string, many = `${noun}s`): string =>
  `${count} ${count === 1 ? noun : many}`;

const title = (entry: FixNextEntry): string =>
  `${entry.kind === RemediationKind.ForceVersion ? "Force" : "Upgrade"} ${entry.package} to ${entry.target_version}`;

// The ticket state of an entry: its one ticket, how many of its projects have one, or none.
function ticketState(entry: FixNextEntry): {
  text: string;
  ticketId?: string;
} {
  const tickets = entry.remediations.flatMap((r) =>
    r.ticket ? [r.ticket] : [],
  );
  if (tickets.length === 0) return { text: "No ticket" };
  if (entry.remediations.length === 1) {
    return {
      text: TicketStatusLabels[tickets[0]!.status],
      ticketId: tickets[0]!.id,
    };
  }
  return {
    text: `${tickets.length} of ${entry.remediations.length} ticketed`,
  };
}
</script>

<template>
  <CardState
    label="Fix next list"
    :loading="loading"
    :error="error"
    :empty="entries.length === 0"
    empty-text="Nothing to fix: no remediation resolves a vulnerability in your projects."
    @retry="() => void fetch()"
  >
    <ol aria-label="Remediations to fix next" class="flex flex-col divide-y">
      <li
        v-for="entry in entries"
        :key="`${entry.kind} ${entry.package} ${entry.target_version}`"
        data-testid="fix-next-entry"
        class="flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <div class="flex min-w-0 flex-col gap-1.5">
          <h3 class="truncate font-medium">
            <RouterLink
              :to="{
                name: 'orgVulnerability',
                params: { vulnerabilityId: entry.vulnerability_id },
              }"
              class="hover:underline focus-visible:underline focus-visible:outline-none"
              >{{ title(entry) }}</RouterLink
            >
          </h3>
          <div class="flex flex-wrap items-center gap-1.5">
            <span data-testid="fix-next-reason">
              <SeverityBadge :level="levelOfClass(entry.rank.severity_class)" />
            </span>
            <Badge
              v-if="entry.rank.known_exploited"
              data-testid="fix-next-reason"
              variant="destructive"
              title="Listed in the CISA KEV catalog"
              >Exploited</Badge
            >
            <Badge
              v-if="entry.rank.high_epss"
              data-testid="fix-next-reason"
              variant="destructive"
              title="EPSS score at or above the high threshold"
              >High EPSS</Badge
            >
            <Badge
              data-testid="fix-next-reason"
              variant="outline"
              :title="
                entry.rank.prod
                  ? 'Installed for production'
                  : 'Installed by development dependencies only'
              "
              >{{ entry.rank.prod ? "Prod" : "Dev only" }}</Badge
            >
            <span class="text-xs text-muted-foreground">
              {{
                plural(
                  entry.vulnerability_count,
                  "vulnerability",
                  "vulnerabilities",
                )
              }}
              in {{ plural(entry.project_count, "project") }}
            </span>
          </div>
        </div>
        <RouterLink
          v-if="ticketState(entry).ticketId"
          data-testid="fix-next-ticket"
          :to="{
            name: 'tickets',
            query: { ticket_id: ticketState(entry).ticketId },
          }"
          class="shrink-0 text-sm hover:underline"
          >{{ ticketState(entry).text }}</RouterLink
        >
        <span
          v-else
          data-testid="fix-next-ticket"
          class="shrink-0 text-sm text-muted-foreground"
          >{{ ticketState(entry).text }}</span
        >
      </li>
    </ol>
  </CardState>
</template>
