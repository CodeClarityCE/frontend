<script setup lang="ts">
import type { SortingState } from "@tanstack/vue-table";

import { DataTable, type DataTableColumn } from "@/base_components/data-table";
import { StatusBadge, type StatusTone } from "@/base_components/page";
import {
  ActionSeverity,
  type AuditLog,
} from "@/codeclarity_components/organizations/audit_logs/AuditLog";
import RoleBadge from "@/codeclarity_components/organizations/members/RoleBadge.vue";
import { formatDate } from "@/utils/dateUtils";

// One page of entries; the parent loads the page, search and sort the table asks for.
defineProps<{
  logs: AuditLog[];
  loading: boolean;
  total: number;
  pageSize: number;
  emptyText: string;
}>();
const search = defineModel<string>("filter", { default: "" });
const pageIndex = defineModel<number>("pageIndex", { default: 0 });
const emit = defineEmits<{ "update:sorting": [sorting: SortingState] }>();

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

// Column ids are the API's sort keys.
const columns: DataTableColumn<AuditLog>[] = [
  {
    id: "action_severity",
    accessorFn: (log) => severity(log).label,
    header: "Severity",
  },
  { id: "action_class", accessorKey: "action_class", header: "Area" },
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
    id: "blame_on_email",
    accessorFn: (log) => log.blame_on?.email ?? log.blame_on_email,
    header: "By",
  },
  {
    id: "created_on",
    accessorFn: (log) => new Date(log.created_on).getTime(),
    header: "Date",
  },
];
</script>

<template>
  <DataTable
    v-model:filter="search"
    v-model:page-index="pageIndex"
    :columns="columns"
    :data="logs"
    :loading="loading"
    :total="total"
    :page-size="pageSize"
    :row-key="(log: AuditLog) => log.id"
    :initial-sorting="[{ id: 'created_on', desc: true }]"
    caption="Audit logs"
    filter-label="Filter audit logs"
    :empty-text="emptyText"
    @update:sorting="emit('update:sorting', $event)"
  >
    <template #cell-action_severity="{ row }">
      <StatusBadge v-bind="severity(row)" />
    </template>
    <template #cell-blame_on_email="{ row }">
      <div v-if="row.blame_on" class="flex items-center gap-2">
        <span>{{ row.blame_on.email }}</span>
        <RoleBadge :role="row.blame_on.role" />
      </div>
      <div v-else class="flex flex-col">
        <span>{{ row.blame_on_email }}</span>
        <span class="text-xs text-muted-foreground">No longer a member</span>
      </div>
    </template>
    <template #cell-created_on="{ row }">
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
