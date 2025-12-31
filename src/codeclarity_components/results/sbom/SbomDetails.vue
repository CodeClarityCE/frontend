<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { type Ref, ref } from "vue";

import InfoCard from "@/base_components/ui/cards/InfoCard.vue";
import StatCard from "@/base_components/ui/cards/StatCard.vue";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import {
  DependencyDetails,
  type SeverityDist,
} from "@/codeclarity_components/results/sbom/SbomDetails/SbomDetails";
import router from "@/router";
import Badge from "@/shadcn/ui/badge/Badge.vue";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import type { DataResponse } from "@/utils/api/responses/DataResponse";

import SbomDependencyHealth from "./SbomDetails/SbomDependencyHealth.vue";
import SbomDetailsHeader from "./SbomDetails/SbomDetailsHeader.vue";
import SbomDetailsLoader from "./SbomDetails/SbomDetailsLoader.vue";
import SbomImportPaths from "./SbomDetails/SbomImportPaths.vue";
import SbomInformation from "./SbomDetails/SbomInformation.vue";

// Import stores

// Import common components

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
const dependency: Ref<DependencyDetails> = ref(new DependencyDetails());

function goBack(): void {
  router.back();
}

// Helper functions for displaying package information
function isPackageOutdated(
  releaseDate: Date,
  latestReleaseDate: Date,
): boolean {
  if (!releaseDate || !latestReleaseDate) return false;
  const release = new Date(releaseDate);
  const latest = new Date(latestReleaseDate);
  const diffTime = latest.getTime() - release.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays > 182; // Consider outdated if more than 6 months behind
}

function calculateSecurityScore(dependency: DependencyDetails): string {
  const vulnCount = dependency.vulnerabilities?.length || 0;
  const critical = dependency.severity_dist?.critical || 0;
  const high = dependency.severity_dist?.high || 0;

  if (vulnCount === 0) return "A";
  if (critical > 0) return "F";
  if (high > 0) return "D";
  if (vulnCount > 10) return "C";
  return "B";
}

function getSecurityScoreVariant(
  dependency: DependencyDetails,
): "success" | "danger" | "primary" | "default" {
  const score = calculateSecurityScore(dependency);
  if (score === "A") return "success";
  if (score === "F" || score === "D") return "danger";
  if (score === "C") return "primary";
  return "default";
}

function getSecurityScoreDescription(dependency: DependencyDetails): string {
  const score = calculateSecurityScore(dependency);
  const descriptions = {
    A: "Excellent security",
    B: "Good security",
    C: "Fair security",
    D: "Poor security",
    F: "Critical security issues",
  };
  return descriptions[score as keyof typeof descriptions] || "Unknown";
}

function getVulnerabilityDescription(count: number): string {
  if (count === 0) return "No known vulnerabilities";
  if (count === 1) return "Requires attention";
  if (count <= 5) return "Multiple issues found";
  return "High vulnerability count";
}

function getCriticalHighCount(severityDist?: SeverityDist): number {
  if (!severityDist) return 0;
  return (severityDist.critical ?? 0) + (severityDist.high ?? 0);
}

function getVersionStatus(dependency: DependencyDetails): string {
  if (!authStore.getAuthenticated || !dependency.version) return "Unknown";
  if (dependency.version === dependency.latest_version) return "Latest";
  // Check if version already starts with 'v' to avoid duplication
  return dependency.version.startsWith("v")
    ? dependency.version
    : `v${dependency.version}`;
}

function getVersionStatusVariant(
  dependency: DependencyDetails,
): "success" | "primary" | "default" {
  if (!authStore.getAuthenticated || !dependency.version) return "default";
  if (dependency.version === dependency.latest_version) return "success";
  if (
    isPackageOutdated(dependency.release_date, dependency.lastest_release_date)
  )
    return "primary";
  return "default";
}

function getVersionStatusDescription(dependency: DependencyDetails): string {
  if (!authStore.getAuthenticated || !dependency.version)
    return "Version information unavailable";
  if (dependency.version === dependency.latest_version)
    return "Using latest version";
  // Check if version already starts with 'v' to avoid duplication
  const latestVersion = dependency.latest_version.startsWith("v")
    ? dependency.latest_version
    : `v${dependency.latest_version}`;
  return `Latest: ${latestVersion}`;
}

