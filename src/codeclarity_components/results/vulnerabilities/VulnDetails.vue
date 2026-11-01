<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { type Ref, ref } from "vue";

import BubbleComponent from "@/base_components/data-display/bubbles/BubbleComponent.vue";
import InfoCard from "@/base_components/ui/cards/InfoCard.vue";
import StatCard from "@/base_components/ui/cards/StatCard.vue";
import PositionedModal from "@/base_components/ui/modals/PositionedModal.vue";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { VulnerabilityDetails } from "@/codeclarity_components/results/vulnerabilities/VulnDetails";
import router from "@/router.ts";
import Badge from "@/shadcn/ui/badge/Badge.vue";
import Button from "@/shadcn/ui/button/Button.vue";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import type { DataResponse } from "@/utils/api/responses/DataResponse";
import { cvssV2_fields_map, cvssV3_fields_map } from "@/utils/cvss";
import { formatDate } from "@/utils/dateUtils";

import AddToPolicyButton from "./components/AddToPolicyButton.vue";
import VulnDetailsHeader from "./VulnDetails/VulnDetailsHeader.vue";
import VulnDetailsLoader from "./VulnDetails/VulnDetailsLoader.vue";
import VulnerabilitySeverities from "./VulnDetails/VulnerabilitySeverities.vue";
import VulnReferences from "./VulnDetails/VulnReferences.vue";
import VulnSummaryContent from "./VulnDetails/VulnSummaryContent.vue";

interface Props {
  showBack?: boolean;
  analysisID: string;
  projectID: string;
  runIndex?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  showBack: false,
  runIndex: null,
});

const render: Ref<boolean> = ref(false);
const finding: Ref<VulnerabilityDetails> = ref(new VulnerabilityDetails());
const references_limit: Ref<number> = ref(8);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const versions_modal_ref: Ref<typeof PositionedModal> = ref(PositionedModal);
const chart_version: Ref<string> = ref("");

function toggleReferences(): void {
  if (references_limit.value !== finding.value.references.length)
    references_limit.value = finding.value.references.length;
  else references_limit.value = 8;
}

function goBack(): void {
  router.back();
}

const resultsRepository: ResultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

async function getFinding(
  projectID: string,
  analysisID: string,
): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const finding_id_param = urlParams.get("finding_id");
  const finding_id = finding_id_param ?? props.analysisID;
  if (finding_id === "") {
    return;
  }
  let res: DataResponse<VulnerabilityDetails>;
  try {
    if (userStore.getDefaultOrg == null) {
      throw new Error("No default org");
    }
    if (authStore.getToken == null) {
      throw new Error("No token");
    }
    res = await resultsRepository.getFinding({
      orgId: userStore.getDefaultOrg.id,
      projectId: projectID,
      analysisId: analysisID,
      vulnerability_id: finding_id,
      bearerToken: authStore.getToken,
      runIndex: props.runIndex,
      handleBusinessErrors: true,
      workspace: ".",
    });
    finding.value = res.data;
    if (finding.value?.severities?.cvss_31 !== null) {
      chart_version.value = "cvss31";
    } else if (finding.value?.severities?.cvss_3 !== null) {
      chart_version.value = "cvss3";
    } else if (finding.value?.severities?.cvss_2 !== null) {
      chart_version.value = "cvss2";
    }
    render.value = true;
  } catch (_err) {
    console.error(_err);
  }
}
void getFinding(props.projectID, props.analysisID);

// --- Stat Card Logic ---
function getBaseScore(
  finding: VulnerabilityDetails,
): number | null | undefined {
  if (
    finding.severities.cvss_31?.base_score !== null &&
    finding.severities.cvss_31?.base_score !== undefined
  ) {
    return finding.severities.cvss_31.base_score;
  } else if (
    finding.severities.cvss_3?.base_score !== null &&
    finding.severities.cvss_3?.base_score !== undefined
  ) {
    return finding.severities.cvss_3.base_score;
  } else if (
    finding.severities.cvss_2?.base_score !== null &&
    finding.severities.cvss_2?.base_score !== undefined
  ) {
    return finding.severities.cvss_2.base_score;
  }
  return null;
}

function getSeverityLevel(
  finding: VulnerabilityDetails,
): "critical" | "high" | "medium" | "low" | "none" {
  const score = getBaseScore(finding);
  if (score == null) return "none";
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "medium";
  if (score > 0.0) return "low";
  return "none";
}

