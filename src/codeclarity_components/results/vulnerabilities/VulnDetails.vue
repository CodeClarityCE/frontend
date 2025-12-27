<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ref, type Ref } from "vue";
import InfoCard from "@/base_components/ui/cards/InfoCard.vue";
import StatCard from "@/base_components/ui/cards/StatCard.vue";
import InfoMarkdown from "@/base_components/ui/InfoMarkdown.vue";
import CenteredModal from "@/base_components/ui/modals/CenteredModal.vue";
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
import VulnSecurityAnalysis from "./VulnDetails/VulnSecurityAnalysis.vue";
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
const cvss_field: Ref<string> = ref("");
const cvss_field_value: Ref<string> = ref("");
const cvss_field_version: Ref<string> = ref("");
interface CvssInfoField {
  full_name: string;
  text: { description: string; value_descriptions: Record<string, string> };
  values: string[];
  class: Record<string, string>;
}
type CvssInfo = Record<string, CvssInfoField>;

const cvss_info: Ref<CvssInfo> = ref({});
const cvss_field_info_modal_ref = ref<{
  show: () => void;
  toggle: () => void;
} | null>(null);
const active_view: Ref<string> = ref("patches");
const readme: Ref<string> = ref("");
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const read_me_modal_ref: Ref<typeof CenteredModal> = ref(CenteredModal);
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

interface CvssModalData {
  cvss_field: string;
  cvss_field_value: string;
  cvss_field_version: string;
  cvss_info: CvssInfo | object;
}

function openModal(data: CvssModalData): void {
  cvss_field.value = data.cvss_field;
  cvss_field_value.value = data.cvss_field_value;
  cvss_field_version.value = data.cvss_field_version;
  cvss_info.value = data.cvss_info as CvssInfo;
  const modal = cvss_field_info_modal_ref.value as { show?: () => void } | null;
  if (modal?.show) {
    modal.show();
  }
}

