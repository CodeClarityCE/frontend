<script setup lang="ts" generic="TPolicy extends Policy">
import { Pencil, Trash2 } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";

import { DataTable } from "@/base_components/data-table";
import { StatusBadge } from "@/base_components/page";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { formatShortDate } from "@/utils/dateUtils";

import { type Policy, policyTypeLabel, policyTypeTone } from "./policy-labels";

// A license or vulnerability policy list, with edit and optional delete per row.
const props = defineProps<{
  policies: TPolicy[];
  caption: string;
  // What the content column counts, like "Licenses".
  contentLabel: string;
  loading?: boolean;
  canDelete?: boolean;
}>();

defineEmits<{ edit: [policy: TPolicy]; delete: [policy: TPolicy] }>();

const columns: ColumnDef<TPolicy, unknown>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
  {
    id: "type",
    accessorFn: (policy) => policyTypeLabel(policy.policy_type),
    header: "Type",
  },
  {
    id: "content",
    accessorFn: (policy) => policy.content?.length ?? 0,
    header: props.contentLabel,
    enableGlobalFilter: false,
  },
  {
    id: "created_by",
    accessorFn: (policy) => policy.created_by ?? "Unknown",
    header: "Created by",
  },
  {
    id: "created_on",
    accessorFn: (policy) => new Date(policy.created_on).getTime(),
    header: "Created",
    enableGlobalFilter: false,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
  },
];
</script>

<template>
  <DataTable
    :columns="columns"
    :data="policies"
    :loading="loading"
    :caption="caption"
    :filter-label="`Filter ${caption.toLowerCase()}`"
    :row-key="(policy: TPolicy) => policy.id"
    empty-text="No policies match."
  >
    <template #cell-name="{ row }">
      <div class="flex flex-col gap-1">
        <span class="flex items-center gap-2 font-semibold text-foreground">
          {{ row.name }}
          <Badge v-if="row.default" variant="secondary">Default</Badge>
        </span>
        <span
          v-if="row.description"
          class="max-w-md truncate text-xs text-muted-foreground"
        >
          {{ row.description }}
        </span>
      </div>
    </template>
    <template #cell-type="{ row }">
      <StatusBadge
        :tone="policyTypeTone(row.policy_type)"
        :label="policyTypeLabel(row.policy_type)"
      />
    </template>
    <template #cell-content="{ row }">
      <span class="tabular-nums">{{ row.content?.length ?? 0 }}</span>
    </template>
    <template #cell-created_on="{ row }">
      {{ formatShortDate(row.created_on) }}
    </template>
    <template #cell-actions="{ row }">
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          :aria-label="`Edit ${row.name}`"
          @click="$emit('edit', row)"
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          v-if="canDelete"
          variant="ghost"
          size="icon-sm"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive"
          :aria-label="`Delete ${row.name}`"
          @click="$emit('delete', row)"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </template>
  </DataTable>
</template>