function getLicenseDescription(license?: string): string {
  if (!license) return "License information missing";
  const commonLicenses = [
    "MIT",
    "Apache-2.0",
    "GPL-3.0",
    "BSD-3-Clause",
    "ISC",
  ];
  if (commonLicenses.includes(license)) return "Common open source license";
  return "Custom or uncommon license";
}

function shouldRecommendUpdate(dependency: DependencyDetails): boolean {
  if (!authStore.getAuthenticated || !dependency.version) return false;
  return dependency.version !== dependency.latest_version;
}

const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

async function getDependency(
  projectID: string,
  analysisID: string,
): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const package_id_param = urlParams.get("package_id");

  if (package_id_param === null) return;

  let res: DataResponse<DependencyDetails>;
  try {
    if (userStore.getDefaultOrg == null) {
      throw new Error("No default org");
    }

    if (authStore.getToken == null) {
      throw new Error("No token");
    }

    res = await resultsRepository.getDependency({
      orgId: userStore.getDefaultOrg.id,
      projectId: projectID,
      analysisId: analysisID,
      dependency: package_id_param,
      bearerToken: authStore.getToken,
      workspace: ".",
      runIndex: props.runIndex,
      handleBusinessErrors: true,
    });
    dependency.value = res.data;

    render.value = true;
  } catch (_err) {
    console.error(_err);

    // error.value = true;
    // if (_err instanceof BusinessLogicError) {
    //     errorCode.value = _err.error_code;
    // }
  } finally {
    // loading.value = false;
    // createDepTypeChart();
    // createDepStatusDistChart();
  }
}

void getDependency(props.projectID, props.analysisID);
</script>

