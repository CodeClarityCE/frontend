<script setup lang="ts">
import type { ColumnDef, SortingState } from "@tanstack/vue-table";

import { DataTable } from "@/base_components/data-table";
import { SeverityBadge, StatusBadge } from "@/base_components/page";
import CreateTicketButton from "@/codeclarity_components/tickets/components/CreateTicketButton.vue";

import AddToPolicyButton from "./components/AddToPolicyButton.vue";
import {
  detailsRoute,
  findingSignals,
  formatPercent,
  impacts,
  owaspCategories,
  patchStatus,
  ticketVulnerability,
} from "./vuln-format";
import type { VulnerabilityMerged } from "./VulnStats";

// One page of findings in the shared table; the parent loads each page.
const props = defineProps<{
  findings: VulnerabilityMerged[];
  total: number;
  loading: boolean;
  emptyText: string;
  sorting: SortingState;
  pageSize: number;
  analysisID: string;
  projectID: string;
}>();

const pageIndex = defineModel<number>("pageIndex", { required: true });
const emit = defineEmits<{ "update:sorting": [sorting: SortingState] }>();

// Column ids are the API's sort keys.
const columns: ColumnDef<VulnerabilityMerged, unknown>[] = [
  { id: "cve", header: "CVE", accessorFn: (f) => f.Vulnerability },
  {
    id: "severity",
    header: "Severity",
    accessorFn: (f) => f.Severity?.Severity,
  },
  {
    id: "dep_name",
    header: "Dependency",
    accessorFn: (f) => f.Affected?.[0]?.AffectedDependency,
  },
  {
    id: "weakness",
    header: "Weakness",
    accessorFn: (f) => f.Weaknesses?.[0]?.WeaknessId,
  },
  {
    id: "exploitability",
    header: "Exploitability",
    accessorFn: (f) => f.Severity?.Exploitability,
  },
  {
    id: "impact",
    header: "Impact",
    enableSorting: false,
    accessorFn: () => null,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    accessorFn: () => null,
  },
];

function rowKey(finding: VulnerabilityMerged): string {
  return finding.Id;
}
</script>

<template>
  <DataTable
    v-model:page-index="pageIndex"
    :columns="columns"
    :data="findings"
    :total="total"
    :loading="loading"
    :page-size="pageSize"
    :initial-sorting="props.sorting"
    :row-key="rowKey"
    caption="Vulnerabilities"
    :empty-text="emptyText"
    @update:sorting="emit('update:sorting', $event)"
  >
    <template #cell-cve="{ row }">
      <div class="flex flex-col items-start gap-1.5">
        <RouterLink
          class="whitespace-nowrap rounded-sm font-semibold text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :to="detailsRoute(analysisID, projectID, row.Vulnerability)"
        >
          {{ row.Vulnerability }}
        </RouterLink>
        <StatusBadge
          v-for="signal in findingSignals(row)"
          :key="signal.label"
          :tone="signal.tone"
          :label="signal.label"
          :title="signal.detail"
          class="whitespace-nowrap"
        />
      </div>
    </template>
    <template #cell-severity="{ row }">
      <div class="flex flex-col items-start gap-1">
        <SeverityBadge :score="row.Severity?.Severity" />
        <span
          v-for="vlai in row.VLAI ?? []"
          :key="vlai.Source"
          class="whitespace-nowrap text-xs text-muted-foreground"
        >
          AI ({{ vlai.Source }}): {{ vlai.Score }},
          {{ Math.round(vlai.Confidence * 100) }}% confident
        </span>
      </div>
    </template>
    <template #cell-dep_name="{ row }">
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="affected in row.Affected"
          :key="affected.AffectedDependency"
          class="flex flex-col items-start gap-1"
        >
          <span class="font-medium text-foreground-strong">
            {{ affected.AffectedDependency }}@{{ affected.AffectedVersion }}
          </span>
          <StatusBadge
            v-bind="patchStatus(affected.PatchType)"
            class="whitespace-nowrap"
          />
        </li>
      </ul>
    </template>
    <template #cell-weakness="{ row }">
      <ul class="flex flex-col gap-1">
        <li
          v-for="weakness in row.Weaknesses ?? []"
          :key="weakness.WeaknessId"
          :title="weakness.WeaknessName"
          class="whitespace-nowrap"
        >
          {{ weakness.WeaknessId }}
        </li>
        <li
          v-for="category in owaspCategories(row.Weaknesses)"
          :key="category.id"
          class="text-muted-foreground"
        >
          OWASP {{ category.id }} {{ category.name }}
        </li>
      </ul>
    </template>
    <template #cell-exploitability="{ row }">
      <span class="tabular-nums">
        {{ row.Severity?.Exploitability?.toFixed(1) ?? "-" }}
      </span>
      <span
        v-if="row.EPSS?.Score"
        class="block whitespace-nowrap text-xs text-muted-foreground"
      >
        EPSS {{ formatPercent(row.EPSS.Score) }}
      </span>
    </template>
    <template #cell-impact="{ row }">
      <ul class="flex flex-col gap-1">
        <li v-for="impact in impacts(row.Severity)" :key="impact.name">
          {{ impact.name }}:
          <span :class="impact.high ? 'font-semibold text-danger' : ''">
            {{ impact.value }}
          </span>
        </li>
      </ul>
    </template>
    <template #cell-actions="{ row }">
      <div class="flex flex-col items-start gap-2">
        <CreateTicketButton
          :project-id="projectID"
          :vulnerability="ticketVulnerability(row)"
          size="sm"
          variant="outline"
        />
        <AddToPolicyButton
          v-if="!row.is_blacklisted"
          :vulnerability-id="row.Vulnerability"
          size="sm"
          variant="outline"
        />
      </div>
    </template>
  </DataTable>
</template>
