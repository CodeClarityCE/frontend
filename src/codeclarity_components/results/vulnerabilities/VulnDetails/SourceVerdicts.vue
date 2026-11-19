<script setup lang="ts">
import {
  type SourceVerdict,
  SourceVerdictValue,
} from "@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails.types";
import { Badge } from "@/shadcn/ui/badge";

defineProps<{
  verdicts: SourceVerdict[];
  available: boolean;
}>();

const SOURCE_LABELS: Record<string, string> = {
  gcve: "GCVE",
  nvd: "NVD",
  osv: "OSV",
};

const VERDICT_LABELS: Record<string, string> = {
  [SourceVerdictValue.Matched]: "Matched",
  [SourceVerdictValue.NoRecord]: "No record",
  [SourceVerdictValue.StaleOrFailed]: "Stale or failed",
};

const STATUS_NOTES: Record<string, string> = {
  stale: "Its data was out of date when this analysis ran.",
  failed: "Its last update had failed when this analysis ran.",
  unknown: "Its state could not be read when this analysis ran.",
};

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
        v-if="verdict.evidence?.source_status"
        class="text-sm text-muted-foreground"
        >{{
          STATUS_NOTES[verdict.evidence.source_status] ??
          STATUS_NOTES["unknown"]
        }}</span
      >
    </li>
  </ul>
</template>