<template>
  <div class="sbom-details-container">
    <!--------------------------------------------------------------------------->
    <!--                               Navigation                              -->
    <!--------------------------------------------------------------------------->
    <div v-if="showBack" class="navigation-section">
      <Badge
        variant="secondary"
        title="Go back to preview page"
        class="back-button"
        @click="goBack()"
      >
        <Icon
          :icon="'material-symbols:keyboard-backspace'"
          class="mr-2 text-theme-primary"
        ></Icon>
        Go back
      </Badge>
    </div>

    <!--------------------------------------------------------------------------->
    <!--                                 Content                               -->
    <!--------------------------------------------------------------------------->
    <div v-if="render" class="content-wrapper">
      <!-- Header Section with Package Info -->
      <InfoCard
        :title="dependency.name ?? 'Dependency Details'"
        :description="`Version ${dependency.version ?? 'unknown'} - Package information and external links`"
        icon="solar:box-bold"
        variant="primary"
        class="header-section"
      >
        <SbomDetailsHeader :dependency="dependency"></SbomDetailsHeader>
      </InfoCard>

      <!-- Security Overview Stats -->
      <div class="security-stats-grid">
        <StatCard
          label="Security Score"
          :value="calculateSecurityScore(dependency)"
          icon="solar:shield-check-bold"
          :variant="getSecurityScoreVariant(dependency)"
          :subtitle="getSecurityScoreDescription(dependency)"
          subtitle-icon="solar:info-circle-linear"
        />

        <StatCard
          label="Total Vulnerabilities"
          :value="dependency.vulnerabilities?.length || 0"
          icon="solar:bug-bold"
          :variant="
            (dependency.vulnerabilities?.length || 0) > 0 ? 'danger' : 'success'
          "
          :subtitle="
            getVulnerabilityDescription(dependency.vulnerabilities?.length || 0)
          "
          subtitle-icon="solar:shield-warning-linear"
        />

        <StatCard
          label="Critical & High"
          :value="getCriticalHighCount(dependency.severity_dist)"
          icon="solar:danger-triangle-bold"
          :variant="
            getCriticalHighCount(dependency.severity_dist) > 0
              ? 'danger'
              : 'success'
          "
          :subtitle="`${dependency.severity_dist?.medium || 0} medium, ${dependency.severity_dist?.low || 0} low`"
          subtitle-icon="solar:shield-check-linear"
        />

        <StatCard
          label="Version Status"
          :value="getVersionStatus(dependency)"
          icon="solar:refresh-bold"
          :variant="getVersionStatusVariant(dependency)"
          :subtitle="getVersionStatusDescription(dependency)"
          subtitle-icon="solar:calendar-linear"
        />

        <StatCard
          label="License"
          :value="dependency.license ?? 'Unlicensed'"
          icon="solar:document-text-bold"
          :variant="dependency.license ? 'success' : 'danger'"
          :subtitle="getLicenseDescription(dependency.license)"
          subtitle-icon="solar:check-circle-linear"
        />

        <StatCard
          label="Package Manager"
          :value="dependency.package_manager ?? 'Unknown'"
          icon="solar:box-bold"
          variant="default"
          :subtitle="
            dependency.transitive
              ? 'Transitive dependency'
              : 'Direct dependency'
          "
          :subtitle-icon="
            dependency.transitive
              ? 'solar:hierarchy-2-linear'
              : 'solar:download-linear'
          "
        />
      </div>

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
            <!-- Package Information Section -->
            <div class="overview-section">
              <SbomInformation :dependency="dependency"></SbomInformation>
            </div>

            <!-- Integrated Health & Security Section -->
            <div class="overview-section health-section">
              <div class="health-section-header">
                <Icon
                  icon="solar:shield-check-bold"
                  class="health-header-icon"
                />
                <h3 class="health-section-title">
                  Security & Compliance Status
                </h3>
              </div>
              <SbomDependencyHealth
                :dependency="dependency"
              ></SbomDependencyHealth>
            </div>
          </div>
        </InfoCard>

        <!-- Import Paths Card -->
        <InfoCard
          title="Import Paths & Usage"
          description="How this dependency is imported and used in your project"
          icon="solar:route-bold"
          variant="default"
          class="import-paths-card-side"
        >
          <SbomImportPaths
            :dependency="dependency"
            :analysis-i-d="analysisID"
            :project-i-d="projectID"
          ></SbomImportPaths>
        </InfoCard>
      </div>

      <!-- Vulnerability Details Section (if vulnerabilities exist) -->
      <div
        v-if="
          dependency.vulnerabilities && dependency.vulnerabilities.length > 0
        "
        class="vulnerability-section"
      >
        <InfoCard
          title="Security Analysis"
          :description="`${dependency.vulnerabilities.length} known vulnerabilities affecting this package`"
          icon="solar:bug-bold"
          variant="danger"
          class="vulnerability-card"
        >
          <div class="vulnerability-content">
            <!-- Severity Distribution -->
            <div class="severity-breakdown">
              <h3 class="breakdown-title">Severity Distribution</h3>
              <div class="severity-grid">
                <div class="severity-item critical">
                  <Icon
                    icon="solar:danger-triangle-bold"
                    class="severity-icon"
                  />
                  <span class="severity-count">{{
                    dependency.severity_dist?.critical || 0
                  }}</span>
                  <span class="severity-label">Critical</span>
                </div>
                <div class="severity-item high">
                  <Icon
                    icon="solar:shield-warning-bold"
                    class="severity-icon"
                  />
                  <span class="severity-count">{{
                    dependency.severity_dist?.high || 0
                  }}</span>
                  <span class="severity-label">High</span>
                </div>
                <div class="severity-item medium">
                  <Icon icon="solar:shield-check-bold" class="severity-icon" />
                  <span class="severity-count">{{
                    dependency.severity_dist?.medium || 0
                  }}</span>
                  <span class="severity-label">Medium</span>
                </div>
                <div class="severity-item low">
                  <Icon icon="solar:shield-bold" class="severity-icon" />
                  <span class="severity-count">{{
                    dependency.severity_dist?.low || 0
                  }}</span>
                  <span class="severity-label">Low</span>
                </div>
              </div>
            </div>

            <!-- Security Recommendations -->
            <div class="security-recommendations">
              <h3 class="breakdown-title">Recommendations</h3>
              <div class="recommendation-list">
                <div
                  v-if="shouldRecommendUpdate(dependency)"
                  class="recommendation-item update"
                >
                  <Icon icon="solar:refresh-bold" class="recommendation-icon" />
                  <div class="recommendation-content">
                    <span class="recommendation-title"
                      >Update to Latest Version</span
                    >
                    <span class="recommendation-desc"
                      >Upgrade from
                      {{
                        dependency.version.startsWith("v")
                          ? dependency.version
                          : `v${dependency.version}`
                      }}
                      to
                      {{
                        dependency.latest_version.startsWith("v")
                          ? dependency.latest_version
                          : `v${dependency.latest_version}`
                      }}
                      to potentially resolve security issues</span
                    >
                  </div>
                </div>
                <div
                  v-if="getCriticalHighCount(dependency.severity_dist) > 0"
                  class="recommendation-item critical"
                >
                  <Icon
                    icon="solar:danger-triangle-bold"
                    class="recommendation-icon"
                  />
                  <div class="recommendation-content">
                    <span class="recommendation-title"
                      >Immediate Attention Required</span
                    >
                    <span class="recommendation-desc"
                      >{{
                        getCriticalHighCount(dependency.severity_dist)
                      }}
                      critical/high severity vulnerabilities need immediate
                      remediation</span
                    >
                  </div>
                </div>
                <div
                  v-if="dependency.transitive"
                  class="recommendation-item transitive"
                >
                  <Icon
                    icon="solar:hierarchy-2-linear"
                    class="recommendation-icon"
                  />
                  <div class="recommendation-content">
                    <span class="recommendation-title"
                      >Transitive Dependency</span
                    >
                    <span class="recommendation-desc"
                      >This is an indirect dependency. Consider updating the
                      parent package or adding an override</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Vulnerability List -->
            <div class="vulnerability-list">
              <h3 class="breakdown-title">Vulnerability Identifiers</h3>
              <div class="vulnerability-items">
                <Badge
                  v-for="vuln in dependency.vulnerabilities.slice(0, 12)"
                  :key="vuln"
                  variant="destructive"
                  class="vulnerability-badge"
                  :title="`Click to view details for ${vuln}`"
                >
                  {{ vuln }}
                </Badge>
                <Badge
                  v-if="dependency.vulnerabilities.length > 12"
                  variant="secondary"
                  class="more-vulnerabilities"
                  :title="`${dependency.vulnerabilities.length - 12} more vulnerabilities`"
                >
                  +{{ dependency.vulnerabilities.length - 12 }} more
                </Badge>
              </div>
            </div>
          </div>
        </InfoCard>
      </div>
    </div>

    <!--------------------------------------------------------------------------->
    <!--                            Loading skeleton                           -->
    <!--------------------------------------------------------------------------->
    <div v-else class="loading-wrapper">
      <SbomDetailsLoader></SbomDetailsLoader>
    </div>
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

