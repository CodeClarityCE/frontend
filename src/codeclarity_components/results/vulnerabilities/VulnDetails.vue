<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ArrowLeft, ExternalLink, Globe } from "@lucide/vue";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import { PageHeading, SeverityBadge, StatTile } from "@/base_components/page";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { type VulnerabilityDetails } from "@/codeclarity_components/results/vulnerabilities/VulnDetails";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader } from "@/shadcn/ui/card";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { cvssV2_fields_map, cvssV3_fields_map } from "@/utils/cvss";
import { formatDate } from "@/utils/dateUtils";
import { SEVERITY_LABELS, severityLevel } from "@/utils/severity";

import AddToPolicyButton from "./components/AddToPolicyButton.vue";
import VulnDetailsHeader from "./VulnDetails/VulnDetailsHeader.vue";
import VulnDetailsLoader from "./VulnDetails/VulnDetailsLoader.vue";
import VulnerabilitySeverities from "./VulnDetails/VulnerabilitySeverities.vue";
import VulnReferences from "./VulnDetails/VulnReferences.vue";
import VulnSummaryContent from "./VulnDetails/VulnSummaryContent.vue";

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
const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

const finding = ref<VulnerabilityDetails | null>(null);
const failed = ref(false);

async function getFinding(): Promise<void> {
  const findingID =
    new URLSearchParams(window.location.search).get("finding_id") ??
    props.analysisID;
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (findingID === "" || !org || !token) return;
  try {
    const res = await resultsRepository.getFinding({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      vulnerability_id: findingID,
      bearerToken: token,
      runIndex: props.runIndex,
      handleBusinessErrors: true,
      workspace: ".",
    });
    finding.value = res.data;
  } catch {
    failed.value = true;
  }
}
void getFinding();

// The newest CVSS version the finding has a score for.
const baseScore = computed(() => {
  const s = finding.value?.severities;
  return (
    s?.cvss_31?.base_score ?? s?.cvss_3?.base_score ?? s?.cvss_2?.base_score
  );
});
const level = computed(() => severityLevel(baseScore.value));

const SECURITY_SCORE = {
  none: ["A", "No known severity"],
  low: ["A", "Low risk"],
  medium: ["B", "Moderate risk"],
  high: ["D", "High risk"],
  critical: ["F", "Critical risk"],
} as const;

const version = computed(() => {
  const v = finding.value?.dependency_info?.version;
  if (!v) return "Unknown";
  return v.startsWith("v") ? v : `v${v}`;
});

const isNpm = computed(
  () =>
    finding.value?.other?.package_manager === "NPM" ||
    finding.value?.other?.package_manager === "YARN",
);

const linkClass =
  "inline-flex items-center gap-2 rounded-sm font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
</script>

