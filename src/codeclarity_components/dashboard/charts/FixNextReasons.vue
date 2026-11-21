<script setup lang="ts">
import { SeverityBadge } from "@/base_components/page";
import type { FixNextRank } from "@/codeclarity_components/vulnerabilities/fix_next.entity";
import { levelOfClass } from "@/codeclarity_components/vulnerabilities/severity-class";
import { Badge } from "@/shadcn/ui/badge";

// The reasons for a Fix next rank as chips: severity, exploited, high EPSS, prod or dev only.
defineProps<{ rank: FixNextRank }>();
</script>

<template>
  <span data-testid="fix-next-reason">
    <SeverityBadge :level="levelOfClass(rank.severity_class)" />
  </span>
  <Badge
    v-if="rank.known_exploited"
    data-testid="fix-next-reason"
    variant="destructive"
    title="Listed in the CISA KEV catalog"
    >Exploited</Badge
  >
  <Badge
    v-if="rank.high_epss"
    data-testid="fix-next-reason"
    variant="destructive"
    title="EPSS score at or above the high threshold"
    >High EPSS</Badge
  >
  <Badge
    v-if="rank.instance_count > 0"
    data-testid="fix-next-reason"
    variant="outline"
    :title="
      rank.prod
        ? 'Installed for production'
        : 'Installed by development dependencies only'
    "
    >{{ rank.prod ? "Prod" : "Dev only" }}</Badge
  >
</template>