async function getFinding(
  projectID: string,
  analysisID: string,
): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const finding_id_param = urlParams.get("finding_id");
  let finding_id = "";
  if (finding_id_param) {
    finding_id = finding_id_param;
  } else {
    finding_id = props.analysisID;
  }
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
function getVulnerabilityDescription(): string {
  return "This is a single vulnerability.";
}
function getCriticalHighCount(finding: VulnerabilityDetails): number {
  const level = getSeverityLevel(finding);
  return level === "critical" || level === "high" ? 1 : 0;
}
function getMediumLowCount(finding: VulnerabilityDetails): string {
  const level = getSeverityLevel(finding);
  if (level === "medium") return "1 medium, 0 low";
  if (level === "low") return "0 medium, 1 low";
  return "0 medium, 0 low";
}
function getVersionStatus(finding: VulnerabilityDetails): string {
  if (!finding.dependency_info?.version) return "Unknown";
  // Check if version already starts with 'v' to avoid duplication
  return finding.dependency_info.version.startsWith("v")
    ? finding.dependency_info.version
    : `v${finding.dependency_info.version}`;
}
function getVersionStatusVariant(): "success" | "primary" | "default" {
  return "default";
}
function getVersionStatusDescription(finding: VulnerabilityDetails): string {
  if (!finding.dependency_info?.version)
    return "Version information unavailable";
  // Check if version already starts with 'v' to avoid duplication
  const version = finding.dependency_info.version.startsWith("v")
    ? finding.dependency_info.version
    : `v${finding.dependency_info.version}`;
  return `Version: ${version}`;
}
function getPackageManager(finding: VulnerabilityDetails): string {
  // fallback to other.package_manager if not present in dependency_info
  return finding.other?.package_manager || "Unknown";
}
function getPackageManagerSubtitle(): string {
  return "Direct dependency";
}
function getPackageManagerSubtitleIcon(): string {
  return "solar:download-linear";
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
      <!-- Security Overview Stats -->
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
          label="Total Vulnerabilities"
          :value="1"
          icon="solar:bug-bold"
          :variant="1 > 0 ? 'danger' : 'success'"
          :subtitle="getVulnerabilityDescription()"
          subtitle-icon="solar:shield-warning-linear"
        />
        <StatCard
          label="Critical & High"
          :value="getCriticalHighCount(finding)"
          icon="solar:danger-triangle-bold"
          :variant="getCriticalHighCount(finding) > 0 ? 'danger' : 'success'"
          :subtitle="`${getMediumLowCount(finding).split(',')[0]}`"
          subtitle-icon="solar:shield-check-linear"
        />
        <StatCard
          label="Version Status"
          :value="getVersionStatus(finding)"
          icon="solar:refresh-bold"
          :variant="getVersionStatusVariant()"
          :subtitle="getVersionStatusDescription(finding)"
          subtitle-icon="solar:calendar-linear"
        />
        <StatCard
          label="License"
          :value="'Unknown'"
          icon="solar:document-text-bold"
          :variant="'danger'"
          :subtitle="'License information missing'"
          subtitle-icon="solar:check-circle-linear"
        />
        <StatCard
          label="Package Manager"
          :value="getPackageManager(finding)"
          icon="solar:box-bold"
          variant="default"
          :subtitle="getPackageManagerSubtitle()"
          :subtitle-icon="getPackageManagerSubtitleIcon()"
        />
      </div>
      <!-- Security Analysis Section (moved to top for clarity) -->
      <InfoCard
        title="Security Analysis"
        description="Severity breakdown, recommendations, and identifier for this vulnerability"
        icon="solar:bug-bold"
        variant="danger"
        class="vulnerability-card"
      >
        <VulnSecurityAnalysis
          :finding="finding"
          :get-severity-level="getSeverityLevel"
          :get-critical-high-count="getCriticalHighCount"
          :get-medium-low-count="getMediumLowCount"
        />
      </InfoCard>
      <!-- Main Content Grid -->
      <div class="main-content-grid">
        <!-- Comprehensive Package Overview Card -->
        <InfoCard
          title="Package Overview"
          description="Complete technical details, metadata, and security analysis"
          icon="solar:info-circle-bold"
          variant="default"
          class="comprehensive-overview-card"
        >
          <div class="comprehensive-content">
            <div class="overview-section">
              <VulnSummaryContent
                :finding="finding"
                :read-me-modal-ref="read_me_modal_ref"
                :readme="readme"
                :active-view="active_view"
              />
              <VulnerabilitySeverities
                :finding="finding"
                :cvss-v3-fields-map="cvssV3_fields_map"
                :cvss-v2-fields-map="cvssV2_fields_map"
                :chart-version="chart_version"
                :cvss-field-info-modal-ref="cvss_field_info_modal_ref"
                @open-modal="openModal"
              />
            </div>
          </div>
        </InfoCard>
        <!-- Import Paths Card (Placeholder for now) -->
        <InfoCard
          title="Import Paths & Usage"
          description="How this dependency is imported and used in your project"
          icon="solar:route-bold"
          variant="default"
          class="import-paths-card-side"
        >
          <div
            style="
              min-height: 300px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #888;
            "
          >
            <span>Dependency tree and import paths coming soon.</span>
          </div>
        </InfoCard>
      </div>
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
    <!-- Readme Modal -->
    <CenteredModal ref="read_me_modal_ref">
      <template #title>
        <div
          style="
            display: flex;
            flex-direction: row;
            align-items: center;
            column-gap: 7px;
            justify-content: space-between;
          "
        >
          <div
            style="
              display: flex;
              flex-direction: row;
              column-gap: 8px;
              align-items: center;
            "
          >
            <Icon :icon="'tabler:markdown'" />
            <div>Readme</div>
          </div>
        </div>
      </template>
      <template #content>
        <div style="max-width: 1000px; max-height: 80vh; overflow-y: auto">
          <InfoMarkdown class="w-full" :markdown="readme" />
        </div>
      </template>
      <template #buttons>
        <Button @click="read_me_modal_ref['toggle']()"> Close </Button>
      </template>
    </CenteredModal>
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
    <!-- CVSS Details Modal -->
    <CenteredModal ref="cvss_field_info_modal_ref">
      <template #title>
        <span>CVSS{{ cvss_field_version }} - </span>
        {{ cvss_info[cvss_field]?.full_name }}
      </template>
      <template #subtitle> What does this mean for you? </template>
      <template #content>
        <div style="max-width: 40vw">
          <div style="margin-bottom: 20px">
            {{ cvss_info[cvss_field]?.text?.description }}
          </div>
          <div class="cvss-field-value" style="font-weight: 900">
            <div
              v-for="field_value in cvss_info[cvss_field]?.values ?? []"
              :key="field_value"
            >
              <div
                v-if="field_value[0] === cvss_field_value"
                :class="cvss_info[cvss_field]?.class?.[cvss_field_value]"
              >
                {{ field_value }}
              </div>
              <div v-if="field_value[0] !== cvss_field_value">
                {{ field_value }}
              </div>
            </div>
          </div>
          <div style="margin-top: 20px">
            {{
              cvss_info[cvss_field]?.text?.value_descriptions?.[
                cvss_field_value
              ]
            }}
          </div>
        </div>
      </template>
      <template #buttons>
        <Button
          variant="outline"
          @click="cvss_field_info_modal_ref?.toggle?.()"
        >
          Close
        </Button>
      </template>
    </CenteredModal>
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
.main-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  width: 100%;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
.vulnerability-section {
  margin: 2rem 0;
}
.vulnerability-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.breakdown-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-theme-black);
  margin-bottom: 1rem;
}
.severity-breakdown {
  .severity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .severity-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: white;
    transition: all 0.2s ease-in-out;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    &.critical {
      border-left: 4px solid var(--color-severity-critical);
      .severity-icon {
        color: var(--color-severity-critical);
      }
    }
    &.high {
      border-left: 4px solid var(--color-severity-high);
      .severity-icon {
        color: var(--color-severity-high);
      }
    }
    &.medium {
      border-left: 4px solid var(--color-severity-medium);
      .severity-icon {
        color: var(--color-severity-medium);
      }
    }
    &.low {
      border-left: 4px solid var(--color-severity-low);
      .severity-icon {
        color: var(--color-severity-low);
      }
    }
  }
  .severity-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .severity-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-theme-black);
    margin-bottom: 0.25rem;
  }
  .severity-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-theme-gray);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
