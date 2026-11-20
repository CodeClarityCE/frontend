<script setup lang="ts">
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";

import { SeverityBadge } from "@/base_components/page";
import CopyCommand from "@/base_components/ui/CopyCommand.vue";
import {
  RemediationKind,
  type TopLevelDependency,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import { levelOfClass } from "@/codeclarity_components/vulnerabilities/severity-class";
import { Badge } from "@/shadcn/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

import type { TicketInstance, TicketRemediation } from "../tickets.entity";

// The remediation a ticket tracks and every vulnerability instance it resolves.
const props = defineProps<{
  remediation: TicketRemediation;
  instances: TicketInstance[];
}>();

const VERB: Record<RemediationKind, string> = {
  [RemediationKind.UpgradeDirect]: "Upgrade",
  [RemediationKind.UpgradeTopLevel]: "Upgrade",
  [RemediationKind.ForceVersion]: "Force",
};

const installed = computed(() =>
  props.remediation.installed_versions.join(", "),
);

const pathText = (top: TopLevelDependency): string =>
  top.path.map((pkg) => `${pkg.name}@${pkg.version}`).join(" > ");

const vulnerabilityRoute = (instance: TicketInstance): RouteLocationRaw => ({
  name: "orgVulnerability",
  params: { vulnerabilityId: instance.vulnerability_id },
});
</script>

<template>
  <section
    aria-labelledby="ticket-remediation-change"
    class="flex flex-col gap-3 rounded-card bg-muted p-4"
  >
    <h3
      id="ticket-remediation-change"
      class="text-sm font-semibold text-foreground-strong"
    >
      Remediation
    </h3>
    <p class="flex flex-wrap items-center gap-2 text-sm">
      <span>
        {{ VERB[remediation.kind] }}
        {{ " " }}
        <span class="font-medium">{{ remediation.package }}</span>
        <template v-if="installed">
          {{ " " }}
          <span class="tabular-nums">{{ installed }}</span>
        </template>
        to
        <span class="font-medium tabular-nums">{{
          remediation.target_version
        }}</span>
      </span>
      <Badge
        v-if="remediation.kind === RemediationKind.UpgradeTopLevel"
        variant="secondary"
        >Top-level dependency</Badge
      >
      <Badge v-if="remediation.potentially_breaking" variant="destructive"
        >Potentially breaking</Badge
      >
      <span
        v-if="remediation.workspace !== '.'"
        class="text-xs text-muted-foreground"
        >in {{ remediation.workspace }}</span
      >
    </p>
    <div v-if="remediation.manifest_edit" class="space-y-1">
      <p class="text-xs">
        Add to
        <code class="font-mono">{{ remediation.manifest_edit.file }}</code
        >, then run:
      </p>
      <pre
        class="rounded-control bg-background px-2 py-1 font-mono text-xs whitespace-pre-wrap"
        >{{ remediation.manifest_edit.text.trimEnd() }}</pre>
    </div>
    <CopyCommand
      v-if="remediation.command"
      :command="remediation.command"
      label="remediation"
    />
    <p v-else class="text-xs text-muted-foreground">
      No command: the analysis names no supported package manager.
    </p>

    <div class="overflow-x-auto">
      <Table aria-label="Resolved vulnerabilities">
        <TableHeader>
          <TableRow>
            <TableHead>Vulnerability</TableHead>
            <TableHead>Installed version</TableHead>
            <TableHead>Fixed in</TableHead>
            <TableHead>Installed by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="instance in instances"
            :key="instance.id"
            :class="{ 'text-muted-foreground': !instance.is_active }"
          >
            <TableCell>
              <div class="flex flex-wrap items-center gap-2">
                <RouterLink
                  :to="vulnerabilityRoute(instance)"
                  class="font-mono text-primary underline-offset-4 hover:underline"
                  >{{ instance.vulnerability_id }}</RouterLink
                >
                <SeverityBadge
                  :level="levelOfClass(instance.severity_class)"
                  :score="instance.severity_score ?? undefined"
                />
                <Badge v-if="!instance.is_active" variant="outline"
                  >Resolved</Badge
                >
              </div>
            </TableCell>
            <TableCell class="tabular-nums"
              >{{ instance.package }}
              {{ instance.installed_version }}</TableCell
            >
            <TableCell v-if="instance.fixed_version" class="tabular-nums">{{
              instance.fixed_version
            }}</TableCell>
            <TableCell v-else class="text-muted-foreground">No fix</TableCell>
            <TableCell>
              <span
                v-if="instance.top_level_dependencies.length === 0"
                class="text-muted-foreground"
                >Not found</span
              >
              <ul v-else aria-label="Installed by" class="space-y-1">
                <li
                  v-for="top in instance.top_level_dependencies"
                  :key="`${top.dev}\u0000${top.name}@${top.version}`"
                  class="text-xs break-all"
                >
                  {{ pathText(top) }}
                  <Badge v-if="top.dev" variant="outline" class="ml-1"
                    >Dev</Badge
                  >
                </li>
              </ul>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </section>
</template>
