<script setup lang="ts">
import { ChevronRight, TriangleAlert } from "@lucide/vue";
import { computed } from "vue";

import { SeverityBadge } from "@/base_components/page";
import CopyCommand from "@/base_components/ui/CopyCommand.vue";
import { RemediationKind } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import { orgVulnerabilityRoute } from "@/codeclarity_components/vulnerabilities/organization-vulnerability-route";
import { levelOfClass } from "@/codeclarity_components/vulnerabilities/severity-class";
import InstanceDiffLinks from "@/codeclarity_components/vulnerabilities/shared/InstanceDiffLinks.vue";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Badge } from "@/shadcn/ui/badge";

import {
  groupByVulnerability,
  hasDiffLinks,
  pathText,
  remediationTitle,
} from "../page/ticket-fix";
import type { TicketInstance, TicketRemediation } from "../tickets.entity";

// The change a ticket tracks and every vulnerability it resolves: the same facts as its external issue.
const props = defineProps<{
  /** The ticket's organization, for links to its vulnerability pages */
  orgId: string;
  remediation: TicketRemediation;
  instances: TicketInstance[];
  /** The page's title; the change is not repeated when it says the same */
  ticketTitle?: string;
}>();

const vulnerabilities = computed(() => groupByVulnerability(props.instances));

const plural = (count: number, one: string, many = `${one}s`): string =>
  `${count} ${count === 1 ? one : many}`;
</script>

<template>
  <section
    aria-labelledby="ticket-fix"
    class="flex flex-col rounded-card border bg-card"
  >
    <header class="flex flex-col gap-2 border-b p-5">
      <h2
        id="ticket-fix"
        class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        The fix
      </h2>
      <p
        v-if="remediationTitle(remediation) !== ticketTitle"
        class="text-lg font-semibold break-words text-foreground-strong"
      >
        {{ remediationTitle(remediation) }}
      </p>
      <p
        class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <span v-if="remediation.installed_versions.length > 0">
          Installed:
          <span class="text-foreground tabular-nums">{{
            remediation.installed_versions.join(", ")
          }}</span>
        </span>
        <Badge
          v-if="remediation.kind === RemediationKind.UpgradeTopLevel"
          variant="secondary"
          >Top-level dependency</Badge
        >
      </p>
      <Alert v-if="remediation.potentially_breaking" variant="destructive">
        <TriangleAlert aria-hidden="true" />
        <AlertDescription>
          Potentially breaking: it leaves the current major.
        </AlertDescription>
      </Alert>
    </header>

    <ol class="flex flex-col gap-4 border-b p-5" aria-label="Steps">
      <li v-if="remediation.manifest_edit" class="flex flex-col gap-2">
        <p class="text-sm font-medium text-foreground-strong">
          Add to
          <code class="font-mono">{{ remediation.manifest_edit.file }}</code>
        </p>
        <pre
          class="overflow-x-auto rounded-control bg-muted px-3 py-2 font-mono text-xs"
          >{{ remediation.manifest_edit.text.trimEnd() }}</pre>
      </li>
      <li class="flex flex-col gap-2">
        <p class="text-sm font-medium text-foreground-strong">Run</p>
        <CopyCommand
          v-if="remediation.command"
          :command="remediation.command"
          label="remediation"
        />
        <p v-else class="text-sm text-muted-foreground">
          No command: the analysis names no supported package manager.
        </p>
      </li>
    </ol>

    <div class="flex flex-col gap-3 p-5">
      <h3 class="text-sm font-semibold text-foreground-strong">
        Resolves
        {{ plural(vulnerabilities.length, "vulnerability", "vulnerabilities") }}
      </h3>
      <ul aria-label="Resolved vulnerabilities" class="flex flex-col gap-3">
        <li
          v-for="vulnerability in vulnerabilities"
          :key="vulnerability.vulnerability_id"
          class="flex flex-col gap-3 rounded-control border p-4"
          :class="{ 'text-muted-foreground': vulnerability.resolved }"
        >
          <p class="flex flex-wrap items-center gap-2">
            <SeverityBadge
              :level="levelOfClass(vulnerability.severity_class)"
              :score="vulnerability.severity_score ?? undefined"
            />
            <RouterLink
              :to="orgVulnerabilityRoute(orgId, vulnerability.vulnerability_id)"
              class="font-mono text-sm font-medium break-all text-brand-subtle-foreground underline-offset-4 hover:underline"
              >{{ vulnerability.vulnerability_id }}</RouterLink
            >
            <Badge v-if="vulnerability.resolved" variant="outline"
              >Resolved</Badge
            >
          </p>
          <ul class="flex flex-col gap-3" aria-label="Installed versions">
            <li
              v-for="instance in vulnerability.instances"
              :key="instance.id"
              class="flex flex-col gap-2 border-l-2 pl-3"
            >
              <p class="flex flex-wrap items-center gap-2 text-sm">
                <span class="tabular-nums">
                  <span class="font-medium">{{ instance.package }}</span>
                  {{ instance.installed_version }}
                  <template v-if="instance.fixed_version">
                    <span aria-hidden="true">&rarr;</span>
                    <span class="sr-only">fixed in</span>
                    {{ instance.fixed_version }}
                  </template>
                  <span v-else class="text-muted-foreground">· no fix</span>
                </span>
                <Badge v-if="!instance.prod" variant="outline">Dev only</Badge>
                <Badge
                  v-if="!instance.is_active && !vulnerability.resolved"
                  variant="outline"
                  >Resolved</Badge
                >
              </p>
              <!-- Native details, so the paths stay in the page for find and copy. -->
              <details
                v-if="instance.top_level_dependencies.length > 0"
                class="group"
              >
                <summary
                  class="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden"
                >
                  <ChevronRight
                    aria-hidden="true"
                    class="size-3.5 transition-transform group-open:rotate-90"
                  />
                  Installed via
                  {{ plural(instance.top_level_dependencies.length, "path") }}
                </summary>
                <ul aria-label="Installed by" class="mt-2 flex flex-col gap-1">
                  <li
                    v-for="top in instance.top_level_dependencies"
                    :key="`${top.dev}\u0000${pathText(top)}`"
                    class="font-mono text-xs break-all"
                  >
                    {{ pathText(top) }}
                    <Badge v-if="top.dev" variant="outline" class="ml-1"
                      >Dev</Badge
                    >
                  </li>
                </ul>
              </details>
              <p v-else class="text-xs text-muted-foreground">
                Installed by: not found
              </p>
              <InstanceDiffLinks
                v-if="hasDiffLinks(instance)"
                :links="instance.diff_links"
              />
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>
