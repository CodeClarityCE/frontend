<script lang="ts" setup>
import type { ColumnDef } from "@tanstack/vue-table";
import { computed } from "vue";

import { DataTable } from "@/base_components/data-table";

import type { FailedProjectImport } from "../projectImport";

const props = defineProps<{
  reposFailedToImport: Record<string, FailedProjectImport>;
}>();

const failures = computed(() => Object.values(props.reposFailedToImport));

const columns: ColumnDef<FailedProjectImport, unknown>[] = [
  {
    id: "repository",
    accessorFn: (failure) => failure.repo.fully_qualified_name,
    header: "Repository",
  },
  { id: "reason", accessorKey: "reason", header: "Why it failed" },
];
</script>

<template>
  <DataTable
    :columns="columns"
    :data="failures"
    :row-key="(failure: FailedProjectImport) => failure.repo.id"
    caption="Failed imports"
    row-testid="failed-import"
  >
    <template #cell-repository="{ row }">
      <span class="font-semibold text-foreground-strong">
        {{ row.repo.fully_qualified_name }}
      </span>
    </template>
    <template #cell-reason="{ row }">
      <span class="text-destructive">{{ row.reason }}</span>
    </template>
  </DataTable>
</template>
