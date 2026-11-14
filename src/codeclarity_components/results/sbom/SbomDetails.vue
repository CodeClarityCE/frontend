<script lang="ts" setup>
import { ArrowLeft } from "@lucide/vue";
import { computed, type Ref, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { PageHeading, SeverityBadge, StatTile } from "@/base_components/page";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { DependencyDetails } from "@/codeclarity_components/results/sbom/SbomDetails/SbomDetails";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader } from "@/shadcn/ui/card";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import type { SeverityLevel } from "@/utils/severity";

import { detailsRoute } from "../vulnerabilities/vuln-format";

import SbomDependencyGraph from "./SbomDetails/SbomDependencyGraph.vue";
import SbomDependencyHealth from "./SbomDetails/SbomDependencyHealth.vue";
import SbomDetailsHeader from "./SbomDetails/SbomDetailsHeader.vue";
import SbomDetailsLoader from "./SbomDetails/SbomDetailsLoader.vue";
import SbomInformation from "./SbomDetails/SbomInformation.vue";

const props = withDefaults(
  defineProps<{
    showBack?: boolean;
    analysisID: string;
    projectID: string;
    runIndex?: number | null;
  }>(),
  { showBack: false, runIndex: null },
);

const router = useRouter();
const route = useRoute();
const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

const loading = ref(true);
const failed = ref(false);
const dependency: Ref<DependencyDetails> = ref(new DependencyDetails());

async function getDependency(): Promise<void> {
  const packageId = route.query.package_id ?? null;
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  try {
    if (typeof packageId !== "string" || !org || !token)
      throw new Error("Missing dependency, organisation or token");
    const res = await resultsRepository.getDependency({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      dependency: packageId,
      bearerToken: token,
      workspace: ".",
      runIndex: props.runIndex,
      handleBusinessErrors: true,
    });
    dependency.value = res.data;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

void getDependency();

const vulnerabilities = computed(() => dependency.value.vulnerabilities ?? []);
const criticalOrHigh = computed(
  () =>
    (dependency.value.severity_dist?.critical ?? 0) +
    (dependency.value.severity_dist?.high ?? 0),
);

// A letter grade from the known vulnerabilities of this one package.
const securityScore = computed((): [string, string] => {
  const count = vulnerabilities.value.length;
  if (count === 0) return ["A", "No known vulnerabilities"];
  if ((dependency.value.severity_dist?.critical ?? 0) > 0)
    return ["F", "Critical vulnerabilities"];
  if ((dependency.value.severity_dist?.high ?? 0) > 0)
    return ["D", "High vulnerabilities"];
  if (count > 10) return ["C", "Many vulnerabilities"];
  return ["B", "Few, lower severity vulnerabilities"];
});

function withV(version: string | undefined): string {
  if (!version) return "unknown";
  return version.startsWith("v") ? version : `v${version}`;
}

const isLatest = computed(
  () => dependency.value.version === dependency.value.latest_version,
);

const SEVERITIES: SeverityLevel[] = ["critical", "high", "medium", "low"];
const severityCounts = computed(() =>
  SEVERITIES.map((level) => ({
    level,
    count: dependency.value.severity_dist?.[level] ?? 0,
  })),
);

const recommendations = computed(() => {
  const list: { title: string; text: string }[] = [];
  if (!isLatest.value && dependency.value.latest_version)
    list.push({
      title: "Update to the latest version",
      text: `Upgrade from ${withV(dependency.value.version)} to ${withV(dependency.value.latest_version)}; it may fix some of these vulnerabilities.`,
    });
  if (criticalOrHigh.value > 0)
    list.push({
      title: "Fix critical and high first",
      text: `${criticalOrHigh.value} critical or high vulnerabilities need attention now.`,
    });
  if (dependency.value.transitive)
    list.push({
      title: "Transitive dependency",
      text: "Another package pulls this one in. Update that parent package or add an override.",
    });
  return list;
});

const LINK =
  "rounded-sm font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
</script>

<template>
  <div class="flex flex-col gap-8">
    <div v-if="showBack">
      <Button variant="ghost" size="sm" @click="router.back()">
        <ArrowLeft aria-hidden="true" class="size-4" />
        Back to results
      </Button>
    </div>

    <SbomDetailsLoader v-if="loading" />

    <Alert v-else-if="failed" variant="destructive">
      <AlertTitle>Could not load this dependency</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <template v-else>
      <PageHeading>
        {{ dependency.name }}
        <template #badge>
          <code
            class="rounded-control bg-muted px-2 py-0.5 font-mono text-sm text-foreground"
            >{{ dependency.version }}</code
          >
        </template>
      </PageHeading>
      <SbomDetailsHeader :dependency="dependency" class="-mt-4" />

      <ul
        aria-label="Dependency numbers"
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StatTile
          label="Security score"
          :value="securityScore[0]"
          :hint="securityScore[1]"
        />
        <StatTile
          label="Vulnerabilities"
          :value="vulnerabilities.length"
          :hint="
            criticalOrHigh > 0
              ? `${criticalOrHigh} critical or high`
              : undefined
          "
        />
        <StatTile
          label="Version"
          :value="isLatest ? 'Latest' : withV(dependency.version)"
          :hint="
            isLatest
              ? 'Using the latest version'
              : `Latest: ${withV(dependency.latest_version)}`
          "
        />
        <StatTile label="License" :value="dependency.license || 'Unlicensed'" />
        <StatTile
          label="Added as"
          :value="dependency.transitive ? 'Transitive' : 'Direct'"
        />
      </ul>

      <SbomInformation :dependency="dependency" />

      <Card>
        <CardHeader>
          <h2 class="text-lg font-semibold leading-none tracking-tight">
            Dependency graph
          </h2>
        </CardHeader>
        <CardContent>
          <SbomDependencyGraph
            :dependency="dependency"
            :analysis-i-d="analysisID"
            :project-i-d="projectID"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 class="text-lg font-semibold leading-none tracking-tight">
            Security
          </h2>
        </CardHeader>
        <CardContent class="flex flex-col gap-6">
          <SbomDependencyHealth :dependency="dependency" />

          <template v-if="vulnerabilities.length > 0">
            <section class="flex flex-col gap-2">
              <h3 class="text-sm font-semibold text-foreground-strong">
                Vulnerabilities by severity
              </h3>
              <ul class="flex flex-wrap gap-4 text-sm">
                <li
                  v-for="entry in severityCounts"
                  :key="entry.level"
                  class="flex items-center gap-2"
                >
                  <SeverityBadge :level="entry.level" />
                  <span class="font-semibold tabular-nums">{{
                    entry.count
                  }}</span>
                </li>
              </ul>
            </section>

            <section
              v-if="recommendations.length > 0"
              class="flex flex-col gap-2"
            >
              <h3 class="text-sm font-semibold text-foreground-strong">
                Recommendations
              </h3>
              <ul class="flex flex-col gap-2 text-sm">
                <li v-for="item in recommendations" :key="item.title">
                  <span class="font-semibold text-foreground-strong"
                    >{{ item.title }}.</span
                  >
                  {{ item.text }}
                </li>
              </ul>
            </section>

            <section class="flex flex-col gap-2">
              <h3 class="text-sm font-semibold text-foreground-strong">
                Vulnerabilities
              </h3>
              <ul class="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <li v-for="id in vulnerabilities" :key="id">
                  <RouterLink
                    :class="LINK"
                    :to="detailsRoute(analysisID, projectID, id)"
                    >{{ id }}</RouterLink
                  >
                </li>
              </ul>
            </section>
          </template>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
