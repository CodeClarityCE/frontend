<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { computed, type Ref, ref } from "vue";

import InfoCard from "@/base_components/ui/cards/InfoCard.vue";
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

import SbomDependencyGraph from "./SbomDetails/SbomDependencyGraph.vue";
import SbomDependencyHealth from "./SbomDetails/SbomDependencyHealth.vue";
import SbomDetailsHeader from "./SbomDetails/SbomDetailsHeader.vue";
import SbomDetailsLoader from "./SbomDetails/SbomDetailsLoader.vue";
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

const hasVulnerabilities = computed(() => {
  return (
    dependency.value.vulnerabilities &&
    dependency.value.vulnerabilities.length > 0
  );
});

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
        <div class="stat-item" :class="getSecurityScoreVariant(dependency)">
          <Icon icon="solar:shield-check-bold" class="stat-icon" />
          <span class="stat-label">Score</span>
          <span class="stat-value">{{
            calculateSecurityScore(dependency)
          }}</span>
          <span class="stat-subtitle">{{
            getSecurityScoreDescription(dependency)
          }}</span>
        </div>

        <div class="stat-divider" />

        <div
          class="stat-item"
          :class="
            (dependency.vulnerabilities?.length || 0) > 0 ? 'danger' : 'success'
          "
        >
          <Icon icon="solar:bug-bold" class="stat-icon" />
          <span class="stat-label">Vulnerabilities</span>
          <span class="stat-value">{{
            dependency.vulnerabilities?.length || 0
          }}</span>
          <span
            v-if="getCriticalHighCount(dependency.severity_dist) > 0"
            class="stat-subtitle danger"
            >{{
              getCriticalHighCount(dependency.severity_dist)
            }}
            critical/high</span
          >
        </div>

        <div class="stat-divider" />

        <div class="stat-item" :class="getVersionStatusVariant(dependency)">
          <Icon icon="solar:refresh-bold" class="stat-icon" />
          <span class="stat-label">Version</span>
          <span class="stat-value">{{ getVersionStatus(dependency) }}</span>
          <span class="stat-subtitle">{{
            getVersionStatusDescription(dependency)
          }}</span>
        </div>

        <div class="stat-divider" />

        <div
          class="stat-item"
          :class="dependency.license ? 'success' : 'danger'"
        >
          <Icon icon="solar:document-text-bold" class="stat-icon" />
          <span class="stat-label">License</span>
          <span class="stat-value">{{
            dependency.license ?? "Unlicensed"
          }}</span>
        </div>

        <div class="stat-divider" />

        <div class="stat-item default">
          <Icon icon="solar:box-bold" class="stat-icon" />
          <span class="stat-label">Ecosystem</span>
          <span class="stat-value">{{
            dependency.transitive ? "Transitive" : "Direct"
          }}</span>
        </div>
      </div>

      <!-- Overview -->
      <SbomInformation :dependency="dependency" />

      <!-- Dependency Graph -->
      <div class="section-block">
        <div class="section-label">
          <Icon icon="solar:route-bold" class="section-label-icon" />
          Dependency Graph
        </div>
        <SbomDependencyGraph
          :dependency="dependency"
          :analysis-i-d="analysisID"
          :project-i-d="projectID"
        />
      </div>

      <!-- Security (conditional) -->
      <div v-if="hasVulnerabilities" class="section-block">
        <div class="section-label">
          <Icon icon="solar:bug-bold" class="section-label-icon" />
          Security ({{ dependency.vulnerabilities.length }})
        </div>

        <SbomDependencyHealth
          :dependency="dependency"
          class="security-health-summary"
        />

        <InfoCard
          title="Security Analysis"
          :description="`${dependency.vulnerabilities.length} known vulnerabilities affecting this package`"
          icon="solar:bug-bold"
          variant="danger"
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
      background: #f9fafb;
      border-color: #d1d5db;
    }
  }
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.header-section {
  margin-bottom: 0;
}

/* Compact summary stats bar */
.security-stats-grid {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.75rem 1.25rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  min-width: 0;

  .stat-icon {
    font-size: 1rem;
    flex-shrink: 0;
    color: #6b7280;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .stat-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-theme-black);
    white-space: nowrap;
  }

  .stat-subtitle {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;

    &.danger {
      color: #dc2626;
    }
  }

  &.success .stat-icon {
    color: var(--color-theme-primary);
  }

  &.success .stat-value {
    color: var(--color-theme-primary);
  }

  &.danger .stat-icon {
    color: #dc2626;
  }

  &.danger .stat-value {
    color: #dc2626;
  }

  &.primary .stat-icon {
    color: #f59e0b;
  }

  &.primary .stat-value {
    color: #f59e0b;
  }
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  flex-shrink: 0;
}

/* Section blocks */
.section-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.section-label-icon {
  font-size: 0.875rem;
}

.security-health-summary {
  margin-bottom: 0.5rem;
}

/* Vulnerability / Security tab */
.vulnerability-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

.security-recommendations {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  border: 1px solid transparent;

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
  transition: background 0.15s ease-in-out;

  &:hover {
    background: #b91c1c;
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

.loading-wrapper {
  background: white;
  border-radius: 8px;
  padding: 4rem;
  border: 1px solid #e5e7eb;
  text-align: center;
  margin: 2rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .sbom-details-container {
    padding: 1rem;
  }

  .content-wrapper {
    gap: 1rem;
  }

  .security-stats-grid {
    flex-direction: column;
    align-items: stretch;
  }

  .stat-divider {
    width: 100%;
    height: 1px;
  }

  .stat-item {
    padding: 0.5rem 0;
  }
}

@media (min-width: 1400px) {
  .sbom-details-container {
    padding: 2rem 4rem;
  }
}
</style>