function calculateSecurityScore(finding: VulnerabilityDetails): string {
  const level = getSeverityLevel(finding);
  if (level === "none" || level === "low") return "A";
  if (level === "medium") return "B";
  if (level === "high") return "D";
  if (level === "critical") return "F";
  return "B";
}
function getSecurityScoreVariant(
  finding: VulnerabilityDetails,
): "success" | "danger" | "primary" | "default" {
  const score = calculateSecurityScore(finding);
  if (score === "A") return "success";
  if (score === "F" || score === "D") return "danger";
  if (score === "C") return "primary";
  return "default";
}
function getSecurityScoreDescription(finding: VulnerabilityDetails): string {
  const score = calculateSecurityScore(finding);
  const descriptions = {
    A: "Excellent security",
    B: "Good security",
    C: "Fair security",
    D: "Poor security",
    F: "Critical security issues",
  };
  return descriptions[score as keyof typeof descriptions] || "Unknown";
}
function getCvssScoreDisplay(finding: VulnerabilityDetails): string {
  const score = getBaseScore(finding);
  if (score == null) return "N/A";
  return String(score);
}
function getCvssScoreVariant(
  finding: VulnerabilityDetails,
): "success" | "danger" | "primary" | "default" {
  const level = getSeverityLevel(finding);
  if (level === "critical" || level === "high") return "danger";
  if (level === "medium") return "primary";
  if (level === "low") return "success";
  return "default";
}
function getCvssScoreSubtitle(finding: VulnerabilityDetails): string {
  const level = getSeverityLevel(finding);
  return `${level.charAt(0).toUpperCase()}${level.slice(1)} severity`;
}
function getVersionStatus(finding: VulnerabilityDetails): string {
  if (!finding.dependency_info?.version) return "Unknown";
  return finding.dependency_info.version.startsWith("v")
    ? finding.dependency_info.version
    : `v${finding.dependency_info.version}`;
}
function getVersionStatusDescription(finding: VulnerabilityDetails): string {
  if (!finding.dependency_info?.version)
    return "Version information unavailable";
  const version = finding.dependency_info.version.startsWith("v")
    ? finding.dependency_info.version
    : `v${finding.dependency_info.version}`;
  return `Version: ${version}`;
}
</script>

