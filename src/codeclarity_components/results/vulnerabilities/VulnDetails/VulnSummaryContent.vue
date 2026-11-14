<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ExternalLink, TriangleAlert } from "@lucide/vue";
import { computed } from "vue";

import InfoMarkdown from "@/base_components/ui/InfoMarkdown.vue";
import type { VulnerabilityDetails } from "@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails";
import { Badge } from "@/shadcn/ui/badge";
import { formatDate } from "@/utils/dateUtils";

const props = defineProps<{
  finding: VulnerabilityDetails;
}>();

const SOURCE_ORDER: Record<string, number> = { GCVE: 0, OSV: 1, NVD: 2 };

const sortedSources = computed(() =>
  [...(props.finding.vulnerability_info.sources ?? [])].sort(
    (a, b) => (SOURCE_ORDER[a.name] ?? 99) - (SOURCE_ORDER[b.name] ?? 99),
  ),
);

const sourcesDisagree = computed(() => {
  const comparison =
    props.finding.vulnerability_info.version_info.source_comparison;
  return comparison !== undefined && !comparison.agree;
});

function owaspUrl(name: string): string {
  return `https://owasp.org/Top10/${name.replace(": ", "_2021-").replace(" ", "_")}`;
}

function cweUrl(id: string): string {
  return `https://cwe.mitre.org/data/definitions/${id.replace("CWE-", "")}`;
}

function consequences(id: string): string {
  return (props.finding.common_consequences?.[id] ?? [])
    .map((c) => c.impact.join(", "))
    .join("; ");
}

const linkClass =
  "inline-flex items-center gap-1 rounded-sm font-medium text-brand-subtle-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
</script>

<template>
  <div class="flex flex-col gap-6">
    <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
      <dt class="text-muted-foreground">Published</dt>
      <dd>{{ formatDate(finding.vulnerability_info.published, "LL") }}</dd>
      <dt class="text-muted-foreground">Last modified</dt>
      <dd>{{ formatDate(finding.vulnerability_info.last_modified, "LL") }}</dd>
      <template v-if="finding.vulnerability_info.aliases?.length">
        <dt class="text-muted-foreground">Aliases</dt>
        <dd class="flex flex-wrap gap-1.5">
          <Badge
            v-for="alias in finding.vulnerability_info.aliases"
            :key="alias"
            variant="outline"
            >{{ alias }}</Badge
          >
        </dd>
      </template>
      <template v-if="sortedSources.length">
        <dt class="text-muted-foreground">Sources</dt>
        <dd class="flex flex-wrap gap-3">
          <a
            v-for="source in sortedSources"
            :key="source.name"
            :href="source.vuln_url"
            target="_blank"
            rel="noopener noreferrer"
            :class="linkClass"
          >
            {{ source.name }}
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </dd>
      </template>
    </dl>

    <p
      v-if="sourcesDisagree"
      class="flex items-center gap-2 text-sm font-medium text-warning"
    >
      <TriangleAlert aria-hidden="true" class="size-4 shrink-0" />
      Vulnerability sources do not fully agree on affected versions
    </p>

    <section class="flex flex-col gap-2">
      <h3 class="font-semibold text-foreground-strong">Description</h3>
      <div class="overflow-x-auto text-sm">
        <InfoMarkdown :markdown="finding.vulnerability_info.description" />
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h3 class="font-semibold text-foreground-strong">Weaknesses</h3>
      <p
        v-if="
          (!finding.weaknesses || finding.weaknesses.length === 0) &&
          !finding.owasp_top_10
        "
        class="text-sm text-muted-foreground"
      >
        No information on weaknesses yet. It often follows soon after a
        vulnerability is published.
      </p>
      <template v-else>
        <p class="text-sm text-muted-foreground">
          The type of flaw in the dependency that makes exploitation possible.
        </p>
        <div v-if="finding.owasp_top_10" class="flex flex-col gap-1 text-sm">
          <h4 class="flex items-center gap-2 font-semibold">
            <Icon icon="simple-icons:owasp" aria-hidden="true" class="size-4" />
            OWASP Top 10 2021: {{ finding.owasp_top_10.name }}
          </h4>
          <p>{{ finding.owasp_top_10.description }}</p>
          <a
            :href="owaspUrl(finding.owasp_top_10.name)"
            target="_blank"
            rel="noopener noreferrer"
            :class="linkClass"
            class="self-start"
          >
            OWASP category details
            <ExternalLink aria-hidden="true" class="size-3.5" />
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        <div
          v-for="weakness in finding.weaknesses"
          :key="weakness.id"
          class="flex flex-col gap-1 text-sm"
        >
          <h4 class="font-semibold">{{ weakness.id }}: {{ weakness.name }}</h4>
          <p>{{ weakness.description }}</p>
          <p v-if="consequences(weakness.id)">
            Potential consequences: {{ consequences(weakness.id) }}.
          </p>
          <a
            :href="cweUrl(weakness.id)"
            target="_blank"
            rel="noopener noreferrer"
            :class="linkClass"
            class="self-start"
          >
            {{ weakness.id }} details
            <ExternalLink aria-hidden="true" class="size-3.5" />
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </template>
    </section>
  </div>
</template>
