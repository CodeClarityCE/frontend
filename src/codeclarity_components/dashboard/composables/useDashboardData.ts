import { ref, computed, onMounted } from 'vue';
import { useStateStore } from '@/stores/state';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { storeToRefs } from 'pinia';

/**
 * useDashboardData - Simple dashboard data management
 *
 * Handles:
 * - Loading organization and integration data
 * - Simple error states
 * - Loading states
 * - Empty state logic
 */
export function useDashboardData() {
    // Store setup
    const state = useStateStore();
    const { defaultOrg } = storeToRefs(useUserStore());
    const auth = useAuthStore();

    state.$reset();
    state.page = 'home';

    // Simple reactive state
    const isLoading = ref(false);
    const hasError = ref(false);
    const orgData = ref<any>(null);
    const integrations = ref<any[]>([]);

    // Computed helpers
    const isReady = computed(() => defaultOrg?.value && auth.getAuthenticated && auth.getToken);
    const hasData = computed(() => !!(orgData.value && integrations.value.length > 0));
    const shouldShowEmptyState = computed(() => isLoading.value || hasError.value || !hasData.value);
    const activeIntegrationIds = computed(() => integrations.value.map(integration => integration.id || ''));

    /**
     * Load all dashboard data
     */
    async function loadDashboardData() {
        if (!isReady.value || !defaultOrg?.value || !auth.getToken) {
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
                    handleBusinessErrors: true
                }),
                new IntegrationsRepository().getVCS({
                    orgId: defaultOrg.value.id,
                    bearerToken: auth.getToken,
                    pagination: { page: 0, entries_per_page: 100 },
                    handleBusinessErrors: true
                })
            ]);

            // Handle responses
            if (orgResponse.status === 'fulfilled') {
                orgData.value = orgResponse.value;
            }

            if (integrationsResponse.status === 'fulfilled') {
                integrations.value = integrationsResponse.value.data || [];
            }

            // Show error only if both failed
            if (orgResponse.status === 'rejected' && integrationsResponse.status === 'rejected') {
                hasError.value = true;
            }
        } catch (error) {
            hasError.value = true;
            console.error('Dashboard data loading failed:', error);
        } finally {
            isLoading.value = false;
        }
    }

    // Auto-load on mount
    onMounted(() => {
        if (isReady.value) {
            loadDashboardData();
        }
    });

    return {
        // State
        isLoading,
        hasError,
        shouldShowEmptyState,
        activeIntegrationIds,

        // Computed
        hasIntegrations: computed(() => integrations.value.length > 0),
        hasProjects: computed(() => !!orgData.value),

        // Actions
        refreshData: loadDashboardData,

        // Store refs
        defaultOrg
    };
}
