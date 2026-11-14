<script setup lang="ts">
import { ChevronDown, ExternalLink } from "@lucide/vue";
import { ref } from "vue";

import { SeverityBadge, StatusBadge } from "@/base_components/page";
import InfoMarkdown from "@/base_components/ui/InfoMarkdown.vue";
import CreateTicketButton from "@/codeclarity_components/tickets/components/CreateTicketButton.vue";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { Skeleton } from "@/shadcn/ui/skeleton";

import AddToPolicyButton from "./components/AddToPolicyButton.vue";
import {
  detailsRoute,
  findingSignals,
  formatPercent,
  impacts,
  owaspCategories,
  patchStatus,
  shortDescription,
  ticketVulnerability,
} from "./vuln-format";
import type { VulnerabilityMerged } from "./VulnStats";

// One page of findings as cards that open for more detail.
defineProps<{
  findings: VulnerabilityMerged[];
  loading: boolean;
  emptyText: string;
  analysisID: string;
  projectID: string;
}>();

const expanded = ref(new Set<string>());

function toggle(id: string): void {
  if (expanded.value.has(id)) expanded.value.delete(id);
  else expanded.value.add(id);
}

const linkClass =
  "inline-flex items-center gap-1 rounded-sm font-medium text-brand-subtle-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function cweUrl(id: string): string {
  return `https://cwe.mitre.org/data/definitions/${id.replace("CWE-", "")}.html`;
}
</script>

