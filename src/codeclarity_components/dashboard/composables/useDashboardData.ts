import { storeToRefs } from "pinia";
import { computed, type ComputedRef, onMounted, type Ref, ref } from "vue";

import { DashboardRepository } from "@/codeclarity_components/dashboard/dashboard.repository";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import type {
  Integration,
  Organization,
  OrganizationMetaData,
} from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";

/**
 * useDashboardData - Simple dashboard data management
 *
 * Handles:
 * - Loading organization and integration data
 * - Simple error states
 * - Loading states
 * - Empty state logic (no integrations, no projects, no analyses)
 */
export function useDashboardData(): {
  isLoading: Ref<boolean>;
  hasError: Ref<boolean>;
  orgData: Ref<OrganizationMetaData | null>;
  integrations: Ref<Integration[]>;
  isReady: ComputedRef<boolean>;
  hasData: ComputedRef<boolean>;
  shouldShowEmptyState: ComputedRef<boolean>;
  activeIntegrationIds: ComputedRef<string[]>;
  loadDashboardData: () => Promise<void>;
  hasIntegrations: ComputedRef<boolean>;
  hasProjects: ComputedRef<boolean>;
  hasAnalyses: ComputedRef<boolean>;
  refreshData: () => Promise<void>;
  defaultOrg: Ref<Organization | undefined>;
} {
  // Store setup
  const state = useStateStore();
  const { defaultOrg } = storeToRefs(useUserStore());
  const auth = useAuthStore();

  state.$reset();
  state.page = "home";

  // Simple reactive state
  const isLoading = ref(false);
  const hasError = ref(false);
  const orgData = ref<OrganizationMetaData | null>(null);
  const integrations = ref<Integration[]>([]);
  const projectsScanned = ref<number>(0);

  // Computed helpers
  const isReady = computed(
    () => !!(defaultOrg?.value && auth.getAuthenticated && auth.getToken),
  );
  const hasIntegrations = computed(() => integrations.value.length > 0);
  const hasProjects = computed(
    () => (orgData.value?.projects?.length ?? 0) > 0,
  );
  const hasAnalyses = computed(() => projectsScanned.value > 0);
  const hasData = computed(
    () => hasIntegrations.value && hasProjects.value && hasAnalyses.value,
  );
  const shouldShowEmptyState = computed(
    () => isLoading.value || hasError.value || !hasData.value,
  );
  const activeIntegrationIds = computed((): string[] =>
    integrations.value.map(
      (integration: Integration): string => integration.id ?? "",
    ),
  );

  /**
   * Load all dashboard data
   */
  async function loadDashboardData(): Promise<void> {
    if (!auth.getAuthenticated || !defaultOrg?.value || !auth.getToken) {
      return;
    }

    isLoading.value = true;
    hasError.value = false;

    try {
      // Load org data and integrations in parallel
      const [orgResponse, integrationsResponse] = await Promise.allSettled([
        new OrgRepository().getOrgMetaData({
          orgId: defaultOrg.value.id,
          bearerToken: auth.getToken,
          handleBusinessErrors: true,
        }),
        new IntegrationsRepository().getVCS({
          orgId: defaultOrg.value.id,
          bearerToken: auth.getToken,
          pagination: { page: 0, entries_per_page: 100 },
          handleBusinessErrors: true,
        }),
      ]);

      // Handle responses
      if (orgResponse.status === "fulfilled") {
        orgData.value = orgResponse.value;
      }

      if (integrationsResponse.status === "fulfilled") {
        integrations.value = (integrationsResponse.value.data ??
          []) as unknown as Integration[];

        // If we have integrations, fetch quick stats to check for analyses
        if (integrations.value.length > 0) {
          const integrationIds = integrations.value.map((i) => i.id ?? "");
          try {
            const quickStatsResponse =
              await new DashboardRepository().getQuickStats({
                orgId: defaultOrg.value.id,
                bearerToken: auth.getToken,
                handleBusinessErrors: true,
                integrationIds,
              });
            projectsScanned.value = quickStatsResponse.data.nmb_projects ?? 0;
          } catch {
            // If quick stats fail, assume no analyses yet
            projectsScanned.value = 0;
          }
        }
      }

      // Show error only if both failed
      if (
        orgResponse.status === "rejected" &&
        integrationsResponse.status === "rejected"
      ) {
        hasError.value = true;
      }
    } catch (error) {
      hasError.value = true;
      console.error("Dashboard data loading failed:", error);
    } finally {
      isLoading.value = false;
    }
  }

  // Auto-load on mount
  onMounted(() => {
    if (isReady.value) {
      void loadDashboardData();
    }
  });

  return {
    // State
    isLoading,
    hasError,
    orgData,
    integrations,
    shouldShowEmptyState,
    activeIntegrationIds,
    isReady,
    hasData,

    // Computed
    hasIntegrations,
    hasProjects,
    hasAnalyses,

    // Actions
    loadDashboardData,
    refreshData: loadDashboardData,

    // Store refs
    defaultOrg: defaultOrg!,
  };
}