.vulnerability-list {
  .vulnerability-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .vulnerability-badge {
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease-in-out;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }
  .more-vulnerabilities {
    font-weight: 500;
    color: var(--color-theme-gray);
    background: #f3f4f6;
    border: 1px solid #d1d5db;
  }
}
.comprehensive-overview-card,
.import-paths-card-side {
  transition: all 0.2s ease-in-out;
  min-height: 600px;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(29, 206, 121, 0.15);
  }
}
.comprehensive-overview-card {
  @media (min-width: 1024px) {
    grid-column: 1 / 2;
    min-width: 0;
  }
}
.import-paths-card-side {
  @media (min-width: 1024px) {
    grid-column: 2 / 3;
    min-width: 0;
  }
}
.comprehensive-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: 100%;
}
.overview-section {
  flex: 1;
}
.references-section {
  margin-top: 2rem;
}
.references-inner-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.reference {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.15s ease-in-out;
  &:hover {
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
}
.reference-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.reference-header-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.reference-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}
.references-show-more-wrapper {
  text-align: center;
  margin-top: 1rem;
}
.button {
  cursor: pointer;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: background 0.15s ease-in-out;
  &:hover {
    background: #f3f4f6;
  }
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
  .main-content-grid {
    gap: 1.5rem;
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
