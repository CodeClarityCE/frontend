import { storeToRefs } from "pinia";
import { computed, type ComputedRef, onMounted, type Ref, ref } from "vue";

import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import type {
  Integration,
  Organization,
  OrganizationMetaData,
} from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import { OrganizationVulnerabilitiesRepository } from "@/codeclarity_components/vulnerabilities/organization_vulnerabilities.repository";
import type {
  OrganizationVulnerabilityFilters,
  OrganizationVulnerabilityList,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import {
  TrendPeriod,
  type VulnerabilityTrend,
  type VulnerabilityTrendFilters,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";

import {
  type FilteredDashboardRequest,
  useFilteredDashboardRequest,
} from "./useDashboardRequest";

/**
 * Loads what decides the project overview: the organisation's projects and
 * integrations, plus the summary requests shared by several cards.
 */
export function useDashboardData(): {
  isLoading: Ref<boolean>;
  hasError: Ref<boolean>;
  orgData: Ref<OrganizationMetaData | null>;
  integrations: Ref<Integration[]>;
  isReady: ComputedRef<boolean>;
  hasData: ComputedRef<boolean>;
  activeIntegrationIds: ComputedRef<string[]>;
  loadDashboardData: () => Promise<void>;
  hasIntegrations: ComputedRef<boolean>;
  hasProjects: ComputedRef<boolean>;
  hasAnalyses: ComputedRef<boolean>;
  refreshData: () => Promise<void>;
  defaultOrg: Ref<Organization | undefined>;
  trend: FilteredDashboardRequest<
    VulnerabilityTrend,
    VulnerabilityTrendFilters
  >;
  vulnerabilityList: FilteredDashboardRequest<
    OrganizationVulnerabilityList,
    OrganizationVulnerabilityFilters
  >;
} {
  const state = useStateStore();
  const { defaultOrg } = storeToRefs(useUserStore());
  const auth = useAuthStore();

  state.$reset();
  state.page = "home";

  const isReady = computed(
    () => !!(defaultOrg?.value && auth.getAuthenticated && auth.getToken),
  );
  // Starts loading when it can, so the empty state never flashes first.
  const isLoading = ref(isReady.value);
  const hasError = ref(false);
  const orgData = ref<OrganizationMetaData | null>(null);
  const integrations = ref<Integration[]>([]);

  const activeIntegrationIds = computed((): string[] =>
    integrations.value.map(
      (integration: Integration): string => integration.id ?? "",
    ),
  );

  const requestOptions = (): {
    orgId: string;
    bearerToken: string;
    handleBusinessErrors: boolean;
    integrationIds: string[];
  } => ({
    orgId: defaultOrg?.value?.id ?? "",
    bearerToken: auth.getToken ?? "",
    handleBusinessErrors: true,
    integrationIds: activeIntegrationIds.value,
  });
  const vulnerabilitiesRepository = new OrganizationVulnerabilitiesRepository();
  // The project numbers and the trend card share it, so both follow its filters.
  const trend = useFilteredDashboardRequest<
    VulnerabilityTrend,
    VulnerabilityTrendFilters
  >(
    async (filters) =>
      await vulnerabilitiesRepository.getTrend({
        ...requestOptions(),
        filters,
      }),
    { period: TrendPeriod.Week },
  );
  const vulnerabilityList = useFilteredDashboardRequest(
    async (filters: OrganizationVulnerabilityFilters) =>
      await vulnerabilitiesRepository.getVulnerabilities({
        ...requestOptions(),
        filters,
      }),
    {},
  );

  const hasIntegrations = computed(() => integrations.value.length > 0);
  const hasProjects = computed(
    () => (orgData.value?.projects?.length ?? 0) > 0,
  );
  // Unknown counts as analysed: a failed request must not show onboarding.
  // Narrowed to one project, the organization is known to have data.
  const hasAnalyses = computed(
    () =>
      trend.error ||
      trend.filters.project !== undefined ||
      (trend.data?.points[trend.data.points.length - 1]?.project_count ?? 0) >
        0,
  );
  const hasData = computed(() => hasProjects.value && hasAnalyses.value);

  async function loadDashboardData(): Promise<void> {
    if (!isReady.value || !defaultOrg?.value || !auth.getToken) return;

    isLoading.value = true;
    hasError.value = false;

    const [orgResponse, integrationsResponse] = await Promise.allSettled([
      new OrgRepository().getOrgMetaData({
        orgId: defaultOrg?.value.id,
        bearerToken: auth.getToken,
        handleBusinessErrors: true,
      }),
      new IntegrationsRepository().getVCS({
        orgId: defaultOrg?.value.id,
        bearerToken: auth.getToken,
        pagination: { page: 0, entries_per_page: 100 },
        handleBusinessErrors: true,
      }),
    ]);

    // Without the project list there is no telling what to show.
    if (orgResponse.status === "rejected") {
      orgData.value = null;
      hasError.value = true;
      isLoading.value = false;
      return;
    }
    orgData.value = orgResponse.value;
    if (integrationsResponse.status === "fulfilled") {
      integrations.value = (integrationsResponse.value.data ??
        []) as unknown as Integration[];
    }

    if (hasProjects.value) {
      void vulnerabilityList.run();
      await trend.run();
    }
    isLoading.value = false;
  }

  onMounted(() => {
    if (isReady.value) void loadDashboardData();
  });

  return {
    isLoading,
    hasError,
    orgData,
    integrations,
    activeIntegrationIds,
    isReady,
    hasData,
    hasIntegrations,
    hasProjects,
    hasAnalyses,
    loadDashboardData,
    refreshData: loadDashboardData,
    defaultOrg: defaultOrg!,
    trend,
    vulnerabilityList,
  };
}
