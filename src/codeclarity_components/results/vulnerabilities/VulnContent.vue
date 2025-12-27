<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { computed, ref, type Ref, watch } from "vue";
import { InfoCard, StatCard } from "@/base_components";
import TextLoader from "@/base_components/ui/loaders/TextLoader.vue";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { AnalysisStats } from "@/codeclarity_components/results/stats.entity";
import { Card, CardContent } from "@/shadcn/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import type { DataResponse } from "@/utils/api/responses/DataResponse";
import {
  GRADE_DISPLAY_RANGES,
  getGradeSubtitle,
  getScoreBorderColor,
  scoreToGrade,
} from "@/utils/gradeUtils";
import SelectWorkspace from "../SelectWorkspace.vue";

export interface Props {
  analysisID?: string;
  projectID?: string;
}
const props = withDefaults(defineProps<Props>(), {
  projectID: "",
  analysisID: "",
});

const emit = defineEmits<{
  "ecosystem-filter-changed": [ecosystem: string | null];
}>();

// Repositories
const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const selected_workspace = defineModel<string>("selected_workspace", {
  default: ".",
});
const selectedEcosystemFilter: Ref<string | null> = ref(null);

watch(
  () => props.projectID,
  () => {
    void getVulnerabilitiesStats();
  },
);
watch(
  () => props.analysisID,
  () => {
    void getVulnerabilitiesStats();
  },
);

const render: Ref<boolean> = ref(false);
// const error = ref(false);
const stats: Ref<AnalysisStats> = ref(new AnalysisStats());

// let boxLoaderDimensions = {
//     width: '100px',
//     height: '40px'
// };

void getVulnerabilitiesStats();

// Event handlers
function handleEcosystemFilterChanged(ecosystemType: string | null): void {
  /** Handles ecosystem filter changes from SelectWorkspace component */
  selectedEcosystemFilter.value = ecosystemType;
  // Emit the change to parent component
  void emit("ecosystem-filter-changed", ecosystemType);
  // Refresh stats with the new filter
  void getVulnerabilitiesStats(true);
}

// Methods
async function getVulnerabilitiesStats(refresh = false): Promise<void> {
  if (!userStore.getDefaultOrg) return;
  if (!(authStore.getAuthenticated && authStore.getToken)) return;

  error.value = false;
  errorCode.value = undefined;
  if (!refresh) loading.value = true;

  if (!authStore.getAuthenticated || !props.analysisID) return;
  if (props.projectID === "" || props.analysisID === "") return;

  let res: DataResponse<AnalysisStats>;
  try {
    res = await resultsRepository.getVulnerabilitiesStat({
      orgId: userStore.getDefaultOrg.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: selected_workspace.value,
      bearerToken: authStore.getToken,
      ecosystem_filter: selectedEcosystemFilter.value ?? undefined,
      handleBusinessErrors: true,
    });
    stats.value = res.data;
    render.value = true;
  } catch (_err) {
    console.error(_err);

    error.value = true;
    render.value = false;
  } finally {
    loading.value = false;
  }
}

watch(selected_workspace, async () => getVulnerabilitiesStats());

// Computed properties for enhanced vulnerability metrics
const securityRiskScore = computed(() => {
  const totalVulns = stats.value.number_of_vulnerabilities ?? 0;
  const criticalVulns = stats.value.number_of_critical ?? 0;
  const highVulns = stats.value.number_of_high ?? 0;

  if (totalVulns === 0) return 100;

  const criticalWeight = 10;
  const highWeight = 5;
  const weightedIssues =
    criticalVulns * criticalWeight + highVulns * highWeight;
  const maxPossibleWeight = totalVulns * criticalWeight;

  const riskPercentage =
    (weightedIssues / Math.max(maxPossibleWeight, 1)) * 100;
  return Math.max(0, Math.round(100 - riskPercentage));
});

