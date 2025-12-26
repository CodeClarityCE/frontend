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
import { storeToRefs } from "pinia";
import { ref, computed, onMounted, type ComputedRef, type Ref } from "vue";

/**
 * useDashboardData - Simple dashboard data management
 *
 * Handles:
 * - Loading organization and integration data
 * - Simple error states
 * - Loading states
 * - Empty state logic
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

  // Computed helpers
  const isReady = computed(
    () => !!(defaultOrg?.value && auth.getAuthenticated && auth.getToken),
  );
  const hasData = computed(
    () => !!(orgData.value && integrations.value.length > 0),
  );
  const shouldShowEmptyState = computed(
    () => isLoading.value ?? hasError.value ?? !hasData.value,
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
    hasIntegrations: computed(() => integrations.value.length > 0),
    hasProjects: computed(() => !!orgData.value),

    // Actions
    loadDashboardData,
    refreshData: loadDashboardData,

    // Store refs
    defaultOrg: defaultOrg!,
  };
}
