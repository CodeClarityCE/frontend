<script setup lang="ts">
import { Info, TriangleAlert } from "@lucide/vue";
import { computed, ref } from "vue";

import type { VulnerabilityDetails } from "@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { formatDate } from "@/utils/dateUtils";

const MAX_VERSIONS_LENGTH = 200;

const props = defineProps<{
  finding: VulnerabilityDetails;
}>();

const versionsExpanded = ref(false);
const versionInfo = computed(
  () => props.finding.vulnerability_info.version_info,
);

const affectedVersionsString = computed(
  () => versionInfo.value.affected_versions_string ?? "",
);
const isVersionsTruncated = computed(
  () => affectedVersionsString.value.length > MAX_VERSIONS_LENGTH,
);
const displayedVersions = computed(() =>
  !isVersionsTruncated.value || versionsExpanded.value
    ? affectedVersionsString.value
    : `${affectedVersionsString.value.slice(0, MAX_VERSIONS_LENGTH)}...`,
);

const comparison = computed(() => versionInfo.value.source_comparison);
const sourcesAgree = computed(
  () => !comparison.value || comparison.value.agree,
);

// What each source says about the installed version, when they disagree.
const sourceViews = computed(() => {
  const c = comparison.value;
  if (!c) return [];
  return [
    { name: "NVD", reason: c.nvdReason, versions: c.nvdAllVersions },
    { name: "OSV", reason: c.osvReason, versions: c.osvAllVersions },
    { name: "GCVE", reason: c.gcveReason, versions: c.gcveAllVersions },
  ].filter((view) => view.reason);
});

const imprecise = computed(() => {
  const value = affectedVersionsString.value.toLowerCase().trim();
  return value === "*" || value === "all versions";
});

const versions = computed(() => versionInfo.value.versions ?? []);
const notAffected = computed(() =>
  versions.value.filter((v) => v.status === "not_affected"),
);
const affected = computed(() =>
  versions.value.filter((v) => v.status === "affected"),
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="sourcesAgree" class="flex flex-col items-start gap-2">
      <p>
        <span class="font-semibold text-foreground-strong">
          Affected versions of {{ finding.dependency_info?.name }}:
        </span>
        {{ displayedVersions }}
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <Button
          v-if="isVersionsTruncated"
          variant="link"
          size="sm"
          class="h-auto px-0"
          :aria-expanded="versionsExpanded"
          @click="versionsExpanded = !versionsExpanded"
        >
          {{ versionsExpanded ? "Show fewer versions" : "Show all versions" }}
        </Button>
        <span
          v-if="versionInfo.affected_versions_source"
          class="rounded-control bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          Source: {{ versionInfo.affected_versions_source }}
        </span>
      </div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <p
        class="flex items-center gap-2 rounded-control bg-warning-subtle p-3 font-semibold text-warning"
      >
        <TriangleAlert aria-hidden="true" class="size-4 shrink-0" />
        Vulnerability sources disagree on your version
      </p>
      <ul class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="view in sourceViews"
          :key="view.name"
          class="flex flex-col gap-2 rounded-card border p-4"
        >
          <h3 class="font-semibold text-foreground-strong">
            {{ view.name }} says
          </h3>
          <p class="text-sm">{{ view.reason }}</p>
          <details class="text-sm">
            <summary
              class="cursor-pointer rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              All affected versions from {{ view.name }}
            </summary>
            <p
              class="mt-2 whitespace-pre-line rounded-control bg-muted p-2 font-mono text-xs"
            >
              {{ view.versions?.replace(/, /g, ",\n") ?? "" }}
            </p>
          </details>
        </li>
      </ul>
      <p class="flex items-start gap-2 rounded-control bg-muted p-3 text-sm">
        <Info aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
        <span>
          Since sources disagree on your version
          <strong>{{ finding.dependency_info?.version }}</strong
          >, review the explanations above and check the official advisory links
          to determine your actual risk.
        </span>
      </p>
    </div>

    <p
      v-if="imprecise"
      class="flex items-start gap-2 rounded-control bg-warning-subtle p-3 text-sm text-warning"
    >
      <TriangleAlert aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
      The affected version information is imprecise ("all versions"). This may
      be a false positive. Check the official advisory links for accurate
      version ranges.
    </p>

    <Dialog v-if="versions.length > 0">
      <DialogTrigger as-child>
        <Button variant="outline" size="sm" class="self-start">
          Compare versions
        </Button>
      </DialogTrigger>
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Dependency versions</DialogTitle>
          <DialogDescription>
            Which versions are known to be affected by the vulnerability and
            which are not.
          </DialogDescription>
        </DialogHeader>
        <div class="grid max-h-[50vh] gap-6 overflow-y-auto sm:grid-cols-2">
          <section>
            <h3 class="mb-2 font-semibold text-success">Not affected</h3>
            <ul class="flex flex-col gap-1 text-sm">
              <li
                v-for="v in notAffected"
                :key="v.version"
                class="flex justify-between gap-4"
              >
                <span>{{ v.version }}</span>
                <span class="text-muted-foreground">{{
                  formatDate(v.release, "LL")
                }}</span>
              </li>
            </ul>
          </section>
          <section>
            <h3 class="mb-2 font-semibold text-danger">Affected</h3>
            <ul class="flex flex-col gap-1 text-sm">
              <li
                v-for="v in affected"
                :key="v.version"
                class="flex justify-between gap-4"
                :class="
                  v.version === finding.dependency_info?.version
                    ? 'font-bold text-foreground-strong'
                    : ''
                "
              >
                <span>
                  {{ v.version }}
                  <span
                    v-if="v.version === finding.dependency_info?.version"
                    class="font-normal"
                    >(installed)</span
                  >
                </span>
                <span class="text-muted-foreground">{{
                  formatDate(v.release, "LL")
                }}</span>
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
