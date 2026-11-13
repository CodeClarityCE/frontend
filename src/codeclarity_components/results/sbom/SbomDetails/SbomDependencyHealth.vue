<script lang="ts" setup>
import { computed } from "vue";

import { StatusBadge, type StatusTone } from "@/base_components/page";
import { type DependencyDetails } from "@/codeclarity_components/results/sbom/SbomDetails/SbomDetails";
import { calculateDateDifference } from "@/utils/dateUtils";

// The health of one dependency: vulnerabilities, license and version lag.
const props = defineProps<{ dependency: DependencyDetails }>();

const daysBehind = computed(() => {
  const { release_date, lastest_release_date } = props.dependency;
  if (!release_date || !lastest_release_date) return 0;
  return calculateDateDifference(lastest_release_date, release_date, "days");
});

interface HealthIssue {
  title: string;
  tone: StatusTone;
  label: string;
  text: string;
}

const issues = computed((): HealthIssue[] => {
  const list: HealthIssue[] = [];
  const vulns = props.dependency.vulnerabilities?.length ?? 0;
  if (vulns > 0)
    list.push({
      title: "Security vulnerabilities",
      tone: "danger",
      label: `${vulns} found`,
      text: `${vulns} known ${vulns === 1 ? "vulnerability affects" : "vulnerabilities affect"} this version.`,
    });
  if (!props.dependency.license)
    list.push({
      title: "Unlicensed",
      tone: "danger",
      label: "License risk",
      text: "Without a license, its authors keep every right to its use, copies and changes.",
    });
  if (daysBehind.value > 182)
    list.push({
      title: "Outdated",
      tone: "warning",
      label: `${daysBehind.value} days behind`,
      text: `This release is ${daysBehind.value} days older than the latest. Consider upgrading ${props.dependency.name}.`,
    });
  return list;
});
</script>

<template>
  <section
    aria-labelledby="dependency-health-heading"
    class="flex flex-col gap-3"
  >
    <div class="flex flex-wrap items-center gap-2">
      <h3
        id="dependency-health-heading"
        class="text-sm font-semibold text-foreground-strong"
      >
        Health
      </h3>
      <StatusBadge
        :tone="issues.length === 0 ? 'success' : 'warning'"
        :label="
          issues.length === 0
            ? 'Healthy'
            : `${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}`
        "
      />
    </div>
    <p v-if="issues.length === 0" class="text-sm text-muted-foreground">
      No known vulnerabilities, license problems or outdated versions.
    </p>
    <ul v-else class="grid gap-3 md:grid-cols-3">
      <li
        v-for="issue in issues"
        :key="issue.title"
        class="flex flex-col gap-2 rounded-control border p-3 text-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-semibold text-foreground-strong">{{
            issue.title
          }}</span>
          <StatusBadge :tone="issue.tone" :label="issue.label" />
        </div>
        <p class="text-muted-foreground">{{ issue.text }}</p>
      </li>
    </ul>
  </section>
</template>