<template>
  <div class="sbom-details-container">
    <!-- Navigation -->
    <div v-if="showBack" class="navigation-section">
      <div class="flex items-center justify-between">
        <Badge
          variant="secondary"
          title="Go back to preview page"
          class="back-button"
          @click="goBack()"
        >
          <Icon
            :icon="'material-symbols:keyboard-backspace'"
            class="mr-2 text-theme-primary"
          />
          Go back
        </Badge>
        <AddToPolicyButton
          v-if="finding?.vulnerability_info?.vulnerability_id"
          :vulnerability-id="finding.vulnerability_info.vulnerability_id"
          size="default"
          variant="outline"
        />
      </div>
    </div>
    <!-- Add to Policy button for when no back button is shown -->
    <div
      v-if="
        !showBack && render && finding?.vulnerability_info?.vulnerability_id
      "
      class="mb-6 flex justify-end"
    >
      <AddToPolicyButton
        :vulnerability-id="finding.vulnerability_info.vulnerability_id"
        size="default"
        variant="outline"
      />
    </div>

    <!-- Content -->
    <div v-if="render && finding" class="content-wrapper">
      <!-- Header Section with Package Info -->
      <InfoCard
        :title="
          finding?.vulnerability_info?.vulnerability_id ||
          'Vulnerability Details'
        "
        :description="`Version ${finding?.dependency_info?.version || 'unknown'} - Package information and external links`"
        icon="solar:bug-bold"
        variant="primary"
        class="header-section"
      >
        <VulnDetailsHeader
          :finding="finding"
          :versions-modal-ref="versions_modal_ref"
        />
      </InfoCard>

      <!-- Security Overview Stats (3 cards) -->
      <div class="security-stats-grid">
        <StatCard
          label="Security Score"
          :value="calculateSecurityScore(finding)"
          icon="solar:shield-check-bold"
          :variant="getSecurityScoreVariant(finding)"
          :subtitle="getSecurityScoreDescription(finding)"
          subtitle-icon="solar:info-circle-linear"
        />
        <StatCard
          label="CVSS Score"
          :value="getCvssScoreDisplay(finding)"
          icon="solar:danger-triangle-bold"
          :variant="getCvssScoreVariant(finding)"
          :subtitle="getCvssScoreSubtitle(finding)"
          subtitle-icon="solar:shield-warning-linear"
        />
        <StatCard
          label="Version"
          :value="getVersionStatus(finding)"
          icon="solar:refresh-bold"
          variant="default"
          :subtitle="getVersionStatusDescription(finding)"
          subtitle-icon="solar:calendar-linear"
        />
      </div>

      <!-- Main Content Grid: Vuln Info (left) + Severities (right) -->
      <div class="main-content-grid">
        <!-- Left: Vulnerability & Weakness Information -->
        <InfoCard
          title="Vulnerability Details"
          description="Technical details and weakness information"
          icon="solar:info-circle-bold"
          variant="default"
          class="vuln-info-card"
        >
          <VulnSummaryContent :finding="finding" />
        </InfoCard>

        <!-- Right: CVSS Severities with Tabs -->
        <InfoCard
          title="CVSS Analysis"
          description="Severity scores and metrics"
          icon="solar:chart-bold"
          variant="default"
          class="severities-card"
        >
          <VulnerabilitySeverities
            :finding="finding"
            :cvss-v3-fields-map="cvssV3_fields_map"
            :cvss-v2-fields-map="cvssV2_fields_map"
            :chart-version="chart_version"
          />
        </InfoCard>
      </div>

      <!-- Dependency Section -->
      <InfoCard
        v-if="finding.dependency_info"
        title="Dependency"
        description="Package details and links"
        icon="solar:box-bold"
        variant="default"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-end gap-1">
            <div class="text-xl font-bold">
              {{ finding.dependency_info.name }}@{{
                finding.dependency_info.version
              }}
            </div>
            <div class="text-[#6c6b6b]">
              (published on
              {{ formatDate(finding.vulnerability_info.published, "LL") }})
            </div>
          </div>
          <div v-if="finding.dependency_info.description">
            {{ finding.dependency_info.description }}
          </div>
          <div
            v-if="
              finding.other.package_manager === 'NPM' ||
              finding.other.package_manager === 'YARN'
            "
            class="flex gap-6"
          >
            <div>
              <a
                :href="`https://www.npmjs.com/package/${finding.dependency_info.name}`"
                title="opens the npm package page (in a new tab)"
                target="_blank"
              >
                <Icon :icon="'iconoir:npm'" class="text-5xl"></Icon>
              </a>
            </div>
            <div>
              <a
                :href="`https://www.yarnpkg.com/package/${finding.dependency_info.name}`"
                title="opens the yarn package page (in a new tab)"
                target="_blank"
              >
                <Icon :icon="'devicon:yarn-wordmark'" class="text-5xl"></Icon>
              </a>
            </div>
            <div v-if="finding.dependency_info.github_link">
              <a
                :href="'https://' + finding.dependency_info.github_link"
                title="opens the github repo of the dependency (in a new tab)"
                target="_blank"
              >
                <Icon :icon="'devicon:github-wordmark'" class="text-5xl"></Icon>
              </a>
            </div>
            <div v-if="finding.dependency_info.issues_link">
              <a
                :href="'https://' + finding.dependency_info.issues_link"
                title="opens the github issues of the dependency (in a new tab)"
                target="_blank"
                class="flex gap-1"
              >
                <Icon :icon="'devicon:github-wordmark'" class="text-5xl"></Icon>
                Issues
              </a>
            </div>
            <div v-if="finding.dependency_info.homepage">
              <a
                :href="finding.dependency_info.homepage"
                title="opens the website of the dependency (in a new tab)"
                target="_blank"
                class="flex gap-1"
              >
                <Icon :icon="'ph:link'" class="text-5xl"></Icon> Website
              </a>
            </div>
          </div>
          <div
            v-if="
              finding.dependency_info.keywords &&
              finding.dependency_info.keywords.length > 0
            "
            class="flex gap-2 items-center"
          >
            <div>Tags</div>
            <div class="flex flex-wrap gap-1">
              <div
                v-for="keyword in finding.dependency_info.keywords"
                :key="keyword"
              >
                <div
                  v-if="
                    finding.other.package_manager === 'NPM' ||
                    finding.other.package_manager === 'YARN'
                  "
                >
                  <BubbleComponent :slim="true">
                    <template #content>
                      <a
                        title="opens npm with applied keyword search (in a new tab)"
                        :href="
                          'https://www.npmjs.com/search?q=keywords:' + keyword
                        "
                        target="_blank"
                        >#{{ keyword }}</a
                      >
                    </template>
                  </BubbleComponent>
                </div>
                <BubbleComponent v-else :slim="true">
                  <template #content>#{{ keyword }}</template>
                </BubbleComponent>
              </div>
            </div>
          </div>
        </div>
      </InfoCard>

      <!-- References Section -->
      <InfoCard
        title="References"
        description="External links and documentation for this vulnerability"
        icon="solar:link-bold"
        variant="default"
        class="references-section"
      >
        <VulnReferences
          :references="finding.references"
          :references-limit="references_limit"
          :on-toggle="toggleReferences"
        />
      </InfoCard>
    </div>

    <!-- Loading skeleton -->
    <div v-else class="loading-wrapper">
      <VulnDetailsLoader />
    </div>

    <!-- All versions modal -->
    <PositionedModal
      ref="versions_modal_ref"
      :tracker="'show-all-versions'"
      :position="'top'"
    >
      <template #title>
        <div
          style="
            display: flex;
            flex-direction: row;
            column-gap: 1em;
            justify-content: space-between;
          "
        >
          <div>Dependency Versions</div>
          <Icon
            :icon="'ic:round-close'"
            style="cursor: pointer"
            title="Close modal"
            @click="versions_modal_ref['toggle']()"
            >Close</Icon
          >
        </div>
      </template>
      <template #subtitle>
        The following list highlights which versions are known to be affected
        and which are known to not be affected by the vulnerability.
      </template>
      <template #content>
        <div style="max-width: 1000px; max-height: 40vh; overflow-y: auto">
          <div
            style="
              display: flex;
              flex-direction: row;
              column-gap: 40px;
              font-weight: 400;
              color: #737171;
            "
          >
            <div style="width: 50%">
              <div
                style="
                  color: #457905;
                  font-weight: 400;
                  margin-bottom: 10px;
                  font-size: 1em;
                  display: flex;
                  align-items: center;
                  flex-direction: row;
                  column-gap: 6px;
                "
              >
                <div>Not Affected</div>
                <Icon :icon="'bi:shield-check'" />
              </div>
              <div
                v-for="version_obj in finding.vulnerability_info.version_info
                  .versions"
                :key="version_obj.version"
                :class="{
                  affected: version_obj.status === 'affected',
                  not_affected: version_obj.status === 'not_affected',
                }"
              >
                <div v-if="version_obj.status === 'not_affected'">
                  <div
                    style="
                      display: flex;
                      flex-direction: row;
                      justify-content: space-between;
                      column-gap: 40px;
                    "
                  >
                    <div>{{ version_obj.version }}</div>
                    <div>{{ formatDate(version_obj.release, "LL") }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div style="width: 50%">
              <div
                style="
                  color: #8c0c0c;
                  font-weight: 400;
                  margin-bottom: 10px;
                  font-size: 1em;
                  display: flex;
                  align-items: center;
                  flex-direction: row;
                  column-gap: 6px;
                "
              >
                <div>Affected</div>
                <Icon :icon="'bi:shield-exclamation'" />
              </div>
              <div
                v-for="version_obj in finding.vulnerability_info.version_info
                  .versions"
                :key="version_obj.version"
                :class="{
                  affected: version_obj.status === 'affected',
                  not_affected: version_obj.status === 'not_affected',
                }"
              >
                <div v-if="version_obj.status === 'affected'">
                  <div
                    style="
                      display: flex;
                      flex-direction: row;
                      justify-content: space-between;
                      column-gap: 40px;
                    "
                    :style="{
                      'font-weight':
                        version_obj.version == finding.dependency_info?.version
                          ? 'black'
                          : '400',
                      color:
                        version_obj.version == finding.dependency_info?.version
                          ? '#8c0c0c'
                          : '#737171',
                    }"
                  >
                    <div>{{ version_obj.version }}</div>
                    <div>{{ formatDate(version_obj.release, "LL") }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #buttons>
        <Button variant="outline" @click="versions_modal_ref['toggle']()">
          Close
        </Button>
      </template>
    </PositionedModal>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/common/details.scss";
@use "@/assets/common/cvss.scss";
.sbom-details-container {
  width: 100%;
  max-width: 100vw;
  margin: 0;
  padding: 2rem;
  background: white;
  min-height: 100vh;
}
.navigation-section {
  margin-bottom: 2rem;
  .back-button {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    background: white;
    border: 2px solid #e5e7eb;
    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.05);
    font-weight: 500;
    &:hover {
      background: var(--color-theme-primary);
      border-color: var(--color-theme-primary);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px 0 rgb(29 206 121 / 0.2);
    }
  }
}
.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}
.header-section {
  margin-bottom: 0;
}
.security-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
.main-content-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 2rem;
  width: 100%;
  align-items: start;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
.vuln-info-card,
.severities-card {
  min-width: 0;
}
.references-section {
  margin-top: 0;
}
.loading-wrapper {
  background: white;
  border-radius: 12px;
  padding: 4rem;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  text-align: center;
  margin: 2rem 0;
}
@media (max-width: 768px) {
  .sbom-details-container {
    padding: 1rem;
  }
  .navigation-section {
    margin-bottom: 1.5rem;
  }
  .content-wrapper {
    gap: 1.5rem;
  }
}
@media (min-width: 1400px) {
  .sbom-details-container {
    padding: 3rem 4rem;
  }
  .main-content-grid {
    gap: 3rem;
  }
  .content-wrapper {
    gap: 3rem;
  }
}
</style>
