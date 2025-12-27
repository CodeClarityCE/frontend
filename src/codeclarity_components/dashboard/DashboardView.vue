<script setup lang="ts">
import { PageHeader } from "@/base_components";
import { useStateStore } from "@/stores/state";
import { useDashboardData } from "./composables/useDashboardData";
import DashboardEmptyState from "./layout/DashboardEmptyState.vue";
import DashboardCharts from "./sections/DashboardCharts.vue";
import DashboardQuickStats from "./sections/DashboardQuickStats.vue";
// import DashboardFooter from './layout/DashboardFooter.vue';

/**
 * DashboardView - Main dashboard entry point
 *
 * Consolidates the dashboard functionality by:
 * 1. Setting page state
 * 2. Getting data from composable
 * 3. Showing empty state if needed
 * 4. Otherwise rendering dashboard sections
 */

// Set page state
const state = useStateStore();
state.$reset();
state.page = "dashboard";

// Get dashboard data
const {
  activeIntegrationIds,
  shouldShowEmptyState,
  hasIntegrations,
  hasProjects,
  hasError,
  isLoading,
  defaultOrg,
  refreshData,
} = useDashboardData();
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <!-- Empty state: loading, error, or setup needed -->
    <DashboardEmptyState
      v-if="shouldShowEmptyState"
      :is-error="hasError"
      :has-integrations="hasIntegrations"
      :has-projects="hasProjects"
      :org-id="defaultOrg?.id"
    />

    <!-- Main dashboard: header + stats + charts + sidebar -->
    <div v-else class="space-y-8">
      <PageHeader
        title="Security Dashboard"
        description="Monitor your organization's security posture and vulnerabilities"
        :is-loading="isLoading"
        @refresh="refreshData"
      />
      <DashboardQuickStats />
      <DashboardCharts :integration-ids="activeIntegrationIds" />
      <!-- <DashboardFooter /> -->
    </div>
  </div>
</template>
