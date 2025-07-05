// composables/useDashboardData.ts
import { ref, computed, onMounted } from 'vue';
import { useStateStore } from '@/stores/state';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { storeToRefs } from 'pinia';

/**
 * Simplified Dashboard Data Composable
 *
 * Ultra-simple data management for the dashboard.
 * Focuses on the essential data needed for display.
 */
export function useDashboardData() {
    // Simple state setup
    const state = useStateStore();
    const { defaultOrg } = storeToRefs(useUserStore());
    const auth = useAuthStore();

    // Set page state once
    state.$reset();
    state.page = 'home';

    // Minimal reactive state with proper types
    const isLoading = ref(false);
    const hasError = ref(false);
    const orgData = ref<any>(null);
    const integrations = ref<any[]>([]);

    // Simple computed properties
    const isReady = computed(() => defaultOrg?.value && auth.getAuthenticated && auth.getToken);
    const hasData = computed(() => !!(orgData.value && integrations.value.length > 0));
    const shouldShowEmptyState = computed(
        () => isLoading.value || hasError.value || !hasData.value
    );

    // Integration IDs for charts (simplified)
    const activeIntegrationIds = computed(() =>
        integrations.value.map((integration) => integration.id || '')
    );

    /**
     * Simplified data fetching - does everything in one go
     */
    async function loadDashboardData() {
        if (!isReady.value || !defaultOrg?.value || !auth.getToken) {
            return;
        }

        isLoading.value = true;
        hasError.value = false;

        try {
            // Fetch both org data and integrations in parallel
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

            // Handle org data
            if (orgResponse.status === 'fulfilled') {
                orgData.value = orgResponse.value;
            }

            // Handle integrations data
            if (integrationsResponse.status === 'fulfilled') {
                integrations.value = integrationsResponse.value.data || [];
            }

            // Only show error if both failed
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

    // Auto-load data when composable is used
    onMounted(() => {
        if (isReady.value) {
            loadDashboardData();
        }
    });

    return {
        // Simple state
        isLoading,
        hasError,
        shouldShowEmptyState,
        activeIntegrationIds,

        // Computed helpers
        hasIntegrations: computed(() => integrations.value.length > 0),
        hasProjects: computed(() => !!orgData.value), // Simplified assumption

        // Simple action
        refreshData: loadDashboardData,

        // Store reference
        defaultOrg
    };
}
