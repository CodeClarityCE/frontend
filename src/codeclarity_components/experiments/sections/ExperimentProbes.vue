<script setup lang="ts">
import { computed } from "vue";

import type {
  DatingPrecision,
  ExposuresBlock,
  ProbeOutcomeCounts,
  ProbesBlock,
} from "../experiment.entity";

const props = defineProps<{ probes: ProbesBlock; exposures: ExposuresBlock | null }>();

function share(precision: Record<DatingPrecision, number> | undefined, key: DatingPrecision): string {
  const total = precision ? precision.commit + precision.snapshot : 0;
  return precision && total > 0 ? `${((precision[key] / total) * 100).toFixed(1)}%` : "-";
}

const rows = computed(() => {
  const row = (
    label: string,
    counts: ProbeOutcomeCounts,
    precision: Record<DatingPrecision, number> | undefined,
  ): { label: string; counts: ProbeOutcomeCounts; commit: string; snapshot: string } => ({
    label,
    counts,
    commit: share(precision, "commit"),
    snapshot: share(precision, "snapshot"),
  });
  return [
    row("Fixes", props.probes.fixes, props.exposures?.fix_precision),
    row("Introductions", props.probes.introductions, props.exposures?.introduction_precision),
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
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
    data-testid="experiment-probes"
  >
    <div>
      <h3 class="font-semibold text-gray-900">Fix probes</h3>
      <p class="text-sm text-gray-500">
        Probes analyse the commits between two snapshots to date a fix or an
        introduction to the commit that made it. Events found are dated to a
        commit; the rest stay dated to their snapshot interval and are pooled
        with them in the metrics above. Ambiguous means a commit already known
        in the interval contradicts a single change.
      </p>
    </div>
    <table class="w-full text-sm">
      <thead class="text-left text-gray-500">
        <tr>
          <th class="font-medium">Event</th>
          <th class="font-medium text-right">Found</th>
          <th class="font-medium text-right">Ambiguous</th>
          <th class="font-medium text-right">Not found</th>
          <th class="font-medium text-right">Not probed yet</th>
          <th class="font-medium text-right">Commit precision</th>
          <th class="font-medium text-right">Snapshot precision</th>
        </tr>
      </thead>
      <tbody class="text-gray-700">
        <tr v-for="row in rows" :key="row.label" data-testid="probe-outcome-row">
          <td>{{ row.label }}</td>
          <td class="text-right">{{ row.counts.found }}</td>
          <td class="text-right">{{ row.counts.ambiguous }}</td>
          <td class="text-right">{{ row.counts.not_found }}</td>
          <td class="text-right">{{ row.counts.not_probed }}</td>
          <td class="text-right">{{ row.commit }}</td>
          <td class="text-right">{{ row.snapshot }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="budgetLine" class="text-sm text-gray-700" data-testid="probe-budget">
      {{ budgetLine }}
    </p>
    <div v-if="reasons.length > 0" data-testid="probe-reasons">
      <h4 class="text-sm font-medium text-gray-900 mb-1">Why no commit was found</h4>
      <ul class="text-sm text-gray-700 list-disc ml-4">
        <li v-for="[reason, n] in reasons" :key="reason" data-testid="probe-reason">
          {{ reason }}: {{ n }}
        </li>
      </ul>
    </div>
  </div>
</template>