// Use InfoCard styling from the common components - enhanced for better space usage
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
  // Spans more width since it contains more content
  @media (min-width: 1024px) {
    // Make the overview card wider than the import paths card
    grid-column: 1 / 2;
    min-width: 0; // Allow flexbox to work properly
  }
}

.import-paths-card-side {
  @media (min-width: 1024px) {
    grid-column: 2 / 3;
    min-width: 0; // Allow flexbox to work properly
  }
}

// Overview content styling
.comprehensive-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: 100%;
}

.overview-section {
  flex: 1;

  &.health-section {
    background: linear-gradient(
      135deg,
      rgba(29, 206, 121, 0.03) 0%,
      rgba(29, 206, 121, 0.01) 100%
    );
    border: 1px solid rgba(29, 206, 121, 0.15);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
    transition: all 0.2s ease-in-out;

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(29, 206, 121, 0.05) 0%,
        rgba(29, 206, 121, 0.02) 100%
      );
      border-color: rgba(29, 206, 121, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(29, 206, 121, 0.1);
    }
  }
}

.health-section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(29, 206, 121, 0.2);
  box-shadow: 0 2px 4px rgba(29, 206, 121, 0.05);
}

.health-header-icon {
  font-size: 1.5rem;
  color: var(--color-theme-primary);
  background: rgba(29, 206, 121, 0.1);
  padding: 0.5rem;
  border-radius: 8px;
}

.health-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-theme-black);
  margin: 0;
  flex: 1;
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

/* Enhanced theming for better visual hierarchy and space usage */
:deep(.card) {
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease-in-out;
  background: white;

  &:hover {
    border-color: rgba(29, 206, 121, 0.4);
    box-shadow: 0 8px 25px rgba(29, 206, 121, 0.15);
  }
}

/* Maximize content area within cards */
:deep(.card-content) {
  padding: 2rem;
  height: 100%;
}

:deep(.card-header) {
  padding: 1.5rem 2rem 0.5rem 2rem;
}

