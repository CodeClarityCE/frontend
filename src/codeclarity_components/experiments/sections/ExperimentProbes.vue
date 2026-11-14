<script setup lang="ts">
import { computed, useId } from "vue";

import { formatShare } from "@/base_components/charts/chart-format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

import type {
  DatingPrecision,
  ExposuresBlock,
  ProbeOutcomeCounts,
  ProbesBlock,
} from "../experiment.entity";

const props = defineProps<{
  probes: ProbesBlock;
  exposures: ExposuresBlock | null;
}>();

function share(
  precision: Record<DatingPrecision, number> | undefined,
  key: DatingPrecision,
): string {
  const total = precision ? precision.commit + precision.snapshot : 0;
  return formatShare(precision && total > 0 ? precision[key] / total : null);
}

const rows = computed(() => {
  const row = (
    label: string,
    counts: ProbeOutcomeCounts,
    precision: Record<DatingPrecision, number> | undefined,
  ): {
    label: string;
    counts: ProbeOutcomeCounts;
    commit: string;
    snapshot: string;
  } => ({
    label,
    counts,
    commit: share(precision, "commit"),
    snapshot: share(precision, "snapshot"),
  });
  return [
    row("Fixes", props.probes.fixes, props.exposures?.fix_precision),
    row(
      "Introductions",
      props.probes.introductions,
      props.exposures?.introduction_precision,
    ),
  ];
});

/** Reasons most frequent first, as the API orders them */
const reasons = computed(() => Object.entries(props.probes.not_found_reasons));

/** The budget line, null without a budget */
const budgetLine = computed<string | null>(() => {
  const budget = props.probes.budget;
  if (budget?.analysis_budget == null) return null;
  const used = `Analysis budget: ${(budget.analyses_submitted ?? 0).toLocaleString()} of ${budget.analysis_budget.toLocaleString()} analyses submitted.`;
  return budget.spent ? `${used} Spent: no further fix probe runs.` : used;
});

const headingId = useId();
</script>

<template>
  <section
    class="flex flex-col gap-4 rounded-card border bg-card p-4 text-card-foreground shadow-card"
    :aria-labelledby="headingId"
    data-testid="experiment-probes"
  >
    <div>
      <h3 :id="headingId" class="font-semibold text-foreground-strong">
        Fix probes
      </h3>
      <p class="text-sm text-muted-foreground">
        Probes analyse the commits between two snapshots to date a fix or an
        introduction to the commit that made it. Events found are dated to a
        commit; the rest stay dated to their snapshot interval and are pooled
        with them in the metrics above. Ambiguous means a commit already known
        in the interval contradicts a single change.
      </p>
    </div>
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead>Event</TableHead>
          <TableHead class="text-right">Found</TableHead>
          <TableHead class="text-right">Ambiguous</TableHead>
          <TableHead class="text-right">Not found</TableHead>
          <TableHead class="text-right">Not probed yet</TableHead>
          <TableHead class="text-right">Commit precision</TableHead>
          <TableHead class="text-right">Snapshot precision</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody class="tabular-nums">
        <TableRow
          v-for="row in rows"
          :key="row.label"
          data-testid="probe-outcome-row"
        >
          <TableCell>{{ row.label }}</TableCell>
          <TableCell class="text-right">{{ row.counts.found }}</TableCell>
          <TableCell class="text-right">{{ row.counts.ambiguous }}</TableCell>
          <TableCell class="text-right">{{ row.counts.not_found }}</TableCell>
          <TableCell class="text-right">{{ row.counts.not_probed }}</TableCell>
          <TableCell class="text-right">{{ row.commit }}</TableCell>
          <TableCell class="text-right">{{ row.snapshot }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <p
      v-if="budgetLine"
      class="text-sm text-foreground"
      data-testid="probe-budget"
    >
      {{ budgetLine }}
    </p>
    <div v-if="reasons.length > 0" data-testid="probe-reasons">
      <h4 class="text-sm font-medium text-foreground-strong mb-1">
        Why no commit was found
      </h4>
      <ul class="text-sm text-foreground list-disc ml-4">
        <li
          v-for="[reason, n] in reasons"
          :key="reason"
          data-testid="probe-reason"
        >
          {{ reason }}: {{ n }}
        </li>
      </ul>
    </div>
  </section>
</template>
