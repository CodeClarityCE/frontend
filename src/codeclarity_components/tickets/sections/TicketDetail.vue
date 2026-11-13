<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  Archive,
  ArrowUpRight,
  ChevronDown,
  CircleCheck,
  CircleX,
  Link,
  LoaderCircle,
  Play,
  RefreshCw,
  Unlink,
} from "@lucide/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";

import { StatusBadge } from "@/base_components/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/ui/accordion";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shadcn/ui/sheet";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { formatShortDate } from "@/utils/dateUtils";
import { getOwaspInfoById } from "@/utils/owasp";
import { errorToast } from "@/utils/toasts";

import RiskScoreGauge from "../components/RiskScoreGauge.vue";
import ScoreProgressBar from "../components/ScoreProgressBar.vue";
import TicketPriorityBadge from "../components/TicketPriorityBadge.vue";
import {
  ExternalProviderIcons,
  ExternalProviderLabels,
  type ExternalTicketProvider,
  type IntegrationConfigSummary,
  type TicketDetails,
  TicketStatus,
  TicketStatusLabels,
  TicketStatusTones,
  TicketTypeLabels,
  type VulnerabilityDetailsReport,
} from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

const props = defineProps<{
  ticket: TicketDetails;
  isLoading: boolean;
  vulnerabilityDetails?: VulnerabilityDetailsReport | null;
  isLoadingVulnDetails?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();
const ticketsRepository = new TicketsRepository();

const isOpen = ref(true);
const isSyncing = ref(false);
const isUnlinking = ref<string | null>(null);
const isSyncingFromExternal = ref<string | null>(null);
const isUpdatingStatus = ref(false);
const availableIntegrations = ref<IntegrationConfigSummary[]>([]);
const openAccordionItems = ref<string[]>([]);

async function loadIntegrations(): Promise<void> {
  if (!defaultOrg?.value?.id || !auth.getToken) return;

  try {
    const response = await ticketsRepository.getIntegrations({
      orgId: defaultOrg.value.id,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    availableIntegrations.value = response.data.filter((i) => i.enabled);
  } catch {
    // Without integrations the Sync menu stays hidden.
  }
}

async function syncToProvider(provider: ExternalTicketProvider): Promise<void> {
  if (!defaultOrg?.value?.id || !auth.getToken) return;

  isSyncing.value = true;
  try {
    await ticketsRepository.syncTicket({
      orgId: defaultOrg.value.id,
      ticketId: props.ticket.id,
      provider,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    void emit("updated");
  } catch {
    errorToast("Failed to sync the ticket");
  } finally {
    isSyncing.value = false;
  }
}

async function unlinkFromProvider(linkId: string): Promise<void> {
  if (!defaultOrg?.value?.id || !auth.getToken) return;

  isUnlinking.value = linkId;
  try {
    await ticketsRepository.unlinkTicket({
      orgId: defaultOrg.value.id,
      ticketId: props.ticket.id,
      linkId,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    void emit("updated");
  } catch {
    errorToast("Failed to unlink the ticket");
  } finally {
    isUnlinking.value = null;
  }
}

async function syncFromExternalLink(linkId: string): Promise<void> {
  if (!defaultOrg?.value?.id || !auth.getToken) return;

  isSyncingFromExternal.value = linkId;
  try {
    const result = await ticketsRepository.syncFromExternal({
      orgId: defaultOrg.value.id,
      ticketId: props.ticket.id,
      linkId,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    if (result.data.updated) {
      void emit("updated");
    }
  } catch {
    errorToast("Failed to sync the status");
  } finally {
    isSyncingFromExternal.value = null;
  }
}

async function updateStatus(newStatus: TicketStatus): Promise<void> {
  if (!defaultOrg?.value?.id || !auth.getToken) return;

  isUpdatingStatus.value = true;
  try {
    await ticketsRepository.updateTicket({
      orgId: defaultOrg.value.id,
      ticketId: props.ticket.id,
      data: { status: newStatus },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    void emit("updated");
  } catch {
    errorToast("Failed to update the ticket status");
  } finally {
    isUpdatingStatus.value = false;
  }
}

// Lets the closing animation finish before the parent unmounts the panel.
function close(): void {
  isOpen.value = false;
  setTimeout(() => emit("close"), 300);
}

// Get providers that aren't already linked
const availableSyncProviders = computed(() => {
  const linkedProviders = new Set(
    props.ticket.external_links.map((link) => link.provider),
  );
  return availableIntegrations.value.filter(
    (integration) => !linkedProviders.has(integration.provider),
  );
});

// Get the best available CVSS score (prefer v3.1 > v3 > v2)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cvssData = computed((): { version: string; data: any } | null => {
  if (!props.vulnerabilityDetails?.severities) return null;
  const { cvss_31, cvss_3, cvss_2 } = props.vulnerabilityDetails.severities;
  if (cvss_31) return { version: "3.1", data: cvss_31 };
  if (cvss_3) return { version: "3.0", data: cvss_3 };
  if (cvss_2) return { version: "2.0", data: cvss_2 };
  return null;
});

// Format EPSS score as percentage
const epssFormatted = computed(() => {
  const score = props.vulnerabilityDetails?.other?.epss_score;
  const percentile = props.vulnerabilityDetails?.other?.epss_percentile;
  if (score === undefined || score === null) return null;
  return {
    score: `${(score * 100).toFixed(2)}%`,
    scoreRaw: score * 100,
    percentile:
      percentile !== undefined ? `${(percentile * 100).toFixed(1)}%` : null,
    percentileRaw: percentile !== undefined ? percentile * 100 : null,
  };
});

// Get CVSS base score safely
function getCvssBaseScore(): number {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (cvssData.value?.data?.base_score as number) ?? 0;
}

// Convert VLAI score string to numeric value for gauge
function getVlaiNumericScore(vlaiScore: string | undefined): number {
  if (!vlaiScore) return 0;
  const mapping: Record<string, number> = {
    CRITICAL: 10,
    HIGH: 7.5,
    MEDIUM: 5,
    LOW: 2.5,
  };
  return mapping[vlaiScore.toUpperCase()] ?? 0;
}

// Get overall risk level
const overallRiskLevel = computed(() => {
  const cvss = getCvssBaseScore();
  if (cvss >= 9.0) return "critical";
  if (cvss >= 7.0) return "high";
  if (cvss >= 4.0) return "medium";
  if (cvss >= 0.1) return "low";
  return "none";
});

// Risk banner colour and advice for each CVSS level.
const riskBanners: Record<
  "critical" | "high" | "medium" | "low" | "none",
  { class: string; label: string; recommendation: string }
> = {
  critical: {
    class: "bg-severity-critical text-severity-foreground",
    label: "Critical",
    recommendation: "Immediate action required",
  },
  high: {
    class: "bg-severity-high text-severity-foreground",
    label: "High",
    recommendation: "Address as soon as possible",
  },
  medium: {
    class: "bg-severity-medium text-severity-foreground",
    label: "Medium",
    recommendation: "Plan remediation in an upcoming cycle",
  },
  low: {
    class: "bg-severity-low text-severity-foreground",
    label: "Low",
    recommendation: "Monitor and address when convenient",
  },
  none: {
    class: "bg-neutral-subtle text-neutral",
    label: "Info",
    recommendation: "No immediate action required",
  },
};
const riskBanner = computed(() => riskBanners[overallRiskLevel.value]);

// CVSS vector fields shown in the breakdown, in reading order.
const cvssVectorFields = [
  ["attack_vector", "Attack vector"],
  ["attack_complexity", "Attack complexity"],
  ["privileges_required", "Privileges required"],
  ["user_interaction", "User interaction"],
  ["scope", "Scope"],
  ["confidentiality_impact", "Confidentiality"],
  ["integrity_impact", "Integrity"],
  ["availability_impact", "Availability"],
] as const;

function onOpenChange(open: boolean): void {
  if (!open) close();
}

// Check if we have any scores to show in risk overview
const hasRiskScores = computed(() => {
  return Boolean(
    cvssData.value ??
    epssFormatted.value ??
    props.vulnerabilityDetails?.other?.vlai_score,
  );
});

// Get OWASP info if available
const owaspInfo = computed(() => {
  const owasp = props.vulnerabilityDetails?.owasp_top_10;
  if (!owasp?.id) return null;
  return getOwaspInfoById(owasp.id);
});

onMounted(() => {
  void loadIntegrations();
});
</script>

<template>
  <Sheet :open="isOpen" @update:open="onOpenChange">
    <SheetContent class="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
      <SheetHeader class="gap-3 border-b px-6 py-5 pr-12">
        <p
          class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ TicketTypeLabels[ticket.type] }} ticket
        </p>
        <SheetTitle class="text-xl font-bold text-foreground-strong">
          {{ ticket.title }}
        </SheetTitle>
        <SheetDescription class="flex flex-wrap items-center gap-2">
          <StatusBadge
            :tone="TicketStatusTones[ticket.status]"
            :label="TicketStatusLabels[ticket.status]"
          />
          <TicketPriorityBadge :priority="ticket.priority" />
          <span class="sr-only">priority</span>
          <a
            v-if="
              ticket.vulnerability_id &&
              !ticket.title.includes(ticket.vulnerability_id)
            "
            :href="`https://nvd.nist.gov/vuln/detail/${ticket.vulnerability_id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 rounded-sm font-mono text-sm text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {{ ticket.vulnerability_id }}
            <ArrowUpRight aria-hidden="true" class="size-3.5" />
          </a>
        </SheetDescription>
      </SheetHeader>

      <div class="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
        <template
          v-if="vulnerabilityDetails && hasRiskScores && !isLoadingVulnDetails"
        >
          <div
            class="flex flex-col gap-0.5 rounded-card p-4"
            :class="riskBanner.class"
          >
            <p class="font-semibold">{{ riskBanner.label }} risk</p>
            <p class="text-sm">{{ riskBanner.recommendation }}</p>
          </div>

          <section
            aria-labelledby="ticket-risk-overview"
            class="flex flex-col gap-4 rounded-card border bg-card p-5"
          >
            <h3
              id="ticket-risk-overview"
              class="text-sm font-semibold text-foreground-strong"
            >
              Risk overview
            </h3>
            <ul class="grid grid-cols-3 gap-4">
              <li v-if="cvssData">
                <RiskScoreGauge
                  :score="getCvssBaseScore()"
                  :max-score="10"
                  :label="'CVSS v' + cvssData.version"
                  type="cvss"
                  sublabel="Severity, 0 to 10"
                />
              </li>
              <li v-if="epssFormatted">
                <RiskScoreGauge
                  :score="epssFormatted.scoreRaw"
                  :max-score="100"
                  label="EPSS"
                  type="epss"
                  :sublabel="
                    epssFormatted.percentile
                      ? `Exploit chance in 30 days, top ${epssFormatted.percentile}`
                      : 'Exploit chance in 30 days'
                  "
                />
              </li>
              <li v-if="vulnerabilityDetails.other?.vlai_score">
                <RiskScoreGauge
                  :score="
                    getVlaiNumericScore(vulnerabilityDetails.other.vlai_score)
                  "
                  :max-score="10"
                  label="VLAI"
                  type="vlai"
                  :sublabel="vulnerabilityDetails.other.vlai_score"
                />
              </li>
            </ul>
            <div
              v-if="vulnerabilityDetails.owasp_top_10?.id"
              class="flex flex-col gap-1 border-t pt-4 text-sm"
            >
              <p
                class="flex items-center gap-2 font-semibold text-foreground-strong"
              >
                <Icon
                  icon="simple-icons:owasp"
                  aria-hidden="true"
                  class="size-4"
                />
                OWASP {{ vulnerabilityDetails.owasp_top_10.id }}:
                {{ vulnerabilityDetails.owasp_top_10.name }}
              </p>
              <p class="text-muted-foreground">{{ owaspInfo?.description }}</p>
              <p class="text-muted-foreground">
                Potential impact: {{ owaspInfo?.impact }}
              </p>
            </div>
          </section>
        </template>

        <section
          v-if="ticket.affected_package"
          aria-labelledby="ticket-component"
          class="flex flex-col gap-3 rounded-card bg-muted p-4"
        >
          <h3
            id="ticket-component"
            class="text-sm font-semibold text-foreground-strong"
          >
            Affected component
          </h3>
          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-xs text-muted-foreground">Package</dt>
              <dd class="truncate text-foreground-strong">
                {{ ticket.affected_package }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Version</dt>
              <dd class="text-foreground-strong">
                {{ ticket.affected_version ?? "Unknown"
                }}{{
                  ticket.recommended_version
                    ? `, fixed in ${ticket.recommended_version}`
                    : ""
                }}
              </dd>
            </div>
          </dl>
        </section>

        <div
          v-if="isLoadingVulnDetails"
          role="status"
          class="flex items-center gap-2 rounded-card bg-muted p-4 text-sm text-muted-foreground"
        >
          <LoaderCircle
            aria-hidden="true"
            class="size-4 animate-spin motion-reduce:animate-none"
          />
          Loading vulnerability details
        </div>

        <Accordion
          v-if="vulnerabilityDetails && !isLoadingVulnDetails"
          v-model="openAccordionItems"
          type="multiple"
          class="flex flex-col gap-2"
        >
          <AccordionItem
            v-if="cvssData"
            value="cvss-details"
            class="overflow-hidden rounded-card border"
          >
            <AccordionTrigger class="px-4 py-3 text-sm hover:no-underline">
              CVSS v{{ cvssData.version }} breakdown
            </AccordionTrigger>
            <AccordionContent class="flex flex-col gap-4 px-4 pb-4 pt-2">
              <div class="grid grid-cols-2 gap-3">
                <ScoreProgressBar
                  v-if="cvssData.data.exploitability_score"
                  :value="cvssData.data.exploitability_score"
                  :max="3.9"
                  label="Exploitability"
                />
                <ScoreProgressBar
                  v-if="cvssData.data.impact_score"
                  :value="cvssData.data.impact_score"
                  :max="6.1"
                  label="Impact"
                />
              </div>
              <dl class="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <template v-for="[key, label] in cvssVectorFields" :key="key">
                  <div
                    v-if="cvssData.data[key]"
                    class="flex justify-between gap-2 py-1"
                  >
                    <dt class="text-muted-foreground">{{ label }}</dt>
                    <dd class="font-medium text-foreground-strong">
                      {{ cvssData.data[key] }}
                    </dd>
                  </div>
                </template>
              </dl>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            v-if="vulnerabilityDetails.weaknesses?.length"
            value="weaknesses"
            class="overflow-hidden rounded-card border"
          >
            <AccordionTrigger class="px-4 py-3 text-sm hover:no-underline">
              Weaknesses ({{ vulnerabilityDetails.weaknesses.length }})
            </AccordionTrigger>
            <AccordionContent class="px-4 pb-4 pt-2">
              <ul class="flex flex-col gap-2">
                <li
                  v-for="weakness in vulnerabilityDetails.weaknesses"
                  :key="weakness.id"
                  class="flex items-start gap-2 rounded-control border bg-card p-3 text-sm"
                >
                  <span
                    class="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {{ weakness.id }}
                  </span>
                  <span class="flex min-w-0 flex-col">
                    <span class="font-medium text-foreground-strong">
                      {{ weakness.name }}
                    </span>
                    <span
                      v-if="weakness.description"
                      class="line-clamp-2 text-xs text-muted-foreground"
                    >
                      {{ weakness.description }}
                    </span>
                  </span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            v-if="vulnerabilityDetails.location?.length"
            value="locations"
            class="overflow-hidden rounded-card border"
          >
            <AccordionTrigger class="px-4 py-3 text-sm hover:no-underline">
              Affected locations ({{ vulnerabilityDetails.location.length }})
            </AccordionTrigger>
            <AccordionContent class="px-4 pb-4 pt-2">
              <ul class="flex max-h-48 flex-col gap-2 overflow-y-auto">
                <li
                  v-for="(path, index) in vulnerabilityDetails.location"
                  :key="index"
                  class="truncate rounded-control border bg-card px-3 py-2 font-mono text-xs text-foreground"
                  :title="path"
                >
                  {{ path }}
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            v-if="vulnerabilityDetails.references?.length"
            value="references"
            class="overflow-hidden rounded-card border"
          >
            <AccordionTrigger class="px-4 py-3 text-sm hover:no-underline">
              References ({{ vulnerabilityDetails.references.length }})
            </AccordionTrigger>
            <AccordionContent class="px-4 pb-4 pt-2">
              <ul class="flex max-h-48 flex-col gap-1 overflow-y-auto">
                <li
                  v-for="(reference, index) in vulnerabilityDetails.references"
                  :key="index"
                >
                  <a
                    :href="reference.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 rounded-sm px-1 py-1 text-xs text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowUpRight aria-hidden="true" class="size-3 shrink-0" />
                    <span class="truncate">{{ reference.url }}</span>
                  </a>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <section aria-labelledby="ticket-description">
          <h3
            id="ticket-description"
            class="mb-2 text-sm font-semibold text-foreground-strong"
          >
            Description
          </h3>
          <p class="whitespace-pre-wrap text-sm text-foreground">
            {{ ticket.description }}
          </p>
        </section>

        <section
          v-if="ticket.remediation_notes"
          aria-labelledby="ticket-remediation"
        >
          <h3
            id="ticket-remediation"
            class="mb-2 text-sm font-semibold text-foreground-strong"
          >
            Remediation notes
          </h3>
          <p
            class="whitespace-pre-wrap rounded-card border border-brand-subtle-border bg-brand-subtle p-4 text-sm text-brand-subtle-foreground"
          >
            {{ ticket.remediation_notes }}
          </p>
        </section>

        <dl class="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
          <div>
            <dt class="text-xs text-muted-foreground">Project</dt>
            <dd class="text-foreground-strong">{{ ticket.project_name }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Created by</dt>
            <dd class="text-foreground-strong">
              {{ ticket.created_by_name }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Assigned to</dt>
            <dd class="text-foreground-strong">
              {{ ticket.assigned_to_name ?? "Unassigned" }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Due date</dt>
            <dd class="text-foreground-strong">
              {{
                formatShortDate(ticket.due_date, {
                  time: true,
                  fallback: "Not set",
                })
              }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Created on</dt>
            <dd class="text-foreground-strong">
              {{
                formatShortDate(ticket.created_on, {
                  time: true,
                  fallback: "Not set",
                })
              }}
            </dd>
          </div>
          <div v-if="ticket.resolved_on">
            <dt class="text-xs text-muted-foreground">Resolved on</dt>
            <dd class="text-foreground-strong">
              {{
                formatShortDate(ticket.resolved_on, {
                  time: true,
                  fallback: "Not set",
                })
              }}
            </dd>
          </div>
        </dl>

        <p
          v-if="ticket.occurrence_count > 0"
          class="border-t pt-4 text-sm text-foreground"
        >
          <strong>{{ ticket.occurrence_count }}</strong> total occurrences,
          <strong>{{ ticket.active_occurrence_count }}</strong> active
        </p>

        <section
          v-if="ticket.external_links.length > 0"
          aria-labelledby="ticket-links"
          class="border-t pt-4"
        >
          <h3
            id="ticket-links"
            class="mb-3 text-sm font-semibold text-foreground-strong"
          >
            External links
          </h3>
          <ul class="flex flex-col gap-2">
            <li
              v-for="link in ticket.external_links"
              :key="link.id"
              class="flex items-center gap-3 rounded-card bg-muted p-3"
            >
              <a
                :href="link.external_url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex min-w-0 flex-1 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon
                  v-if="ExternalProviderIcons[link.provider]"
                  :icon="ExternalProviderIcons[link.provider]"
                  aria-hidden="true"
                  class="size-4 shrink-0 text-foreground-strong"
                />
                <Link
                  v-else
                  aria-hidden="true"
                  class="size-4 shrink-0 text-foreground-strong"
                />
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="text-sm font-medium text-foreground-strong">
                    {{ ExternalProviderLabels[link.provider] || link.provider }}
                  </span>
                  <span class="truncate text-xs text-muted-foreground">
                    {{ link.external_id }}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  class="size-4 text-muted-foreground"
                />
              </a>
              <Button
                variant="ghost"
                size="icon-sm"
                :aria-label="`Sync status from ${ExternalProviderLabels[link.provider] || link.provider}`"
                :disabled="isSyncingFromExternal === link.id"
                @click="syncFromExternalLink(link.id)"
              >
                <RefreshCw
                  aria-hidden="true"
                  :class="{
                    'animate-spin motion-reduce:animate-none':
                      isSyncingFromExternal === link.id,
                  }"
                />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                :aria-label="`Unlink from ${ExternalProviderLabels[link.provider] || link.provider}`"
                :disabled="isUnlinking === link.id"
                @click="unlinkFromProvider(link.id)"
              >
                <Unlink aria-hidden="true" />
              </Button>
            </li>
          </ul>
        </section>
      </div>

      <SheetFooter
        class="flex-row items-center justify-end gap-2 border-t px-6 py-4"
      >
        <DropdownMenu v-if="availableSyncProviders.length > 0">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" :disabled="isSyncing">
              <LoaderCircle
                v-if="isSyncing"
                aria-hidden="true"
                class="animate-spin motion-reduce:animate-none"
              />
              <Link v-else aria-hidden="true" />
              Sync
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="integration in availableSyncProviders"
              :key="integration.provider"
              @click="syncToProvider(integration.provider)"
            >
              <Icon
                :icon="ExternalProviderIcons[integration.provider]"
                aria-hidden="true"
                class="size-4"
              />
              Sync to {{ ExternalProviderLabels[integration.provider] }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          v-if="ticket.status === TicketStatus.OPEN"
          variant="outline"
          :disabled="isUpdatingStatus"
          @click="updateStatus(TicketStatus.IN_PROGRESS)"
        >
          <Play aria-hidden="true" />
          Start progress
        </Button>
        <Button
          v-if="ticket.status === TicketStatus.IN_PROGRESS"
          :disabled="isUpdatingStatus"
          @click="updateStatus(TicketStatus.RESOLVED)"
        >
          <CircleCheck aria-hidden="true" />
          Mark resolved
        </Button>
        <Button
          v-if="
            ticket.status === TicketStatus.OPEN ||
            ticket.status === TicketStatus.IN_PROGRESS
          "
          variant="outline"
          :disabled="isUpdatingStatus"
          @click="updateStatus(TicketStatus.WONT_FIX)"
        >
          <CircleX aria-hidden="true" />
          Won't fix
        </Button>
        <Button
          v-if="ticket.status === TicketStatus.RESOLVED"
          variant="outline"
          :disabled="isUpdatingStatus"
          @click="updateStatus(TicketStatus.CLOSED)"
        >
          <Archive aria-hidden="true" />
          Close ticket
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
