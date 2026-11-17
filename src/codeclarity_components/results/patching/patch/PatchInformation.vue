<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";
import { computed } from "vue";

import { SeverityBadge, StatusBadge } from "@/base_components/page";
import type {
  PatchInfo,
  ToPatch,
} from "@/codeclarity_components/results/patching/Patching";

import { semverText } from "../patch-format";

// One vulnerable dependency: its path, severity and fixed version.
// An introduced one comes with the upgrade, so it has no fixed version to show.
const props = defineProps<{
  patch: ToPatch;
  patchInfo: PatchInfo;
  introduced?: boolean;
}>();

// A zero score with no type or vector means the plugin found no severity data.
const hasSeverity = computed(() => {
  const severity = props.patch.Vulnerability.Severity as
    | { Severity?: number; SeverityType?: string; Vector?: string }
    | null
    | undefined;
  return (
    (severity?.Severity ?? 0) > 0 ||
    Boolean(severity?.SeverityType) ||
    Boolean(severity?.Vector)
  );
});

const fixedIn = computed(() =>
  semverText(
    props.patchInfo.Patches?.[
      `${props.patch.DependencyName}@${props.patch.DependencyVersion}`
    ],
  ),
);
</script>

<template>
  <li class="flex flex-col gap-2 rounded-control border p-3 text-sm">
    <div class="flex flex-wrap items-center gap-2">
      <code class="font-mono font-semibold text-foreground-strong">{{
        patch.Vulnerability.VulnerabilityId
      }}</code>
      <SeverityBadge
        v-if="hasSeverity"
        :score="patch.Vulnerability.Severity?.Severity"
      />
      <StatusBadge v-else tone="neutral" label="Unknown severity" />
      <span class="text-muted-foreground">
        in {{ patch.DependencyName }}@{{ patch.DependencyVersion }}
      </span>
    </div>
    <ol
      v-if="patch.Path?.length"
      aria-label="Dependency path"
      class="flex flex-wrap items-center gap-1 text-muted-foreground"
    >
      <li
        v-for="(element, index) in patch.Path"
        :key="`${index}-${element}`"
        class="flex items-center gap-1"
      >
        <ChevronRight v-if="index > 0" aria-hidden="true" class="size-3.5" />
        <span>{{ element }}</span>
      </li>
    </ol>
    <p v-if="!introduced">
      <template v-if="fixedIn">
        Fixed in <code class="font-mono">{{ fixedIn }}</code>
      </template>
      <span v-else class="text-muted-foreground">No fixed version</span>
    </p>
  </li>
</template>