// Security grade mapping using shared utility
const securityGrade = computed(() => scoreToGrade(securityRiskScore.value));
const securityGradeSubtitle = computed(() =>
  getGradeSubtitle(securityGrade.value, "security"),
);
const securityScoreBorderColor = computed(() =>
  getScoreBorderColor(securityRiskScore.value),
);

const criticalAndHighCount = computed(() => {
  return (
    (stats.value.number_of_critical ?? 0) + (stats.value.number_of_high ?? 0)
  );
});

const severityDistribution = computed(() => {
  const total = stats.value.number_of_vulnerabilities ?? 1;
  return {
    critical: Math.round(((stats.value.number_of_critical ?? 0) / total) * 100),
    high: Math.round(((stats.value.number_of_high ?? 0) / total) * 100),
    medium: Math.round(((stats.value.number_of_medium ?? 0) / total) * 100),
    low: Math.round(((stats.value.number_of_low ?? 0) / total) * 100),
  };
});

const topOwaspCategories = computed(() => {
  const categories = [
    {
      name: "A01: Broken Access Control",
      count: stats.value.number_of_owasp_top_10_2021_a1 ?? 0,
    },
    {
      name: "A02: Cryptographic Failures",
      count: stats.value.number_of_owasp_top_10_2021_a2 ?? 0,
    },
    {
      name: "A03: Injection",
      count: stats.value.number_of_owasp_top_10_2021_a3 ?? 0,
    },
    {
      name: "A04: Insecure Design",
      count: stats.value.number_of_owasp_top_10_2021_a4 ?? 0,
    },
    {
      name: "A05: Security Misconfiguration",
      count: stats.value.number_of_owasp_top_10_2021_a5 ?? 0,
    },
  ];
  return categories
    .filter((cat) => cat.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
});
</script>

<template>
  <div class="space-y-4">
    <!-- Workspace Selection -->
    <SelectWorkspace
      v-model:error="error"
      v-model:selected_workspace="selected_workspace"
      :project-i-d="projectID"
      :analysis-i-d="analysisID"
      @ecosystem-filter-changed="handleEcosystemFilterChanged"
    />

    <!-- Key Statistics Grid -->
    <div
      class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 vuln-stats-grid"
    >
      <!-- Total Vulnerabilities -->
      <StatCard
        label="Total Vulnerabilities"
        :value="stats.number_of_vulnerabilities ?? 0"
        icon="solar:bug-bold"
        variant="default"
        :subtitle="
          stats.number_of_vulnerabilities_diff !== undefined
            ? `${stats.number_of_vulnerabilities_diff > 0 ? '+' : ''}${stats.number_of_vulnerabilities_diff} from last scan`
            : 'Security vulnerabilities found'
        "
        :subtitle-icon="
          stats.number_of_vulnerabilities_diff > 0
            ? 'solar:arrow-up-linear'
            : stats.number_of_vulnerabilities_diff < 0
              ? 'solar:arrow-down-linear'
              : 'solar:bug-linear'
        "
      />

      <!-- Critical & High Count -->
      <StatCard
        label="Critical & High"
        :value="criticalAndHighCount"
        icon="solar:danger-triangle-bold"
        variant="danger"
        subtitle="Immediate attention required"
        subtitle-icon="solar:shield-warning-linear"
      />

      <!-- Vulnerable Dependencies -->
      <StatCard
        label="Vulnerable Dependencies"
        :value="stats.number_of_vulnerable_dependencies ?? 0"
        icon="tabler:package"
        variant="danger"
        :subtitle="
          stats.number_of_vulnerable_dependencies_diff !== undefined
            ? `${stats.number_of_vulnerable_dependencies_diff > 0 ? '+' : ''}${stats.number_of_vulnerable_dependencies_diff} from last scan`
            : 'All identified dependencies'
        "
        :subtitle-icon="
          stats.number_of_vulnerable_dependencies_diff > 0
            ? 'solar:arrow-up-linear'
            : stats.number_of_vulnerable_dependencies_diff < 0
              ? 'solar:arrow-down-linear'
              : 'solar:package-linear'
        "
      />

      <!-- Security Score with tooltip -->
      <TooltipProvider>
        <Card
          class="border shadow-sm hover:shadow-md transition-shadow h-full border-l-4"
          :class="securityScoreBorderColor"
        >
          <CardContent class="p-6 h-full flex flex-col">
            <p
              class="text-sm font-semibold uppercase tracking-wide text-theme-gray mb-2"
            >
              Security Score
            </p>

            <div class="flex-1 flex items-center">
              <div class="flex items-center justify-between w-full">
                <div class="space-y-2">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <p
                        class="text-3xl font-bold text-theme-black cursor-help flex items-center gap-2"
                      >
                        {{ securityGrade }}
                        <Icon
                          icon="solar:info-circle-line-duotone"
                          class="w-5 h-5 text-gray-400"
                        />
                      </p>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      class="max-w-xs bg-white text-gray-900 border border-gray-200 shadow-lg p-3"
                    >
                      <div class="space-y-2">
                        <p class="font-semibold text-sm text-gray-900">
                          Security Grade Scale
                        </p>
                        <div class="space-y-1 text-xs">
                          <div class="flex justify-between gap-4">
                            <span class="text-green-600 font-medium"
                              >A+ / A</span
                            >
                            <span class="text-gray-500"
                              >Excellent ({{
                                GRADE_DISPLAY_RANGES.excellent
                              }})</span
                            >
                          </div>
                          <div class="flex justify-between gap-4">
                            <span class="text-blue-600 font-medium"
                              >B+ / B</span
                            >
                            <span class="text-gray-500"
                              >Good ({{ GRADE_DISPLAY_RANGES.good }})</span
                            >
                          </div>
                          <div class="flex justify-between gap-4">
                            <span class="text-yellow-600 font-medium"
                              >C+ / C</span
                            >
                            <span class="text-gray-500"
                              >Fair ({{ GRADE_DISPLAY_RANGES.fair }})</span
                            >
                          </div>
                          <div class="flex justify-between gap-4">
                            <span class="text-red-600 font-medium">D+ / D</span>
                            <span class="text-gray-500"
                              >Poor ({{ GRADE_DISPLAY_RANGES.poor }})</span
                            >
                          </div>
                        </div>
                        <p
                          class="text-xs text-gray-500 pt-1 border-t border-gray-200"
                        >
                          Based on weighted critical and high severity
                          vulnerabilities.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  <div class="flex items-center gap-1 text-xs">
                    <span class="font-medium text-theme-gray">
                      {{ securityGradeSubtitle }}
                    </span>
                  </div>
                </div>

                <div class="p-3 rounded-full bg-gray-100">
                  <Icon
                    icon="solar:shield-check-bold"
                    class="h-8 w-8 text-gray-600"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>

      <!-- Severity Overview -->
      <InfoCard
        title="Severity Range"
        icon="solar:chart-bold"
        variant="default"
      >
        <div v-if="render" class="flex items-center justify-between gap-2">
          <!-- Mean -->
          <div class="flex-1 text-center">
            <p class="text-xs text-gray-500 mb-1">Mean</p>
            <div class="text-2xl font-bold text-theme-black">
              {{ stats.mean_severity?.toFixed(2) ?? "0.00" }}
            </div>
            <p
              v-if="stats.mean_severity_diff !== undefined"
              class="text-xs mt-1"
              :class="
                stats.mean_severity_diff > 0
                  ? 'text-red-500'
                  : stats.mean_severity_diff < 0
                    ? 'text-green-500'
                    : 'text-gray-500'
              "
            >
              {{ stats.mean_severity_diff > 0 ? "+" : ""
              }}{{ stats.mean_severity_diff?.toFixed(2) }}
            </p>
          </div>

          <!-- Visual separator -->
          <div class="w-px h-12 bg-gray-200"></div>

          <!-- Max -->
          <div class="flex-1 text-center">
            <p class="text-xs text-gray-500 mb-1">Max</p>
            <div class="text-2xl font-bold text-red-600">
              {{ stats.max_severity?.toFixed(2) ?? "0.00" }}
            </div>
            <p
              v-if="stats.max_severity_diff !== undefined"
              class="text-xs mt-1"
              :class="
                stats.max_severity_diff > 0
                  ? 'text-red-500'
                  : stats.max_severity_diff < 0
                    ? 'text-green-500'
                    : 'text-gray-500'
              "
            >
              {{ stats.max_severity_diff > 0 ? "+" : ""
              }}{{ stats.max_severity_diff?.toFixed(2) }}
            </p>
          </div>
        </div>
        <div v-else class="flex justify-center items-center h-20">
          <TextLoader />
        </div>
      </InfoCard>
    </div>

    <!-- Detailed Analysis Grid -->
    <div class="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <!-- Vulnerability Distribution -->
      <InfoCard
        title="Vulnerability Distribution"
        description="Breakdown by severity"
        icon="solar:chart-square-bold"
        variant="primary"
      >
        <div v-if="render" class="space-y-3">
          <!-- Severity breakdown -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Critical</span>
              <span class="text-sm font-bold text-theme-black">{{
                stats.number_of_critical ?? 0
              }}</span>
            </div>
            <div class="w-full bg-severity-critical-bg rounded-full h-2">
              <div
                class="bg-severity-critical h-2 rounded-full transition-all duration-300"
                :style="{ width: `${severityDistribution.critical}%` }"
              ></div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">High</span>
              <span class="text-sm font-bold text-theme-black">{{
                stats.number_of_high ?? 0
              }}</span>
            </div>
            <div class="w-full bg-severity-high-bg rounded-full h-2">
              <div
                class="bg-severity-high h-2 rounded-full transition-all duration-300"
                :style="{ width: `${severityDistribution.high}%` }"
              ></div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Medium</span>
              <span class="text-sm font-bold text-theme-black">{{
                stats.number_of_medium ?? 0
              }}</span>
            </div>
            <div class="w-full bg-severity-medium-bg rounded-full h-2">
              <div
                class="bg-severity-medium h-2 rounded-full transition-all duration-300"
                :style="{ width: `${severityDistribution.medium}%` }"
              ></div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Low</span>
              <span class="text-sm font-bold text-theme-black">{{
                stats.number_of_low ?? 0
              }}</span>
            </div>
            <div class="w-full bg-severity-low-bg rounded-full h-2">
              <div
                class="bg-severity-low h-2 rounded-full transition-all duration-300"
                :style="{ width: `${severityDistribution.low}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-3">
          <TextLoader v-for="i in 4" :key="i" />
        </div>
      </InfoCard>

      <!-- Security Impact Analysis -->
      <InfoCard
        title="Security Impact (CIA)"
        description="Impact assessment"
        icon="solar:shield-cross-bold"
        variant="default"
      >
        <div v-if="render" class="space-y-3">
          <!-- Compact Impact Display -->
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="p-3 bg-gray-50 rounded-lg">
              <Icon
                icon="solar:eye-closed-bold"
                class="w-5 h-5 text-theme-primary mx-auto mb-1"
              />
              <div class="text-lg font-bold text-theme-black">
                {{ stats.mean_confidentiality_impact?.toFixed(1) ?? "0.0" }}
              </div>
              <p class="text-xs text-gray-500">Confidentiality</p>
            </div>

            <div class="p-3 bg-gray-50 rounded-lg">
              <Icon
                icon="solar:shield-check-bold"
                class="w-5 h-5 text-theme-primary mx-auto mb-1"
              />
              <div class="text-lg font-bold text-theme-black">
                {{ stats.mean_integrity_impact?.toFixed(1) ?? "0.0" }}
              </div>
              <p class="text-xs text-gray-500">Integrity</p>
            </div>

            <div class="p-3 bg-gray-50 rounded-lg">
              <Icon
                icon="solar:server-bold"
                class="w-5 h-5 text-theme-primary mx-auto mb-1"
              />
              <div class="text-lg font-bold text-theme-black">
                {{ stats.mean_availability_impact?.toFixed(1) ?? "0.0" }}
              </div>
              <p class="text-xs text-gray-500">Availability</p>
            </div>
          </div>

          <!-- Overall Impact -->
          <div
            class="p-3 bg-theme-primary/5 rounded-lg border border-theme-primary/20 text-center"
          >
            <p class="text-sm font-medium text-theme-black mb-1">
              Overall Impact
            </p>
            <div class="text-2xl font-bold text-theme-primary">
              {{
                (
                  ((stats.mean_confidentiality_impact ?? 0) +
                    (stats.mean_integrity_impact ?? 0) +
                    (stats.mean_availability_impact ?? 0)) /
                  3
                ).toFixed(1)
              }}
            </div>
            <p class="text-xs text-gray-500 mt-1">Combined risk score</p>
          </div>
        </div>

        <div v-else class="space-y-3">
          <TextLoader v-for="i in 4" :key="i" />
        </div>
      </InfoCard>

      <!-- OWASP Top 10 -->
      <InfoCard
        title="OWASP Top 10"
        description="Most common categories"
        icon="solar:shield-bold"
        variant="primary"
      >
        <div v-if="render">
          <!-- Summary Stats -->
          <div
            class="mb-3 p-3 bg-theme-primary/5 rounded-lg border border-theme-primary/20"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-theme-black">
                  Total OWASP Issues
                </p>
                <p class="text-xs text-gray-500">
                  Across {{ topOwaspCategories.length ?? 0 }} categories
                </p>
              </div>
              <div class="text-2xl font-bold text-theme-primary">
                {{
                  topOwaspCategories.reduce(
                    (sum: number, cat: any) => sum + cat.count,
                    0,
                  ) || 0
                }}
              </div>
            </div>
          </div>

          <!-- Categories List -->
          <div v-if="topOwaspCategories.length > 0" class="space-y-1">
            <div
              v-for="(category, index) in topOwaspCategories.slice(0, 5)"
              :key="index"
              class="group"
            >
              <div
                class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <span class="text-xs font-bold text-gray-400">{{
                    category.name.split(":")[0]
                  }}</span>
                  <p class="text-xs text-gray-600 truncate flex-1">
                    {{ category.name.split(":")[1]?.trim() ?? "" }}
                  </p>
                </div>
                <span
                  class="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-bold bg-theme-primary/10 text-theme-primary"
                >
                  {{ category.count }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-2">
            <Icon
              icon="solar:shield-check-bold"
              class="w-6 h-6 text-green-500 mx-auto mb-1"
            />
            <p class="text-xs text-gray-500">
              No OWASP vulnerabilities detected
            </p>
          </div>
        </div>
        <div v-else class="space-y-3">
          <TextLoader v-for="i in 3" :key="i" />
        </div>
      </InfoCard>
    </div>
  </div>
</template>

<style scoped>
.vuln-stats-grid {
  align-items: stretch;
}

/* Make all cards in the stats grid have equal heights */
.vuln-stats-grid > * {
  height: 100%;
}

/* For StatCards: center the main content */
.vuln-stats-grid :deep(.card:not(:has(.card-header))) {
  display: flex;
  align-items: center;
}

/* For InfoCards: make them fill height and center content vertically */
.vuln-stats-grid :deep(.card:has(.card-header)) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.vuln-stats-grid :deep(.card:has(.card-header) .card-content) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