<template>
  <div class="flex flex-col gap-8">
    <div v-if="showBack" class="flex items-center justify-between gap-4">
      <Button variant="ghost" size="sm" @click="router.back()">
        <ArrowLeft aria-hidden="true" class="size-4" />
        Back to results
      </Button>
    </div>

    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load this vulnerability</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <template v-else-if="finding">
      <PageHeading>
        {{ finding.vulnerability_info.vulnerability_id }}
        <template #badge>
          <SeverityBadge :score="baseScore" />
        </template>
        <template #description>
          <span v-if="finding.weaknesses.length > 0"
            >{{ finding.weaknesses[0]?.name }} in
          </span>
          <span class="font-semibold text-foreground-strong"
            >{{ finding.dependency_info?.name }}@{{
              finding.dependency_info?.version
            }}</span
          >
        </template>
        <template #actions>
          <AddToPolicyButton
            :vulnerability-id="finding.vulnerability_info.vulnerability_id"
            size="default"
            variant="outline"
          />
        </template>
      </PageHeading>

      <ul aria-label="Vulnerability numbers" class="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="CVSS score"
          :value="baseScore ?? 'N/A'"
          :hint="`${SEVERITY_LABELS[level]} severity`"
        />
        <StatTile
          label="Security score"
          :value="SECURITY_SCORE[level][0]"
          :hint="SECURITY_SCORE[level][1]"
        />
        <StatTile
          label="Version"
          :value="version"
          :hint="
            finding.vulnerability_info.published
              ? `Published ${formatDate(finding.vulnerability_info.published, 'LL')}`
              : undefined
          "
        />
      </ul>

      <Card>
        <CardHeader>
          <h2 class="text-lg font-semibold leading-none tracking-tight">
            Affected versions
          </h2>
        </CardHeader>
        <CardContent>
          <VulnDetailsHeader :finding="finding" />
        </CardContent>
      </Card>

      <div class="grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 class="text-lg font-semibold leading-none tracking-tight">
              Vulnerability information
            </h2>
          </CardHeader>
          <CardContent>
            <VulnSummaryContent :finding="finding" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 class="text-lg font-semibold leading-none tracking-tight">
              CVSS
            </h2>
          </CardHeader>
          <CardContent>
            <VulnerabilitySeverities
              :finding="finding"
              :cvss-v3-fields-map="cvssV3_fields_map"
              :cvss-v2-fields-map="cvssV2_fields_map"
            />
          </CardContent>
        </Card>
      </div>

      <Card v-if="finding.dependency_info">
        <CardHeader>
          <h2 class="text-lg font-semibold leading-none tracking-tight">
            Dependency
          </h2>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <p>
            <span class="text-lg font-semibold text-foreground-strong"
              >{{ finding.dependency_info.name }}@{{
                finding.dependency_info.version
              }}</span
            >
            <span
              v-if="finding.dependency_info.published"
              class="text-muted-foreground"
            >
              (published
              {{ formatDate(finding.dependency_info.published, "LL") }})
            </span>
          </p>
          <p v-if="finding.dependency_info.description">
            {{ finding.dependency_info.description }}
          </p>
          <ul class="flex flex-wrap gap-6">
            <template v-if="isNpm">
              <li>
                <a
                  :href="`https://www.npmjs.com/package/${finding.dependency_info.name}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="linkClass"
                >
                  <Icon
                    icon="simple-icons:npm"
                    aria-hidden="true"
                    class="size-5"
                  />
                  npm
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a
                  :href="`https://www.yarnpkg.com/package/${finding.dependency_info.name}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="linkClass"
                >
                  <Icon
                    icon="simple-icons:yarn"
                    aria-hidden="true"
                    class="size-5"
                  />
                  Yarn
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            </template>
            <li v-if="finding.dependency_info.github_link">
              <a
                :href="`https://${finding.dependency_info.github_link}`"
                target="_blank"
                rel="noopener noreferrer"
                :class="linkClass"
              >
                <Icon
                  icon="simple-icons:github"
                  aria-hidden="true"
                  class="size-5"
                />
                Repository
                <span class="sr-only">(opens in a new tab)</span>
              </a>
            </li>
            <li v-if="finding.dependency_info.issues_link">
              <a
                :href="`https://${finding.dependency_info.issues_link}`"
                target="_blank"
                rel="noopener noreferrer"
                :class="linkClass"
              >
                <Icon
                  icon="simple-icons:github"
                  aria-hidden="true"
                  class="size-5"
                />
                Issues
                <span class="sr-only">(opens in a new tab)</span>
              </a>
            </li>
            <li v-if="finding.dependency_info.homepage">
              <a
                :href="finding.dependency_info.homepage"
                target="_blank"
                rel="noopener noreferrer"
                :class="linkClass"
              >
                <Globe aria-hidden="true" class="size-5" />
                Website
                <span class="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          </ul>
          <div
            v-if="finding.dependency_info.keywords?.length"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="text-sm text-muted-foreground">Tags</span>
            <ul class="flex flex-wrap gap-1.5">
              <li
                v-for="keyword in finding.dependency_info.keywords"
                :key="keyword"
              >
                <a
                  v-if="isNpm"
                  :href="`https://www.npmjs.com/search?q=keywords:${keyword}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  #{{ keyword }}
                  <ExternalLink aria-hidden="true" class="size-3" />
                  <span class="sr-only">(search npm, opens in a new tab)</span>
                </a>
                <Badge v-else variant="outline">#{{ keyword }}</Badge>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 class="text-lg font-semibold leading-none tracking-tight">
            References
          </h2>
        </CardHeader>
        <CardContent>
          <VulnReferences :references="finding.references ?? []" />
        </CardContent>
      </Card>
    </template>

    <VulnDetailsLoader v-else />
  </div>
</template>
