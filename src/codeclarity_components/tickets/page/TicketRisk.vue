<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ArrowRight } from "@lucide/vue";
import { computed } from "vue";

import ExternalLink from "@/base_components/ui/ExternalLink.vue";
import { formatPercent } from "@/codeclarity_components/results/vulnerabilities/vuln-format";
import { orgVulnerabilityRoute } from "@/codeclarity_components/vulnerabilities/organization-vulnerability-route";
import { uniqueReferences } from "@/utils/references";

import type { VulnerabilityDetailsReport } from "../tickets.entity";

// How likely and how bad the ticket's one vulnerability is, with a link to its full page.
const props = defineProps<{
  orgId: string;
  vulnerabilityId: string;
  details: VulnerabilityDetailsReport;
}>();

interface Score {
  label: string;
  value: string;
  hint: string;
}

// Only the scores the vulnerability has, best CVSS version first.
const scores = computed((): Score[] => {
  const found: Score[] = [];
  const { cvss_31, cvss_3, cvss_2 } = props.details.severities;
  const cvss =
    (cvss_31 && { version: "3.1", score: cvss_31.base_score }) ??
    (cvss_3 && { version: "3.0", score: cvss_3.base_score }) ??
    (cvss_2 && { version: "2.0", score: cvss_2.base_score });
  if (cvss) {
    found.push({
      label: `CVSS v${cvss.version}`,
      value: cvss.score.toFixed(1),
      hint: "Severity, 0 to 10",
    });
  }
  const { epss_score, epss_percentile, vlai_score } = props.details.other;
  if (epss_score !== undefined && epss_score !== null) {
    found.push({
      label: "EPSS",
      value: formatPercent(epss_score),
      hint:
        epss_percentile !== undefined && epss_percentile !== null
          ? `Higher than ${formatPercent(epss_percentile)} of vulnerabilities`
          : "Chance of exploitation in 30 days",
    });
  }
  if (vlai_score) {
    found.push({
      label: "VLAI",
      value: vlai_score,
      hint: "Severity predicted from the description",
    });
  }
  return found;
});

const references = computed(() => uniqueReferences(props.details.references));
</script>

<template>
  <section
    aria-labelledby="ticket-risk"
    class="flex flex-col gap-4 rounded-card border bg-card p-5"
  >
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2
        id="ticket-risk"
        class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        Risk
      </h2>
      <RouterLink
        :to="orgVulnerabilityRoute(orgId, vulnerabilityId)"
        class="inline-flex items-center gap-1 rounded-sm text-sm text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Full vulnerability details
        <ArrowRight aria-hidden="true" class="size-3.5" />
      </RouterLink>
    </div>

    <dl
      v-if="scores.length > 0"
      class="grid grid-cols-1 gap-3 sm:grid-cols-3"
      aria-label="Scores"
    >
      <div
        v-for="score in scores"
        :key="score.label"
        class="flex flex-col gap-0.5 rounded-control bg-muted p-3"
      >
        <dt class="text-xs text-muted-foreground">{{ score.label }}</dt>
        <dd class="text-xl font-semibold text-foreground-strong tabular-nums">
          {{ score.value }}
        </dd>
        <dd class="text-xs text-muted-foreground">{{ score.hint }}</dd>
      </div>
    </dl>

    <p
      v-if="details.owasp_top_10?.id"
      class="flex items-center gap-2 text-sm text-foreground"
    >
      <Icon icon="simple-icons:owasp" aria-hidden="true" class="size-4" />
      OWASP {{ details.owasp_top_10.id }}: {{ details.owasp_top_10.name }}
    </p>

    <div v-if="references.length > 0" class="flex flex-col gap-2">
      <h3 class="text-sm font-medium text-foreground-strong">References</h3>
      <ul class="flex flex-col gap-1 text-sm">
        <li
          v-for="reference in references"
          :key="reference.url"
          class="break-all"
        >
          <ExternalLink :href="reference.url">{{ reference.url }}</ExternalLink>
        </li>
      </ul>
    </div>
  </section>
</template>
