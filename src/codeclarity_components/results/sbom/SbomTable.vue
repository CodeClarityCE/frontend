<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";

import { DataTable } from "@/base_components/data-table";
import { StatusBadge, type StatusTone } from "@/base_components/page";
import EcosystemBadge from "@/base_components/ui/EcosystemBadge.vue";
import type { Dependency } from "@/codeclarity_components/results/graph.entity";
import { EcosystemDetector } from "@/utils/packageEcosystem";

// Every dependency of the analysis in the shared table.
const props = defineProps<{
  dependencies: Dependency[];
  analysisID: string;
  projectID: string;
}>();

interface UpdateStatus {
  label: string;
  tone: StatusTone;
}

// How far the installed version is behind the newest release.
function updateStatus(dep: Dependency): UpdateStatus | null {
  if (!dep.version || !dep.newest_release) return null;
  if (dep.version === dep.newest_release)
    return { label: "Up to date", tone: "success" };
  const current = dep.version.split(".").map(Number);
  const newest = dep.newest_release.split(".").map(Number);
  if ((newest[0] ?? 0) > (current[0] ?? 0))
    return { label: "Major update", tone: "warning" };
  if ((newest[1] ?? 0) > (current[1] ?? 0))
    return { label: "Minor update", tone: "neutral" };
  return { label: "Patch update", tone: "neutral" };
}

function isDirect(dep: Dependency): boolean {
  return dep.is_direct_count > 0 || dep.is_direct;
}

const columns: ColumnDef<Dependency, unknown>[] = [
  { id: "name", header: "Package", accessorFn: (d) => d.name },
  {
    id: "ecosystem",
    header: "Ecosystem",
    enableGlobalFilter: false,
    accessorFn: (d) => EcosystemDetector.detectFromDependency(d).name,
  },
  {
    id: "version",
    header: "Version",
    enableSorting: false,
    accessorFn: (d) => d.version,
  },
  {
    id: "update",
    header: "Newest release",
    enableGlobalFilter: false,
    accessorFn: (d) => updateStatus(d)?.label ?? "",
  },
  {
    id: "deprecated",
    header: "Deprecated",
    enableGlobalFilter: false,
    accessorFn: (d) => (d.deprecated ? "Yes" : "No"),
  },
  {
    id: "added",
    header: "Added as",
    enableGlobalFilter: false,
    accessorFn: (d) => (isDirect(d) ? "Direct" : "Transitive"),
  },
  {
    id: "scope",
    header: "Scope",
    enableGlobalFilter: false,
    accessorFn: (d) => (d.dev && !d.prod ? "Development" : "Production"),
  },
];

function rowKey(dep: Dependency): string {
  return `${dep.name}@${dep.version}`;
}

function detailsRoute(dep: Dependency): Record<string, unknown> {
  return {
    name: "results",
    params: { page: "sbom_details" },
    query: {
      analysis_id: props.analysisID,
      project_id: props.projectID,
      package_id: `${dep.name}@${dep.version}`,
    },
  };
}
</script>

<template>
  <section aria-labelledby="sbom-table-heading" class="flex flex-col gap-4">
    <h3
      id="sbom-table-heading"
      class="text-lg font-semibold tracking-tight text-foreground-strong"
    >
      All dependencies
    </h3>
    <DataTable
      :columns="columns"
      :data="dependencies"
      :row-key="rowKey"
      :initial-sorting="[{ id: 'name', desc: false }]"
      caption="Dependencies"
      filter-label="Search dependencies"
      empty-text="No dependencies match the search."
    >
      <template #cell-name="{ row }">
        <RouterLink
          class="rounded-sm font-semibold text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :to="detailsRoute(row)"
        >
          {{ row.name }}
        </RouterLink>
      </template>
      <template #cell-ecosystem="{ row }">
        <EcosystemBadge
          :ecosystem="EcosystemDetector.detectFromDependency(row)"
          size="sm"
          show-name
          variant="default"
        />
      </template>
      <template #cell-version="{ row }">
        <code class="font-mono text-sm">{{ row.version || "N/A" }}</code>
      </template>
      <template #cell-update="{ row }">
        <div v-if="updateStatus(row)" class="flex flex-col items-start gap-1">
          <StatusBadge v-bind="updateStatus(row)!" class="whitespace-nowrap" />
          <code
            v-if="row.newest_release !== row.version"
            class="font-mono text-xs text-muted-foreground"
            >{{ row.newest_release }}</code
          >
        </div>
        <span v-else class="text-muted-foreground">N/A</span>
      </template>
      <template #cell-deprecated="{ row }">
        <StatusBadge
          v-if="row.deprecated"
          tone="danger"
          label="Deprecated"
          :title="row.deprecated_message || undefined"
        />
        <span v-else class="text-muted-foreground">No</span>
      </template>
    </DataTable>
  </section>
</template>