<template>
  <div
    v-if="loading"
    role="status"
    aria-label="Loading vulnerabilities"
    class="flex flex-col gap-3"
  >
    <div
      v-for="i in 4"
      :key="i"
      class="flex flex-col gap-3 rounded-card border bg-card p-4 shadow-card"
    >
      <div class="flex items-center gap-3">
        <Skeleton class="h-5 w-20" />
        <Skeleton class="h-5 w-40" />
      </div>
      <Skeleton class="h-4 w-1/3" />
      <Skeleton class="h-4 w-2/3" />
    </div>
  </div>

  <p
    v-else-if="findings.length === 0"
    class="rounded-card border bg-card p-8 text-center text-muted-foreground"
  >
    {{ emptyText }}
  </p>

  <ul v-else aria-label="Vulnerabilities" class="flex flex-col gap-3">
    <li
      v-for="finding in findings"
      :key="finding.Id"
      data-testid="vulnerability-card"
      class="rounded-card border bg-card text-card-foreground shadow-card"
    >
      <article
        :aria-labelledby="`vuln-${finding.Id}`"
        class="flex flex-col gap-3 p-4"
      >
        <div class="flex flex-wrap items-start gap-3">
          <SeverityBadge :score="finding.Severity?.Severity" class="mt-1" />
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3
                :id="`vuln-${finding.Id}`"
                class="text-lg font-bold tracking-tight"
              >
                <RouterLink
                  :to="
                    detailsRoute(analysisID, projectID, finding.Vulnerability)
                  "
                  class="rounded-sm text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {{ finding.Vulnerability }}
                </RouterLink>
              </h3>
              <span
                v-if="finding.Weaknesses?.[0]"
                class="text-sm text-muted-foreground"
              >
                {{ finding.Weaknesses[0].WeaknessName }}
              </span>
            </div>
            <ul
              aria-label="Affected dependencies"
              class="flex flex-wrap gap-1.5"
            >
              <li
                v-for="affected in finding.Affected.slice(0, 3)"
                :key="affected.AffectedDependency"
              >
                <Badge variant="outline">
                  {{ affected.AffectedDependency }}@{{
                    affected.AffectedVersion
                  }}
                </Badge>
              </li>
              <li v-if="finding.Affected.length > 3">
                <Badge variant="outline">
                  {{ finding.Affected.length - 3 }} more
                </Badge>
              </li>
            </ul>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <CreateTicketButton
              :project-id="projectID"
              :vulnerability="ticketVulnerability(finding)"
              size="sm"
              variant="outline"
            />
            <AddToPolicyButton
              v-if="!finding.is_blacklisted"
              :vulnerability-id="finding.Vulnerability"
              size="sm"
              variant="outline"
            />
          </div>
        </div>

        <p class="text-sm text-muted-foreground">
          {{ shortDescription(finding.Description) }}
        </p>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <ul
            v-if="findingSignals(finding).length > 0"
            aria-label="Warnings"
            class="flex flex-wrap gap-2"
          >
            <li v-for="signal in findingSignals(finding)" :key="signal.label">
              <StatusBadge :tone="signal.tone" :label="signal.label" />
            </li>
          </ul>
          <Button
            variant="ghost"
            size="sm"
            class="ml-auto"
            :aria-expanded="expanded.has(finding.Id)"
            :aria-controls="`vuln-more-${finding.Id}`"
            @click="toggle(finding.Id)"
          >
            {{ expanded.has(finding.Id) ? "Show less" : "Show more" }}
            <ChevronDown
              aria-hidden="true"
              class="size-4 transition-transform motion-reduce:transition-none"
              :class="expanded.has(finding.Id) ? 'rotate-180' : ''"
            />
          </Button>
        </div>

        <div
          v-if="expanded.has(finding.Id)"
          :id="`vuln-more-${finding.Id}`"
          class="flex flex-col gap-4 border-t pt-4 text-sm"
        >
          <ul
            v-if="findingSignals(finding).length > 0"
            class="flex flex-col gap-1 text-muted-foreground"
          >
            <li v-for="signal in findingSignals(finding)" :key="signal.label">
              <span class="font-medium text-foreground">{{ signal.label }}</span
              >: {{ signal.detail }}
            </li>
          </ul>

          <dl class="grid gap-4 sm:grid-cols-3">
            <div class="flex flex-col gap-1">
              <dt class="font-medium text-foreground-strong">Exploit risk</dt>
              <dd class="flex flex-col items-start gap-1">
                <span>
                  EPSS {{ formatPercent(finding.EPSS?.Score ?? 0) }}, higher
                  than {{ formatPercent(finding.EPSS?.Percentile ?? 0) }} of
                  vulnerabilities
                </span>
                <a
                  href="https://www.first.org/epss/"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="linkClass"
                >
                  About EPSS
                  <ExternalLink aria-hidden="true" class="size-3.5" />
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>
            <div v-if="finding.VLAI?.length" class="flex flex-col gap-1">
              <dt class="font-medium text-foreground-strong">AI assessment</dt>
              <dd v-for="vlai in finding.VLAI" :key="vlai.Source">
                {{ vlai.Source }}: {{ vlai.Score }},
                {{ Math.round(vlai.Confidence * 100) }}% confident
              </dd>
            </div>
            <div v-if="finding.Weaknesses?.length" class="flex flex-col gap-1">
              <dt class="font-medium text-foreground-strong">Weaknesses</dt>
              <dd
                v-for="weakness in finding.Weaknesses"
                :key="weakness.WeaknessId"
              >
                <a
                  :href="cweUrl(weakness.WeaknessId)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="linkClass"
                >
                  {{ weakness.WeaknessId }}
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
                {{ weakness.WeaknessName }}
              </dd>
            </div>
            <div
              v-if="impacts(finding.Severity).length"
              class="flex flex-col gap-1"
            >
              <dt class="font-medium text-foreground-strong">Impact</dt>
              <dd
                v-for="impact in impacts(finding.Severity)"
                :key="impact.name"
              >
                {{ impact.name }}:
                <span :class="impact.high ? 'font-semibold text-danger' : ''">
                  {{ impact.value }}
                </span>
              </dd>
            </div>
            <div
              v-if="owaspCategories(finding.Weaknesses).length"
              class="flex flex-col gap-1"
            >
              <dt class="font-medium text-foreground-strong">OWASP Top 10</dt>
              <dd
                v-for="category in owaspCategories(finding.Weaknesses)"
                :key="category.id"
              >
                <span class="font-semibold">{{ category.id }}</span>
                {{ category.name }}
              </dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt class="font-medium text-foreground-strong">Patch status</dt>
              <dd
                v-for="affected in finding.Affected"
                :key="affected.AffectedDependency"
                class="flex flex-wrap items-center gap-2"
              >
                {{ affected.AffectedDependency }}
                <StatusBadge v-bind="patchStatus(affected.PatchType)" />
              </dd>
            </div>
          </dl>

          <div class="text-foreground">
            <InfoMarkdown :markdown="finding.Description.trim()" />
          </div>
        </div>
      </article>
    </li>
  </ul>
</template>
