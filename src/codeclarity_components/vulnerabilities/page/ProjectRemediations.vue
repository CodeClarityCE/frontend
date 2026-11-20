<script setup lang="ts">
import { computed } from "vue";

import CopyCommand from "@/base_components/ui/CopyCommand.vue";
import CreateRemediationTicket from "@/codeclarity_components/tickets/components/CreateRemediationTicket.vue";
import { Badge } from "@/shadcn/ui/badge";

import {
  type AffectedProject,
  type Remediation,
  RemediationKind,
} from "../organization_vulnerability.entity";

// The remediations of one affected project, and its instances none resolves.
const props = defineProps<{ project: AffectedProject }>();

const VERB: Record<RemediationKind, string> = {
  [RemediationKind.UpgradeDirect]: "Upgrade",
  [RemediationKind.UpgradeTopLevel]: "Upgrade",
  [RemediationKind.ForceVersion]: "Force",
};

const plural = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

const resolvedIds = computed(
  () =>
    new Set(
      props.project.remediations.flatMap((r) =>
        r.instances.map((i) => i.instance_id),
      ),
    ),
);

// Policy-excluded instances are never remediated, so they are not listed here.
const unresolved = computed(() =>
  props.project.instances.filter(
    (i) => !i.excluded_by_policy && !resolvedIds.value.has(i.instance_id),
  ),
);

const vulnerabilitiesOf = (remediation: Remediation): string[] => [
  ...new Set(remediation.instances.map((i) => i.vulnerability_id)),
];

const remediationKey = (r: Remediation): string =>
  [r.kind, r.workspace, r.package].join("\u0000");
</script>

<template>
  <div class="mt-3 space-y-3">
    <ul
      v-if="project.remediations.length > 0"
      aria-label="Remediations"
      class="space-y-3"
    >
      <li
        v-for="remediation in project.remediations"
        :key="remediationKey(remediation)"
        class="space-y-2 rounded-control border p-3"
      >
        <p class="flex flex-wrap items-center gap-2 text-sm">
          <span>
            {{ VERB[remediation.kind] }}
            {{ " " }}
            <span class="font-medium">{{ remediation.package }}</span>
            {{ " " }}
            <span class="tabular-nums">{{
              remediation.installed_versions.join(", ")
            }}</span>
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
          <Badge v-if="remediation.dev" variant="outline">Dev</Badge>
          <span
            v-if="remediation.workspace !== '.'"
            class="text-xs text-muted-foreground"
            >in {{ remediation.workspace }}</span
          >
        </p>
        <p class="text-xs text-muted-foreground">
          Resolves
          {{ plural(remediation.instances.length, "vulnerability instance") }}:
          {{ vulnerabilitiesOf(remediation).join(", ") }}
        </p>
        <div v-if="remediation.manifest_edit" class="space-y-1">
          <p class="text-xs">
            Add to
            <code class="font-mono">{{ remediation.manifest_edit.file }}</code
            >, then run:
          </p>
          <pre
            class="rounded-control bg-muted px-2 py-1 font-mono text-xs whitespace-pre-wrap"
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
        <CreateRemediationTicket
          :project-id="project.project_id"
          :remediation="remediation"
        />
      </li>
    </ul>
    <ul v-if="unresolved.length > 0" class="space-y-1 text-sm">
      <li
        v-for="instance in unresolved"
        :key="instance.instance_id"
        class="text-muted-foreground"
      >
        No remediation: no fixed version exists for {{ instance.package }}
        {{ instance.installed_version }}
      </li>
    </ul>
  </div>
</template>