/* Ensure all icons use consistent colors */
:deep(.icon) {
  color: var(--color-theme-primary);
}

/* Style any buttons to match theme */
:deep(.btn-outline) {
  border-color: var(--color-theme-primary);
  color: var(--color-theme-primary);

  &:hover {
    background-color: var(--color-theme-primary);
    color: white;
  }
}

/* Progress bars and indicators */
:deep(.progress-bar) {
  background-color: rgba(29, 206, 121, 0.2);

  .progress-fill {
    background-color: var(--color-theme-primary);
  }
}

/* Ensure consistent text hierarchy */
:deep(.text-primary) {
  color: var(--color-theme-primary) !important;
}

:deep(.text-secondary) {
  color: var(--color-theme-gray) !important;
}

/* Loading states */
:deep(.skeleton) {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    rgba(29, 206, 121, 0.1) 37%,
    #f0f0f0 63%
  );
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.security-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.vulnerability-section {
  margin-bottom: 2rem;
}

.vulnerability-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.security-recommendations {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.breakdown-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-theme-black);
  margin-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.severity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.severity-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: #f9fafb;
  border: 2px solid transparent;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.critical {
    border-color: #dc2626;
    background: #fef2f2;

    .severity-icon {
      color: #dc2626;
    }

    .severity-count {
      color: #dc2626;
    }
  }

  &.high {
    border-color: #ea580c;
    background: #fff7ed;

    .severity-icon {
      color: #ea580c;
    }

    .severity-count {
      color: #ea580c;
    }
  }

  &.medium {
    border-color: #d97706;
    background: #fffbeb;

    .severity-icon {
      color: #d97706;
    }

    .severity-count {
      color: #d97706;
    }
  }

  &.low {
    border-color: var(--color-theme-primary);
    background: rgba(29, 206, 121, 0.05);

    .severity-icon {
      color: var(--color-theme-primary);
    }

    .severity-count {
      color: var(--color-theme-primary);
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
  margin-bottom: 0.25rem;
}

.severity-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-theme-gray);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.update {
    background: rgba(29, 206, 121, 0.05);
    border-color: rgba(29, 206, 121, 0.2);

    .recommendation-icon {
      color: var(--color-theme-primary);
    }
  }

  &.critical {
    background: #fef2f2;
    border-color: rgba(220, 38, 38, 0.2);

    .recommendation-icon {
      color: #dc2626;
    }
  }

  &.transitive {
    background: #f0f9ff;
    border-color: rgba(59, 130, 246, 0.2);

    .recommendation-icon {
      color: #3b82f6;
    }
  }
}

.recommendation-icon {
  font-size: 1.25rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.recommendation-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.recommendation-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-theme-black);
}

.recommendation-desc {
  font-size: 0.875rem;
  color: var(--color-theme-gray);
  line-height: 1.4;
}

.vulnerability-list {
  margin-top: 0.5rem;
}

.vulnerability-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.vulnerability-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  background: #dc2626;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: #b91c1c;
    transform: translateY(-1px);
  }
}

.more-vulnerabilities {
  font-weight: 500;
  color: var(--color-theme-gray);
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  cursor: pointer;

  &:hover {
    background: #e5e7eb;
  }
}

/* Enhanced responsive design for maximum space usage */
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

/* Theme-specific styling to ensure consistency with dashboard */
:deep(.border-l-theme-primary) {
  border-left-color: var(--color-theme-primary);
}

:deep(.text-theme-primary) {
  color: var(--color-theme-primary);
}

:deep(.text-theme-black) {
  color: var(--color-theme-black);
}

:deep(.text-theme-gray) {
  color: var(--color-theme-gray);
}

/* Ensure links use theme colors */
:deep(a) {
  color: var(--color-theme-primary);
  transition: color 0.2s ease-in-out;

  &:hover {
    color: var(--color-theme-primary-dark);
  }
}

/* Button accent colors */
:deep(.btn-primary) {
  background-color: var(--color-theme-primary);
  border-color: var(--color-theme-primary);

  &:hover {
    background-color: var(--color-theme-primary-dark);
    border-color: var(--color-theme-primary-dark);
  }
}

/* Badge accent colors */
:deep(.badge-primary) {
  background-color: var(--color-theme-primary);
  color: white;
}

:deep(.badge-secondary) {
  background-color: var(--color-theme-black);
  color: white;
}
</style>
