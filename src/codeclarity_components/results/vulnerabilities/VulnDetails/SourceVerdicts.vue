<script setup lang="ts">
import {
  type SourceVerdict,
  SourceVerdictValue,
} from "@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails.types";
import { Badge } from "@/shadcn/ui/badge";

import {
  SOURCE_LABELS,
  VERDICT_LABELS,
  verdictEvidence,
} from "./source-verdict-evidence";

defineProps<{
  verdicts: SourceVerdict[];
  available: boolean;
}>();

// Matched is the only verdict that reports the vulnerability.
function badgeVariant(
  verdict: SourceVerdictValue,
): "default" | "outline" | "secondary" {
  if (verdict === SourceVerdictValue.Matched) return "default";
  if (verdict === SourceVerdictValue.StaleOrFailed) return "secondary";
  return "outline";
}
</script>

<template>
  <p v-if="!available" class="text-muted-foreground">
    Source verdicts are not available for this analysis. Re-run it to see what
    each knowledge source said.
  </p>
  <p v-else-if="verdicts.length === 0" class="text-muted-foreground">
    This finding has no source verdicts: it comes from an analyzer that does not
    match the knowledge sources, such as the PHP extension or private package
    analyzer.
  </p>
  <ul v-else class="flex flex-col divide-y">
    <li
      v-for="verdict in verdicts"
      :key="verdict.source"
      class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0"
    >
      <span class="w-14 font-semibold text-foreground-strong">{{
        SOURCE_LABELS[verdict.source] ?? verdict.source
      }}</span>
      <Badge :variant="badgeVariant(verdict.verdict)">{{
        VERDICT_LABELS[verdict.verdict] ?? verdict.verdict
      }}</Badge>
      <span
        v-if="verdict.evidence?.record_ids?.length"
        class="font-mono text-sm"
        >{{ verdict.evidence.record_ids.join(", ") }}</span
      >
      <span
        v-if="verdictEvidence(verdict)"
        class="text-sm text-muted-foreground"
        >{{ verdictEvidence(verdict) }}</span
      >
    </li>
  </ul>
</template>
