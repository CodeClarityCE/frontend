<template>
  <!-- Stats display with loading state -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Loading state -->
    <template v-if="loading">
      <Skeleton
        v-for="index in 4"
        :key="index"
        class="h-30 w-full rounded-xl"
      />
    </template>

    <!-- Loaded state -->
    <template v-else>
      <StatCard
        label="Critical Issues"
        :value="stats.critical"
        icon="solar:danger-triangle-bold"
        variant="danger"
        :subtitle="criticalSubtitle"
      />

      <StatCard
        label="High Severity"
        :value="stats.high"
        icon="solar:shield-warning-bold"
        variant="primary"
        :subtitle="highSubtitle"
      />

      <StatCard
        label="Projects Scanned"
        :value="stats.projects"
        icon="solar:folder-check-bold"
        variant="success"
        subtitle="All systems"
      />

      <!-- Security Score with tooltip -->
      <TooltipProvider>
        <Card
          class="border shadow-sm hover:shadow-md transition-shadow h-full border-l-4 border-l-theme-primary"
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
                        {{ stats.gradeClass }}
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
                          Based on average vulnerability severity.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  <div class="flex items-center gap-1 text-xs">
                    <span class="font-medium text-theme-gray">
                      {{ scoreSubtitle }}
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { ref, watch, computed, type Ref } from "vue";
import StatCard from "@/base_components/ui/cards/StatCard.vue";
import { ProjectGradeClass } from "@/codeclarity_components/dashboard/dashboard.entity";
import { DashboardRepository } from "@/codeclarity_components/dashboard/dashboard.repository";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Skeleton } from "@/shadcn/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import {
  GRADE_DISPLAY_RANGES,
  getGradeSubtitle,
  type Grade,
} from "@/utils/gradeUtils";

/**
 * DashboardQuickStats - Simple 4-stat overview
 *
 * Displays key metrics in a responsive grid.
 * Fetches real data from API.
 */

// Props
const props = defineProps<{
  integrationIds: string[];
}>();

// Watch for integration changes
watch(
  () => props.integrationIds,
  async () => {
    void fetchData();
  },
);

// Repositories
const dashboardRepository = new DashboardRepository();

// Stores
const userStore = useUserStore();
const authStore = useAuthStore();
const { defaultOrg } = storeToRefs(userStore);

// State
const loading: Ref<boolean> = ref(true);
const stats = ref({
  critical: 0,
  high: 0,
  projects: 0,
  score: 10,
  gradeClass: ProjectGradeClass.A_PLUS,
});

// Computed subtitles
const criticalSubtitle = computed(() => {
  if (stats.value.critical === 0) return "No critical issues";
  return `${stats.value.critical} issue${stats.value.critical > 1 ? "s" : ""} found`;
});

const highSubtitle = computed(() => {
  if (stats.value.high === 0) return "No high severity";
  return `${stats.value.high} issue${stats.value.high > 1 ? "s" : ""} found`;
});

const scoreSubtitle = computed(() => {
  // Convert ProjectGradeClass enum to Grade type for shared utility
  const gradeClass = stats.value.gradeClass;
  const gradeMap: Record<ProjectGradeClass, Grade> = {
    [ProjectGradeClass.A_PLUS]: "A+",
    [ProjectGradeClass.A]: "A",
    [ProjectGradeClass.B_PLUS]: "B+",
    [ProjectGradeClass.B]: "B",
    [ProjectGradeClass.C_PLUS]: "C+",
    [ProjectGradeClass.C]: "C",
    [ProjectGradeClass.D_PLUS]: "D+",
    [ProjectGradeClass.D]: "D",
  };
  return getGradeSubtitle(gradeMap[gradeClass] ?? "A+", "security");
});

async function fetchData(refresh = false): Promise<void> {
  if (!defaultOrg?.value) return;
  if (!authStore.getAuthenticated || !authStore.getToken) return;

  if (!refresh) loading.value = true;

  try {
    // Fetch both endpoints in parallel
    const [vulnsResp, quickStatsResp] = await Promise.all([
      dashboardRepository.getRecentVulns({
        orgId: defaultOrg.value.id,
        bearerToken: authStore.getToken,
        handleBusinessErrors: true,
        integrationIds: props.integrationIds,
      }),
      dashboardRepository.getQuickStats({
        orgId: defaultOrg.value.id,
        bearerToken: authStore.getToken,
        handleBusinessErrors: true,
        integrationIds: props.integrationIds,
      }),
    ]);

    // Extract vulnerability counts from severity_count
    let criticalCount = 0;
    let highCount = 0;

    for (const item of vulnsResp.data.severity_count) {
      if (item.severity_class === "CRITICAL") {
        criticalCount = item.count;
      } else if (item.severity_class === "HIGH") {
        highCount = item.count;
      }
    }

    // Update stats
    stats.value = {
      critical: criticalCount,
      high: highCount,
      projects: quickStatsResp.data.nmb_projects ?? 0,
      score: quickStatsResp.data.max_grade?.score ?? 10,
      gradeClass:
        quickStatsResp.data.max_grade?.class ?? ProjectGradeClass.A_PLUS,
    };
  } catch (err) {
    console.error("Failed to fetch dashboard quick stats:", err);
    // Keep default values on error
  } finally {
    if (!refresh) loading.value = false;
  }
}

// Initial fetch
void fetchData();
</script>
