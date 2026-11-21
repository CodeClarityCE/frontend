<script setup lang="ts">
import { ref } from "vue";

import type {
  DueDateState,
  MyWorkEntry,
} from "@/codeclarity_components/tickets/my_work.entity";
import { TicketsRepository } from "@/codeclarity_components/tickets/tickets.repository";
import { RemediationKind } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import { orgVulnerabilityRoute } from "@/codeclarity_components/vulnerabilities/organization-vulnerability-route";
import { Badge } from "@/shadcn/ui/badge";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import CardState from "../layout/CardState.vue";

import FixNextReasons from "./FixNextReasons.vue";

// The open tickets assigned to the signed-in user, overdue and due soon first.
const authStore = useAuthStore();
const userStore = useUserStore();
const repository = new TicketsRepository();

const entries = ref<MyWorkEntry[]>([]);
// The organization the tickets belong to, for their links.
const shownOrg = ref("");
const loading = ref(true);
const error = ref(false);

async function fetch(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getToken) return;
  loading.value = true;
  error.value = false;
  try {
    shownOrg.value = orgId;
    entries.value = await repository.getMyWork({
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

// The change a remediation ticket tracks; an old ticket keeps its own title.
function heading(entry: MyWorkEntry): string {
  const r = entry.remediation;
  if (!r?.target_version) return entry.title;
  const verb = r.kind === RemediationKind.ForceVersion ? "Force" : "Upgrade";
  const where = r.workspace === "." ? "" : ` in ${r.workspace}`;
  return `${verb} ${r.package} to ${r.target_version}${where}`;
}

const DUE_DATE_LABEL: Record<DueDateState, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  on_track: "Due",
  none: "No due date",
};

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" });
</script>

<template>
  <CardState
    label="My work list"
    :loading="loading"
    :error="error"
    :empty="entries.length === 0"
    empty-text="Nothing is assigned to you: tickets assigned to you show up here."
    @retry="() => void fetch()"
  >
    <ol aria-label="Tickets assigned to me" class="flex flex-col divide-y">
      <li
        v-for="entry in entries"
        :key="entry.ticket_id"
        data-testid="my-work-entry"
        class="flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <div class="flex min-w-0 flex-col gap-1.5">
          <h3 class="truncate font-medium">
            <RouterLink
              :to="{ name: 'tickets', query: { ticket_id: entry.ticket_id } }"
              class="hover:underline focus-visible:underline focus-visible:outline-none"
              >{{ heading(entry) }}</RouterLink
            >
          </h3>
          <div class="flex flex-wrap items-center gap-1.5">
            <FixNextReasons :rank="entry.rank" />
            <span class="text-xs text-muted-foreground">
              {{ entry.project_name }}
              <template v-if="!entry.remediation && entry.vulnerability_id">
                ·
                <RouterLink
                  :to="orgVulnerabilityRoute(shownOrg, entry.vulnerability_id)"
                  data-testid="my-work-vulnerability"
                  class="hover:underline focus-visible:underline focus-visible:outline-none"
                  >{{ entry.vulnerability_id }}</RouterLink
                >
                <template v-if="entry.affected_package">
                  in {{ entry.affected_package }}</template
                >
              </template>
            </span>
          </div>
        </div>
        <span data-testid="my-work-due" class="shrink-0 text-sm">
          <template v-if="entry.due_date">
            <Badge
              v-if="
                entry.deadline === 'overdue' || entry.deadline === 'due_soon'
              "
              :variant="
                entry.deadline === 'overdue' ? 'destructive' : 'outline'
              "
              >{{ DUE_DATE_LABEL[entry.deadline] }}</Badge
            >
            <span v-else class="text-muted-foreground">{{
              DUE_DATE_LABEL[entry.deadline]
            }}</span>
            {{ " " }}
            <time :datetime="entry.due_date">{{
              formatDate(entry.due_date)
            }}</time>
          </template>
          <span v-else class="text-muted-foreground">No due date</span>
        </span>
      </li>
    </ol>
  </CardState>
</template>
