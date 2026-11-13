<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";

import { DataTable } from "@/base_components/data-table";
import { StatusBadge, type StatusTone } from "@/base_components/page";
import {
  ActionSeverity,
  type AuditLog,
} from "@/codeclarity_components/organizations/audit_logs/AuditLog";
import RoleBadge from "@/codeclarity_components/organizations/members/RoleBadge.vue";
import { formatDate } from "@/utils/dateUtils";

defineProps<{ logs: AuditLog[]; loading: boolean }>();

const severities: Record<ActionSeverity, { label: string; tone: StatusTone }> =
  {
    [ActionSeverity.Critical]: { label: "Critical", tone: "danger" },
    [ActionSeverity.High]: { label: "High", tone: "warning" },
    [ActionSeverity.Medium]: { label: "Medium", tone: "warning" },
    [ActionSeverity.Low]: { label: "Low", tone: "neutral" },
  };

function severity(log: AuditLog): { label: string; tone: StatusTone } {
  return (
    severities[log.action_severity] ?? { label: "Unknown", tone: "neutral" }
  );
}

// "OrganizationMemberJoined" reads as "Organization member joined".
function actionLabel(action: string): string {
  const words = action.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const columns: ColumnDef<AuditLog, unknown>[] = [
  {
    id: "severity",
    accessorFn: (log) => severity(log).label,
    sortingFn: (a, b) =>
      a.original.action_severity - b.original.action_severity,
    header: "Severity",
  },
  { id: "class", accessorKey: "action_class", header: "Area" },
  {
    id: "action",
    accessorFn: (log) => actionLabel(log.action),
    header: "Action",
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
  },
  {
    id: "by",
    accessorFn: (log) => log.blame_on?.email ?? log.blame_on_email,
    header: "By",
  },
  {
    id: "date",
    accessorFn: (log) => new Date(log.created_on).getTime(),
    header: "Date",
    enableGlobalFilter: false,
  },
];
</script>

<template>
  <DataTable
    :columns="columns"
    :data="logs"
    :loading="loading"
    :row-key="(log: AuditLog) => log.id"
    :initial-sorting="[{ id: 'date', desc: true }]"
    caption="Audit logs"
    filter-label="Filter audit logs"
    empty-text="No audit logs match."
  >
    <template #cell-severity="{ row }">
      <StatusBadge v-bind="severity(row)" />
    </template>
    <template #cell-by="{ row }">
      <div v-if="row.blame_on" class="flex items-center gap-2">
        <span>{{ row.blame_on.email }}</span>
        <RoleBadge :role="row.blame_on.role" />
      </div>
      <div v-else class="flex flex-col">
        <span>{{ row.blame_on_email }}</span>
        <span class="text-xs text-muted-foreground">No longer a member</span>
      </div>
    </template>
    <template #cell-date="{ row }">
      <span class="whitespace-nowrap tabular-nums">
        {{ formatDate(row.created_on, "MMM DD, YYYY") }},
        {{
          new Date(row.created_on).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }}
      </span>
    </template>
  </DataTable>
</template>
